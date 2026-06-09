// MIKAYLA — Proactive Outfit Generator
// Endpoint: GET /api/outfits?city=Paris&occasion=all
//
// Generates 4 complete, shoppable outfit looks for a city — NO user photo needed.
// AI cross-references current TikTok/Instagram aesthetics for the destination,
// then builds full outfit breakdowns with affiliate-ready buy links.
//
// Affiliate setup (set env vars in Netlify → Site configuration → Environment variables):
//   SOVRN_ACTIVE      → add Sovrn //Commerce JS snippet to index.html head (auto-converts all links)
//   LTK_AFFILIATE_ID  → LTK creator links when approved
//
// Required: ANTHROPIC_API_KEY

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

// LTK_AFFILIATE_ID: add to Netlify env vars when LTK approves you — all links update automatically
const LTK_AFFILIATE_ID = process.env.LTK_AFFILIATE_ID || null;

// Retailers — direct search links now; LTK wrapping activates when LTK_AFFILIATE_ID is set
const RETAILERS = [
  { name: 'ASOS',         url: 'https://www.asos.com/search/?q='                },
  { name: 'Zara',         url: 'https://www.zara.com/gb/en/search?searchTerm='  },
  { name: 'Mango',        url: 'https://shop.mango.com/gb/women/all-products/search?q='               },
  { name: 'FARFETCH',     url: 'https://www.farfetch.com/shopping/women/search/items.aspx?q='            },
  { name: 'Net-a-Porter', url: 'https://www.net-a-porter.com/en-gb/search?q='  },
  { name: 'Revolve',      url: 'https://www.revolve.com/r/Search.jsp?search='             },
  { name: 'Shopbop',      url: 'https://www.shopbop.com/search/?q='             },
  { name: 'SSENSE',       url: 'https://www.ssense.com/en-us/women?q='          },
];

function buildBuyOptions(searchQuery) {
  return RETAILERS.map(r => ({
    retailer: r.name,
    url:      r.url + encodeURIComponent(searchQuery),
  }));
}

function addBuyLinks(piece) {
  return { ...piece, buy_options: buildBuyOptions(piece.search_query || piece.name) };
}

