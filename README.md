# MIKAYLA — Travel Fashion Intelligence

MIKAYLA is a city-specific fashion search and trip-styling platform. The interface connects five core experiences:

- City Edit: current style signals and shoppable directions for any destination.
- Itinerary Stylist: venue-aware outfits from pasted plans, images, or PDFs.
- My Closet: AI-recognised pieces saved locally on the user's device.
- MIKAYLA Lens: outfit recognition with city scoring and price-tier alternatives.
- Outfit Studio: a mix-and-match look builder covering clothing, shoes, and accessories.

## Vercel configuration

Copy the keys in `.env.example` into the Vercel project's environment settings. `ANTHROPIC_API_KEY` activates the AI features. `AWIN_API_TOKEN` activates live affiliate product feeds; the interface uses a curated destination-aware catalog when it is absent.

The production domain is `www.mikaylaco.com`.
