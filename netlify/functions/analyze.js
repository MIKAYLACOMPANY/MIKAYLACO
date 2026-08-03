// MIKAYLA — AI Outfit Analyzer
// Endpoint: POST /api/analyze
// Body: { imageUrl?, imageBase64?, mediaType?, city? }
//
// Identifies every piece in a photo, scores trend relevance for the city,
// and returns budget-tiered shopping links for each piece.
// Required: ANTHROPIC_API_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

function isSafePublicImageUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' || host === '::1') return false;
    if (/^(?:10|127)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return false;
    const private172 = host.match(/^172\.(\d{1,3})\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false;
    return true;
  } catch (_) {
    return false;
  }
}

// Budget-tiered retailers
const TIERS = {
  luxury: [
    { name: 'FARFETCH',     url: 'https://www.farfetch.com/shopping/women/search/items.aspx?q='           },
    { name: 'Net-a-Porter', url: 'https://www.net-a-porter.com/en-gb/search?q=' },
    { name: 'SSENSE',       url: 'https://www.ssense.com/en-us/women?q='         },
    { name: 'Shopbop',      url: 'https://www.shopbop.com/search/?q='            },
  ],
  mid: [
    { name: 'Revolve',      url: 'https://www.revolve.com/r/Search.jsp?search='            },
    { name: 'ASOS',         url: 'https://www.asos.com/search/?q='               },
    { name: 'Anthropologie', url: 'https://www.anthropologie.com/search?text='   },
    { name: '& Other Stories', url: 'https://www.stories.com/en_eur/search?q='  },
  ],
  budget: [
    { name: 'Zara',         url: 'https://www.zara.com/gb/en/search?searchTerm=' },
    { name: 'Mango',        url: 'https://shop.mango.com/gb/women/all-products/search?q='              },
    { name: 'H&M',          url: 'https://www2.hm.com/en_gb/search-results.html?q=' },
    { name: 'ASOS Sale',    url: 'https://www.asos.com/search/?q=sale+'       },
  ],
};

function buildTieredLinks(piece) {
  const luxQuery    = piece.search_query_luxury  || piece.search_query || piece.description;
  const midQuery    = piece.search_query_mid     || piece.search_query || piece.description;
  const budgetQuery = piece.search_query_budget  || piece.search_query || piece.description;
  return {
    luxury: TIERS.luxury.map(r => ({ retailer: r.name, url: r.url + encodeURIComponent(luxQuery) })),
    mid:    TIERS.mid.map(r => ({ retailer: r.name, url: r.url + encodeURIComponent(midQuery) })),
    budget: TIERS.budget.map(r => ({ retailer: r.name, url: r.url + encodeURIComponent(budgetQuery) })),
  };
}

