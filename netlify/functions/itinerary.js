const Anthropic = require("@anthropic-ai/sdk");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function inferDestination(text, hint) {
  if (hint) return hint.trim();
  const cities = ["Paris", "London", "Milan", "Rome", "Tokyo", "Barcelona", "Santorini", "Positano", "Ibiza", "Mykonos", "Lisbon", "Copenhagen", "Amsterdam", "New York", "Dubai", "Bali", "Tulum", "Marrakech"];
  return cities.find((name) => new RegExp(`\\b${name.replace(" ", "\\s+")}\\b`, "i").test(text || "")) || "Your destination";
}

function eventFromLine(line, index, city) {
  const timeMatch = line.match(/\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM)|\d{1,2}:\d{2})\b/i);
  const time = timeMatch ? timeMatch[1].toUpperCase().replace(/\s+/g, " ") : index % 2 ? "19:30" : "10:30";
  let venue = line
    .replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b[,\s]*/i, "")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b/ig, "")
    .replace(/\b\d{1,2}:\d{2}\b/g, "")
    .replace(/^[\s—–,:-]+|[\s—–,:-]+$/g, "")
    .replace(/^(dinner|lunch|brunch|breakfast|drinks?|cocktails?|visit|tour)\s+(at|to)\s+/i, "");
  if (!venue) venue = `${city} plan`;

  const lower = line.toLowerCase();
  let venueType = "Exploring";
  let dressCode = "Elevated Casual";
  let description = "Wide-leg trousers · fitted knit · leather flats · structured day bag · gold hoops";
  let note = "Polished enough for the destination while remaining practical for the plan.";

  if (/museum|gallery|louvre|exhibit|tour/.test(lower)) {
    venueType = "Culture";
    dressCode = "Smart Casual";
    description = "Tailored trousers · silk shirt · walking loafers · light layer · shoulder bag";
    note = "Comfortable for time on your feet, with clean proportions that suit a cultural setting.";
  } else if (/dinner|restaurant|supper|tasting/.test(lower)) {
    venueType = "Restaurant";
    dressCode = "Elegant";
    description = "Fluid midi dress · sculptural earrings · kitten heels · small leather bag";
    note = "A refined evening silhouette that feels considered without becoming formalwear.";
  } else if (/lunch|brunch|cafe|café/.test(lower)) {
    venueType = "Restaurant";
    dressCode = "Day Chic";
    description = "Rewear tailored trousers · silk camisole · lightweight blazer · ballet flats · top-handle bag";
    note = "A lighter rework of the capsule that transitions naturally from sightseeing to the table.";
  } else if (/bar|drink|cocktail|club|night/.test(lower)) {
    venueType = "Bar";
    dressCode = "City Chic";
    description = "Silk shirt over camisole · tailored skirt · heeled mule · statement cuff · compact bag";
    note = "A focused accessory change gives the capsule a confident evening finish.";
  } else if (/beach|pool|boat|yacht/.test(lower)) {
    venueType = "Resort";
    dressCode = "Coastal";
    description = "Linen set · leather sandal · woven tote · sunglasses · gold pendant";
    note = "Breathable, packable pieces with enough structure to move beyond the water.";
  }

  const options = [
    {
      direction: "Understated",
      description,
      stylist_note: note,
    },
    {
      direction: "Fashion-forward",
      description: venueType === "Resort"
        ? "Draped resort dress · sculptural sandal · oversized sunglasses · statement cuff · compact woven bag"
        : venueType === "Restaurant" || venueType === "Bar"
          ? "Asymmetric midi silhouette · sharp heel · sculptural jewellery · compact top-handle bag"
          : "Directional tailoring · fitted base layer · low-profile shoe · architectural bag · statement eyewear",
      stylist_note: "A more directional interpretation that keeps the same occasion and city context.",
    },
    {
      direction: "Practical",
      description: venueType === "Resort"
        ? "Linen co-ord · flat leather sandal · secure woven tote · sunglasses · lightweight layer"
        : venueType === "Restaurant" || venueType === "Bar"
          ? "Polished separates · low heel · compact shoulder bag · refined earrings · light layer"
          : "Relaxed tailored trouser · fitted knit · leather flat · hands-free bag · polished outer layer",
      stylist_note: "An easy-to-wear alternative with the same visual intention and a simpler day-to-night transition.",
    },
  ];

  return {
    time,
    venue,
    venue_type: venueType,
    dress_code: dressCode,
    outfit: { description, stylist_note: note },
    outfit_options: options,
  };
}