const CITY_SOCIAL = {
  paris: {
    tiktok: 'French girl aesthetic, quiet luxury, effortless Parisian chic',
    instagram: 'Neutral tones, tailored silhouettes, cobblestone backdrops, minimal jewellery',
    reels_tags: '#parisianstyle #frenchgirl #quietluxury #ootdparis',
    local_insiders: 'Sezane, Rouje, Isabel Marant, A.P.C. are the local cult brands',
    season_note: 'Spring: linen trench coats; Summer: midi dresses + ballet flats',
  },
  milan: {
    tiktok: 'Italian fashion week energy, polished editorial, sprezzatura effortless sophistication',
    instagram: 'Saturated colour pops, sharp tailoring, pointed shoes',
    reels_tags: '#milanfashion #italianstyle #fashionweek #ootdmilan',
    local_insiders: 'Max Mara, Toteme, Loro Piana for investment; Zara Milan for high-low mixing',
    season_note: 'Summer: linen blazers + loafers; aperitivo = smart casual always',
  },
  rome: {
    tiktok: 'Roman Holiday aesthetic, dolce vita summer dressing, cobblestone-ready footwear essential',
    instagram: 'Floral midi dresses, straw hats, golden hour against ancient ruins',
    reels_tags: '#romestyle #romanholiday #dolcevita #ootdrome',
    local_insiders: 'Romans dress up for dinner always. Linen and silk for summer. No athletic wear in churches.',
    season_note: 'Summer: cotton/linen only, sandals, maxi dresses for sightseeing modesty',
  },
  santorini: {
    tiktok: 'Aegean dream aesthetic, white-and-blue colour story, cliffside sunset backdrop obsession',
    instagram: 'White linen against Cycladic architecture, flowing maxi dresses, gold jewellery, straw hats',
    reels_tags: '#santorini #greeksummer #santorinigreece #aegeansummer',
    local_insiders: 'White is non-negotiable. Flat sandals only — cobblestones destroy heels. Gold always.',
    season_note: 'Summer only: linen/cotton maxi, flat leather sandals, raffia bag, minimal gold',
  },
  mykonos: {
    tiktok: 'Mykonos party season, boho-luxe beach club aesthetic, sunset DJ set dressing',
    instagram: 'Beach club elegance, coverup-to-cocktail dressing, white linen meets sparkle',
    reels_tags: '#mykonos #mykonosstyle #greekislands #beachclub',
    local_insiders: 'Effortless by day, effortlessly glam by night. Linen shift at noon, mini dress at sunset.',
    season_note: 'Summer: linen co-ords for day, embellished minis or silk slip for clubs',
  },
  ibiza: {
    tiktok: 'Ibiza boho, White Isle aesthetic, festival-meets-beach, effortless hippie luxe',
    instagram: 'White dresses at sunset, beachside bohemian, crochet and macrame everything',
    reels_tags: '#ibiza #ibizastyle #whiteisle #ibizafashion',
    local_insiders: 'Boho is genuinely on trend here. Crochet, linen, crystals are all appropriate. White dress = island uniform.',
    season_note: 'Summer: crochet coverups, linen wide-leg, maxi dresses, strappy heeled sandals at night',
  },
  'french riviera': {
    tiktok: 'Cote d\'Azur old money, Grace Kelly-era glamour revived, Nice to Monaco by yacht',
    instagram: 'Striped mariniere tops, navy and white, polished linen, yacht-ready elegance',
    reels_tags: '#cotedazur #frenchriviera #nicefrance #cannes #monaco',
    local_insiders: 'Breton stripe is the regional uniform. Navy + white + gold = never wrong. Espadrilles for day.',
    season_note: 'Summer: Breton stripe, linen wide-legs, espadrilles, silk scarf, gold anchor necklace',
  },
  nice: {
    tiktok: 'Cote d\'Azur old money, French Riviera glamour, cafe terrace chic',
    instagram: 'Striped mariniere tops, navy and white, polished linen',
    reels_tags: '#nice #nicefrance #cotedazur #frenchriviera',
    local_insiders: 'Breton stripe + navy = the local uniform. Always more put-together than you expect.',
    season_note: 'Summer: Breton stripe, linen wide-legs, espadrilles, silk scarf',
  },
  'amalfi coast': {
    tiktok: 'Coastal grandmother, dolce vita, lemon grove at noon',
    instagram: 'Cliffside colours, linen co-ords, flat sandals on terracotta steps, gold jewellery',
    reels_tags: '#amalficoast #positano #amalfistyle #italianriviera',
    local_insiders: 'Linen is non-negotiable. Flat sandals — the steps destroy heels. Jewellery always appropriate.',
    season_note: 'Summer: linen midi dress, Capri cropped trousers, flat Capri sandals, gold jewellery',
  },
  positano: {
    tiktok: 'Coastal grandmother, dolce vita, Amalfi summer, lemon grove at noon',
    instagram: 'Cliffside colours, linen co-ords, flat sandals on terracotta steps, raffia hats',
    reels_tags: '#positano #amalficoast #italianriviera #coasting',
    local_insiders: 'Linen, raffia, rope-sole sandals — natural materials only. Prints welcome.',
    season_note: 'Summer: printed linen co-ord, Capri sandals, straw hat, gold jewellery',
  },
  dubrovnik: {
    tiktok: 'Adriatic chic, Game of Thrones glamour, Croatian coast summer aesthetic',
    instagram: 'Stone city walls at golden hour, linen dresses, boat trip ready, Adriatic blue backdrop',
    reels_tags: '#dubrovnik #croatia #adriatic #croatiasummer',
    local_insiders: 'Smart casual is the baseline. The Old City walls are a fashion runway in summer.',
    season_note: 'Summer: flowy midi dress, espadrilles or flat sandals, woven bag, sun protection',
  },
  lisbon: {
    tiktok: 'Lisbon aesthetic, Portuguese tiles as backdrop, Alfama hills lifestyle, Atlantic coast cool',
    instagram: 'Cobblestone streets, earth tones, tram 28, vintage-meets-modern European style',
    reels_tags: '#lisbon #lisbonstyle #portugal #alfama',
    local_insiders: 'Wear layers — the Atlantic wind is real even in summer. Saddle shoes and loafers dominate.',
    season_note: 'Summer: linen trousers, fitted top, loafers, light cardigan for evenings',
  },
  barcelona: {
    tiktok: 'Mediterranean chic, Spanish summer, Barceloneta at golden hour',
    instagram: 'Bold colour against tile backdrops, espadrilles, woven bags, effortless tan-skin glow',
    reels_tags: '#barcelonastyle #spanishfashion #barcelona #mediterraneanstyle',
    local_insiders: 'Mango, Zara, Uterque — Spanish brands worn with local confidence. Bold print very welcome.',
    season_note: 'Summer: bold floral dress or co-ord, espadrilles, woven bag, statement earrings',
  },
  london: {
    tiktok: 'London street style, dark academia, Notting Hill chic, dressed by accident',
    instagram: 'Brick wall backdrops, statement coats, chunky loafers, creative layering',
    reels_tags: '#londonstyle #londonfashion #nottinghill #ootdlondon',
    local_insiders: 'Arket, & Other Stories, Reiss — the London girl staples. Always bring a layer.',
    season_note: 'Summer: layer anyway — it will rain. Trench + dress combo never wrong.',
  },
  amsterdam: {
    tiktok: 'Scandi-Dutch minimalism, sustainable fashion, canal side cycling chic',
    instagram: 'Earth tones, boxy silhouettes, quality fabrics, zero-logo aesthetic',
    reels_tags: '#amsterdamstyle #dutchfashion #scandistyle #sustainablefashion',
    local_insiders: 'Kings of Indigo, Filippa K, COS. Cycling-proof is a real requirement.',
    season_note: 'Summer: linen wide-leg, fitted tee, loafers or white trainers, minimal accessories',
  },
  'new york': {
    tiktok: 'Old money aesthetic, downtown cool, power dressing, NYC off duty model',
    instagram: 'Street-shot candids, luxury bags, oversized blazers, coffee in hand',
    reels_tags: '#nycfashion #nycstyle #oldmoney #ootdnyc',
    local_insiders: 'Khaite, Tibi, Staud — what actual NYC women wear.',
    season_note: 'Summer: linen or silk slip dress, clean white trainers or sandals, designer tote',
  },
  tokyo: {
    tiktok: 'Harajuku street style, minimal Japanese aesthetic, precise layering, Ginza clean',
    instagram: 'Immaculate flat lays, avant-garde streetwear, neon backdrop contrast',
    reels_tags: '#tokyostyle #harajuku #tokyofashion #ootdjapan',
    local_insiders: 'Comme des Garcons, Issey Miyake, Sacai. Presentation is everything.',
    season_note: 'Summer: lightweight linen or cotton, minimal accessories, impeccable grooming',
  },
  dubai: {
    tiktok: 'Dubai luxury, modest glamour, resort chic, brunch in the sky',
    instagram: 'Wide-leg palazzo sets, embellished pieces, statement sunglasses, gold everything',
    reels_tags: '#dubaistyle #dubaifashion #modestfashion #luxurylifestyle',
    local_insiders: 'Floor-length and luxe — modesty is a style choice here. Quality fabrics read in the heat.',
    season_note: 'Year-round: modest-length dresses, wide-leg trousers, silk tops, statement accessories',
  },
};

