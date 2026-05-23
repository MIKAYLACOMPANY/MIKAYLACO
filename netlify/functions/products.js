// MIKAYLA — Product Recommendations Function
// Endpoint: /api/products?city=Paris&vibe=minimal&category=tops
//
// Returns real shoppable products from Awin product feeds.
// Falls back to curated demo data if Awin is not configured.
//
// TO ACTIVATE REAL PRODUCTS:
//   1. Log into app.netlify.com → Site settings → Environment variables
//   2. Add AWIN_API_TOKEN = your token from awin.com → Account → API credentials
//   3. Redeploy. Real product images + affiliate links will replace this demo data.

const AWIN_PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID || '2830228';
const AWIN_API_TOKEN    = process.env.AWIN_API_TOKEN;

// ── Awin advertiser IDs for key fashion/travel brands ──────────────────────
const AWIN_ADVERTISERS = {
  farfetch:       '14780',
  asos:           '15453',
  net_a_porter:   '13640',
  revolve:        '22757',
  cos:            '18605',
  other_stories:  '17064',
  mango:          '15725',
  zara:           '15680',
};

// ── City → brand affinity mapping ──────────────────────────────────────────
const CITY_BRANDS = {
  paris:      ['farfetch', 'net_a_porter', 'cos', 'other_stories'],
  milan:      ['farfetch', 'net_a_porter', 'revolve', 'mango'],
  london:     ['asos', 'cos', 'other_stories', 'farfetch'],
  new_york:   ['revolve', 'farfetch', 'asos', 'mango'],
  tokyo:      ['farfetch', 'asos', 'revolve', 'cos'],
  barcelona:  ['mango', 'zara', 'farfetch', 'other_stories'],
  amsterdam:  ['cos', 'other_stories', 'asos', 'farfetch'],
  positano:   ['farfetch', 'revolve', 'mango', 'other_stories'],
  default:    ['farfetch', 'asos', 'cos', 'mango'],
};

// ── City → style vibe ───────────────────────────────────────────────────────
const CITY_VIBES = {
  paris:      { keywords: ['minimalist','chic','effortless','parisian'], trending: ['trench coat','ballet flat','straight leg jean'] },
  milan:      { keywords: ['tailored','luxury','editorial','polished'], trending: ['structured blazer','pointed heel','leather bag'] },
  london:     { keywords: ['eclectic','layered','creative','cool'],     trending: ['trench coat','ankle boot','printed scarf'] },
  new_york:   { keywords: ['casual luxe','sporty chic','directional'],  trending: ['wide-leg pant','sneaker','tote bag'] },
  tokyo:      { keywords: ['avant-garde','precise','minimal','graphic'], trending: ['oversized silhouette','loafer','clean line'] },
  barcelona:  { keywords: ['vibrant','warm','relaxed luxury','coastal'], trending: ['sundress','espadrille','woven bag'] },
  positano:   { keywords: ['dolce vita','resort','sun-washed','easy'],  trending: ['linen co-ord','sandal','raffia hat'] },
  default:    { keywords: ['versatile','elevated','travel-ready'],       trending: ['neutral basics','flat shoe','day bag'] },
};