const CITY_CONTEXT = {
  paris:            'Paris 2026: quiet luxury, French girl aesthetic dominating TikTok. Ballet flats replaced trainers. Wide-leg trousers, silk camisoles, mini structured bags. Tags: #parisianstyle #frenchgirl #quietluxury. Avoid: matching sets, crossbody at dinner.',
  milan:            'Milan 2026: polished editorial. Sharp blazers on Navigli canal backdrops. Pointed-toe loafers everywhere, gold jewellery stacking. Tags: #italianstyle #milanfashion. Avoid: sporty shoes off-gym.',
  rome:             'Rome 2026: Roman Holiday aesthetic. Floral midi dresses, straw hats, linen for day, smart casual for dinner. Modesty required for churches. Tags: #romestyle #dolcevita.',
  santorini:        'Santorini 2026: white-and-blue aesthetic. White linen maxi dresses, flat leather sandals, raffia, gold. Tags: #santorini #greeksummer.',
  mykonos:          'Mykonos 2026: boho-luxe beach club. Linen co-ords by day, embellished minis at sunset. Tags: #mykonos #beachclub.',
  ibiza:            'Ibiza 2026: White Isle boho-luxe. Crochet, linen wide-leg, maxi dresses. White dress = island uniform. Tags: #ibiza #whiteisle.',
  'french riviera': 'French Riviera 2026: Cote d Azur old money. Breton stripe + navy + gold = never wrong. Tags: #cotedazur #frenchriviera.',
  nice:             'Nice 2026: Breton stripe is the local uniform. Navy and white always appropriate. Tags: #nice #cotedazur.',
  'amalfi coast':   'Amalfi Coast 2026: coastal grandmother + dolce vita. Linen non-negotiable, flat sandals only. Tags: #amalficoast.',
  positano:         'Positano 2026: dolce vita. Linen co-ords, flat Capri sandals, raffia. Natural materials. Tags: #positano.',
  dubrovnik:        'Dubrovnik 2026: Adriatic chic. Smart casual — Old City walls are a fashion runway. Tags: #dubrovnik.',
  lisbon:           'Lisbon 2026: Portuguese tile aesthetic. Wear layers, Atlantic wind real. Loafers dominate. Tags: #lisbon.',
  barcelona:        'Barcelona 2026: Mediterranean chic, bold colour. Espadrilles, woven bags, bold prints. Tags: #barcelonastyle.',
  amsterdam:        'Amsterdam 2026: Scandi-Dutch minimalism. Earth tones, boxy silhouettes, cycling-proof. Tags: #amsterdamstyle.',
  'new york':       'New York 2026: old money + downtown cool. Wide-leg trousers, clean trainers, luxury bags. Tags: #nycstyle.',
  new_york:         'New York 2026: old money + downtown cool. Tags: #nycstyle.',
  tokyo:            'Tokyo 2026: Harajuku + minimal Japanese. Immaculate presentation mandatory. Tags: #tokyostyle.',
  dubai:            'Dubai 2026: luxury modest glamour. Wide-leg palazzo sets, embellished pieces. Tags: #dubaistyle.',
  london:           'London 2026: eclectic layering, Notting Hill chic. Chunky loafers, oversized blazers. Tags: #londonstyle.',
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'POST only' }) };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    const demoCity = (() => { try { return JSON.parse(event.body || '{}').city || 'Paris'; } catch(e) { return 'Paris'; } })();
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        _demo: true,
        overall_vibe: 'Your look has been received — AI analysis coming soon',
        aesthetic_label: 'Style in progress',
        overall_rating: 'Chic',
        rating_reason: 'AI-powered outfit analysis will be live shortly.',
        trend_relevance: {
          city: demoCity,
          score: 85,
          verdict: 'Full city trend analysis will activate once AI is configured.',
          key_trend_alignment: ['Quiet Luxury', 'Euro Summer'],
          what_locals_notice: 'AI trend scoring coming soon',
        },
        pieces: [],
        missing_pieces: [],
        city_styling_tip: 'AI-powered styling tips will appear here once fully activated.',
      }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { imageUrl, imageBase64, mediaType = 'image/jpeg', city = 'Paris' } = body;
  if (!imageUrl && !imageBase64) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Provide imageUrl or imageBase64' }) };
  }
  if (imageUrl && !isSafePublicImageUrl(imageUrl)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Use a public HTTPS image URL' }) };
  }

  const imageBlock = imageBase64
    ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } }
    : { type: 'image', source: { type: 'url', url: imageUrl } };

  const cityKey     = city.toLowerCase().replace(/\s+/g, ' ').trim();
  const cityContext = CITY_CONTEXT[cityKey] || CITY_CONTEXT[cityKey.replace(/ /g, '_')] || `${city} 2026: current local fashion trends.`;

  const systemPrompt = `You are MIKAYLA — a world-class AI fashion stylist and visual style analyst. You identify every clothing piece, shoe, bag, and accessory in outfit photos with expert precision, then rate their trend relevance for the specific city provided.

Current trend intelligence for ${city}: ${cityContext}

Respond ONLY with clean valid JSON. No markdown, no explanation outside the JSON.`;

  const userPrompt = `Analyse this outfit photo in full detail.

Return ONLY this exact JSON (no other text):
{
  "overall_vibe": "One evocative sentence — make it feel like a fashion editor wrote it",
  "aesthetic_label": "The TikTok/Instagram aesthetic this outfit fits e.g. 'quiet luxury', 'coastal grandmother', 'old money'",
  "trend_relevance": {
    "city": "${city}",
    "score": 84,
    "verdict": "Specific sentence about how this look lands in ${city} right now",
    "key_trend_alignment": ["trend1", "trend2"],
    "what_locals_notice": "One observation about how a local would read this outfit"
  },
  "pieces": [
    {
      "id": "piece_1",
      "category": "blazer",
      "description": "Oversized camel double-breasted blazer, notched lapels, falls to hip",
      "color": "camel",
      "material_guess": "wool blend",
      "style_notes": "Relaxed fit, structured shoulders — the silhouette doing all the work",
      "brand_guess": "Looks like Toteme, Sandro, or Mango",
      "trend_score": 91,
      "trend_note": "Why this specific piece is or isn't on trend in ${city}",
      "search_query": "camel oversized double breasted blazer women",
      "search_query_luxury": "camel oversized blazer Toteme Sandro women",
      "search_query_mid": "camel oversized blazer women relaxed fit",
      "search_query_budget": "camel blazer women oversized",
      "price_luxury": "$280–$850",
      "price_mid": "$80–$200",
      "price_budget": "$35–$80"
    }
  ],
  "missing_pieces": [
    {
      "suggestion": "Piece name",
      "why": "Why it would elevate this exact look",
      "search_query": "search term",
      "search_query_luxury": "luxury version search",
      "search_query_mid": "mid version search",
      "search_query_budget": "budget version search",
      "price_range": "$40–$180",
      "priority": "high"
    }
  ],
  "city_styling_tip": "What a local in ${city} would do differently — specific and actionable",
  "overall_rating": "Chic|Nearly There|Needs Work",
  "rating_reason": "One honest sentence explaining the rating"
}

Rules:
- Identify EVERY visible item including jewellery, belt, hat, sunglasses
- Be very specific on cuts, colours, and materials — vague descriptions don't help
- trend_score is 0–100 integer
- search_query_luxury should name luxury brands; search_query_budget should use generic terms
- Give exactly 1–3 missing_pieces
- overall_rating must be exactly one of: Chic, Nearly There, Needs Work`;

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL && process.env.ANTHROPIC_MODEL !== 'claude-sonnet-5'
          ? process.env.ANTHROPIC_MODEL
          : 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: [imageBlock, { type: 'text', text: userPrompt }] }],
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Anthropic error:', apiResponse.status, errText);
      let providerType = 'provider_error';
      try {
        const providerError = JSON.parse(errText)?.error || {};
        providerType = providerError.type || providerType;
      } catch (_) {}
      const safeMessage = apiResponse.status === 401
        ? 'The visual AI credential needs to be refreshed.'
        : apiResponse.status === 404
          ? 'The configured visual AI model is unavailable.'
          : apiResponse.status === 429
            ? 'The visual scanner is temporarily at capacity.'
            : 'The visual scanner is temporarily unavailable.';
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: safeMessage, providerStatus: apiResponse.status, providerType }),
      };
    }

    const claudeData = await apiResponse.json();
    const rawText    = (claudeData.content || [])[0]?.text || '';
    const jsonText   = rawText.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();

    let analysis;
    try { analysis = JSON.parse(jsonText); }
    catch (e) {
      console.error('JSON parse error. Raw:', rawText.slice(0, 400));
      return { statusCode: 502, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Could not parse AI response. Please try again.' }) };
    }

    // Enrich pieces with tiered buy links
    if (Array.isArray(analysis.pieces)) {
      analysis.pieces = analysis.pieces.map(piece => ({
        ...piece,
        buy_tiers: buildTieredLinks(piece),
      }));
    }

    // Enrich missing pieces with tiered buy links
    if (Array.isArray(analysis.missing_pieces)) {
      analysis.missing_pieces = analysis.missing_pieces.map(mp => ({
        ...mp,
        buy_tiers: buildTieredLinks(mp),
      }));
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(analysis) };

  } catch (err) {
    console.error('analyze error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Analysis failed', details: err.message }) };
  }
};
