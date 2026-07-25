// MIKAYLA — My Wardrobe AI
// POST /api/closet
// Actions:
//   identify    – base64 photo → clothing item type, color, style, categories
//   build       – array of closet items → outfit combinations by category
//   pack        – closet items + city → travel packing plan

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── City style context for packing / outfit building ──────────────────────────
const CITY_STYLE = {
  paris:           'Old-money Parisian chic. Think tailored blazers, silk scarves, ballet flats, slim trousers. Understated luxury.',
  milan:           'Italian power dressing. Sharp tailoring, monochrome palettes, quality fabrics, minimal branding.',
  rome:            'Roman elegance. Linen, earthy tones, breathable fabrics for cobblestone walking. Sundresses, loafers.',
  santorini:       'Greek island dreaming. White linen, blue accents, strappy sandals, flowy midi dresses. Sun-ready.',
  mykonos:         'Boho-luxe island. Resort wear, statement accessories, cover-ups, maxi dresses, espadrilles.',
  ibiza:           'Festival-meets-beach glamour. Crochet, resort sets, metallic accents, strappy heels. Bold and free.',
  barcelona:       'Mediterranean cool. Colourful prints, comfortable but chic. Great for walking — block heels, sneakers.',
  'french riviera':'Côte d Azur old money. Striped marinière, wide-leg trousers, espadrilles, straw hats. Classic nautical.',
  nice:            'South of France ease. Floral sundresses, linen separates, comfortable sandals. Effortless and warm.',
  'amalfi coast':  'Positano perfection. Bright colours, flowy fabrics, slides and sandals. Made for boat days.',
  positano:        'Italian coastal chic. Lemon prints, off-shoulder tops, strappy sandals, linen co-ords.',
  dubrovnik:       'Adriatic glamour. Elegant sundresses, kitten mules. Walled-city vibes — comfortable but polished.',
  lisbon:          'Fado cool. Relaxed denim, light layers, trainers for hills. Effortlessly Iberian.',
  london:          'London edge. Trench coats, Chelsea boots, structured bags. Layering is essential.',
  amsterdam:       'Dutch minimalism. Neutral palettes, quality basics, cycling-appropriate. Clean and considered.',
  'new york':      'NYC energy. Tailored athleisure, blazers over tees, white sneakers, structured tote.',
  tokyo:           'Tokyo street fashion. Statement pieces, proportion play, interesting textures. Bold and precise.',
  dubai:           'Desert luxury. Light fabrics but covered for culture. Resort labels, silk, modest elegance.',
};

// ── Occasion definitions ──────────────────────────────────────────────────────
const OCCASION_NOTES = {
  favorite:  'signature look — the outfit that defines your personal style',
  work:      'polished and professional — smart casual to business formal',
  weekend:   'relaxed but put-together — brunch, markets, day exploring',
  casual:    'everyday ease — comfortable, wearable, no-thought dressing',
  travel:    'destination-ready — suited for the city, climate, and culture',
  evening:   'dinner, cocktails, or events — elevated and occasion-appropriate',
};