function demoItinerary(cityHint = "", itineraryText = "", closetItems = []) {
  const city = inferDestination(itineraryText, cityHint);
  const lines = String(itineraryText || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const events = (lines.length ? lines : [`${city} city walk`, "Dinner reservation", "Museum visit", "Cocktails"])
    .slice(0, 10)
    .map((line, index) => eventFromLine(line, index, city));
  const schedule = [];
  for (let index = 0; index < events.length; index += 2) {
    schedule.push({
      day: schedule.length + 1,
      date: schedule.length ? "Continue the city edit" : "Arrival and first impressions",
      events: events.slice(index, index + 2),
    });
  }

  return {
    destination: city,
    dates: "Your upcoming trip",
    days: schedule.length,
    total_occasions: events.length,
    capsule_note: closetItems.length
      ? `A closet-first edit beginning with ${closetItems.length} owned ${closetItems.length === 1 ? "piece" : "pieces"}, then adding only the gaps needed for the itinerary.`
      : "A compact wardrobe built around repeatable tailoring, one evening piece, and accessories that change the mood.",
    schedule,
    demo: true,
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid request" }) }; }

  const {
    itinerary_text = "",
    image_base64,
    document_base64,
    media_type = "image/jpeg",
    city = "",
    budget = "mixed",
    rewear = 2,
    closet_items = [],
  } = body;

  if (!itinerary_text && !image_base64 && !document_base64) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Add itinerary text, an image, or a PDF" }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(demoItinerary(city, itinerary_text, closet_items)) };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const content = [];
    if (image_base64) content.push({ type: "image", source: { type: "base64", media_type, data: image_base64 } });
    if (document_base64) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: document_base64 } });
    content.push({
      type: "text",
      text: `You are MIKAYLA, a travel fashion intelligence stylist. Read this itinerary and return a venue-aware outfit plan.

ITINERARY:
${itinerary_text || "Read the attached itinerary."}

PREFERENCES:
- City hint: ${city || "detect it"}
- Budget: ${budget}
- Maximum rewear per piece: ${rewear}

OWNED CLOSET:
${closet_items.length
  ? closet_items.map((item) => `- ${item.id}: ${item.type || "piece"}${item.color ? `, ${item.color}` : ""}${item.material ? `, ${item.material}` : ""}`).join("\n")
  : "- No owned pieces supplied"}

For each named venue or activity, infer its visual atmosphere, relative formality, likely time context, and weather context. Create exactly three complete head-to-toe styling directions: Understated, Fashion-forward, and Practical. Each must include shoes, bag, and accessories, remain true to the same city and occasion, and differ in styling attitude rather than price. Use owned closet pieces first, reference them by their exact IDs, and recommend a purchase only for a genuine gap. Reuse the capsule intelligently. Do not add political, religious, moral, or general lifestyle commentary. Do not claim to have read private social posts or live reviews.

Return only valid JSON:
{
  "destination": "city",
  "dates": "date range or trip label",
  "days": 2,
  "total_occasions": 4,
  "capsule_note": "concise packing strategy",
  "schedule": [{
    "day": 1,
    "date": "day/date",
    "events": [{
      "time": "time",
      "venue": "venue",
      "venue_type": "type",
      "dress_code": "dress code",
      "outfit_options": [{
        "direction": "Understated | Fashion-forward | Practical",
        "description": "complete outfit including accessories",
        "stylist_note": "why this works for this exact venue",
        "pieces": [{"item":"piece","owned_item_id":"exact closet id or null","is_owned":false,"rewear_id":"id","is_rewear":false}],
        "gaps": [{"item":"only a genuine missing piece","reason":"why the owned closet cannot cover it","search_query":"product search"}]
      }]
    }]
  }]
}`,
    });

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL && process.env.ANTHROPIC_MODEL !== "claude-sonnet-5"
        ? process.env.ANTHROPIC_MODEL
        : "claude-sonnet-4-20250514",
      max_tokens: 3500,
      messages: [{ role: "user", content }],
    });
    const raw = message.content?.[0]?.text || "";
    const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(clean);
    result.demo = false;
    return { statusCode: 200, headers: CORS, body: JSON.stringify(result) };
  } catch (error) {
    console.error("itinerary error:", error.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify(demoItinerary(city, itinerary_text, closet_items)) };
  }
};