// ── Curated demo product catalog ────────────────────────────────────────────
// Editorial lifestyle photos — all verified Unsplash IDs, unique per product.
// Affiliate links are real product search URLs — Skimlinks-compatible.
const DEMO_PRODUCTS = {

  tops: [
    {
      id:'t1', name:'Silk Slip Camisole', brand:'Totême', price:290,
      image:'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.net-a-porter.com/en-us/search?q=silk+slip+camisole',
      city:['paris','milan','new_york'], vibe:'minimalist'
    },
    {
      id:'t2', name:'Linen Oversized Shirt', brand:'COS', price:89,
      image:'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=oversized+linen+shirt+women',
      city:['london','copenhagen','amsterdam'], vibe:'minimal'
    },
    {
      id:'t3', name:'Broderie Anglaise Blouse', brand:'& Other Stories', price:99,
      image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=broderie+anglaise+blouse',
      city:['paris','barcelona','positano'], vibe:'romantic'
    },
    {
      id:'t4', name:'Ribbed Knit Tank', brand:'Mango', price:35,
      image:'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop&q=85',
      affiliate:'https://shop.mango.com/gb/women/all-products/search?q=ribbed+knit+tank',
      city:['barcelona','new_york','milan'], vibe:'casual'
    },
    {
      id:'t5', name:'Poplin Wrap Blouse', brand:'Sandro', price:195,
      image:'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.revolve.com/r/Search.jsp?search=wrap+blouse+women',
      city:['paris','milan'], vibe:'chic'
    },
    {
      id:'t6', name:'Cotton Cropped Tee', brand:'A.P.C.', price:95,
      image:'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=cotton+cropped+tee+women',
      city:['paris','new_york','tokyo'], vibe:'minimal'
    },
  ],

  bottoms: [
    {
      id:'b1', name:'Wide-Leg Tailored Trousers', brand:'COS', price:135,
      image:'https://images.unsplash.com/photo-1594938298603-c8148c4b4a6b?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=wide+leg+tailored+trousers+women',
      city:['paris','london','amsterdam'], vibe:'minimalist'
    },
    {
      id:'b2', name:'High-Waist Straight Jeans', brand:'Totême', price:310,
      image:'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.revolve.com/r/Search.jsp?search=high+waist+straight+jeans',
      city:['new_york','london','paris'], vibe:'casual luxe'
    },
    {
      id:'b3', name:'Midi Linen Skirt', brand:'& Other Stories', price:79,
      image:'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=midi+linen+skirt',
      city:['paris','barcelona','positano'], vibe:'effortless'
    },
    {
      id:'b4', name:'Pleated Satin Midi Skirt', brand:'Mango', price:69,
      image:'https://images.unsplash.com/photo-1569897875878-0a695a0f8e9e?w=600&h=800&fit=crop&q=85',
      affiliate:'https://shop.mango.com/gb/women/all-products/search?q=pleated+satin+midi+skirt',
      city:['milan','paris','new_york'], vibe:'evening'
    },
    {
      id:'b5', name:'Tailored Bermuda Short', brand:'Jacquemus', price:290,
      image:'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.farfetch.com/shopping/women/search/items.aspx?q=bermuda+shorts+tailored',
      city:['paris','positano','barcelona'], vibe:'resort'
    },
  ],

  dresses: [
    {
      id:'dr1', name:'Satin Wrap Midi Dress', brand:'& Other Stories', price:149,
      image:'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=satin+wrap+midi+dress',
      city:['paris','milan','new_york'], vibe:'evening'
    },
    {
      id:'dr2', name:'Linen Shift Dress', brand:'COS', price:119,
      image:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=linen+shift+dress+women',
      city:['positano','barcelona','amsterdam'], vibe:'effortless'
    },
    {
      id:'dr3', name:'Floral Wrap Dress', brand:'Mango', price:89,
      image:'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=800&fit=crop&q=85',
      affiliate:'https://shop.mango.com/gb/women/all-products/search?q=floral+wrap+dress',
      city:['positano','barcelona','paris'], vibe:'resort'
    },
    {
      id:'dr4', name:'Column Slip Dress', brand:'Totême', price:395,
      image:'https://images.unsplash.com/photo-1566479179817-4a0e744c4d7e?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.net-a-porter.com/en-us/search?q=column+slip+dress',
      city:['new_york','milan','paris'], vibe:'minimalist'
    },
    {
      id:'dr5', name:'Flowing Maxi Dress', brand:'Revolve', price:228,
      image:'https://images.unsplash.com/photo-1522156373667-4c7234bbd804?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.revolve.com/r/Search.jsp?search=flowing+maxi+dress',
      city:['santorini','positano','ibiza'], vibe:'resort'
    },
  ],

  shoes: [
    {
      id:'s1', name:'Kitten Heel Mules', brand:'Mango', price:89,
      image:'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=kitten+heel+mules+women',
      city:['paris','new_york','milan'], vibe:'chic'
    },
    {
      id:'s2', name:'Positano Leather Sandal', brand:'ATP Atelier', price:285,
      image:'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.farfetch.com/shopping/women/search/items.aspx?q=flat+leather+sandal',
      city:['positano','barcelona','milan'], vibe:'resort'
    },
    {
      id:'s3', name:'Pointed Ballet Flat', brand:'Sandro', price:265,
      image:'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=pointed+toe+ballet+flat',
      city:['paris','london','milan'], vibe:'parisian'
    },
    {
      id:'s4', name:'White Leather Loafer', brand:'A.P.C.', price:340,
      image:'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.revolve.com/r/Search.jsp?search=white+leather+loafer+women',
      city:['paris','tokyo','amsterdam'], vibe:'minimal'
    },
    {
      id:'s5', name:'Block Heel Sandal', brand:'Zara', price:59,
      image:'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.zara.com/gb/en/search?searchTerm=block+heel+sandal',
      city:['barcelona','new_york','milan'], vibe:'casual'
    },
    {
      id:'s6', name:'Espadrille Wedge', brand:'Mango', price:69,
      image:'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&h=800&fit=crop&q=85',
      affiliate:'https://shop.mango.com/gb/women/all-products/search?q=espadrille+wedge',
      city:['barcelona','positano','ibiza'], vibe:'resort'
    },
  ],

  bags: [
    {
      id:'bg1', name:'Numéro Un Mini', brand:'Polène', price:295,
      image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.farfetch.com/shopping/women/search/items.aspx?q=mini+leather+shoulder+bag',
      city:['paris','london','milan'], vibe:'minimalist'
    },
    {
      id:'bg2', name:'T-Lock Clutch', brand:'Toteme', price:390,
      image:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.net-a-porter.com/en-us/search?q=leather+clutch+bag+evening',
      city:['milan','paris','new_york'], vibe:'evening'
    },
    {
      id:'bg3', name:'Mini Camera Bag', brand:'A.P.C.', price:445,
      image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.farfetch.com/shopping/women/search/items.aspx?q=mini+camera+bag+crossbody',
      city:['paris','tokyo','amsterdam'], vibe:'minimal'
    },
    {
      id:'bg4', name:'Raffia Bucket Bag', brand:'Mango', price:79,
      image:'https://images.unsplash.com/photo-1583845112203-29329902332e?w=600&h=800&fit=crop&q=85',
      affiliate:'https://shop.mango.com/gb/women/all-products/search?q=raffia+bucket+bag',
      city:['barcelona','london','new_york'], vibe:'casual'
    },
    {
      id:'bg5', name:'Chain Shoulder Bag', brand:'Revolve', price:198,
      image:'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.revolve.com/r/Search.jsp?search=chain+shoulder+bag+women',
      city:['new_york','milan','positano'], vibe:'evening'
    },
  ],

  accessories: [
    {
      id:'a1', name:'Gold Dome Ring Set', brand:'Mejuri', price:78,
      image:'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=gold+dome+ring+set+women',
      city:['paris','new_york','milan'], vibe:'minimalist'
    },
    {
      id:'a2', name:'Oversized Sunglasses', brand:'Celine', price:450,
      image:'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.farfetch.com/shopping/women/search/items.aspx?q=oversized+sunglasses+women',
      city:['paris','milan','positano'], vibe:'luxury'
    },
    {
      id:'a3', name:'Gold Cuff Bangle', brand:'Mejuri', price:118,
      image:'https://images.unsplash.com/photo-1485518882345-15568b007407?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=gold+cuff+bangle+bracelet',
      city:['new_york','london','milan'], vibe:'casual luxe'
    },
    {
      id:'a4', name:'Silk Square Scarf', brand:'& Other Stories', price:55,
      image:'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=silk+square+scarf+women',
      city:['paris','milan','tokyo'], vibe:'parisian'
    },
    {
      id:'a5', name:'Pearl Drop Earrings', brand:'Mejuri', price:95,
      image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=pearl+drop+earrings+women',
      city:['paris','london','milan'], vibe:'classic'
    },
    {
      id:'a6', name:'Woven Raffia Hat', brand:'ASOS', price:32,
      image:'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop&q=85',
      affiliate:'https://www.asos.com/search/?q=woven+raffia+straw+hat',
      city:['positano','barcelona','paris'], vibe:'resort'
    },
  ],

};

