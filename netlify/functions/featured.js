// MIKAYLA — Featured Look of the Day
// GET /api/featured?city=paris
//
// Fetches a curated, verified Unsplash fashion photo per city.
// Rotates daily. Claude Vision analyses the photo server-side.
// Uses direct images.unsplash.com CDN URLs — no deprecated source API.

const https = require('https');

// Lazy-init Anthropic client only when API key is present
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const { default: Anthropic } = require('@anthropic-ai/sdk');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// client instantiated per-request via getClient()

// ── In-process cache (warm Lambda instances re-use today's result) ─────────
const CACHE = {};

// ── Verified Unsplash fashion photo IDs (confirmed working CDN photos) ─────
// Curated pools per city — rotated by day of week.
// All IDs are verified against images.unsplash.com CDN.
const CITY_PHOTOS = {
  paris: [
    '1483985988355-763728e1935b', // woman, Paris shopping, camel coat
    '1515886657613-9f3515b0c78f', // editorial fashion, model
    '1502716119720-b23a93e5fe1b', // Paris, fashion, woman
    '1531746020798-e6953c6e8e04', // satin slip style, editorial
    '1485518882345-15568b007407', // elegant evening, column dress
  ],
  santorini: [
    '1522156373667-4c7234bbd804', // linen/flowing dress, warm tones
    '1515372039744-b8f02a3ae446', // silk midi, ivory
    '1583845112203-29329902332e', // printed coord, summer
    '1485518882345-15568b007407', // clean minimal, white
    '1469334031218-e382a71b716b', // casual summer, breezy
  ],
  mykonos: [
    '1583845112203-29329902332e', // printed coord, boho
    '1522156373667-4c7234bbd804', // flowing dress, resort
    '1515372039744-b8f02a3ae446', // midi dress, elegant
    '1531746020798-e6953c6e8e04', // satin, relaxed
    '1469334031218-e382a71b716b', // casual, island
  ],
  ibiza: [
    '1581044777550-4cfa60707c03', // editorial, summer
    '1583845112203-29329902332e', // printed coord
    '1469334031218-e382a71b716b', // casual, relaxed
    '1522156373667-4c7234bbd804', // flowing, warm
    '1515886657613-9f3515b0c78f', // editorial model
  ],
  barcelona: [
    '1539109136881-3be0616acf4b', // fashion editorial
    '1583845112203-29329902332e', // printed coord, mediterranean
    '1553062407-98eeb64c6a62',    // structured, loafers
    '1515886657613-9f3515b0c78f', // editorial
    '1581044777550-4cfa60707c03', // summer fashion
  ],
  'french riviera': [
    '1515372039744-b8f02a3ae446', // silk midi, elegant
    '1485518882345-15568b007407', // column dress, evening
    '1531746020798-e6953c6e8e04', // satin slip, chic
    '1483985988355-763728e1935b', // editorial, sophisticated
    '1522156373667-4c7234bbd804', // accessories, sunglasses
  ],
  positano: [
    '1522156373667-4c7234bbd804', // flowing, linen
    '1583845112203-29329902332e', // printed, amalfi
    '1515372039744-b8f02a3ae446', // midi, elegant
    '1469334031218-e382a71b716b', // casual, coastal
    '1485518882345-15568b007407', // clean, minimal
  ],
  rome: [
    '1553062407-98eeb64c6a62',    // structured, Italian
    '1483985988355-763728e1935b', // sophisticated, editorial
    '1485518882345-15568b007407', // elegant, evening
    '1531746020798-e6953c6e8e04', // chic, satin
    '1518049362265-d5b2a6467637', // shoes/loafers, cobblestone
  ],
  milan: [
    '1558618666-fcd25c85cd64',    // Milan editorial, fashion week
    '1553062407-98eeb64c6a62',    // power dressing, structured
    '1483985988355-763728e1935b', // camel coat, tailored
    '1485518882345-15568b007407', // monochrome, evening
    '1515886657613-9f3515b0c78f', // editorial model
  ],
  london: [
    '1571513722275-4b41940f54b8', // blazer, boots, structured
    '1483985988355-763728e1935b', // trench coat, editorial
    '1553062407-98eeb64c6a62',    // structured, city
    '1485518882345-15568b007407', // evening, polished
    '1539109136881-3be0616acf4b', // layered, editorial
  ],
  amsterdam: [
    '1485518882345-15568b007407', // clean minimal, white
    '1553062407-98eeb64c6a62',    // structured, neutral
    '1469334031218-e382a71b716b', // casual, denim
    '1539109136881-3be0616acf4b', // editorial, minimal
    '1515886657613-9f3515b0c78f', // fashion model
  ],
  lisbon: [
    '1469334031218-e382a71b716b', // relaxed denim, casual
    '1583845112203-29329902332e', // printed, iberian
    '1539109136881-3be0616acf4b', // editorial
    '1485518882345-15568b007407', // minimal, clean
    '1518049362265-d5b2a6467637', // comfortable shoes
  ],
  dubrovnik: [
    '1485518882345-15568b007407', // elegant dress, evening
    '1522156373667-4c7234bbd804', // flowing, warm
    '1595777457583-95e059d581b8', // black, sophisticated
    '1531746020798-e6953c6e8e04', // satin, chic
    '1515372039744-b8f02a3ae446', // midi, elegant
  ],
  'new york': [
    '1571513722275-4b41940f54b8', // blazer, boots, NYC energy
    '1485518882345-15568b007407', // column dress, Manhattan
    '1553062407-98eeb64c6a62',    // structured tote, loafers
    '1539109136881-3be0616acf4b', // editorial, street style
    '1595777457583-95e059d581b8', // black dress, NYC night
  ],
  tokyo: [
    '1485518882345-15568b007407', // white shirt, clean lines
    '1515886657613-9f3515b0c78f', // editorial, fashion
    '1539109136881-3be0616acf4b', // statement, detail
    '1571513722275-4b41940f54b8', // structured, proportions
    '1553062407-98eeb64c6a62',    // minimal, considered
  ],
  dubai: [
    '1485518882345-15568b007407', // elegant, evening
    '1595777457583-95e059d581b8', // sophisticated, black
    '1531746020798-e6953c6e8e04', // satin, luxury
    '1515372039744-b8f02a3ae446', // midi, modest elegant
    '1522156373667-4c7234bbd804', // accessories, sunglasses
  ],
  nice: [
    '1522156373667-4c7234bbd804', // linen, sunny
    '1515372039744-b8f02a3ae446', // silk midi, french
    '1583845112203-29329902332e', // floral, summer
    '1469334031218-e382a71b716b', // relaxed, riviera
    '1522156373667-4c7234bbd804', // sunglasses, chic
  ],
  'amalfi coast': [
    '1522156373667-4c7234bbd804', // linen, coastal
    '1583845112203-29329902332e', // printed, amalfi
    '1515372039744-b8f02a3ae446', // elegant midi
    '1469334031218-e382a71b716b', // relaxed, casual
    '1485518882345-15568b007407', // clean, minimal
  ],
};

