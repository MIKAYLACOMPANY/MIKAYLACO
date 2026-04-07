// MIKAYLA — /api/trends
// Returns real-time city fashion trend intelligence via Claude AI
// Caches results in Supabase for 6 hours to minimise API costs

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function getSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring-2026';
  if (m >= 5 && m <= 7) return 'summer-2026';
  if (m >= 8 && m <= 10) return 'autumn-2026';
  return 'winter-2026';
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// Fallback demo data — shown when API key is not set
function getDemoTrends(city) {
  const demos = {
    paris: {
      city: 'Paris',
      season: getSeason(),
      headline: 'Quiet luxury gives way to expressive minimalism',
      vibe_of_the_moment: 'Effortless Parisian chic — structured but never stiff',
      trending_now: [
        { item: 'Wide-leg linen trousers', why: 'Seen everywhere from Le Marais to Saint-Germain', key_brands: ['Totême', 'Sandro', 'Arket'] },
        { item: 'Ballet flats', why: 'The shoe of the season — flat, sleek, Parisian', key_brands: ['Repetto', 'Jacquemus', 'Mango'] },
        { item: 'Micro handbag', why: 'Size is irrelevant when the bag is this good', key_brands: ['Jacquemus', 'Polène', 'A.P.C.'] },
        { item: 'Silk slip tops', why: 'Day-to-dinner without changing', key_brands: ['COS', 'Totême', '& Other Stories'] },
      ],
      key_colors: ['Ivory', 'Camel', 'Navy', 'Soft black', 'Stone'],
      avoid: 'Overly branded logomania — Parisians rarely wear visible logos',
      insider_tip: 'Layer a blazer over your evening look rather than changing entirely — the French way',
      dress_codes: {
        day: 'Smart casual — linen, cotton, clean sneakers or loafers acceptable',
        dinner: 'Elevated casual to smart — no sportswear, heels optional but appreciated',
        nightlife: 'Chic and intentional — one statement piece, everything else understated',
      },
      sources: ['TikTok #parisstyle', 'Instagram #tenuedujour', 'Vogue Paris March 2026'],
      cached: false,
    },
    santorini: {
      city: 'Santorini',
      season: getSeason(),
      headline: 'White linen reigns, gold jewellery is non-negotiable',
      vibe_of_the_moment: 'Mediterranean dream — breezy, sun-kissed, effortlessly elegant',
      trending_now: [
        { item: 'White linen midi dress', why: 'The uniform of Oia — looks incredible against blue domes', key_brands: ['Reformation', 'Zimmermann', 'Faithfull the Brand'] },
        { item: 'Gold jewellery stacks', why: 'Layered necklaces and bangles, worn over tan skin', key_brands: ['Mejuri', 'Missoma', 'Lucy Williams x Missoma'] },
        { item: 'Strappy flat sandals', why: 'Cobblestones demand it — beautiful but practical', key_brands: ['ATP Atelier', 'Ancient Greek Sandals', 'Castañer'] },
        { item: 'Crochet cover-ups', why: 'Beach to lunch without changing', key_brands: ['Zimmermann', 'Seafolly', 'Hunza G'] },
      ],
      key_colors: ['White', 'Gold', 'Terracotta', 'Sky blue', 'Sand'],
      avoid: 'Heavy fabrics — linen and cotton only. No dark colours in peak heat',
      insider_tip: 'Sunset at Oia is a fashion moment — dress for it. Everyone does.',
      dress_codes: {
        day: 'Relaxed resort — breezy, minimal, sun-appropriate',
        dinner: 'Smart resort — white dress, gold jewellery, flat sandals or low wedge',
        nightlife: 'Elevated resort — same palette but more intentional silhouette',
      },
      sources: ['TikTok #santorinioutfit', 'Instagram #greekislands', 'Travel + Leisure Style'],
      cached: false,
    },
  };
  const key = city.toLowerCase().replace(/\s+/g, '');
  return demos[key] || { ...demos.paris, city, headline: `Style intelligence for ${city}` };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const city = (event.queryStringParameters?.city || 'paris').trim().toLowerCase();
  const season = getSeason();
  const supabase = getSupabase();

  // 1. Check cache
  if (supabase) {
    try {
      const { data } = await supabase
        .from('trend_cache')
        .select('trend_data, created_at')
        .eq('city', city)
        .eq('season', season)
        .single();

      if (data) {
        const age = Date.now() - new Date(data.created_at).getTime();
        if (age < 6 * 60 * 60 * 1000) {
          return { statusCode: 200, headers: CORS, body: JSON.stringify({ ...data.trend_data, cached: true }) };
        }
      }
    } catch (_) {}
  }

  // 2. No API key — return demo
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoTrends(city)) };
  }

  // 3. Generate with Claude
  try {
    const cityDisplay = city.charAt(0).toUpperCase() + city.slice(1);
    const prompt = `You are MIKAYLA's fashion intelligence system. Generate a real-time style trend report for ${cityDisplay} for ${season}.

Return ONLY valid JSON with this exact structure:
{
  "city": "${cityDisplay}",
  "season": "${season}",
  "headline": "One punchy sentence about the dominant trend shift right now",
  "vibe_of_the_moment": "The overall aesthetic mood — 10 words max",
  "trending_now": [
    { "item": "specific garment or piece", "why": "why it's trending here specifically", "key_brands": ["Brand1", "Brand2", "Brand3"] }
  ],
  "key_colors": ["Color1", "Color2", "Color3", "Color4", "Color5"],
  "avoid": "What tourists get wrong — one sentence",
  "insider_tip": "One insider styling tip a local would give",
  "dress_codes": {
    "day": "What to wear daytime",
    "dinner": "What to wear for dinner",
    "nightlife": "What to wear for evenings/clubs"
  },
  "sources": ["Source reference 1", "Source reference 2", "Source reference 3"]
}

Base this on real knowledge of ${cityDisplay}'s fashion culture, current season trends, and what's actually being worn there right now based on street style, social media, and fashion publications. Be specific to this city — not generic fashion advice. Include 4 trending_now items. Return only the JSON object, no other text.`;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].text.trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const trendData = JSON.parse(clean);
    trendData.cached = false;

    // 4. Cache in Supabase
    if (supabase) {
      try {
        await supabase.from('trend_cache').upsert(
          { city, season, trend_data: trendData, created_at: new Date().toISOString() },
          { onConflict: 'city,season' }
        );
      } catch (_) {}
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(trendData) };
  } catch (err) {
    console.error('trends error:', err.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(getDemoTrends(city)) };
  }
}
