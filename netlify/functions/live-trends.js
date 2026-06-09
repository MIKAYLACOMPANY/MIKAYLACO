// MIKAYLA — Live Trend Intelligence Engine v3
// Endpoint: GET /api/live-trends?city=Paris
//
// ── ZERO EXTERNAL DEPENDENCIES (beyond Claude API) ──────────────────────────
// Data sources — all free, no auth required:
//   1. Fashion RSS  — Vogue, Harper's Bazaar, Who What Wear, Refinery29, Elle, Hypebae
//   2. Reddit       — r/femalefashionadvice, r/streetwear, r/fashion (public JSON)
//   3. Google Trends— daily trending by country (public RSS, no key needed)
//
// Cache — built-in /tmp filesystem (no Supabase, no Redis, no database):
//   • Writes JSON to /tmp/mikayla/{city}.json with TTL timestamp
//   • Survives within a warm serverless instance (reduces Claude API calls)
//   • Auto-refreshed by GitHub Actions cron every 6 hours
//
// Required env: ANTHROPIC_API_KEY only.
//
'use strict';

const fs   = require('fs');
const path = require('path');

const CACHE_DIR     = '/tmp/mikayla_trends';
const CACHE_TTL_MS  = 6 * 60 * 60 * 1000;   // 6 hours

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

// ── /tmp filesystem cache ─────────────────────────────────────────────────────
function cacheFile(city) {
  const safe = city.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return path.join(CACHE_DIR, safe + '.json');
}

function cacheRead(city) {
  try {
    const file = cacheFile(city);
    if (!fs.existsSync(file)) return null;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!raw.expires_at || Date.now() > raw.expires_at) return null;
    return { data: raw.data, written_at: raw.written_at };
  } catch { return null; }
}

function cacheWrite(city, data) {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile(city), JSON.stringify({
      data,
      expires_at: Date.now() + CACHE_TTL_MS,
      written_at: new Date().toISOString(),
    }));
  } catch (e) { console.warn('Cache write failed (non-fatal):', e.message); }
}

// ── City → ISO country code (for Google Trends RSS) ─────────────────────────
const CITY_CC = {
  paris: 'FR', nice: 'FR', cannes: 'FR', 'french riviera': 'FR', lyon: 'FR',
  milan: 'IT', rome: 'IT', positano: 'IT', florence: 'IT',
  'amalfi coast': 'IT', amalfi: 'IT', venice: 'IT', capri: 'IT',
  london: 'GB',
  tokyo: 'JP', osaka: 'JP', kyoto: 'JP',
  barcelona: 'ES', madrid: 'ES', ibiza: 'ES', seville: 'ES',
  amsterdam: 'NL',
  lisbon: 'PT', porto: 'PT',
  santorini: 'GR', mykonos: 'GR', athens: 'GR',
  dubai: 'AE',
  'new york': 'US', 'los angeles': 'US', miami: 'US', nashville: 'US',
  dubrovnik: 'HR', split: 'HR',
  bali: 'ID',
  tulum: 'MX', cancun: 'MX',
  copenhagen: 'DK',
  stockholm: 'SE',
  berlin: 'DE', munich: 'DE',
  vienna: 'AT',
  sydney: 'AU', melbourne: 'AU',
  bangkok: 'TH',
  singapore: 'SG',
  toronto: 'CA', vancouver: 'CA', montreal: 'CA',
  zurich: 'CH', geneva: 'CH',
  monaco: 'MC',
  prague: 'CZ',
  marrakech: 'MA', fez: 'MA',
};

// ── Fashion editorial RSS feeds (all free, no auth) ──────────────────────────
const RSS_FEEDS = [
  'https://www.vogue.com/feed/rss',
  'https://www.harpersbazaar.com/rss/all.xml/',
  'https://www.whowhatwear.com/rss',
  'https://www.refinery29.com/fashion/rss.xml',
  'https://hypebae.com/feed',
  'https://www.elle.com/rss/fashion.xml/',
];

// ── Reddit fashion subreddits (public JSON, no auth) ─────────────────────────
const REDDIT_SUBS = ['femalefashionadvice', 'streetwear', 'fashion'];

