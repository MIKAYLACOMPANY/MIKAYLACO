// MIKAYLA — Real-Time Fashion Trend Intelligence
// Endpoint: GET /api/trends?city=Paris
//
// Pulls live fashion content from public RSS feeds (Vogue, Harper's Bazaar,
// Who What Wear) then passes it to Claude to synthesize a trend report that
// cross-references TikTok/Instagram aesthetics for the selected city.
//
// Required: ANTHROPIC_API_KEY in Netlify env vars

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

// Fashion news RSS feeds — publicly accessible, no auth needed
const RSS_FEEDS = [
  'https://www.vogue.com/feed/rss',
  'https://www.harpersbazaar.com/rss/all.xml/',
  'https://www.whowhatwear.com/rss',
  'https://www.refinery29.com/fashion/rss.xml',
];

// City-specific TikTok/Instagram context injected into the AI prompt
const SOCIAL_CONTEXT = {
  paris: {
    tiktok_aesthetics: ['French girl aesthetic', 'quiet luxury', 'Parisian street style', 'effortless chic'],
    ig_hashtags:       ['#parisianstyle', '#frenchfashion', '#parisianchic', '#quietluxury'],
    local_creators:    ['@leoniehanne', '@adenorah', '@jeannefrancoise'],
    trending_venues:   ['Marais', 'Saint-Germain', 'Palais Royal', 'Canal Saint-Martin'],
  },
  milan: {
    tiktok_aesthetics: ['Italian fashion', 'quiet luxury', 'Milano style', 'polished editorial'],
    ig_hashtags:       ['#milanfashion', '#italianstyle', '#milanostreet', '#fashionweek'],
    local_creators:    ['@chiara_ferragni', '@giuliagqualano'],
    trending_venues:   ['Brera', 'Navigli', 'Corso Como', 'Porta Ticinese'],
  },
  rome: {
    tiktok_aesthetics: ['Roman Holiday aesthetic', 'dolce vita', 'Italian summer dressing', 'cobblestone ready'],
    ig_hashtags:       ['#romestyle', '#romanholiday', '#dolcevita', '#ootdrome'],
    local_creators:    ['@giulia_valentina', '@chiara_nasti'],
    trending_venues:   ['Trastevere', 'Campo de Fiori', 'Prati', 'Pigneto'],
  },
  santorini: {
    tiktok_aesthetics: ['Aegean dream', 'Greek summer aesthetic', 'white island style', 'cliffside sunset look'],
    ig_hashtags:       ['#santorini', '#greeksummer', '#santorinigreece', '#aegeansummer'],
    local_creators:    ['@santorini.style', '@greekislandlife'],
    trending_venues:   ['Oia', 'Fira', 'Imerovigli', 'Perissa'],
  },
  mykonos: {
    tiktok_aesthetics: ['Mykonos party season', 'boho-luxe beach club', 'Greek island glam', 'sunset DJ set dressing'],
    ig_hashtags:       ['#mykonos', '#mykonosstyle', '#greekislands', '#beachclub'],
    local_creators:    ['@mykonos.style', '@thisisgreece'],
    trending_venues:   ['Little Venice', 'Paradise Beach', 'Nammos', 'Scorpios'],
  },
  ibiza: {
    tiktok_aesthetics: ['Ibiza boho', 'White Isle aesthetic', 'festival meets beach', 'hippie luxe'],
    ig_hashtags:       ['#ibiza', '#ibizastyle', '#whiteisle', '#ibizafashion'],
    local_creators:    ['@ibizastylefiles', '@ibizaboheme'],
    trending_venues:   ['Ses Salines', 'Cala Bassa', 'Sunset Strip', 'Las Dalias'],
  },
  'french riviera': {
    tiktok_aesthetics: ['Cote d Azur old money', 'French Riviera glamour', 'Monaco yacht life', 'Cannes chic'],
    ig_hashtags:       ['#cotedazur', '#frenchriviera', '#nicefrance', '#cannes', '#monaco'],
    local_creators:    ['@nicelooks', '@cotedazurstyle'],
    trending_venues:   ['Promenade des Anglais', 'Old Nice', 'Cap d Antibes', 'Monte Carlo'],
  },
  nice: {
    tiktok_aesthetics: ['French Riviera glamour', 'Nice street style', 'Cote d Azur living', 'Breton stripe aesthetic'],
    ig_hashtags:       ['#nice', '#nicefrance', '#cotedazur', '#frenchriviera'],
    local_creators:    ['@nicelooks', '@frenchrivieraphotography'],
    trending_venues:   ['Promenade des Anglais', 'Vieux Nice', 'Le Cours Saleya', 'Colline du Chateau'],
  },
  'amalfi coast': {
    tiktok_aesthetics: ['coastal grandmother', 'Amalfi dolce vita', 'Italian Riviera summer', 'lemon grove aesthetic'],
    ig_hashtags:       ['#amalficoast', '#positano', '#amalfistyle', '#italianriviera'],
    local_creators:    ['@amalficoastlife', '@italianrivierastyle'],
    trending_venues:   ['Positano', 'Amalfi', 'Ravello', 'Capri'],
  },
  positano: {
    tiktok_aesthetics: ['coastal grandmother', 'dolce vita', 'Amalfi summer', 'lemon grove at noon'],
    ig_hashtags:       ['#positano', '#amalficoast', '#italianriviera', '#coastalstyle'],
    local_creators:    ['@italianstyle__', '@made_in_italy'],
    trending_venues:   ['Positano beach', 'Amalfi', 'Ravello', 'Capri'],
  },
  dubrovnik: {
    tiktok_aesthetics: ['Adriatic chic', 'Croatian coast summer', 'Old City walls fashion', 'boat trip ready'],
    ig_hashtags:       ['#dubrovnik', '#croatia', '#adriatic', '#croatiasummer'],
    local_creators:    ['@dubrovnik.style', '@visitcroatia'],
    trending_venues:   ['Old City', 'Banje Beach', 'Lokrum Island', 'Stradun'],
  },
  lisbon: {
    tiktok_aesthetics: ['Lisbon tile aesthetic', 'Portuguese cool', 'Alfama hills lifestyle', 'Atlantic coast minimalism'],
    ig_hashtags:       ['#lisbon', '#lisbonstyle', '#portugal', '#alfama'],
    local_creators:    ['@lisbongirl', '@portugal.style'],
    trending_venues:   ['Alfama', 'LX Factory', 'Principe Real', 'Belem'],
  },
  barcelona: {
    tiktok_aesthetics: ['Mediterranean chic', 'Barcelona chic', 'Spanish fashion', 'summer in Spain'],
    ig_hashtags:       ['#barcelonastyle', '#barcelonafashion', '#spanishfashion', '#mango'],
    local_creators:    ['@the_sheworksout', '@pepamack'],
    trending_venues:   ['Born', 'Gracia', 'Barceloneta', 'Eixample'],
  },
  london: {
    tiktok_aesthetics: ['London street style', 'Notting Hill chic', 'dark academia', 'eclectic UK fashion'],
    ig_hashtags:       ['#londonfashion', '#londonstyle', '#nottinghillfashion', '#shoreditchstyle'],
    local_creators:    ['@doina', '@tezzt'],
    trending_venues:   ['Notting Hill', 'Shoreditch', 'Soho', 'Chelsea'],
  },
  amsterdam: {
    tiktok_aesthetics: ['Dutch fashion', 'Scandi aesthetic', 'Amsterdam cool', 'sustainable fashion'],
    ig_hashtags:       ['#amsterdamfashion', '#dutchstyle', '#jordaanstyle'],
    local_creators:    ['@noor_de_groot', '@sofielouise'],
    trending_venues:   ['Jordaan', 'De Pijp', 'Nine Streets', 'NDSM'],
  },
  'new york': {
    tiktok_aesthetics: ['NYC style', 'old money aesthetic', 'downtown cool', 'power dressing'],
    ig_hashtags:       ['#nycfashion', '#nycstyle', '#soho', '#brooklynfashion'],
    local_creators:    ['@weworewhat', '@leandramcohen'],
    trending_venues:   ['Soho', 'West Village', 'Williamsburg', 'Upper East Side'],
  },
  tokyo: {
    tiktok_aesthetics: ['harajuku', 'Tokyo street fashion', 'JK fashion', 'minimalist Japanese'],
    ig_hashtags:       ['#tokyofashion', '#tokyostyle', '#harajuku', '#ootd_japan'],
    local_creators:    ['@yoon_ambush', '@kotanikoki'],
    trending_venues:   ['Harajuku', 'Shibuya', 'Shimokitazawa', 'Ginza'],
  },
  dubai: {
    tiktok_aesthetics: ['Dubai glam', 'modest fashion', 'luxury lifestyle', 'resort glam'],
    ig_hashtags:       ['#dubaifashion', '#uaestyle', '#modestfashion', '#dubaistyle'],
    local_creators:    ['@dina_tokio', '@asciaturk'],
    trending_venues:   ['DIFC', 'Downtown', 'JBR', 'La Mer'],
  },
};