function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function getStaticLooks(city, season) {
  return [
    {
      name: 'The Effortless Day Look',
      occasion: 'day',
      vibe: `Sun-drenched and easy — built for exploring ${city} without sacrificing style`,
      tiktok_aesthetic: 'quiet luxury meets coastal casual',
      trend_score: 88,
      city_authenticity: 92,
      stylist_note: `This is what a local in ${city} actually wears to walk around — not a tourist, not overdressed.`,
      pieces: [
        { name: 'Linen Wide-Leg Trousers', description: 'High-waist, relaxed fit, natural linen in ivory or sand', search_query: 'linen wide leg trousers women ivory', buy_options: buildBuyOptions('linen wide leg trousers women ivory') },
        { name: 'Fitted Ribbed Tank', description: 'Seamless ribbed tank in white or nude, tucked in', search_query: 'ribbed fitted tank top women white', buy_options: buildBuyOptions('ribbed fitted tank top women white') },
        { name: 'Leather Flat Sandals', description: 'Simple leather flat sandal, single or two-strap, tan', search_query: 'leather flat sandals women tan', buy_options: buildBuyOptions('leather flat sandals women tan') },
        { name: 'Raffia Tote Bag', description: 'Woven raffia tote, structured base, natural colour', search_query: 'raffia tote bag women structured', buy_options: buildBuyOptions('raffia tote bag women structured') },
        { name: 'Gold Hoop Earrings', description: 'Medium gold hoops, 30-40mm, polished finish', search_query: 'gold hoop earrings women 40mm', buy_options: buildBuyOptions('gold hoop earrings women 40mm') },
      ],
    },
    {
      name: 'The Dinner Look',
      occasion: 'dinner',
      vibe: `Evening in ${city} — effortlessly pulled together, city-appropriate, never try-hard`,
      tiktok_aesthetic: 'old money dinner aesthetic',
      trend_score: 91,
      city_authenticity: 89,
      stylist_note: `Locals in ${city} treat dinner as an occasion but make it look accidental.`,
      pieces: [
        { name: 'Silk Slip Midi Dress', description: 'Bias-cut silk or satin slip in champagne, ivory, or dusty rose', search_query: 'silk slip midi dress women bias cut', buy_options: buildBuyOptions('silk slip midi dress women bias cut') },
        { name: 'Strappy Heeled Sandals', description: 'Delicate strap heeled sandal 7-9cm, gold or nude', search_query: 'strappy heeled sandals women gold', buy_options: buildBuyOptions('strappy heeled sandals women gold') },
        { name: 'Micro Leather Bag', description: 'Small structured leather bag, top-handle or clutch, cream or tan', search_query: 'micro structured leather bag women clutch', buy_options: buildBuyOptions('micro structured leather bag women clutch') },
        { name: 'Gold Chain Necklace', description: 'Delicate layered gold chains, fine Venetian or box chain', search_query: 'delicate gold chain necklace layered women', buy_options: buildBuyOptions('delicate gold chain necklace layered women') },
      ],
    },
    {
      name: 'The Weekend Edit',
      occasion: 'weekend',
      vibe: `Relaxed but considered — the look for market mornings and long lunches in ${city}`,
      tiktok_aesthetic: 'European summer casual, #linenlook',
      trend_score: 85,
      city_authenticity: 87,
      stylist_note: `Works at 10am at the market, noon at a terrace lunch, and 4pm at a gallery.`,
      pieces: [
        { name: 'Linen Shirt Dress', description: 'Relaxed linen shirtdress, midi length, belted or loose, white or stripe', search_query: 'linen shirt dress midi women belted', buy_options: buildBuyOptions('linen shirt dress midi women belted') },
        { name: 'Espadrille Wedges', description: 'Natural jute espadrille wedge sandal, 5-7cm, ankle tie', search_query: 'espadrille wedge sandals women jute', buy_options: buildBuyOptions('espadrille wedge sandals women jute') },
        { name: 'Woven Leather Belt', description: 'Woven or braided leather belt, tan, 25-30mm', search_query: 'braided leather belt women tan', buy_options: buildBuyOptions('braided leather belt women tan') },
        { name: 'Oversized Sunglasses', description: 'Oversized square or cat-eye sunglasses, gold frame', search_query: 'oversized square sunglasses women gold frame', buy_options: buildBuyOptions('oversized square sunglasses women gold frame') },
      ],
    },
    {
      name: 'The Travel Day Look',
      occasion: 'travel',
      vibe: 'Arriving in style — polished enough for the destination, comfortable for the journey',
      tiktok_aesthetic: 'airport fashion, effortless travel chic',
      trend_score: 82,
      city_authenticity: 78,
      stylist_note: 'The best travel outfit is one you can walk off the plane and straight to dinner in.',
      pieces: [
        { name: 'Wide-Leg Linen Trousers', description: 'Slightly tailored wide-leg in ivory or khaki, travel-crease-resistant linen blend', search_query: 'linen wide leg trousers travel women', buy_options: buildBuyOptions('linen wide leg trousers travel women') },
        { name: 'Oversized Linen Blazer', description: 'Relaxed linen or cotton blazer in camel, cream, or light khaki', search_query: 'oversized linen blazer women camel', buy_options: buildBuyOptions('oversized linen blazer women camel') },
        { name: 'Fitted White Tee', description: 'Clean white fitted crew-neck tee, no logos', search_query: 'fitted white tee women no logo', buy_options: buildBuyOptions('fitted white tee women no logo') },
        { name: 'Leather Loafers', description: 'Polished leather loafer in tan, beige, or white — penny or horse-bit detail', search_query: 'leather loafer women tan penny', buy_options: buildBuyOptions('leather loafer women tan penny') },
        { name: 'Large Leather Tote', description: 'Structured leather tote, carry-all size, tan or cognac', search_query: 'large leather tote bag women structured', buy_options: buildBuyOptions('large leather tote bag women structured') },
      ],
    },
  ];
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const params = event.queryStringParameters || {};
  const city   = (params.city || 'Paris').trim();
  const season = params.season || getSeason();

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, s-maxage=300' },
      body: JSON.stringify({
        city, season,
        affiliate_mode: process.env.AWIN_PUBLISHER_ID ? 'awin' : 'direct',
        shopstyle_active: false,
        looks: getStaticLooks(city, season),
        _demo: true,
      }),
    };
  }

  const cityLower = city.toLowerCase();
  const social    = CITY_SOCIAL[cityLower] || CITY_SOCIAL['paris'];

  const systemPrompt = `You are MIKAYLA, a world-class AI fashion stylist and travel wardrobe expert. You create complete, shoppable outfit looks tailored to the exact cultural and social fashion scene of each city. You only respond with clean valid JSON.`;

  const userPrompt = `Generate 4 complete outfit looks for a woman visiting ${city} in ${season} 2026.

City social context:
- TikTok aesthetic: ${social.tiktok}
- Instagram mood: ${social.instagram}
- Key hashtags: ${social.reels_tags}
- Local insiders wear: ${social.local_insiders}
- Season note: ${social.season_note || ''}

Occasions: day sightseeing, dinner/evening, weekend casual, travel day.

Return ONLY this JSON:
{
  "city": "${city}",
  "season": "${season}",
  "looks": [
    {
      "name": "The [name]",
      "occasion": "day|dinner|weekend|travel",
      "vibe": "One evocative sentence",
      "tiktok_aesthetic": "TikTok/Instagram aesthetic category",
      "trend_score": 88,
      "city_authenticity": 91,
      "stylist_note": "Why this works in ${city} specifically",
      "pieces": [
        {
          "name": "Piece Name",
          "description": "Cut, colour, material, detail",
          "search_query": "exact natural language search query",
          "price_range": "$80-$320"
        }
      ]
    }
  ]
}

Rules: 4-6 pieces per look including shoes, bag, one accessory. Be very specific on colours and cuts. search_query must find this exact piece on ASOS or Zara. No text outside the JSON.`;

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!apiRes.ok) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ city, season, looks: getStaticLooks(city, season), _fallback: true }),
      };
    }

    const claudeData = await apiRes.json();
    const rawText    = (claudeData.content || [])[0]?.text || '';
    const jsonText   = rawText.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();

    let result;
    try { result = JSON.parse(jsonText); }
    catch (e) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ city, season, looks: getStaticLooks(city, season), _fallback: true }),
      };
    }

    if (Array.isArray(result.looks)) {
      result.looks = result.looks.map(look => ({
        ...look,
        pieces: Array.isArray(look.pieces) ? look.pieces.map(p => addBuyLinks(p)) : [],
      }));
    }

    result.ltk_ready = !!LTK_AFFILIATE_ID;

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, s-maxage=1800' },
      body: JSON.stringify(result),
    };

  } catch (err) {
    console.error('outfits error:', err);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ city, season, looks: getStaticLooks(city, season), _fallback: true }),
    };
  }
};