// ── RSS fetch + parse ────────────────────────────────────────────────────────
async function fetchRSS(feedUrl, limit = 5) {
  try {
    const res = await fetch(feedUrl, {
      signal:  AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'MIKAYLA/3.0 Fashion Intelligence Bot' },
    });
    if (!res.ok) return [];
    const xml   = await res.text();
    const items = [];
    const re    = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = re.exec(xml)) !== null && items.length < limit) {
      const block = match[1];
      const title = (/<title[^>]*><!\[CDATA\[(.*?)\]\]>/i.exec(block) ||
                     /<title[^>]*>(.*?)<\/title>/i.exec(block) || [])[1] || '';
      const desc  = (/<description[^>]*><!\[CDATA\[(.*?)\]\]>/i.exec(block) ||
                     /<description[^>]*>(.*?)<\/description>/i.exec(block) || [])[1] || '';
      const clean = desc.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim().slice(0, 220);
      if (title.trim()) items.push({ title: title.trim(), snippet: clean, src: new URL(feedUrl).hostname });
    }
    return items;
  } catch { return []; }
}

async function gatherRSS() {
  const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchRSS(f, 4)));
  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .slice(0, 24);
}

// ── Reddit JSON API (no auth, public data) ───────────────────────────────────
async function fetchReddit(city) {
  const q = encodeURIComponent(`${city} fashion outfit style 2026`);
  const urls = [
    `https://www.reddit.com/search.json?q=${q}&sort=new&t=week&limit=10`,
    ...REDDIT_SUBS.map(s =>
      `https://www.reddit.com/r/${s}/search.json?q=${encodeURIComponent(city)}&sort=hot&t=month&limit=5`
    ),
  ];

  const items = [];
  const results = await Promise.allSettled(
    urls.map(u =>
      fetch(u, {
        signal:  AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'MIKAYLA/3.0 (travel fashion AI; contact: mikaylacarnevale@hotmail.com)' },
      }).then(r => r.ok ? r.json() : null)
    )
  );

  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value?.data?.children) continue;
    for (const post of r.value.data.children.slice(0, 5)) {
      const d = post.data;
      if (!d.title || d.score < 5) continue;
      items.push({ title: d.title, body: (d.selftext || '').slice(0, 300), score: d.score, sub: d.subreddit });
    }
  }

  return items.sort((a, b) => b.score - a.score).slice(0, 16);
}

