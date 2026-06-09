// MIKAYLA — Live Product Search Engine
// Endpoint: GET /api/product-search?item=chocolate+brown+blazer&city=Milan&category=outerwear&price_range=mid
//
// Priority:
//   1. Awin Product Data API  — real images, real prices, real affiliate links
//   2. Retailer search URLs   — Skimlinks auto-monetizes all of these (already on site)
//
// Required env: AWIN_PUBLISHER_ID (set), AWIN_API_TOKEN (add to Vercel to activate live search)

'use strict';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

const PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID || '2830228';
const AWIN_TOKEN   = process.env.AWIN_API_TOKEN;

// ── Category → Awin category ID ─────────────────────────────────────────────
const AWIN_CAT = {
  tops:        '167',
  bottoms:     '168',
  dresses:     '166',
  shoes:       '172',
  bags:        '178',
  accessories: '181',
  outerwear:   '169',
  swimwear:    '170',
  jewellery:   '182',
};

// ── Retailer search URLs — Skimlinks auto-monetizes all of these ─────────────
const RETAILERS = [
  { name: 'ASOS',         tier: 'budget',  fn: q => `https://www.asos.com/search/?q=${q}`                                          },
  { name: 'Zara',         tier: 'budget',  fn: q => `https://www.zara.com/gb/en/search?searchTerm=${q}`                            },
  { name: 'Mango',        tier: 'budget',  fn: q => `https://shop.mango.com/gb/women/all-products/search?q=${q}`                   },
  { name: 'Revolve',      tier: 'mid',     fn: q => `https://www.revolve.com/r/Search.jsp?search=${q}`                             },
  { name: 'Sézane',       tier: 'mid',     fn: q => `https://www.sezane.com/en/result?q=${q}`                                      },
  { name: 'COS',          tier: 'mid',     fn: q => `https://www.cos.com/en_gbp/women/search.html?q=${q}`                          },
  { name: 'Net-a-Porter', tier: 'luxury',  fn: q => `https://www.net-a-porter.com/en-gb/shop/search?q=${q}`                       },
  { name: 'Farfetch',     tier: 'luxury',  fn: q => `https://www.farfetch.com/shopping/search/?q=${q}`                             },
  { name: 'Matches',      tier: 'luxury',  fn: q => `https://www.matchesfashion.com/search?q=${q}`                                 },
  { name: 'MatchesFashion', tier: 'luxury',fn: q => `https://www.matchesfashion.com/search?q=${q}`                                 },
];

// ── Awin Product Data API search ─────────────────────────────────────────────
// Uses the Awin datafeed product search endpoint
async function searchAwin(query, category, limit = 8) {
  if (!AWIN_TOKEN) return null;

  const catId = AWIN_CAT[category] || '';
  // Build Awin datafeed search URL
  const params = new URLSearchParams({
    publisherId: PUBLISHER_ID,
    pageSize:    limit,
    sortBy:      'RELEVANCE',
    ...(catId ? { categoryId: catId } : {}),
  });

  // Try the Awin product search API
  const apiUrl = `https://productdata.awin.com/datafeed/list/apikey/${AWIN_TOKEN}/language/en/freetext/${encodeURIComponent(query)}/format/json/?${params}`;

  try {
    const res = await fetch(apiUrl, {
      signal:  AbortSignal.timeout(8000),
      headers: { 'Authorization': `Bearer ${AWIN_TOKEN}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;

    return data.slice(0, limit).map(p => ({
      id:          p.aw_product_id || String(p.product_id),
      name:        p.product_name  || p.name,
      brand:       p.brand_name    || p.merchant_name,
      price:       parseFloat(p.display_price || p.search_price) || 0,
      currency:    p.currency || 'GBP',
      image:       p.merchant_image_url || p.aw_image_url || p.image_url,
      affiliate_url: p.aw_deep_link   || p.merchant_deep_link,
      merchant:    p.merchant_name,
      in_stock:    p.in_stock !== false,
      source:      'awin_live',
    })).filter(p => p.image && p.affiliate_url); // only usable products
  } catch (e) {
    console.error('Awin product search error:', e.message);
    return null;
  }
}

// ── Build curated retailer link list based on price tier ─────────────────────
function buildRetailerLinks(searchQuery, priceRange) {
  const q = encodeURIComponent(searchQuery);

  // Always give budget + mid + luxury options so every user is covered
  const budget  = RETAILERS.filter(r => r.tier === 'budget').slice(0, 2);
  const mid     = RETAILERS.filter(r => r.tier === 'mid').slice(0, 2);
  const luxury  = RETAILERS.filter(r => r.tier === 'luxury').slice(0, 2);

  let selected;
  if (priceRange === 'budget')  selected = [...budget, mid[0]];
  else if (priceRange === 'luxury') selected = [...luxury, mid[0]];
  else selected = [budget[0], mid[0], luxury[0]];

  return selected.filter(Boolean).map(r => ({
    name: r.name,
    tier: r.tier,
    url:  r.fn(q),
  }));
}

// ── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const p          = event.queryStringParameters || {};
  const item       = (p.item       || '').trim();
  const city       = (p.city       || 'Paris').trim();
  const category   = (p.category   || 'tops').trim();
  const priceRange = (p.price_range || 'mid').trim();

  if (!item) {
    return {
      statusCode: 400,
      headers:    CORS,
      body:       JSON.stringify({ error: '`item` query parameter is required' }),
    };
  }

  try {
    // 1. Try live Awin search
    const liveProducts = await searchAwin(item, category, 6);

    // 2. Always build retailer links (Skimlinks-monetized, zero config needed)
    const retailerLinks = buildRetailerLinks(item, priceRange);

    return {
      statusCode: 200,
      headers:    { ...CORS, 'Cache-Control': 'public, s-maxage=3600' },
      body:       JSON.stringify({
        item,
        city,
        category,
        price_range:    priceRange,
        live_products:  liveProducts,            // real Awin products (null if no token)
        retailer_links: retailerLinks,            // always present, Skimlinks-monetized
        awin_active:    !!liveProducts,
        _note: liveProducts
          ? `${liveProducts.length} live Awin products found`
          : 'Add AWIN_API_TOKEN to Vercel env vars to activate live product images + prices',
      }),
    };

  } catch (err) {
    console.error('product-search error:', err);
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
