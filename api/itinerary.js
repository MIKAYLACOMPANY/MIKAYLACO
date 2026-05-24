// MIKAYLA — /api/itinerary (Vercel serverless)
import Anthropic from '@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function getFallback(city, days, budget, style, activities) {
  const actMap = {
    beach:      { icon:'🏖', name:'Beach Look',       desc:`Light linen cover-up over a swimsuit — effortless and resort-ready for ${city}.`,        links:[{store:'Amazon',url:`https://www.amazon.com/s?k=womens+beach+cover+up+linen+resort&tag=mikaylaco20-20`,price:'$24'},{store:'ASOS',url:'https://www.asos.com/search/?q=beach+cover+up+linen',price:'$45'},{store:'♻ Depop',url:'https://www.depop.com/search/?q=beach+cover+up+linen',price:'$15'}]},
    dining:     { icon:'🍽', name:'Dinner Look',      desc:`A polished ${style ? style.toLowerCase() : 'chic'} dress perfect for a nice dinner out in ${city}.`,            links:[{store:'Zara',url:'https://www.zara.com/us/en/search?searchTerm=midi+dress+dinner',price:'$79'},{store:'Revolve',url:'https://www.revolve.com/search/?q=midi+dress+evening',price:'$148'},{store:'♻ ThredUp',url:'https://www.thredup.com/search#searchText=midi+dress+dinner',price:'$25'}]},
    sightseeing:{ icon:'🗺', name:'Day Explorer',     desc:`Comfortable yet stylish — walkable shoes, great bag, layerable outfit for exploring ${city}.`,links:[{store:'H&M',url:'https://www.hm.com/en_us/search-results.html?q=casual+chic+outfit',price:'$48'},{store:'ASOS',url:'https://www.asos.com/search/?q=casual+chic+outfit+women',price:'$72'},{store:'♻ ThredUp',url:'https://www.thredup.com/search#searchText=casual+chic+top+bottom',price:'$20'}]},
    nightlife:  { icon:'🌙', name:'Night Out',        desc:`Bold and city-appropriate. Made to be seen in ${city}.`,                                  links:[{store:'ASOS',url:'https://www.asos.com/search/?q=going+out+outfits+women',price:'$65'},{store:'Revolve',url:'https://www.revolve.com/search/?q=night+out+dress',price:'$145'},{store:'♻ Depop',url:'https://www.depop.com/search/?q=going+out+dress+mini',price:'$30'}]},
    hiking:     { icon:'🥾', name:'Hike-Ready',       desc:`Functional but fashionable — you'll look styled in the photos too.`,                       links:[{store:'Amazon',url:`https://www.amazon.com/s?k=womens+hiking+outfit+set+athletic&tag=mikaylaco20-20`,price:'$45'},{store:'ASOS',url:'https://www.asos.com/search/?q=outdoor+activewear+women',price:'$68'},{store:'♻ ThredUp',url:'https://www.thredup.com/search#searchText=athletic+outdoor+women',price:'$18'}]},
    rooftop:    { icon:'🏙', name:'Rooftop Cocktail', desc:`Elevated but relaxed — the golden hour photo will be stunning.`,                           links:[{store:'Revolve',url:'https://www.revolve.com/search/?q=cocktail+dress+midi',price:'$135'},{store:'ASOS',url:'https://www.asos.com/search/?q=cocktail+dress+women',price:'$75'},{store:'♻ ThredUp',url:'https://www.thredup.com/search#searchText=cocktail+dress+women',price:'$35'}]},
    shopping:   { icon:'🛍', name:'Shopping Day',     desc:`Comfortable, photogenic — ready for dressing rooms and café breaks.`,                       links:[{store:'H&M',url:'https://www.hm.com/en_us/search-results.html?q=casual+chic+women',price:'$38'},{store:'ASOS',url:'https://www.asos.com/search/?q=casual+day+outfit+women',price:'$55'},{store:'♻ Depop',url:'https://www.depop.com/search/?q=casual+chic+outfit+women',price:'$22'}]},
    yoga:       { icon:'🧘', name:'Wellness Morning', desc:`Elevated activewear that transitions from class to brunch.`,                                links:[{store:'Amazon',url:`https://www.amazon.com/s?k=yoga+set+women+stylish+activewear&tag=mikaylaco20-20`,price:'$42'},{store:'ASOS',url:'https://www.asos.com/search/?q=yoga+set+women+activewear',price:'$58'},{store:'H&M',url:'https://www.hm.com/en_us/search-results.html?q=yoga+set+women',price:'$28'}]},
  };
  const fallbackAct = actMap.sightseeing;
  const actList = activities && activities.length ? activities : ['sightseeing', 'dining'];
  const numDays = parseInt(days) || 5;
  const dayPlans = [];
  for (let d = 1; d <= numDays; d++) {
    const todayActs = [actList[(d - 1) % actList.length], actList[d % actList.length] || actList[0]];
    dayPlans.push({
      day: d,
      label: `Day ${d} — ${city}`,
      subtitle: todayActs.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(' · '),
      outfits: todayActs.map(a => actMap[a] || fallbackAct),
    });
  }
  return { days: dayPlans };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).send('');
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { city = 'Paris', days = 5, budget = 'mid', style = 'Chic & Polished', activities = [] } = req.body || {};

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json(getFallback(city, days, budget, style, activities));
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `You are MIKAYLA's AI wardrobe planner. Create a ${days}-day outfit itinerary for ${city}.
Budget: ${budget} | Style: ${style} | Activities: ${activities.join(', ') || 'sightseeing, dining'}

Return ONLY valid JSON:
{
  "days": [
    {
      "day": 1,
      "label": "Day 1 — ${city}",
      "subtitle": "Activity · Activity",
      "outfits": [
        {
          "icon": "emoji",
          "name": "Outfit Name",
          "desc": "Description tailored to ${city}, the activity, and ${style} style at ${budget} budget",
          "links": [
            { "store": "Zara", "url": "https://www.zara.com/us/en/search?searchTerm=...", "price": "$XX" },
            { "store": "ASOS", "url": "https://www.asos.com/search/?q=...", "price": "$XX" },
            { "store": "♻ ThredUp", "url": "https://www.thredup.com/search#searchText=...", "price": "$XX" }
          ]
        }
      ]
    }
  ]
}

Generate ${days} days, 2 outfits per day based on the activities. Links must be real working search URLs for Zara, ASOS, Revolve, Amazon (tag=mikaylaco20-20), H&M, or ThredUp. Always include one secondhand option. Return only JSON.`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content[0].text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err) {
    console.error('itinerary error:', err.message);
    return res.status(200).json(getFallback(city, days, budget, style, activities));
  }
}
