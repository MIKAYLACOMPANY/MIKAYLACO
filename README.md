# MIKAYLA

MIKAYLA is a city-specific travel fashion platform: discover what fits the destination, turn an itinerary into a complete wardrobe, reuse pieces from a digital closet, and mix every part of a look in the Outfit Studio.

## Main experiences

- **Discover** — search any city for its style language, sourced creator/Pinterest references, complete looks, accessories, and luxury, contemporary, or accessible shopping paths.
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
- `PINTEREST_ACCESS_TOKEN` / `PINTEREST_BOARD_ID` — approved access to the live MIKAYLA inspiration board. Adding or removing Pins from this board updates the on-site feed.
- `AWIN_PUBLISHER_ID` and the retailer merchant IDs — later convert the existing direct retailer searches into tracked affiliate deep links without changing the interface.

The current release uses direct retailer search links. It does not represent any active affiliate relationship or commission arrangement.
- `SUPABASE_URL` / `SUPABASE_KEY` — account-backed closet and trip storage.
- `RESEND_API_KEY` — waitlist and access email delivery.

## Social preview

The branded Open Graph image is stored at `public/og.png`.

## Release gate

`pnpm run check` validates the active application, source feed contract, serverless functions, and static release requirements.
