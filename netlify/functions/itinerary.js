// MIKAYLA — /api/itinerary
// Reads an uploaded itinerary (text extracted from PDF/image)
// Returns a structured day-by-day outfit plan with dress codes per venue

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function getDemoItinerary() {
  return {
    destination: 'Paris',
    dates: 'April 10–13, 2026',
    days: 4,
    avg_temp: '18°C',
    total_occasions: 11,
    capsule_note: 'Built around 3 hero pieces that re-wear across 11 occasions. Pack a carry-on.',
    schedule: [
      {
        day: 1,
        date: 'Thursday, April 10',
        events: [
          {
            time: '10:00',
            venue: 'Musée du Louvre',
            venue_type: 'Museum',
            dress_code: 'Smart Casual',
            dress_code_tags: ['Comfortable', 'Walkable'],
            outfit: {
              description: 'Wide-leg cream trousers · White linen blouse · White sneakers · Gold hoops · Tan tote',
              pieces: [
                { item: 'Wide-leg cream trousers', hero: true, rewear_id: 'trousers-1' },
                { item: 'White linen blouse', hero: false, rewear_id: 'blouse-1' },
                { item: 'White sneakers', hero: false, rewear_id: 'sneakers-1' },
                { item: 'Gold hoop earrings', hero: false },
                { item: 'Tan leather tote', hero: true, rewear_id: 'tote-1' },
              ],
              stylist_note: 'Comfortable enough for hours of walking, polished enough for the Louvre\'s grand halls.',
            },
          },
          {
            time: '13:30',
            venue: 'Café de Flore',
            venue_type: 'Iconic Café',
            dress_code: 'Parisian Chic',
            dress_code_tags: ['Smart Casual', 'Effortless'],
            outfit: {
              description: 'Cream trousers (re-wear) · Black silk camisole · Kitten heels · Gold chain · Mini bag',
              rewear_from: 'trousers-1',
              pieces: [
                { item: 'Cream trousers', hero: true, rewear_id: 'trousers-1', is_rewear: true },
                { item: 'Black silk camisole', hero: false, rewear_id: 'cami-1' },
                { item: 'Kitten heel mules', hero: false, rewear_id: 'kitten-1' },
                { item: 'Delicate gold chain', hero: false },
                { item: 'Mini structured bag', hero: false },
              ],
              stylist_note: 'Swap the blouse for the camisole, add heels — the trousers carry both looks.',
            },
          },
          {
            time: '20:00',
            venue: 'Le Grand Véfour ★★',
            venue_type: 'Fine Dining',
            dress_code: 'Elegant',
            dress_code_tags: ['Fine Dining', 'Smart'],
            outfit: {
              description: 'Black midi wrap dress · Tailored blazer · Heeled mules · Pearl studs · Clutch',
              pieces: [
                { item: 'Black midi wrap dress', hero: true, rewear_id: 'dress-1' },
                { item: 'Tailored black blazer', hero: true, rewear_id: 'blazer-1' },
                { item: 'Heeled mules', hero: false, rewear_id: 'mules-1' },
                { item: 'Pearl stud earrings', hero: false },
                { item: 'Small leather clutch', hero: false },
              ],
              stylist_note: 'Le Grand Véfour has a strict ambiance — the dress + blazer combination is exactly right.',
            },
          },
        ],
      },
      {
        day: 2,
        date: 'Friday, April 11',
        events: [
          {
            time: '09:00',
            venue: 'Seine Morning Walk',
            venue_type: 'Outdoor / Sightseeing',
            dress_code: 'Relaxed',
            dress_code_tags: ['Casual', '18°C'],
            outfit: {
              description: 'Dark straight jeans · Oversized camel coat · White trainers · Stud earrings · Crossbody',
              pieces: [
                { item: 'Dark straight jeans', hero: true, rewear_id: 'jeans-1' },
                { item: 'Oversized camel coat', hero: true, rewear_id: 'coat-1' },
                { item: 'White trainers', hero: false, rewear_id: 'sneakers-1', is_rewear: true },
                { item: 'Small gold studs', hero: false },
                { item: 'Leather crossbody bag', hero: false },
              ],
              stylist_note: 'Morning walks along the Seine call for warmth — 18°C with a river breeze requires a layer.',
            },
          },
          {
            time: '19:30',
            venue: 'Septime ★',
            venue_type: 'Modern Bistro',
            dress_code: 'Chic',
            dress_code_tags: ['Smart Casual', 'Fine Dining'],
            outfit: {
              description: 'Dark jeans (re-wear) · Satin slip top · Blazer · Block heel boots · Drop earrings · Shoulder bag',
              rewear_from: 'jeans-1',
              pieces: [
                { item: 'Dark jeans', hero: true, rewear_id: 'jeans-1', is_rewear: true },
                { item: 'Satin slip top', hero: false },
                { item: 'Black blazer', hero: true, rewear_id: 'blazer-1', is_rewear: true },
                { item: 'Block heel ankle boots', hero: false, rewear_id: 'boots-1' },
                { item: 'Drop earrings', hero: false },
                { item: 'Leather shoulder bag', hero: false },
              ],
              stylist_note: 'Septime is relaxed but the food is serious — match the energy. Jeans are fine, but elevate everything above the waist.',
            },
          },
        ],
      },
    ],
    demo: true,
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  const { itinerary_text, image_base64, media_type = 'image/jpeg', city = '', budget = 'mixed', rewear = 2 } = body;

  if (!itinerary_text && !image_base64) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No itinerary content provided' }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoItinerary()) };
  }

  try {
    const contentBlocks = [];

    if (image_base64) {
      contentBlocks.push({ type: 'image', source: { type: 'base64', media_type, data: image_base64 } });
    }

    const textPrompt = `You are MIKAYLA's itinerary intelligence system. Read this travel itinerary and build a complete outfit plan.

${itinerary_text ? `Itinerary text:\n${itinerary_text}` : 'See the uploaded image for the itinerary.'}

Instructions:
- Identify every venue, activity, restaurant, and event
- Assign a dress code to each based on your knowledge of that type of venue
- For named restaurants/venues, use your knowledge of their dress code and vibe
- Build a complete outfit for each occasion
- Identify re-wear opportunities (same piece used across multiple occasions)
- Budget preference: ${budget}
- Re-wear limit: ${rewear}x per piece maximum
- City detected: ${city || 'detect from itinerary'}

Return ONLY valid JSON:
{
  "destination": "City name",
  "dates": "Date range",
  "days": 4,
  "avg_temp": "18°C",
  "total_occasions": 11,
  "capsule_note": "How many pieces create how many looks",
  "schedule": [
    {
      "day": 1,
      "date": "Day label e.g. Thursday, April 10",
      "events": [
        {
          "time": "10:00",
          "venue": "Venue name",
          "venue_type": "Type (Museum/Restaurant/Bar/Hotel/Outdoor etc)",
          "dress_code": "One label e.g. Smart Casual",
          "dress_code_tags": ["Tag1", "Tag2"],
          "outfit": {
            "description": "Full outfit in plain language",
            "rewear_from": "rewear_id if re-using a piece, otherwise omit",
            "pieces": [
              {
                "item": "Specific garment",
                "hero": true,
                "rewear_id": "unique-id-for-this-piece",
                "is_rewear": false
              }
            ],
            "stylist_note": "Why this outfit works for this specific venue"
          }
        }
      ]
    }
  ]
}

Return only JSON. Be specific about venues — if you know the restaurant, use that knowledge.`;

    contentBlocks.push({ type: 'text', text: textPrompt });

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const text = msg.content[0].text.trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(clean);
    data.demo = false;

    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  } catch (err) {
    console.error('itinerary error:', err.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoItinerary()) };
  }
}
