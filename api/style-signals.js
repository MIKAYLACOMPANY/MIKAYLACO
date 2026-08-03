const CITY_REGIONS = {
  amsterdam: "NL",
  bali: "ID",
  barcelona: "ES",
  "cape town": "ZA",
  copenhagen: "DK",
  dubai: "AE",
  edinburgh: "GB",
  ibiza: "ES",
  lisbon: "PT",
  london: "GB",
  marrakech: "MA",
  milan: "IT",
  mykonos: "GR",
  "new york": "US",
  paris: "FR",
  positano: "IT",
  prague: "CZ",
  rome: "IT",
  santorini: "GR",
  tokyo: "JP",
  tulum: "MX",
  vienna: "AT",
};

const FASHION_TERMS = [
  "accessory", "aesthetic", "bag", "ballet flat", "blazer", "coat", "denim",
  "dress", "fashion", "heel", "jacket", "jewelry", "jewellery", "loafer",
  "outfit", "resort wear", "sandal", "shoe", "skirt", "sneaker", "street style",
  "style", "sunglasses", "swimwear", "top", "trend", "trouser", "wardrobe",
];

function clean(value, fallback) {
  const result = String(value || "").replace(/\s+/g, " ").trim();
  return result || fallback;
}

function titleCase(value) {
  return clean(value, "City Edit").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function seasonForDate(date) {
  const month = date.getUTCMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function isPinterestPin(url) {
  return /^https?:\/\/(?:[^/]+\.)?pinterest\.[^/]+\/pin\//i.test(String(url || ""));
}

function socialPlatform(url) {
  const value = String(url || "");
  if (isPinterestPin(value)) return "Pinterest";
  if (/^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[a-zA-Z0-9_-]+/i.test(value)) return "Instagram";
  if (/^https?:\/\/(?:www\.)?tiktok\.com\/@[^/]+\/video\/\d+/i.test(value)) return "TikTok";
  return "";
}

function imageSearchItems(data) {
  return data?.tasks?.[0]?.result?.[0]?.items || [];
}

function toDiscoverySignal(result, city, index, trendKeywords) {
  const platform = socialPlatform(result.url);
  const title = clean(result.title || result.alt, `${city} street-style reference`);
  const description = clean(result.alt || result.title, `Current public ${platform} result for ${city} style.`);
  const query = clean(`${city} women ${title}`, `${city} women outfit`).slice(0, 180);
  return {
    id: `discovery-${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
    city,
    image: result.source_url || result.encoded_url,
    sourceUrl: result.url,
    creator: clean(result.source || platform, platform),
    source: `Current ${platform} public result`,
    platform,
    title,
    signal: description.slice(0, 220),
    query,
    pieces: [],
    freshness: "Current public social search ranking",
    capturedAt: new Date().toISOString(),
    rights: "Platform-hosted public post; original source remains linked",
    confidence: "discovery",
    trendKeywords,
  };
}

async function fetchPinterestTrends(token, city) {
  if (!token) return [];
  const region = CITY_REGIONS[city.toLowerCase()] || "US";
  const endpoint = `https://api.pinterest.com/v5/trends/keywords/${region}/top/growing?limit=50`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  const trends = Array.isArray(data.trends) ? data.trends : [];
  return trends
    .filter((trend) => FASHION_TERMS.some((term) => String(trend.keyword || "").toLowerCase().includes(term)))
    .slice(0, 5)
    .map((trend) => ({
      keyword: clean(trend.keyword, ""),
      growth: Number(trend.pct_growth_wow) || 0,
    }))
    .filter((trend) => trend.keyword);
}

async function fetchCurrentPinterestResults(city, trendKeywords) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return [];

  const date = new Date();
  const trendPhrase = trendKeywords.slice(0, 2).map((trend) => trend.keyword).join(" ");
  const keyword = [
    city,
    seasonForDate(date),
    date.getUTCFullYear(),
    "women street style outfit",
    "Instagram TikTok Pinterest",
    trendPhrase,
  ].filter(Boolean).join(" ");

  const response = await fetch("https://api.dataforseo.com/v3/serp/google/images/live/advanced", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{
      keyword,
      location_code: 2840,
      language_code: "en",
      device: "mobile",
      os: "ios",
      depth: 60,
    }]),
  });
  if (!response.ok) throw new Error(`Image discovery ${response.status}`);
  const data = await response.json();
  if (data.status_code !== 20000) throw new Error(`Image discovery ${data.status_code || "failed"}`);

  const seen = new Set();
  return imageSearchItems(data)
    .filter((item) => item?.type === "images_search" && socialPlatform(item.url) && (item.source_url || item.encoded_url))
    .filter((item) => {
      const key = `${item.url}|${item.source_url || item.encoded_url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (Number(a.rank_group) || 999) - (Number(b.rank_group) || 999))
    .slice(0, 24)
    .map((item, index) => toDiscoverySignal(item, city, index, trendKeywords));
}

module.exports = async function styleSignals(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET required" });
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=86400");

  const requestedCity = titleCase(req.query?.city || "");
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  try {
    if (requestedCity && requestedCity !== "City Edit") {
      const trendKeywords = await fetchPinterestTrends(token, requestedCity);
      const discovered = await fetchCurrentPinterestResults(requestedCity, trendKeywords);
      if (discovered.length) {
        return res.status(200).json({
          items: discovered,
          live: true,
          mode: "current-social-discovery",
          sourcePlatforms: [...new Set(discovered.map((item) => item.platform))],
          trendKeywords,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return res.status(200).json({
      items: [],
      live: false,
      reason: "Automatic city discovery is awaiting its licensed image-search connection",
    });
  } catch (error) {
    console.error("style-signals error:", error.message);
    return res.status(200).json({
      items: [],
      live: false,
      reason: "Current city discovery is temporarily unavailable",
    });
  }
};