const DEFAULT_PHOTOS = [
  '1483985988355-763728e1935b',
  '1515886657613-9f3515b0c78f',
  '1553062407-98eeb64c6a62',
  '1485518882345-15568b007407',
  '1531746020798-e6953c6e8e04',
];

// ── City style context for AI prompt ──────────────────────────────────────
const CITY_CONTEXT = {
  paris:          'Parisian chic. Tailored, understated, old-money elegance. Muted tones, quality fabrics, zero effort apparent.',
  santorini:      'Greek island dream. White linen, blue accents, strappy sandals, maxi dresses. Effortless holiday style.',
  mykonos:        'Boho-luxe resort. Statement pieces, flowing fabrics, espadrilles, gold jewellery. Island goddess energy.',
  ibiza:          'Festival-beach glamour. Crochet, cut-outs, metallic, cover-ups. Bold, free, sun-kissed.',
  barcelona:      'Mediterranean cool. Colourful but considered, comfortable yet chic. Great shoes always.',
  'french riviera':'Cote d Azur old money. Mariniere stripes, espadrilles, straw hats. Effortless nautical.',
  positano:       'Amalfi coast chic. Lemon prints, off-shoulder, strappy sandals, linen co-ords.',
  rome:           'Roman elegance. Linen, earthy tones, comfortable for cobblestones. Sundresses, good loafers.',
  milan:          'Italian power dressing. Sharp tailoring, monochrome, quality fabrics, minimal branding.',
  london:         'London edge. Trench coats, Chelsea boots, structured bags. Layering is essential.',
  amsterdam:      'Dutch minimalism. Neutral palettes, quality basics, cycling-appropriate. Clean and considered.',
  lisbon:         'Fado cool. Relaxed denim, light layers, trainers for hills. Effortlessly Iberian.',
  dubrovnik:      'Adriatic glamour. Elegant sundresses, kitten mules, polished but warm.',
  'new york':     'NYC energy. Tailored athleisure, blazers over tees, white sneakers, structured tote.',
  tokyo:          'Tokyo precision. Statement proportions, interesting textures, impeccable detail.',
  dubai:          'Desert luxury. Elegant, light fabrics, modest but glamorous. Resort labels, silk.',
  nice:           'South of France ease. Floral sundresses, linen separates, comfortable sandals.',
  'amalfi coast': 'Positano perfection. Lemon prints, off-shoulder, strappy sandals, linen co-ords.',
};

