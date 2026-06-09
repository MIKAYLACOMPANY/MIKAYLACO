// MIKAYLA — Outfit Recommendation Function
// Endpoint: POST /api/recommend
// Body: { city, occasion, budget, vibe, days }
//
// The core of MIKAYLA: given a destination + context, Claude returns a
// complete, shoppable outfit recommendation with cultural intelligence.

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Budget ranges in USD
const BUDGET_RANGES = {
  luxury:    { min: 500,  max: 5000, label: 'Investment pieces' },
  mid:       { min: 100,  max: 500,  label: 'Mid-range' },
  affordable:{ min: 30,   max: 100,  label: 'High street' },
  mixed:     { min: 30,   max: 5000, label: 'Mix of high and low' },
};

// ── Main handler ───────────────────────────────────────────────────────────
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const {
    city      = 'Paris',
    occasion  = 'general sightseeing and dinners',
    budget    = 'mixed',
    vibe      = 'classic chic',
    days      = 5,
  } = body;

  const budgetRange = BUDGET_RANGES[budget] || BUDGET_RANGES.mixed;

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(getDemoRecommendation(city, occasion, vibe)),
    };
  }

  try {
    const prompt = `You are MIKAYLA, an AI fashion intelligence platform. A traveller is packing for ${city}.

TRIP DETAILS:
- Destination: ${city}
- Occasion: ${occasion}
- Trip length: ${days} days
- Style vibe: ${vibe}
- Budget: ${budgetRange.label} ($${budgetRange.min}–$${budgetRange.max} per item)

Your job is to create a complete, culturally-intelligent packing wardrobe. Every item must be:
1. Appropriate for ${city}'s actual dress culture (not generic travel advice)
2. Shoppable right now from real brands
3. Mixable with other items in the list (capsule wardrobe logic)
4. Within the stated budget range

Return ONLY valid JSON in exactly this structure (no markdown, no explanation):
{
  "city": "${city}",
  "occasion": "${occasion}",
  "vibe": "${vibe}",
  "packing_philosophy": "One sentence on the overall approach to packing for this specific trip",
  "outfits": [
    {
      "occasion": "e.g. Day exploring / Dinner / Museum visit",
      "description": "One evocative sentence describing this look",
      "items": [
        { "category": "top/bottom/shoes/bag/accessory/outerwear", "name": "specific item name", "brand": "brand name", "price_approx": 150, "why": "one sentence why this works for ${city}", "search_query": "exact search terms to find this on ASOS or FARFETCH" },
        { "category": "...", "name": "...", "brand": "...", "price_approx": 0, "why": "...", "search_query": "..." }
      ]
    },
    {
      "occasion": "...",
      "description": "...",
      "items": []
    },
    {
      "occasion": "...",
      "description": "...",
      "items": []
    }
  ],
  "hero_pieces": ["the 2-3 most important items to buy for this trip"],
  "local_tip": "One genuine, specific tip about dressing in ${city} that most travellers get wrong",
  "capsule_summary": "Brief sentence on how these pieces mix and match"
}`;

    const message = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages:   [{ role: 'user', content: prompt }],
    });

    const rawText  = message.content[0].text.trim();
    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const recommendation = JSON.parse(jsonText);

    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'no-store', // personalised — don't cache
      },
      body: JSON.stringify(recommendation),
    };

  } catch (err) {
    console.error('recommend function error:', err);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(getDemoRecommendation(city, occasion, vibe)),
    };
  }
};

// ── Demo fallback recommendation ───────────────────────────────────────────
function getDemoRecommendation(city, occasion, vibe) {
  return {
    city, occasion, vibe,
    packing_philosophy: `Pack like a ${city} local: quality over quantity, everything mixes, nothing screams tourist.`,
    outfits: [
      {
        occasion: 'Day exploring',
        description: 'Elevated casual that looks intentional from morning coffee to afternoon gallery.',
        items: [
          { category: 'top', name: 'Silk Camisole', brand: 'Totême', price_approx: 290, why: 'Effortlessly Parisian under anything or alone.', search_query: 'silk camisole ivory minimalist' },
          { category: 'bottom', name: 'Wide-Leg Trousers', brand: 'COS', price_approx: 135, why: 'The city-proof silhouette of the moment.', search_query: 'wide leg tailored trousers cream' },
          { category: 'shoes', name: 'Kitten Heel Mules', brand: 'Mango', price_approx: 89, why: 'Walkable elegance — cobblestones included.', search_query: 'black kitten heel mules leather' },
          { category: 'bag', name: 'Mini Structured Bag', brand: 'A.P.C.', price_approx: 445, why: 'The right size for a day out here.', search_query: 'mini structured shoulder bag leather' },
        ],
      },
      {
        occasion: 'Dinner',
        description: 'One polished piece does all the work — the rest stays quiet.',
        items: [
          { category: 'top', name: 'Satin Slip Dress', brand: '& Other Stories', price_approx: 115, why: 'Day-to-dinner without overthinking it.', search_query: 'black satin slip midi dress' },
          { category: 'shoes', name: 'Leather Pointed Flat', brand: 'Sézane', price_approx: 165, why: 'French women rarely wear heels to dinner.', search_query: 'pointed toe leather ballet flat black' },
          { category: 'accessory', name: 'Gold Hoop Earrings', brand: 'Mejuri', price_approx: 68, why: 'The only jewellery you need tonight.', search_query: 'gold hoop earrings medium minimalist' },
        ],
      },
    ],
    hero_pieces: ['Tailored camel blazer — wears over everything', 'Quality leather mule or flat', 'One silk or satin piece'],
    local_tip: `In ${city}, your shoes and bag are scrutinised more than your outfit. One great leather accessory beats a full new wardrobe.`,
    capsule_summary: 'Six pieces, twelve outfits. Pack less. Look better.',
  };
}