function fallbackCloset(body) {
  const action = body.action;
  const items = Array.isArray(body.items) ? body.items : [];
  if (action === 'identify') {
    return {
      type: 'Uploaded Piece',
      color: 'Tap to edit colour',
      material: 'Add material',
      style_tags: ['personal wardrobe'],
      categories: ['casual', 'travel'],
      versatility_score: 7,
      styling_tip: 'Add the colour and category so MIKAYLA can match this piece more precisely.',
      emoji: '👗',
      demo: true,
    };
  }
  if (action === 'build') {
    return {
      outfits: items.length ? [{
        id: 'closet-edit-1',
        name: 'Your First Closet Edit',
        category: 'travel',
        item_indices: items.slice(0, 4).map((_, index) => index),
        description: 'A first combination using the pieces already in your closet.',
        styling_note: 'Adjust each item’s colour and category to unlock more precise combinations.',
        city_ready: Boolean(body.city),
        mood: 'Personal Edit',
      }] : [],
      demo: true,
    };
  }
  if (action === 'pack') {
    return {
      destination: body.city || 'Your destination',
      trip_days: body.days || 5,
      style_brief: 'Start with the most versatile pieces in your wardrobe, then change the mood with shoes, bags, and jewellery.',
      outfits: items.length ? [{
        id: 'travel-1',
        name: 'Arrival Look',
        category: 'travel',
        item_indices: items.slice(0, 4).map((_, index) => index),
        description: 'A comfortable first look made from your existing pieces.',
        styling_note: 'Keep one polished layer accessible for arrival.',
        mood: 'Easy Arrival',
        occasion: 'travel day',
      }] : [],
      pack_list_indices: items.map((_, index) => index),
      missing_pieces: [],
      packing_tip: 'Repeat the base pieces and let accessories distinguish each day.',
      demo: true,
    };
  }
  return { error: 'Unknown action. Use: identify | build | pack' };
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST required' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (_) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { action } = body;
  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback = fallbackCloset(body);
    return {
      statusCode: fallback.error ? 400 : 200,
      headers,
      body: JSON.stringify(fallback),
    };
  }

  try {
    if (action === 'identify') {
      const result = await identifyItem(body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (action === 'build') {
      const result = await buildOutfits(body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    if (action === 'pack') {
      const result = await packForCity(body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action. Use: identify | build | pack' }) };
  } catch (err) {
    console.error('closet.js error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'AI service error', detail: err.message }) };
  }
};

// ── ACTION: Identify a single clothing item from photo ────────────────────────
async function identifyItem({ image_base64, mime_type }) {
  if (!image_base64) throw new Error('image_base64 required');

  const prompt = `You are a professional fashion editor and personal stylist. Analyse this clothing item photo and identify exactly what it is.

Return ONLY valid JSON — no markdown, no explanation, no code blocks.

{
  "type": "string — clothing category e.g. Blazer, Slip Dress, Wide-Leg Trousers, Ankle Boot, Silk Blouse, Denim Jacket, Knit Cardigan, Maxi Skirt, Crossbody Bag, Gold Hoop Earrings, etc.",
  "color": "string — primary colour and any secondary e.g. 'Cream with tortoise buttons', 'Deep navy', 'Camel plaid'",
  "material": "string — fabric or material e.g. 'Linen', 'Satin', 'Merino wool', 'Genuine leather'",
  "style_tags": ["array of 2-4 style keywords e.g. 'minimalist', 'old money', 'coastal', 'boho', 'office chic', 'French girl'"],
  "categories": ["array from: favorite, work, weekend, casual, travel, evening — choose ALL that apply"],
  "versatility_score": number 1-10 "how many occasions this works for",
  "styling_tip": "string — one sentence tip on how to wear or style this piece for maximum impact",
  "emoji": "single emoji that best represents this item (for UI display)"
}`;

  const response = await client.messages.create({
    model:      process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: [
        {
          type:   'image',
          source: { type: 'base64', media_type: mime_type || 'image/jpeg', data: image_base64 },
        },
        { type: 'text', text: prompt },
      ],
    }],
  });

  const raw = response.content[0].text.trim();
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  return JSON.parse(clean);
}

// ── ACTION: Build outfit combinations from closet items ───────────────────────
async function buildOutfits({ items, city, focus_categories }) {
  if (!items || !items.length) throw new Error('items array required');

  const cityStyle = city ? (CITY_STYLE[city.toLowerCase()] || '') : '';
  const occasions  = focus_categories && focus_categories.length
    ? focus_categories
    : ['favorite', 'work', 'weekend', 'casual', 'evening'];

  // Build a text description of each item for the prompt
  const itemList = items.map((it, i) =>
    `Item ${i}: [${it.emoji || '👗'}] ${it.type} — ${it.color}${it.material ? ', ' + it.material : ''}${it.style_tags ? ' (' + it.style_tags.join(', ') + ')' : ''}`
  ).join('\n');

  const cityLine = cityStyle ? `\nCity context: ${city} — ${cityStyle}` : '';
  const occasionDefs = occasions.map(o => `"${o}": ${OCCASION_NOTES[o] || o}`).join('\n');

  const prompt = `You are MIKAYLA's AI personal stylist. The user has the following items in their digital wardrobe:

${itemList}
${cityLine}

Create outfit combinations using ONLY these items (reference them by index number). Create 1-2 outfit combinations for each of these occasions:
${occasionDefs}

Rules:
- Each outfit must use 2-5 items from the list above
- Items can appear in multiple outfits
- Prioritise genuinely stylish combinations a fashion editor would approve
- Include specific, actionable styling notes
- If city context is given, make at least one travel outfit per occasion tailored to that city

Return ONLY valid JSON — no markdown, no explanation:

{
  "outfits": [
    {
      "id": "unique string like work-1",
      "name": "e.g. Power Lunch",
      "category": "one of: favorite|work|weekend|casual|evening|travel",
      "item_indices": [0, 2, 4],
      "description": "2-sentence outfit description a stylist would write",
      "styling_note": "one specific tip e.g. 'Tuck the blouse half-in for a Parisian casual effect'",
      "city_ready": true or false if city was given,
      "mood": "1-3 word mood e.g. 'Effortlessly Chic' or 'Power Move' or 'Weekend Edit'"
    }
  ]
}`;

  const response = await client.messages.create({
    model:      process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw   = response.content[0].text.trim();
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  return JSON.parse(clean);
}

// ── ACTION: Pack for a specific city trip ─────────────────────────────────────
async function packForCity({ items, city, days }) {
  if (!items || !items.length) throw new Error('items array required');
  if (!city)  throw new Error('city required');

  const cityStyle  = CITY_STYLE[city.toLowerCase()] || 'stylish destination travel';
  const tripDays   = days || 5;

  const itemList = items.map((it, i) =>
    `Item ${i}: [${it.emoji || '👗'}] ${it.type} — ${it.color}${it.style_tags ? ' (' + it.style_tags.join(', ') + ')' : ''}`
  ).join('\n');

  const prompt = `You are MIKAYLA's AI travel stylist. The user is packing for ${tripDays} days in ${city}.

${city} style brief: ${cityStyle}

Their wardrobe contains:
${itemList}

Create a complete travel capsule wardrobe using their existing items. Build 4-6 outfits for the trip (day looks, evening looks, one "arrival" look). Identify any critical missing pieces.

Return ONLY valid JSON:

{
  "destination": "${city}",
  "trip_days": ${tripDays},
  "style_brief": "2-sentence style brief for this destination",
  "outfits": [
    {
      "id": "travel-1",
      "name": "Arrival Look",
      "category": "travel",
      "item_indices": [0, 2],
      "description": "outfit description",
      "styling_note": "specific tip",
      "mood": "mood tag",
      "occasion": "e.g. airport, day exploring, dinner, boat day"
    }
  ],
  "pack_list_indices": [0, 1, 2, 3],
  "missing_pieces": [
    { "item": "White linen shirt", "why": "Essential for the heat and local aesthetic", "search_query": "white linen shirt women" }
  ],
  "packing_tip": "one smart tip for packing light for this trip"
}`;

  const response = await client.messages.create({
    model:      process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw   = response.content[0].text.trim();
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  return JSON.parse(clean);
}
