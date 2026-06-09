// MIKAYLA — City Photos Engine v2
// Endpoint: GET /api/city-photos?city=Paris&count=8
//
// ── ZERO EXTERNAL API KEYS REQUIRED ─────────────────────────────────────────
//
// Photo sources (in priority order, all free):
//   1. source.unsplash.com — free Unsplash search, no API key, no rate limit
//      Format: https://source.unsplash.com/{w}x{h}/?{city},{keyword},fashion
//      Returns a redirect to a real Unsplash photo matching the keywords.
//      Because the URL itself changes which photo appears, photos auto-revolve
//      each time the page loads — this IS the "real-time revolving" feature.
//
//   2. Curated Unsplash IDs — direct CDN links, no API key, always work.
//      Used as stable fallback when source.unsplash.com is unavailable.
//
// Trend integration:
//   Reads /tmp/mikayla_trends/{city}.json (written by live-trends.js) to
//   extract photo_keywords from each trending item, making photos match
//   whatever is actually trending in that city right now.
//
// Cache: /tmp/mikayla_photos/{city}.json, 12h TTL
//
// Required env: NONE (just ANTHROPIC_API_KEY for live-trends.js)
//
'use strict';

const fs   = require('fs');
const path = require('path');

const PHOTO_CACHE_DIR  = '/tmp/mikayla_photos';
const TREND_CACHE_DIR  = '/tmp/mikayla_trends';
const PHOTO_CACHE_TTL  = 12 * 60 * 60 * 1000;  // 12 hours

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

// ── /tmp cache helpers ────────────────────────────────────────────────────────
function safeKey(city) {
  return city.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function photoCacheRead(city) {
  try {
    const file = path.join(PHOTO_CACHE_DIR, safeKey(city) + '.json');
    if (!fs.existsSync(file)) return null;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!raw.expires_at || Date.now() > raw.expires_at) return null;
    return raw.photos;
  } catch { return null; }
}

function photoCacheWrite(city, photos) {
  try {
    if (!fs.existsSync(PHOTO_CACHE_DIR)) fs.mkdirSync(PHOTO_CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(PHOTO_CACHE_DIR, safeKey(city) + '.json'), JSON.stringify({
      photos,
      expires_at:  Date.now() + PHOTO_CACHE_TTL,
      written_at:  new Date().toISOString(),
    }));
  } catch { /* non-fatal */ }
}

function getTrendKeywords(city) {
  try {
    const file = path.join(TREND_CACHE_DIR, safeKey(city) + '.json');
    if (!fs.existsSync(file)) return null;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const items = raw.data?.trending_items || [];
    // Extract photo_keywords or fall back to item name
    return items
      .slice(0, 5)
      .map(item => item.photo_keywords || item.name || '')
      .filter(Boolean);
  } catch { return null; }
}

