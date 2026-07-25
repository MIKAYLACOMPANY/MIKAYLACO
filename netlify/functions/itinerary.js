const Anthropic = require("@anthropic-ai/sdk");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function demoItinerary(city = "Paris") {
  return {
    destination: city,
    dates: "Your upcoming trip",
    days: 2,
    total_occasions: 4,
    capsule_note: "A compact wardrobe built around repeatable tailoring, one evening piece, and accessories that change the mood.",
    schedule: [
      {
        day: 1,
        date: "Arrival day",
        events: [
          {
            time: "11:00",
            venue: `${city} city walk`,
            venue_type: "Exploring",
            dress_code: "Elevated Casual",
            outfit: {
              description: "Wide-leg trousers · fitted knit · leather flats · structured day bag · gold hoops",
              stylist_note: "Comfortable for the city, with enough polish to move directly into lunch.",
            },
          },
          {
            time: "20:00",
            venue: "Dinner reservation",
            venue_type: "Restaurant",
            dress_code: "Elegant",
            outfit: {
              description: "Fluid midi dress · sculptural earrings · kitten heels · small leather bag",
              stylist_note: "A clean silhouette reads confidently without feeling overdressed.",
            },
          },
        ],
      },
      {
        day: 2,
        date: "Culture and cocktails",
        events: [
          {
            time: "10:30",
            venue: "Museum visit",
            venue_type: "Culture",
            dress_code: "Smart Casual",
            outfit: {
              description: "Rewear trousers · silk shirt · walking loafers · light layer · shoulder bag",
              stylist_note: "A thoughtful rewear that still feels like a distinct look.",
            },
          },
          {
            time: "18:30",
            venue: "Cocktails",
            venue_type: "Bar",
            dress_code: "City Chic",
            outfit: {
              description: "Silk shirt worn open over camisole · tailored skirt · heeled mule · statement cuff",
              stylist_note: "One styling change takes the capsule from day to night.",
            },
          },
        ],
      },
    ],
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
  } = body;

  if (!itinerary_text && !image_base64 && !document_base64) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Add itinerary text, an image, or a PDF" }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(demoItinerary(city || "Paris")) };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const content = [];
    if (image_base64) {
      content.push({ type: "image", source: { type: "base64", media_type, data: image_base64 } });
    }
    if (document_base64) {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: document_base64 } });
    }
    content.push({
      type: "text",
      text: `You are MIKAYLA, a travel fashion intelligence stylist. Read this itinerary and return a complete venue-aware outfit plan.

ITINERARY:
${itinerary_text || "Read the attached itinerary."}

PREFERENCES:
- City hint: ${city || "detect it"}
- Budget: ${budget}
- Maximum rewear per piece: ${rewear}

For each named venue or activity, infer its atmosphere, relative formality, cultural expectations, likely weather/time context, and practical requirements. Build a complete head-to-toe outfit including shoes, bag, and accessories. Reuse the user's capsule intelligently. Do not claim to have read private social posts or live reviews.

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
      "outfit": {
        "description": "complete outfit including accessories",
        "stylist_note": "why this works for this exact venue",
        "pieces": [{"item":"piece","rewear_id":"id","is_rewear":false}]
      }
    }]
  }]
}`,
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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
    return { statusCode: 200, headers: CORS, body: JSON.stringify(demoItinerary(city || "Paris")) };
  }
};
