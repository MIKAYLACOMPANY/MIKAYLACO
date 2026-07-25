# MIKAYLA product source of truth

## Product

MIKAYLA is an AI-powered travel fashion intelligence platform. It reads the visual language of a city, translates that language into complete outfits for a traveller’s real itinerary, prioritises clothes the traveller already owns, and makes genuine wardrobe gaps shoppable at several price points.

## Core promise

Every city has its own dress code. MIKAYLA reads it.

The user outcome is confidence: fit in while standing out.

## Primary journeys

1. Discover current city style through sourced creator and editorial references.
2. Upload a look and identify exact or similar pieces at luxury, contemporary, and accessible price points.
3. Upload or paste an itinerary and receive venue-aware outfits for every event.
4. Build a private digital closet and avoid duplicate recommendations.
5. Mix tops, bottoms, shoes, bags, and accessories in a Clueless-style studio, then assign saved looks to dates.

## Product principles

- Local authenticity over editorial fantasy.
- Personal first, purchase second.
- Timeless enough to rewear, current enough to feel relevant.
- Budget translation without aesthetic judgement.
- Complete looks include accessories.
- City and venue context matter more than generic global trends.
- Cultural appropriateness, body preferences, and comfort are user-controlled.
- Public source evidence and commercial relationships are visible.

## Data honesty

Live social intelligence requires approved API or licensed-provider access. The product must distinguish:

- live configured data
- curated public references
- editorial interpretation
- fallback or demo output

No public-facing screen may imply private-data access, invented engagement, invented product availability, or fabricated confidence.

## Brand

Chic. Effortless. Timeless. Elegant. Confident. Quiet. Knowing.

The experience should feel like a luxury fashion house made a genuinely useful travel tool.

## Initial city set

Paris, New York, London, Tokyo, Milan, Barcelona, Dubai, Amsterdam, Rome, Santorini, Amalfi Coast, Copenhagen, Lisbon, Mykonos, Tulum, Cape Town, Bali, Vienna, Prague, and Edinburgh.

## Current implementation strategy

- Vercel hosts the web application and serverless endpoints.
- GitHub is the source of record.
- The interface must remain useful without paid API credentials through clearly labelled local fallbacks.
- Anthropic vision and text models provide image and itinerary interpretation when configured.
- Pinterest API may update the approved MIKAYLA inspiration board.
- The current release uses direct retailer searches at luxury, contemporary, and accessible price levels.
- Approved affiliate-network or retailer feeds can later supply product details and trackable links without changing the interface.
- Closet and trip data remain local unless secure account storage is configured.

## Source material reviewed

- Product and Strategy Document, March 2026
- Social Media Content Guide
- Y Combinator Application, S2026
- MIKAYLA Pitch Deck
- Claude HTML prototypes
- Existing production repository and API endpoints
- User-provided visual direction and Pinterest reference screenshot