// ── Curated high-quality Unsplash photo IDs (no API key needed) ──────────────
// Direct CDN links: images.unsplash.com/photo-{id}?w=600&h=800&fit=crop&q=85
const CURATED = {
  paris:          ['photo-1490481651871-ab68de25d43d','photo-1502602898657-3e91760cbb34','photo-1469837905404-87f7c4f1b79b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1539109136881-3be0616acf4b','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  milan:          ['photo-1506152983158-b4a74a01c721','photo-1445205170230-053b83016050','photo-1509631179647-0177331693ae','photo-1558618666-fcd25c85cd64','photo-1483985988355-763728e1802f','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1539109136881-3be0616acf4b'],
  rome:           ['photo-1531572753322-ad063cecc140','photo-1552832230-c0197dd311b5','photo-1515542622106-78bda8ba0e5b','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1539109136881-3be0616acf4b'],
  florence:       ['photo-1499678329028-101435549a02','photo-1467269204594-f2f4f8fc33d8','photo-1552832230-c0197dd311b5','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f','photo-1469334031218-e382a71b716b','photo-1539109136881-3be0616acf4b'],
  barcelona:      ['photo-1583422409516-2895a77efded','photo-1539037116277-4db20889f2d4','photo-1558618666-fcd25c85cd64','photo-1469334031218-e382a71b716b','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e'],
  london:         ['photo-1513635269975-59663e0ac1ad','photo-1529898329602-a2d9b9b7c1e5','photo-1445205170230-053b83016050','photo-1469334031218-e382a71b716b','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1539109136881-3be0616acf4b','photo-1515886657613-9f3515b0c78f'],
  santorini:      ['photo-1613395877344-13d4a8e0d49e','photo-1533105079780-92b9be482077','photo-1527631746610-bca00a040d60','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1515886657613-9f3515b0c78f'],
  mykonos:        ['photo-1527631746610-bca00a040d60','photo-1533105079780-92b9be482077','photo-1613395877344-13d4a8e0d49e','photo-1558769132-cb1aea458c5e','photo-1469334031218-e382a71b716b','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b','photo-1549298916-b41d501d3772'],
  positano:       ['photo-1516483638261-f4dbaf036963','photo-1534260164206-c77cd8e44e17','photo-1499678329028-101435549a02','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1515886657613-9f3515b0c78f'],
  amsterdam:      ['photo-1534351590666-13e3e96b5017','photo-1512470876302-972faa2aa9a4','photo-1449824913935-59a10b8d2000','photo-1469334031218-e382a71b716b','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1515886657613-9f3515b0c78f'],
  lisbon:         ['photo-1555881400-74d7acaacd8b','photo-1589909202802-8f4aadcea3e7','photo-1529156069898-49953e39b3ac','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1558769132-cb1aea458c5e','photo-1539109136881-3be0616acf4b'],
  tokyo:          ['photo-1540959733332-eab4deabeeaf','photo-1513407030348-c983a97b98d8','photo-1528360983277-13d401cdc186','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1515886657613-9f3515b0c78f','photo-1483985988355-763728e1802f'],
  'new york':     ['photo-1499396350179-1b1f573a0a2e','photo-1522083165195-3424ed129620','photo-1534430480872-3498386e7856','photo-1469334031218-e382a71b716b','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1539109136881-3be0616acf4b'],
  dubai:          ['photo-1512453979798-5ea266f8880c','photo-1547595628-c61a29f496f0','photo-1486325212027-8081e485255e','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  bali:           ['photo-1537996194471-e657df975ab4','photo-1518548419970-58e3b4079ab2','photo-1552465011-b4e21bf6e79a','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
  tulum:          ['photo-1547070057-1f0bc21399f1','photo-1518548419970-58e3b4079ab2','photo-1552465011-b4e21bf6e79a','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  marrakech:      ['photo-1489493585363-d69421e0edd3','photo-1547595628-c61a29f496f0','photo-1553913861-c0fddf2619ee','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
  copenhagen:     ['photo-1513622470522-26c3c8a854bc','photo-1512470876302-972faa2aa9a4','photo-1529156069898-49953e39b3ac','photo-1469334031218-e382a71b716b','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1515886657613-9f3515b0c78f'],
  stockholm:      ['photo-1509356843151-3e7d96241e11','photo-1512470876302-972faa2aa9a4','photo-1449824913935-59a10b8d2000','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
  athens:         ['photo-1555408967-52e95e89e7ce','photo-1533105079780-92b9be482077','photo-1613395877344-13d4a8e0d49e','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  prague:         ['photo-1541849546-216549ae216d','photo-1467269204594-f2f4f8fc33d8','photo-1449824913935-59a10b8d2000','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
  vienna:         ['photo-1516550893923-42d28e5677af','photo-1467269204594-f2f4f8fc33d8','photo-1441986300917-64674bd600d8','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  porto:          ['photo-1555400038-a2a4985a1eca','photo-1589909202802-8f4aadcea3e7','photo-1529156069898-49953e39b3ac','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
  monaco:         ['photo-1569437061241-a848be43cc82','photo-1502602898657-3e91760cbb34','photo-1527443154391-507e9dc6c5cc','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  madrid:         ['photo-1543162041-ee2c1ef3a474','photo-1539037116277-4db20889f2d4','photo-1558618666-fcd25c85cd64','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  nice:           ['photo-1528360983277-13d401cdc186','photo-1527443154391-507e9dc6c5cc','photo-1502602898657-3e91760cbb34','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
  capri:          ['photo-1568454537842-d933259bb258','photo-1516483638261-f4dbaf036963','photo-1534260164206-c77cd8e44e17','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  ibiza:          ['photo-1519046904884-53103b34b206','photo-1539037116277-4db20889f2d4','photo-1518548419970-58e3b4079ab2','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
  dubrovnik:      ['photo-1555408967-52e95e89e7ce','photo-1467269204594-f2f4f8fc33d8','photo-1449824913935-59a10b8d2000','photo-1469334031218-e382a71b716b','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1483985988355-763728e1802f','photo-1515886657613-9f3515b0c78f'],
  'french riviera':['photo-1527443154391-507e9dc6c5cc','photo-1502602898657-3e91760cbb34','photo-1569437061241-a848be43cc82','photo-1469334031218-e382a71b716b','photo-1558769132-cb1aea458c5e','photo-1549298916-b41d501d3772','photo-1483985988355-763728e1802f','photo-1539109136881-3be0616acf4b'],
};

const DEFAULT_IDS = ['photo-1469334031218-e382a71b716b','photo-1483985988355-763728e1802f','photo-1549298916-b41d501d3772','photo-1558769132-cb1aea458c5e','photo-1539109136881-3be0616acf4b','photo-1515886657613-9f3515b0c78f','photo-1445205170230-053b83016050','photo-1509631179647-0177331693ae'];

// ── Build source.unsplash.com URLs (free, no key, trend-driven) ───────────────
// These URLs redirect to a matching Unsplash photo — perfect for <img> tags.
// Because the redirect target varies over time, they create the "revolving" effect.
function buildSourceUrls(city, trendKeywords, count) {
  const photos = [];
  const w = 600, h = 800;

  // One URL per trending keyword (most specific, best match)
  if (trendKeywords && trendKeywords.length) {
    trendKeywords.slice(0, Math.ceil(count / 2)).forEach((kw, i) => {
      const terms = encodeURIComponent([kw, city, 'fashion'].join(','));
      photos.push({
        url:         `https://source.unsplash.com/featured/${w}x${h}/?${terms}`,
        thumb:       `https://source.unsplash.com/${Math.round(w/2)}x${Math.round(h/2)}/?${terms}`,
        alt:         `${city} ${kw} street style`,
        photographer:'Unsplash',
        source:      'source_unsplash',
        search_term: kw,
      });
    });
  }

  // General city fashion URLs to fill remaining slots
  const cityTerms = [
    `${city},street+style,fashion`,
    `${city},outfit,aesthetic`,
    `${city},travel,fashion,editorial`,
    `${city},style,luxury`,
    `${city},fashion,summer`,
  ];
  cityTerms.forEach((terms, i) => {
    if (photos.length >= count) return;
    photos.push({
      url:         `https://source.unsplash.com/featured/${w}x${h}/?${encodeURIComponent(terms)}`,
      thumb:       `https://source.unsplash.com/${Math.round(w/2)}x${Math.round(h/2)}/?${encodeURIComponent(terms)}`,
      alt:         `${city} fashion style ${i + 1}`,
      photographer:'Unsplash',
      source:      'source_unsplash',
      search_term: terms,
    });
  });

  return photos.slice(0, count);
}

// ── Build curated fallback photos (always works, no network needed) ───────────
function buildCuratedPhotos(city, count) {
  const key  = city.toLowerCase().trim();
  const ids  = CURATED[key] || DEFAULT_IDS;
  return ids.slice(0, count).map((id, i) => ({
    url:         `https://images.unsplash.com/${id}?w=600&h=800&fit=crop&q=85&auto=format`,
    thumb:       `https://images.unsplash.com/${id}?w=300&h=400&fit=crop&q=75&auto=format`,
    alt:         `${city} fashion ${i + 1}`,
    photographer:'Unsplash',
    source:      'curated',
    search_term: key,
  }));
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const qs      = event.queryStringParameters || {};
  const city    = (qs.city || 'Paris').trim();
  const count   = Math.min(parseInt(qs.count || '8', 10) || 8, 16);
  const refresh = qs.refresh === 'true';

  // 1 — Check /tmp photo cache
  if (!refresh) {
    const cached = photoCacheRead(city);
    if (cached) {
      return {
        statusCode: 200,
        headers:    CORS,
        body:       JSON.stringify({ city, photos: cached, cached: true, source: 'cache' }),
      };
    }
  }

  // 2 — Get trend keywords from live-trends /tmp cache (if available)
  const trendKeywords = getTrendKeywords(city);

  // 3 — Build dynamic source.unsplash.com URLs (trend-driven, no key needed)
  //     These are mixed with curated stable fallbacks for reliability.
  const halfCount  = Math.ceil(count / 2);
  const dynamic    = buildSourceUrls(city, trendKeywords, halfCount);
  const curated    = buildCuratedPhotos(city, count - dynamic.length);
  const photos     = [...dynamic, ...curated].slice(0, count);

  // 4 — Cache for 12 hours
  photoCacheWrite(city, photos);

  return {
    statusCode: 200,
    headers:    CORS,
    body:       JSON.stringify({
      city,
      photos,
      cached:        false,
      source:        'live',
      trend_driven:  (trendKeywords || []).length > 0,
      queries_used:  trendKeywords || [],
    }),
  };
};