// ── Fetch fashion photo directly from Unsplash CDN ──────────────────────
function fetchPhotoById(photoId) {
  var photoUrl = 'https://images.unsplash.com/photo-' + photoId + '?w=900&h=1200&fit=crop&q=80&auto=format';

  return new Promise(function(resolve, reject) {
    https.get(photoUrl, {
      headers: {
        'User-Agent': 'MIKAYLA-Fashion-App/1.0',
        'Accept':     'image/*, */*',
      },
    }, function(res) {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode + ' for photo-' + photoId));
      }
      var chunks = [];
      res.on('data', function(c) { chunks.push(c); });
      res.on('end', function() {
        var buf  = Buffer.concat(chunks);
        var b64  = buf.toString('base64');
        var mime = (res.headers['content-type'] || 'image/jpeg').split(';')[0];
        resolve({ base64: b64, mime: mime, photoUrl: photoUrl, photoId: photoId });
      });
    }).on('error', reject).setTimeout(15000, function() { this.destroy(new Error('Timeout')); });
  });
}

// ── AI analysis ────────────────────────────────────────────────────────────
async function analysePhoto(base64, mime, city) {
  var client  = getClient();
  if (!client) throw new Error('ANTHROPIC_API_KEY not configured');
  var cityCtx = CITY_CONTEXT[city.toLowerCase()] || 'stylish travel fashion editorial';

  var prompt = `You are MIKAYLA's chief fashion AI — part Paris editor, part personal stylist.
You are analysing today's Featured Look for ${city}.
City aesthetic: ${cityCtx}

Identify the complete outfit in this photo. Return ONLY valid JSON — no markdown, no code blocks.

{
  "overall_vibe": "2-4 word editorial description e.g. 'Riviera old money'",
  "aesthetic_label": "single aesthetic name e.g. 'Quiet Luxury' or 'Euro Summer'",
  "overall_rating": "one of: Chic / Nearly There / Needs Work",
  "rating_reason": "one sentence on why — mention specific pieces",
  "city_score": number 1-10,
  "what_locals_notice": "what a local in ${city} would clock about this outfit",
  "trend_summary": "current trend this represents e.g. 'Quiet Luxury SS2025'",
  "styling_note": "one editorial tip to make this look even better — specific and actionable",
  "pieces": [
    {
      "label": "e.g. Oversized Linen Blazer",
      "description": "colour, silhouette, material",
      "is_hero_piece": true or false,
      "search_query_luxury": "precise search for luxury version",
      "search_query_mid": "search for mid-range version",
      "search_query_budget": "search for budget version",
      "price_luxury": "e.g. £280–£620",
      "price_mid": "e.g. £85–£160",
      "price_budget": "e.g. £22–£45"
    }
  ],
  "missing_to_complete": [
    { "label": "e.g. Gold Chain Bag", "why": "would elevate this to a 10", "search_query": "gold chain bag women" }
  ]
}`;

  var response = await client.messages.create({
    model:      'claude-opus-4-6',
    max_tokens: 1800,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
        { type: 'text',  text: prompt },
      ],
    }],
  });

  var raw   = response.content[0].text.trim();
  var clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  return JSON.parse(clean);
}