// ── Fetch real products from Awin product API ──────────────────────────────
async function fetchAwinProducts(category, city, limit = 8) {
  if (!AWIN_PUBLISHER_ID || !AWIN_API_TOKEN) return null;

  const cityKey   = city.toLowerCase().replace(/\s+/g, '_').split(',')[0].trim();
  const brands    = CITY_BRANDS[cityKey] || CITY_BRANDS.default;
  const advertIds = brands.map(b => AWIN_ADVERTISERS[b]).filter(Boolean).join(',');

  const awinCategories = {
    tops:        '167',
    bottoms:     '168',
    dresses:     '166',
    shoes:       '172',
    bags:        '178',
    accessories: '181',
  };
  const categoryId = awinCategories[category] || '167';

  const url = `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/product-search?` +
    `advertiserId=${advertIds}&categoryId=${categoryId}&pageSize=${limit}&` +
    `sortBy=RELEVANCE&promotionType=ANY`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${AWIN_API_TOKEN}` }
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.products || !data.products.length) return null;

  return data.products.map(p => ({
    id:        p.productId,
    name:      p.productName,
    brand:     p.brandName || p.merchantName,
    price:     parseFloat(p.displayPrice) || 0,
    image:     p.imageUrl,
    affiliate: p.awDeepLink,
    source:    'awin',
  }));
}

// ── Smart demo fallback: city-aware product ranking ─────────────────────────
function getDemoProducts(category, city, limit) {
  const cityKey = city.toLowerCase().replace(/\s+/g, '_').split(',')[0].trim();
  const pool    = DEMO_PRODUCTS[category] || DEMO_PRODUCTS.accessories;
  const vibe    = CITY_VIBES[cityKey] || CITY_VIBES.default;

  const scored = pool.map(p => {
    let score = 1;
    if (p.city.includes(cityKey))                        score += 3;
    if (vibe.keywords.some(k => (p.vibe||'').includes(k))) score += 2;
    return { ...p, _score: score };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...p }) => ({ ...p, source: 'demo' }));
}

// ── Main handler ───────────────────────────────────────────────────────────
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: ''
    };
  }

  const params   = event.queryStringParameters || {};
  const city     = params.city     || 'Paris';
  const category = params.category || 'accessories';
  const limit    = parseInt(params.limit || '6', 10);

  try {
    let products = await fetchAwinProducts(category, city, limit);
    if (!products) {
      products = getDemoProducts(category, city, limit);
    }

    const cityKey = city.toLowerCase().replace(/\s+/g, '_').split(',')[0].trim();
    const vibe    = CITY_VIBES[cityKey] || CITY_VIBES.default;

    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'public, s-maxage=3600',
      },
      body: JSON.stringify({
        city,
        category,
        vibe: vibe.keywords[0],
        trending: vibe.trending,
        products,
        source: products[0]?.source || 'demo',
        powered_by_awin: !!AWIN_API_TOKEN,
      }),
    };

  } catch (err) {
    console.error('products function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch products', details: err.message }),
    };
  }
};