function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

// Fetch and parse one RSS feed, returning up to `limit` headlines + snippets
async function fetchRSS(url, limit = 6) {
  try {
    const res = await fetch(url, {
      signal:  AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'MIKAYLA/1.0 Fashion Intelligence' },
    });
    if (!res.ok) return [];
    const xml   = await res.text();
    const items = [];
    const re    = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = re.exec(xml)) !== null && items.length < limit) {
      const block = match[1];
      const title = (/<title[^>]*><!\[CDATA\[(.*?)\]\]>/i.exec(block) || /<title[^>]*>(.*?)<\/title>/i.exec(block) || [])[1] || '';
      const desc  = (/<description[^>]*><!\[CDATA\[(.*?)\]\]>/i.exec(block) || /<description[^>]*>(.*?)<\/description>/i.exec(block) || [])[1] || '';
      const clean = desc.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim().slice(0, 200);
      if (title) items.push({ title: title.trim(), snippet: clean });
    }
    return items;
  } catch {
    return [];
  }
}

// Gather headlines from all feeds in parallel, return flat list
async function gatherFashionNews(limit = 12) {
  const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchRSS(f, 4)));
  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .slice(0, limit);
}

async function generateTrends(city, season, social, news) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return null;

  const newsBlock = news.length
    ? 'LIVE FASHION NEWS (fetched now from Vogue, Harper\'s Bazaar, Who What Wear, Refinery29):\n' +
      news.map((n, i) => `${i + 1}. ${n.title}${n.snippet ? ' — ' + n.snippet : ''}`).join('\n')
    : '';

  const prompt = `You are MIKAYLA's fashion intelligence engine. Today is ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Generate a hyper-current trend report for ${city} in ${season}.

${newsBlock}

TIKTOK AESTHETICS TRENDING FOR ${city.toUpperCase()}: ${social.tiktok_aesthetics.join(', ')}
TRENDING INSTAGRAM HASHTAGS: ${social.ig_hashtags.join(', ')}
KEY LOCAL VENUES SETTING THE TRENDS: ${social.trending_venues.join(', ')}

Using the live news above AND your knowledge of what is currently trending on TikTok and Instagram in ${city}, return ONLY this JSON (no markdown, no explanation):

{
  "city": "${city}",
  "season": "${season}",
  "headline": "One punchy current sentence about the fashion moment in ${city} right now",
  "vibe_of_the_moment": "2-4 word phrase capturing the dominant aesthetic",
  "social_pulse": {
    "tiktok_aesthetic": "the dominant TikTok fashion aesthetic in ${city} right now",
    "instagram_mood": "how ${city} looks on Instagram feeds this season",
    "key_tags": ${JSON.stringify(social.ig_hashtags.slice(0, 3))}
  },
  "trending_now": [
    { "item": "specific item from news or social trends", "why": "why it is trending — cultural/social context", "key_brands": ["brand1", "brand2", "brand3"], "tiktok_context": "how this appears on TikTok in ${city}" },
    { "item": "...", "why": "...", "key_brands": ["..."], "tiktok_context": "..." },
    { "item": "...", "why": "...", "key_brands": ["..."], "tiktok_context": "..." },
    { "item": "...", "why": "...", "key_brands": ["..."], "tiktok_context": "..." },
    { "item": "...", "why": "...", "key_brands": ["..."], "tiktok_context": "..." }
  ],
  "key_colors": ["color1", "color2", "color3", "color4"],
  "key_silhouettes": ["silhouette1", "silhouette2", "silhouette3"],
  "dress_codes": {
    "day": "specific daytime guidance for ${city}",
    "dinner": "specific dinner guidance",
    "nightlife": "specific nightlife guidance"
  },
  "insider_tip": "genuine local fashion insight not found in tourist guides",
  "avoid": "what tourists wear that locals immediately clock"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return null;
  const data    = await res.json();
  const rawText = (data.content || [])[0]?.text || '';
  const json    = rawText.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(json);
}

// Solid static fallback used when ANTHROPIC_API_KEY is not set
function staticFallback(city, season) {
  const fallbacks = {
    paris: {
      headline: 'Paris is in its quiet luxury era — understated, precise, unhurried.',
      vibe_of_the_moment: 'quiet luxury',
      social_pulse: { tiktok_aesthetic: 'French girl aesthetic', instagram_mood: 'effortless neutrals and clean lines', key_tags: ['#parisianstyle', '#frenchfashion', '#quietluxury'] },
      trending_now: [
        { item: 'Tailored camel coat', why: 'The Saint-Germain staple all over Parisian TikTok and Instagram this season.', key_brands: ['Totême', 'Sandro', 'A.P.C.'], tiktok_context: 'Shot on cobblestones, belted loosely, no styling effort visible' },
        { item: 'Ballet flats', why: 'Replaced sneakers as the cool-girl daytime shoe — Repetto and Miu Miu led, everyone followed.', key_brands: ['Repetto', 'Mango', 'Carel'], tiktok_context: '"Get ready with me" videos showing ballet flats with everything from jeans to midi skirts' },
        { item: 'Silk neck scarf', why: 'The accessory that signals you know Paris without looking like you\'re trying to.', key_brands: ['Hermès', 'Zara', 'Sézane'], tiktok_context: 'Tied loosely around neck or bag handle, not knotted' },
        { item: 'Wide-leg trousers', why: 'Fluid, high-waist, replacing skinny jeans across every Paris arrondissement.', key_brands: ['COS', 'Jacquemus', 'Isabel Marant'], tiktok_context: 'Paired with fitted ribbed top, flat shoe, minimal bag' },
        { item: 'Mini structured bag', why: 'Carried under the arm, not on the shoulder — the Parisian distinction.', key_brands: ['Polène', 'A.P.C.', 'Strathberry'], tiktok_context: 'Under-arm tuck is the signature carry method in every Paris OOTD' },
      ],
      key_colors: ['Camel', 'Ivory', 'Navy', 'Burgundy'],
      key_silhouettes: ['Fluid wide-leg', 'Fitted rib top + volume bottom', 'Belted midi'],
      dress_codes: { day: 'Smart casual — a blazer or trench elevates everything', dinner: 'One polished piece minimum: satin, silk, or quality knitwear', nightlife: 'Editorial minimal — one sculptural piece, everything else quiet' },
      insider_tip: 'Parisians judge shoes and bags before anything else. One investment leather accessory outperforms ten trendy fast-fashion pieces.',
      avoid: 'Matching sets that look too co-ordinated. Crossbody bags at dinner. Sneakers at restaurants.',
    },
    milan: {
      headline: 'Milan is all sharp shoulders and unapologetic glamour right now.',
      vibe_of_the_moment: 'polished editorial',
      social_pulse: { tiktok_aesthetic: 'Italian fashion week energy', instagram_mood: 'saturated, tailored, intentional', key_tags: ['#milanfashion', '#italianstyle', '#ootd_milan'] },
      trending_now: [
        { item: 'Structured blazer with shoulder detail', why: 'Power dressing is back in Milan and TikTok is showing it with Navigli canal backdrops.', key_brands: ['Max Mara', 'Totême', 'Mango'], tiktok_context: 'Oversized, worn with straight trousers, minimal accessories' },
        { item: 'Pointed-toe heeled loafer', why: 'The Milan street style shoe — photographed everywhere around Brera and Duomo.', key_brands: ['Gucci', 'Zara', 'Mango'], tiktok_context: 'Worn with straight-cut trousers, heel visible with every step' },
        { item: 'Wide-leg tailored trouser', why: 'Fluid and high-waist — Milan\'s answer to casual but polished.', key_brands: ['Max Mara', 'COS', 'Totême'], tiktok_context: 'Outfit check videos showing the trouser break over the shoe' },
        { item: 'Leather mini bag', why: 'Under-arm or crook of elbow — the Italian carry method.', key_brands: ['Bottega Veneta', 'Polène', 'Strathberry'], tiktok_context: 'Casually held while walking through Navigli' },
        { item: 'Gold jewellery stacking', why: 'Multiple thin chains and rings — the Italian way to do quiet luxury jewellery.', key_brands: ['Mejuri', 'Monica Vinader', 'local goldsmith'], tiktok_context: 'Close-up shots of stacked rings and layered chains' },
      ],
      key_colors: ['Black', 'Camel', 'Ecru', 'Deep Green'],
      key_silhouettes: ['Sharp shoulder + wide leg', 'Fitted jacket + midi skirt', 'Column dress'],
      dress_codes: { day: 'Polished casual — tailored but not stiff', dinner: 'Smart elegant — one luxury fabric piece minimum', nightlife: 'Glamorous without being costume-y' },
      insider_tip: 'Milanese women dress for the piazza, not the occasion. Your daytime outfit should be photogenic.',
      avoid: 'Sporty trainers outside the gym. Flip-flops anywhere except the beach.',
    },
  };
  const base = fallbacks[city.toLowerCase()] || fallbacks.paris;
  return { ...base, city, season };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const params = event.queryStringParameters || {};
  const city   = (params.city || 'Paris').toLowerCase().trim();
  const season = getSeason();
  const social = SOCIAL_CONTEXT[city] || SOCIAL_CONTEXT.paris;

  try {
    // Fetch live fashion news in parallel with nothing blocking
    const news = await gatherFashionNews(12);

    // Generate AI trend report (returns null if no API key)
    const aiTrends = await generateTrends(city, season, social, news);

    const result = aiTrends || staticFallback(city, season);
    result._news_items_used = news.length;
    result._generated_at    = new Date().toISOString();

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, s-maxage=3600' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('trends error:', err);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(staticFallback(city, season)),
    };
  }
};
