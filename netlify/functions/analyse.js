// MIKAYLA — /api/analyse
// AI Vision: identifies every garment in an uploaded photo,
// scores it against city trends, returns shoppable alternatives

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function getDemoAnalysis(city) {
  return {
    city,
    overall_vibe: 'Quiet Luxury · Effortless Chic',
    trend_score: 87,
    trend_verdict: `Strong alignment with what's trending in ${city} right now`,
    aesthetic_label: 'Old Money Minimalism',
    styling_note: `This look reads very well in ${city}. The proportions are right and the colour palette is city-appropriate. One upgrade suggestion: swap the bag for something more structured.`,
    city_tip: `In ${city}, the magic is in restraint. This outfit is close — the one thing locals would change is committing harder to the shoe choice.`,
    pieces: [
      {
        type: 'Top',
        identified: 'Silk slip camisole — ivory, bias-cut, spaghetti strap',
        trend_alignment: 'High',
        exact_match: { name: 'Silk Bias Tank', brand: 'Totême', price: 290, url: 'https://www.net-a-porter.com/en-gb/shop/product/toteme/silk-tank' },
        budget_alternative: { name: 'Satin Cami', brand: '& Other Stories', price: 45, url: 'https://www.stories.com/en_gbp/clothing/tops' },
        luxury_option: { name: 'Silk Camisole', brand: 'The Row', price: 890, url: 'https://www.net-a-porter.com/en-gb/shop/product/the-row/silk-camisole' },
      },
      {
        type: 'Bottom',
        identified: 'Wide-leg trousers — cream/ivory, high-waisted, flowy fabric',
        trend_alignment: 'Very High',
        exact_match: { name: 'Wide-Leg Linen Trousers', brand: 'Totême', price: 295, url: 'https://www.net-a-porter.com/en-gb/shop/product/toteme/linen-trousers' },
        budget_alternative: { name: 'Linen Wide-Leg Trousers', brand: 'Arket', price: 89, url: 'https://www.arket.com/en_gbp/women/trousers' },
        luxury_option: { name: 'Linen Wide-Leg Pants', brand: 'The Row', price: 1290, url: 'https://www.net-a-porter.com/en-gb/shop/product/the-row' },
      },
      {
        type: 'Shoes',
        identified: 'Leather sandals — flat, strappy, tan/nude leather',
        trend_alignment: 'High',
        exact_match: { name: 'Positano Sandal', brand: 'ATP Atelier', price: 285, url: 'https://www.matchesfashion.com/search?q=atp+atelier' },
        budget_alternative: { name: 'Strappy Flat Sandal', brand: 'Zara', price: 39, url: 'https://www.zara.com/gb/en/woman-sandals' },
        luxury_option: { name: 'Knotted Leather Sandal', brand: 'The Row', price: 750, url: 'https://www.net-a-porter.com/en-gb/shop/product/the-row/sandals' },
      },
      {
        type: 'Bag',
        identified: 'Structured mini bag — black leather, top handle',
        trend_alignment: 'Medium',
        upgrade_note: 'A tan or ivory bag would elevate this look further in ' + city,
        exact_match: { name: 'Numéro Un Mini', brand: 'Polène', price: 295, url: 'https://www.polene-paris.com/collections/numero-un' },
        budget_alternative: { name: 'Mini Structured Bag', brand: 'Mango', price: 59, url: 'https://shop.mango.com/gb/women/bags' },
        luxury_option: { name: 'Le Chiquito', brand: 'Jacquemus', price: 550, url: 'https://www.net-a-porter.com/en-gb/shop/product/jacquemus/le-chiquito' },
      },
    ],
    what_would_elevate: [
      { item: 'Gold jewellery stack — necklaces + bangles', why: 'The look needs warmth at the neck and wrist', search: 'gold layered necklace set', url: 'https://mejuri.com/collections/necklaces' },
      { item: 'Tan or ivory tote as an alternative bag', why: `Keeps the monochrome palette ${city} loves right now`, search: 'tan leather tote bag', url: 'https://www.polene-paris.com/collections/bags' },
    ],
    demo: true,
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  const { image_base64, image_url, city = 'Paris', media_type = 'image/jpeg' } = body;

  if (!image_base64 && !image_url) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No image provided' }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoAnalysis(city)) };
  }

  try {
    const imageContent = image_base64
      ? { type: 'image', source: { type: 'base64', media_type, data: image_base64 } }
      : { type: 'image', source: { type: 'url', url: image_url } };

    const prompt = `You are MIKAYLA's AI Vision system. Analyse this outfit photo and return detailed fashion intelligence.

City context: ${city}
Task: Identify every garment and accessory visible, score the overall look against current ${city} trends, and provide shoppable alternatives at three price points for each piece.

Return ONLY valid JSON with this exact structure:
{
  "city": "${city}",
  "overall_vibe": "Aesthetic label — 3-5 words",
  "trend_score": 85,
  "trend_verdict": "One sentence on how well this aligns with current ${city} trends",
  "aesthetic_label": "Named aesthetic (e.g. Quiet Luxury, Parisian Chic, Off-Duty Model)",
  "styling_note": "2-3 sentences of constructive styling feedback specific to ${city}",
  "city_tip": "One specific local tip about wearing this type of look in ${city}",
  "pieces": [
    {
      "type": "Category (Top/Bottom/Dress/Shoes/Bag/Outerwear/Jewellery/Accessory)",
      "identified": "Detailed description of what you see — fabric, cut, colour, style",
      "trend_alignment": "High/Medium/Low",
      "upgrade_note": "Optional: specific suggestion if alignment is Medium or Low",
      "exact_match": { "name": "Item name", "brand": "Brand", "price": 150, "url": "https://direct retailer link" },
      "budget_alternative": { "name": "Item name", "brand": "Brand", "price": 45, "url": "https://direct retailer link" },
      "luxury_option": { "name": "Item name", "brand": "Brand", "price": 600, "url": "https://direct retailer link" }
    }
  ],
  "what_would_elevate": [
    { "item": "Specific missing piece", "why": "Why it would improve the look in ${city}", "search": "search query", "url": "https://retailer link" }
  ]
}

Identify all visible garments. Be specific about what you actually see. For retailer URLs use: Net-a-Porter, ASOS, Zara, Reformation, Arket, COS, & Other Stories, Mango, Polène, Mejuri, Matchesfashion. Return only JSON.`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [imageContent, { type: 'text', text: prompt }],
      }],
    });

    const text = msg.content[0].text.trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(clean);
    data.demo = false;

    return { statusCode: 200, headers: CORS, body: JSON.stringify(data) };
  } catch (err) {
    console.error('analyse error:', err.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoAnalysis(city)) };
  }
}
