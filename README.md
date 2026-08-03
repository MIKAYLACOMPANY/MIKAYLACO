# MIKAYLA

MIKAYLA is a city-specific travel fashion platform: discover what fits the destination, turn an itinerary into a complete wardrobe, reuse pieces from a digital closet, and mix every part of a look in the Outfit Studio.

## Main experiences

- **Discover** — search any city for its style language, source-linked Pinterest, Instagram, and TikTok references, complete looks, accessories, and luxury, contemporary, or accessible shopping paths.
- **Visual Shop** — upload an outfit for full-look analysis or describe the pieces manually when the live vision model is not configured.
- **Plan** — use the guided trip builder or upload/paste an itinerary. Named venues become styled occasions.
- **Closet** — add and categorise clothes the traveller already owns.
- **Studio** — mix tops, bottoms, shoes, bags, and accessories in separate rows, save the look, and assign it to the itinerary.

The site remains useful without paid API keys through clearly labelled curated references, manual visual shopping, local itinerary parsing, local closet storage, and the complete outfit studio. Connected services deepen the same journeys without changing the interface.

The consolidated product brief is in `docs/PRODUCT_SOURCE_OF_TRUTH.md`. Project-local build skills live in `skills/`.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:4173`.

Run the code checks with:

```bash
pnpm run check
```

## Vercel setup

The existing Vercel project can continue deploying from the GitHub `main` branch. Copy the required values from `.env.example` into the Vercel project’s Environment Variables settings. Do not commit real credentials.

- `ANTHROPIC_API_KEY` — live outfit, itinerary, and image analysis.
- `ANTHROPIC_MODEL` / `ANTHROPIC_FAST_MODEL` — current model IDs used by the main and lightweight AI workflows.
- `AWIN_PUBLISHER_ID` / `AWIN_API_TOKEN` — optional future affiliate product feeds.
- `PINTEREST_ACCESS_TOKEN` — approved access to Pinterest's current Trends data and, later, MIKAYLA's branded-Pin publishing workflow.
- `PINTEREST_PUBLISH_BOARD_ID` — optional future destination for branded editorial or approved affiliate Pins. It is not used as the website's trend feed.
- `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` — licensed, current image-search results for each city query. MIKAYLA filters these to specific public Pinterest, Instagram, and TikTok posts, preserves the original source, and never presents search rank alone as proof that a look is trending.
- `AWIN_PUBLISHER_ID` and the retailer merchant IDs — later convert the existing direct retailer searches into tracked affiliate deep links without changing the interface.

The current release uses direct retailer search links. It does not represent any active affiliate relationship or commission arrangement.
- `SUPABASE_URL` / `SUPABASE_KEY` — account-backed closet and trip storage.
- `RESEND_API_KEY` — waitlist and access email delivery.

`mikaylaco.com` and `www.mikaylaco.com` are already attached to the existing
Vercel project. Pushing the validated `main` branch publishes the current build
to that domain.

## Social preview

The active temporary brand and Open Graph artwork is the founder-supplied
wordmark at `public/mikayla-wordmark-reference.png`. No standalone emblem is
active on the website.

## Release gate

`pnpm run check` validates the active application, source feed contract, serverless functions, and static release requirements.