// ── Google Trends RSS by country (free public feed, no auth) ─────────────────
async function fetchGoogleTrends(city) {
  const cc = CITY_CC[city.toLowerCase()] || 'US';
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${cc}`,
      { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'MIKAYLA/3.0' } }
    );
    if (!res.ok) return [];
    const xml   = await res.text();
    const terms = [];
    const re    = /<title[^>]*>(.*?)<\/title>/gi;
    let m;
    while ((m = re.exec(xml)) !== null && terms.length < 25) {
      const t = m[1].replace(/<[^>]+>/g, '').trim();
      if (t && t.length > 2 && !t.toLowerCase().includes('trending searches')) terms.push(t);
    }
    return terms.slice(0, 20);
  } catch { return []; }
}

// ── Claude Haiku synthesis ────────────────────────────────────────────────────
async function synthesize(city, rss, reddit, gTrends, season) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const now        = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const rssBlock   = rss.length
    ? rss.map(n => `[${n.src}] ${n.title}${n.snippet ? ' — ' + n.snippet : ''}`).join('\n')
    : '(no RSS data)';
  const redditBlock = reddit.length
    ? reddit.map(p => `[r/${p.sub} · ${p.score} upvotes] ${p.title}${p.body ? ': ' + p.body : ''}`).join('\n')
    : '(no Reddit data)';
  const trendsBlock = gTrends.length ? gTrends.join(', ') : '(no Google Trends data)';

  const prompt = `You are MIKAYLA's real-time fashion intelligence engine. Today is ${now}.
Generate a hyper-current, deeply specific trend report for ${city} in ${season}.

═══ LIVE DATA (fetched right now) ═══

1. FASHION EDITORIAL RSS (Vogue, Harper's Bazaar, Who What Wear, Refinery29, Elle, Hypebae):
${rssBlock}

2. REDDIT COMMUNITY POSTS (r/femalefashionadvice, r/streetwear, r/fashion — real people):
${redditBlock}

3. GOOGLE DAILY TRENDING SEARCHES for ${city}'s country right now:
${trendsBlock}

═══ TASK ═══

Cross-reference all live data above with your knowledge of what is trending on TikTok and Instagram in ${city} this ${season}.

Identify the 5 most specific, shoppable trend pieces for ${city} right now. Each must be a PRECISE piece (not "blazers" but "oversized double-breasted chocolate blazer with gold buttons"). Include the exact retailer search string a buyer would type.

Return ONLY this JSON — no markdown, no commentary:

{
  "city": "${city}",
  "season": "${season}",
  "generated_at": "${new Date().toISOString()}",
  "headline": "One punchy sentence about the fashion moment in ${city} right now — reference specific live data",
  "vibe_of_the_moment": "2-4 word aesthetic label",
  "social_pulse": {
    "tiktok_aesthetic": "dominant TikTok fashion aesthetic for ${city} this ${season}",
    "instagram_mood": "how ${city} looks on Instagram feeds right now",
    "trending_hashtags": ["#tag1","#tag2","#tag3","#tag4"]
  },
  "trending_items": [
    {
      "name": "Precise shoppable item name",
      "category": "tops|bottoms|dresses|shoes|bags|accessories|outerwear",
      "why_trending": "1-2 sentences citing the live data sources above",
      "color": "primary trend color",
      "key_brands": ["brand1","brand2","brand3"],
      "price_range": "budget|mid|luxury",
      "retailer_search_query": "exact search string to find this on ASOS or Farfetch",
      "photo_keywords": "2-3 keywords for finding photos of this item (e.g. 'linen blazer beige minimal')",
      "tiktok_context": "exactly how this appears on TikTok in ${city} — styling, setting, vibe"
    },
    {"name":"...","category":"...","why_trending":"...","color":"...","key_brands":["..."],"price_range":"...","retailer_search_query":"...","photo_keywords":"...","tiktok_context":"..."},
    {"name":"...","category":"...","why_trending":"...","color":"...","key_brands":["..."],"price_range":"...","retailer_search_query":"...","photo_keywords":"...","tiktok_context":"..."},
    {"name":"...","category":"...","why_trending":"...","color":"...","key_brands":["..."],"price_range":"...","retailer_search_query":"...","photo_keywords":"...","tiktok_context":"..."},
    {"name":"...","category":"...","why_trending":"...","color":"...","key_brands":["..."],"price_range":"...","retailer_search_query":"...","photo_keywords":"...","tiktok_context":"..."}
  ],
  "color_palette": ["color1","color2","color3","color4","color5"],
  "key_silhouettes": ["silhouette1","silhouette2","silhouette3"],
  "dress_codes": {
    "day":      "specific daytime outfit formula for ${city}",
    "dinner":   "specific dinner look for ${city}",
    "nightlife":"specific nightlife look for ${city}"
  },
  "insider_tip":       "genuine local intelligence not in tourist guides",
  "what_locals_avoid": "what tourists wear that locals immediately clock"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2400,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw  = (data.content || [])[0]?.text || '';
    const json = raw.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();
    return JSON.parse(json);
  } catch (e) {
    console.error('Claude synthesis error:', e.message);
    return null;
  }
}

// ── Build shoppable retailer links (Skimlinks auto-monetizes all) ─────────────
function shopLinks(searchQuery, priceRange) {
  const q = encodeURIComponent(searchQuery);
  const all = [
    { name: 'ASOS',         url: `https://www.asos.com/search/?q=${q}`,                         tier: 'budget'  },
    { name: 'Zara',         url: `https://www.zara.com/gb/en/search?searchTerm=${q}`,            tier: 'budget'  },
    { name: 'Mango',        url: `https://shop.mango.com/gb/women/all-products/search?q=${q}`,   tier: 'budget'  },
    { name: 'Revolve',      url: `https://www.revolve.com/r/Search.jsp?search=${q}`,             tier: 'mid'     },
    { name: 'Sézane',       url: `https://www.sezane.com/en/result?q=${q}`,                      tier: 'mid'     },
    { name: 'COS',          url: `https://www.cos.com/en_gbp/women/search.html?q=${q}`,          tier: 'mid'     },
    { name: 'Net-a-Porter', url: `https://www.net-a-porter.com/en-gb/shop/search?q=${q}`,        tier: 'luxury'  },
    { name: 'Farfetch',     url: `https://www.farfetch.com/shopping/search/?q=${q}`,             tier: 'luxury'  },
    { name: 'Matches',      url: `https://www.matchesfashion.com/search?q=${q}`,                 tier: 'luxury'  },
  ];
  const budget  = all.filter(r => r.tier === 'budget').slice(0, 1);
  const mid     = all.filter(r => r.tier === 'mid').slice(0, 1);
  const luxury  = all.filter(r => r.tier === 'luxury').slice(0, 1);
  const primary = priceRange === 'budget' ? budget : priceRange === 'luxury' ? luxury : mid;
  const extras  = priceRange === 'budget'
    ? [all[3], all[6]]
    : priceRange === 'luxury'
      ? [all[7], all[0]]
      : [all[0], all[6]];
  return [...primary, ...extras].slice(0, 3);
}

// ── Season helper ─────────────────────────────────────────────────────────────
function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const params       = event.queryStringParameters || {};
  const city         = (params.city    || 'Paris').trim();
  const forceRefresh = params.refresh === 'true';
  const season       = getSeason();

  try {
    // ── 1. Check /tmp cache ────────────────────────────────────────────────────
    if (!forceRefresh) {
      const cached = cacheRead(city);
      if (cached) {
        cached.data.trending_items?.forEach(item => {
          item.shop_links = shopLinks(item.retailer_search_query || item.name, item.price_range);
        });
        const ageMins = Math.round((Date.now() - new Date(cached.written_at).getTime()) / 60000);
        return {
          statusCode: 200,
          headers:    { ...CORS, 'Cache-Control': 'public, s-maxage=1800', 'X-Cache': 'HIT' },
          body:       JSON.stringify({ ...cached.data, _cached: true, _cache_age_mins: ageMins }),
        };
      }
    }

    // ── 2. Fetch all live data sources in parallel ─────────────────────────────
    const [rss, reddit, gTrends] = await Promise.all([
      gatherRSS(),
      fetchReddit(city),
      fetchGoogleTrends(city),
    ]);

    // ── 3. Synthesize with Claude ──────────────────────────────────────────────
    let result = await synthesize(city, rss, reddit, gTrends, season);

    // ── 4. Graceful fallback if Claude key missing ─────────────────────────────
    if (!result) {
      result = {
        city,
        season,
        generated_at:      new Date().toISOString(),
        headline:          `Add ANTHROPIC_API_KEY to your Vercel environment to enable live AI trend synthesis for ${city}.`,
        vibe_of_the_moment:'Set up in progress',
        trending_items:    [],
        color_palette:     [],
        _fallback:         true,
        _setup_needed:     'ANTHROPIC_API_KEY',
      };
    }

    // ── 5. Attach shop links ───────────────────────────────────────────────────
    result.trending_items?.forEach(item => {
      item.shop_links = shopLinks(item.retailer_search_query || item.name, item.price_range);
    });

    // ── 6. Record source counts ────────────────────────────────────────────────
    result._sources = {
      rss_articles:        rss.length,
      reddit_posts:        reddit.length,
      google_trends_terms: gTrends.length,
      total_inputs:        rss.length + reddit.length + gTrends.length,
    };

    // ── 7. Write to /tmp cache ─────────────────────────────────────────────────
    cacheWrite(city, result);

    return {
      statusCode: 200,
      headers:    { ...CORS, 'Cache-Control': 'public, s-maxage=1800', 'X-Cache': 'MISS' },
      body:       JSON.stringify(result),
    };

  } catch (err) {
    console.error('live-trends error:', err);
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({ error: 'Trend engine error', city, details: err.message }),
    };
  }
};