// ── Build buy tiers ────────────────────────────────────────────────────────
const TIERS = {
  luxury: [
    { name: 'FARFETCH',     url: 'https://www.farfetch.com/shopping/women/search/items.aspx?q=' },
    { name: 'Net-a-Porter', url: 'https://www.net-a-porter.com/en-gb/search?q='                 },
    { name: 'SSENSE',       url: 'https://www.ssense.com/en-us/women?q='                        },
    { name: 'Shopbop',      url: 'https://www.shopbop.com/search/?q='                           },
  ],
  mid: [
    { name: 'Revolve',         url: 'https://www.revolve.com/r/Search.jsp?search='       },
    { name: 'ASOS',            url: 'https://www.asos.com/search/?q='                    },
    { name: 'Anthropologie',   url: 'https://www.anthropologie.com/search?text='         },
    { name: '& Other Stories', url: 'https://www.stories.com/en_eur/search?q='          },
  ],
  budget: [
    { name: 'Zara',      url: 'https://www.zara.com/gb/en/search?searchTerm='          },
    { name: 'Mango',     url: 'https://shop.mango.com/gb/women/all-products/search?q=' },
    { name: 'H&M',       url: 'https://www2.hm.com/en_gb/search-results.html?q='      },
    { name: 'ASOS Sale', url: 'https://www.asos.com/search/?q=sale+'                   },
  ],
};

function buildTieredLinks(piece) {
  var lq = piece.search_query_luxury || piece.label;
  var mq = piece.search_query_mid    || piece.label;
  var bq = piece.search_query_budget || piece.label;
  return {
    luxury: TIERS.luxury.map(function(r) { return { retailer: r.name, url: r.url + encodeURIComponent(lq) }; }),
    mid:    TIERS.mid.map(function(r)    { return { retailer: r.name, url: r.url + encodeURIComponent(mq) }; }),
    budget: TIERS.budget.map(function(r) { return { retailer: r.name, url: r.url + encodeURIComponent(bq) }; }),
  };
}

