// MIKAYLA — /api/recommend
// Generates complete outfit recommendations: city + occasion + budget + vibe
// Returns structured outfit data with pieces, stylist notes, and search queries

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function getDemoRecommendation(city, occasion, budget) {
  return {
    city,
    occasion,
    budget,
    packing_philosophy: 'Build around three hero pieces that each work across multiple occasions. Every item should earn its place in your bag.',
    capsule_summary: '8 pieces that create 14 looks — a carry-on wardrobe that covers every moment of your trip.',
    local_tip: `In ${city}, the golden rule is: invest in one statement piece and let everything else be understated. Locals spot a tourist not by what they wear but by trying too hard.`,
    hero_pieces: [
      'Wide-leg linen trousers in ivory or camel — worn 4 different ways',
      'A silk slip top that works under a blazer or alone',
      'One quality bag that elevates every outfit it touches',
    ],
    outfits: [
      {
        occasion: 'Day Exploring',
        trend_score: 88,
        vibe: 'Quiet Luxury Meets Coastal Casual',
        description: `Sun-drenched and easy — built for exploring ${city} without sacrificing style`,
        stylist_note: `This is what a local in ${city} actually wears to walk around — not a tourist, not overdressed.`,
        items: [
          { category: 'Trousers', name: 'Wide-Leg Linen Trousers', brand: 'Totême / Arket', price_approx: 180, why: 'The silhouette of the season — breezy, polished, re-wearable', search_query: 'wide leg linen trousers ivory', retailer_url: 'https://www.net-a-porter.com/en-gb/shop/product/toteme/clothing/trousers' },
          { category: 'Top', name: 'Fitted Ribbed Tank', brand: 'COS / Zara', price_approx: 35, why: 'The quiet base that makes the trousers the star', search_query: 'fitted ribbed tank white', retailer_url: 'https://www.cos.com/en_gbp/women/tops/tanks-and-vests' },
          { category: 'Shoes', name: 'Leather Flat Sandals', brand: 'ATP Atelier / Mango', price_approx: 120, why: 'All-day comfort that still photographs beautifully', search_query: 'leather flat sandals tan', retailer_url: 'https://www.matchesfashion.com/search?q=atp+atelier+sandals' },
          { category: 'Bag', name: 'Woven Raffia Tote', brand: 'Jacquemus / Mango', price_approx: 85, why: 'Textural contrast that makes the whole look feel curated', search_query: 'woven raffia tote bag', retailer_url: 'https://www.net-a-porter.com/en-gb/shop/product/jacquemus' },
          { category: 'Jewellery', name: 'Gold Hoop Earrings', brand: 'Mejuri / ASOS', price_approx: 60, why: 'The one accessory that pulls a casual look together instantly', search_query: 'gold hoop earrings small', retailer_url: 'https://mejuri.com/collections/earrings' },
        ],
      },
      {
        occasion: 'Dinner',
        trend_score: 91,
        vibe: 'Old Money Dinner Aesthetic',
        description: `Evening in ${city} — effortlessly pulled together, city-appropriate, never try-hard`,
        stylist_note: `Locals treat dinner as an occasion but make it look accidental. The goal is to look like you threw this on in five minutes.`,
        items: [
          { category: 'Dress', name: 'Silk Slip Midi Dress', brand: '& Other Stories / Reformation', price_approx: 149, why: 'Does all the work — elegant without effort', search_query: 'silk slip midi dress ivory', retailer_url: 'https://www.stories.com/en_gbp/clothing/dresses' },
          { category: 'Shoes', name: 'Strappy Heeled Sandals', brand: 'Stuart Weitzman / Zara', price_approx: 180, why: 'Elongates the leg and elevates the slip dress instantly', search_query: 'strappy heeled sandals nude', retailer_url: 'https://www.stuartweitzman.com/products/nudist' },
          { category: 'Bag', name: 'Micro Structured Bag', brand: 'Polène / Mango', price_approx: 295, why: 'Small enough to signal you are not carrying the world, structured enough to look intentional', search_query: 'micro structured bag leather', retailer_url: 'https://www.polene-paris.com/collections/bags' },
          { category: 'Jewellery', name: 'Delicate Gold Chain Necklace', brand: 'Mejuri / ASOS', price_approx: 75, why: 'One delicate piece at the neck — nothing more needed', search_query: 'delicate gold chain necklace', retailer_url: 'https://mejuri.com/collections/necklaces' },
        ],
      },
      {
        occasion: 'Travel Day',
        trend_score: 82,
        vibe: 'Airport Fashion · Effortless Travel Chic',
        description: 'Arriving in style — polished enough for the destination, comfortable for the journey',
        stylist_note: 'The best travel outfit is one you can walk off the plane and straight into the city in.',
        items: [
          { category: 'Trousers', name: 'Wide-Leg Linen Trousers (re-wear)', brand: 'Totême / Arket', price_approx: 0, why: 'Already packed — this is how you re-wear and look intentional', search_query: 'wide leg linen trousers travel', retailer_url: 'https://www.arket.com/en_gbp/women/trousers' },
          { category: 'Outerwear', name: 'Oversized Linen Blazer', brand: 'Sandro / Zara', price_approx: 145, why: 'Makes any outfit look pulled-together; doubles as a blanket on the flight', search_query: 'oversized linen blazer camel', retailer_url: 'https://www.sandro-paris.com/en_gb/women/blazers' },
          { category: 'Top', name: 'Fitted White Tee', brand: 'A.P.C. / Arket', price_approx: 55, why: 'The most reliable base in travel — clean, versatile, always right', search_query: 'fitted white tee cotton', retailer_url: 'https://www.apc.fr/en-gb/women/tops' },
          { category: 'Shoes', name: 'Clean White Sneakers', brand: 'Veja / New Balance', price_approx: 130, why: 'Walking comfort without looking like a tourist', search_query: 'clean white sneakers leather', retailer_url: 'https://www.veja-store.com/en_gb/campo' },
          { category: 'Bag', name: 'Large Leather Tote', brand: 'Polène / Mango', price_approx: 220, why: 'Hand luggage that looks like a fashion choice', search_query: 'large leather tote carry on', retailer_url: 'https://www.polene-paris.com/collections/bags' },
        ],
      },
    ],
    rewear_map: [
      { piece: 'Wide-leg linen trousers', used_in: ['Day Exploring', 'Travel Day', 'Weekend brunch'] },
      { piece: 'Silk slip top', used_in: ['Dinner', 'Evening out', 'Day with blazer'] },
      { piece: 'Leather flat sandals', used_in: ['Day', 'Weekend', 'Smart casual dinner'] },
    ],
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  const { city = 'Paris', occasion = 'general', budget = 'mixed', vibe = '', days = 5, rewear = 2 } = body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoRecommendation(city, occasion, budget)) };
  }

  try {
    const prompt = `You are MIKAYLA, a travel fashion intelligence system. Create a complete outfit packing recommendation for a trip to ${city}.

Trip details:
- Destination: ${city}
- Occasions: ${occasion}
- Budget per outfit: ${budget}
- Travel style/vibe: ${vibe || 'not specified'}
- Trip length: ${days} days
- Re-wear preference: ${rewear}x max per piece

Return ONLY valid JSON with this exact structure:
{
  "city": "${city}",
  "occasion": "${occasion}",
  "budget": "${budget}",
  "packing_philosophy": "One sentence capsule wardrobe strategy for this trip",
  "capsule_summary": "X pieces that create Y looks — one sentence",
  "local_tip": "One specific insider tip about dressing in ${city}",
  "hero_pieces": ["Hero piece 1 with styling note", "Hero piece 2", "Hero piece 3"],
  "outfits": [
    {
      "occasion": "Occasion name",
      "trend_score": 85,
      "vibe": "Aesthetic label — short",
      "description": "One sentence outfit description",
      "stylist_note": "Insider tip about this look in ${city}",
      "items": [
        {
          "category": "Category (Top/Bottom/Shoes/Bag/Jewellery/Outerwear/Dress)",
          "name": "Specific item name",
          "brand": "Aspirational brand / Budget alternative",
          "price_approx": 150,
          "why": "Why this specific item works for ${city} right now",
          "search_query": "search terms to find this item",
          "retailer_url": "https://direct link to best retailer for this item"
        }
      ]
    }
  ],
  "rewear_map": [
    { "piece": "Item name", "used_in": ["Occasion 1", "Occasion 2"] }
  ]
}

Create 3 complete outfits (day, dinner, one other relevant occasion). Each outfit should have 4-5 items. Be specific to ${city}'s actual dress culture. Include real retailer URLs (Net-a-Porter, ASOS, Zara, Reformation, Arket, COS, & Other Stories, Mango). Return only JSON.`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].text.trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(clean);

    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  } catch (err) {
    console.error('recommend error:', err.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoRecommendation(city, occasion, budget)) };
  }
}
