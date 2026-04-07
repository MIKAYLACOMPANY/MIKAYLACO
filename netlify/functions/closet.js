// MIKAYLA — /api/closet
// Analyses uploaded clothing photos and identifies each garment
// Used to prevent duplicate recommendations and build personal style profile

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  const { image_base64, media_type = 'image/jpeg' } = body;

  if (!image_base64) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No image provided' }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({
        identified: true,
        demo: true,
        item: { category: 'Top', subcategory: 'Blouse', color: 'White', fabric: 'Linen', style: 'Relaxed', occasions: ['Day', 'Casual', 'Smart Casual'], travel_score: 8, label: 'White Linen Blouse', can_rewear_with: ['Wide-leg trousers', 'Jeans', 'Shorts'] },
      }),
    };
  }

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type, data: image_base64 } },
          { type: 'text', text: `Identify the clothing item in this photo. Return ONLY valid JSON:
{
  "identified": true,
  "item": {
    "category": "Top/Bottom/Dress/Shoes/Bag/Outerwear/Jewellery/Accessory",
    "subcategory": "e.g. Blouse/Jeans/Sneaker/Tote",
    "color": "Primary colour",
    "fabric": "Fabric if visible",
    "style": "Style descriptor e.g. Relaxed/Structured/Dressy",
    "occasions": ["Occasion1", "Occasion2"],
    "travel_score": 8,
    "label": "Short display label e.g. White Linen Blouse",
    "can_rewear_with": ["Item type 1", "Item type 2", "Item type 3"]
  }
}
If no clothing item is visible return {"identified": false}. Return only JSON.` },
        ],
      }],
    });

    const text = msg.content[0].text.trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(clean);
    data.demo = false;

    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  } catch (err) {
    console.error('closet error:', err.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ identified: false, error: err.message }) };
  }
}