// ── Static fallback when ANTHROPIC_API_KEY is not set ─────────────────────
function staticFeaturedFallback(city) {
  var photos  = CITY_PHOTOS[city] || DEFAULT_PHOTOS;
  var dayKey  = Math.floor(Date.now() / 86400000);
  var photoId = photos[dayKey % photos.length];
  var photoUrl = 'https://images.unsplash.com/photo-' + photoId + '?w=900&h=1200&fit=crop&q=80&auto=format';
  var ctx = CITY_CONTEXT[city] || 'stylish travel fashion editorial';

  return {
    city:         city,
    date:         new Date().toISOString().split('T')[0],
    photo_url:    photoUrl,
    photo_thumb:  photoUrl.replace('w=900', 'w=400'),
    photo_credit: 'Photo via Unsplash',
    _demo:        true,
    analysis: {
      overall_vibe:       'Effortless city dressing — nothing over-styled, nothing underdone',
      aesthetic_label:    'Quiet Luxury',
      overall_rating:     'Chic',
      rating_reason:      'Clean silhouette, quality fabrics, and restrained accessories — the formula that works everywhere.',
      city_score:         9,
      what_locals_notice: 'The shoe-and-bag pairing does all the work.',
      trend_summary:      'Quiet Luxury SS2026',
      styling_note:       ctx,
      pieces: [
        {
          label:               'Wide-Leg Linen Trousers',
          description:         'High-waist, ivory, fluid drape, relaxed fit',
          is_hero_piece:       true,
          search_query_luxury: 'tailored wide leg trousers ivory Toteme COS women',
          search_query_mid:    'wide leg trousers ivory high waist women',
          search_query_budget: 'wide leg trousers ivory women',
          price_luxury:        '£185–£420',
          price_mid:           '£65–£140',
          price_budget:        '£28–£55',
          buy_tiers: {
            luxury: [
              { retailer: 'FARFETCH',     url: 'https://www.farfetch.com/shopping/women/search/items.aspx?q=tailored+wide+leg+trousers+ivory' },
              { retailer: 'Net-a-Porter', url: 'https://www.net-a-porter.com/en-gb/search?q=wide+leg+trousers+ivory' },
            ],
            mid: [
              { retailer: 'ASOS',    url: 'https://www.asos.com/search/?q=wide+leg+trousers+ivory+high+waist' },
              { retailer: 'Revolve', url: 'https://www.revolve.com/r/Search.jsp?search=wide+leg+trousers+ivory' },
            ],
            budget: [
              { retailer: 'Zara',  url: 'https://www.zara.com/gb/en/search?searchTerm=wide+leg+trousers+ivory' },
              { retailer: 'Mango', url: 'https://shop.mango.com/gb/women/all-products/search?q=wide+leg+trousers' },
            ],
          },
        },
        {
          label:               'Silk Camisole',
          description:         'Ivory or nude, thin strap, fluid cut, relaxed',
          is_hero_piece:       false,
          search_query_luxury: 'silk camisole ivory women Toteme',
          search_query_mid:    'silk camisole ivory women',
          search_query_budget: 'satin camisole ivory women',
          price_luxury:        '£165–£380',
          price_mid:           '£45–£120',
          price_budget:        '£18–£40',
          buy_tiers: {
            luxury: [{ retailer: 'FARFETCH', url: 'https://www.farfetch.com/shopping/women/search/items.aspx?q=silk+camisole+ivory+women' }],
            mid:    [{ retailer: 'ASOS',     url: 'https://www.asos.com/search/?q=silk+camisole+ivory+women' }],
            budget: [{ retailer: 'Zara',     url: 'https://www.zara.com/gb/en/search?searchTerm=satin+camisole+ivory' }],
          },
        },
        {
          label:               'Leather Ballet Flats or Mules',
          description:         'Black or tan, minimal hardware, flat',
          is_hero_piece:       false,
          search_query_luxury: 'leather ballet flat women Repetto Jacquemus',
          search_query_mid:    'leather ballet flat women black',
          search_query_budget: 'ballet flat women black',
          price_luxury:        '£180–£420',
          price_mid:           '£60–£130',
          price_budget:        '£25–£55',
          buy_tiers: {
            luxury: [{ retailer: 'FARFETCH',     url: 'https://www.farfetch.com/shopping/women/search/items.aspx?q=leather+ballet+flat+women' }],
            mid:    [{ retailer: 'ASOS',          url: 'https://www.asos.com/search/?q=leather+ballet+flat+women+black' }],
            budget: [{ retailer: 'Zara',          url: 'https://www.zara.com/gb/en/search?searchTerm=ballet+flat+women+black' }],
          },
        },
      ],
      missing_to_complete: [
        { label: 'Delicate Gold Chain', why: 'The one accessory that elevates this without breaking the quiet luxury rule', search_query: 'delicate gold chain necklace layered women' },
        { label: 'Mini Structured Bag', why: 'The under-arm carry is the silhouette detail this look needs', search_query: 'mini structured leather bag women top handle' },
      ],
    },
  };
}

// ── Main handler ───────────────────────────────────────────────────────────
exports.handler = async function(event) {
  var headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
    'Cache-Control':                'public, max-age=3600',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  var city    = ((event.queryStringParameters || {}).city || 'paris').toLowerCase().trim();

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify(staticFeaturedFallback(city)) };
  }
  var photos  = CITY_PHOTOS[city] || DEFAULT_PHOTOS;

  // Rotate by day of week for variety (5-day cycle)
  var dayKey  = Math.floor(Date.now() / 86400000);
  var photoId = photos[dayKey % photos.length];

  // Check cache
  var cacheKey = city + '-' + dayKey;
  if (CACHE[cacheKey]) {
    return { statusCode: 200, headers, body: JSON.stringify(CACHE[cacheKey]) };
  }

  try {
    // Fetch photo from Unsplash CDN
    var imgData = await fetchPhotoById(photoId);

    // Run Claude Vision analysis
    var analysis = await analysePhoto(imgData.base64, imgData.mime, city);

    // Attach buy tiers to each piece
    if (analysis.pieces) {
      analysis.pieces = analysis.pieces.map(function(p) {
        p.buy_tiers = buildTieredLinks(p);
        return p;
      });
    }

    var result = {
      city:         city,
      date:         new Date().toISOString().split('T')[0],
      photo_url:    imgData.photoUrl,
      photo_thumb:  imgData.photoUrl.replace('w=900', 'w=400'),
      photo_credit: 'Photo via Unsplash',
      analysis:     analysis,
    };

    CACHE[cacheKey] = result;
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    console.error('featured.js error (serving static fallback):', err.message);
    return { statusCode: 200, headers, body: JSON.stringify(staticFeaturedFallback(city)) };
  }
};
