const { createClient } = require("@supabase/supabase-js");

const PINTEREST_BASE = "https://api.pinterest.com/v5";
const CACHE_TTL_HOURS = 4;

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    : null;

async function getCached(cacheKey) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("pinterest_cache")
      .select("data, created_at")
      .eq("cache_key", cacheKey)
      .single();
    if (!data) return null;
    const ageHours = (Date.now() - new Date(data.created_at).getTime()) / 36e5;
    return ageHours > CACHE_TTL_HOURS ? null : data.data;
  } catch {
    return null;
  }
}

async function setCache(cacheKey, data) {
  if (!supabase) return;
  try {
    await supabase
      .from("pinterest_cache")
      .upsert(
        { cache_key: cacheKey, data, created_at: new Date().toISOString() },
        { onConflict: "cache_key" }
      );
  } catch {}
}

function normalizePins(items) {
  if (!items) return [];
  return items
    .filter(function(p) { return p.media && p.media.images; })
    .map(function(p) {
      const images = p.media.images;
      const img = images["736x"] || images["600x"] || images["400x300"] || images["150x150"] || Object.values(images)[0];
      return {
        id: p.id,
        title: p.title || "",
        description: p.description || "",
        imageUrl: img ? img.url : "",
        width: img ? img.width : 400,
        height: img ? img.height : 600,
        link: "https://pinterest.com/pin/" + p.id,
      };
    })
    .filter(function(p) { return p.imageUrl; });
}

exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  if (!accessToken) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "PINTEREST_ACCESS_TOKEN not set", pins: [] }) };
  }
  const p = event.queryStringParameters || {};
  const city = (p.city || "paris").toLowerCase().trim();
  const style = (p.style || "street style fashion outfit").trim();
  const limit = Math.min(parseInt(p.limit || "16", 10), 24);
  const query = city + " " + style;
  const cacheKey = "pinterest:" + city + ":" + style + ":" + limit;
  const cached = await getCached(cacheKey);
  if (cached) {
    return { statusCode: 200, headers, body: JSON.stringify({ pins: cached, source: "cache", city, query }) };
  }
  try {
    const url = PINTEREST_BASE + "/pins?query=" + encodeURIComponent(query) + "&page_size=" + limit;
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error("Pinterest API " + res.status + ": " + errText);
    }
    const json = await res.json();
    const pins = normalizePins(json.items || json.data || []);
    await setCache(cacheKey, pins);
    return { statusCode: 200, headers, body: JSON.stringify({ pins, source: "api", city, query }) };
  } catch (err) {
    console.error("Pinterest error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, pins: [] }) };
  }
};
