# MIKAYLA

MIKAYLA is a city-specific travel fashion platform: discover what fits the destination, turn an itinerary into a complete wardrobe, reuse pieces from a digital closet, and mix every part of a look in the Outfit Studio.

## Main experiences

- **Discover** — search any city for its style language, complete looks, accessories, and exact or lower-price shopping paths.
- **Plan** — use the guided trip builder or upload/paste an itinerary. Named venues become styled occasions.
- **Closet** — add and categorise clothes the traveller already owns.
- **Studio** — mix tops, bottoms, shoes, bags, and accessories in separate rows.

The site works without paid API keys using carefully labelled editorial/demo data and a local itinerary parser. Adding the environment variables below enables richer AI analysis, image understanding, product feeds, email, and account storage.

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
- `AWIN_PUBLISHER_ID` / `AWIN_API_TOKEN` — affiliate product feeds.
- `PINTEREST_ACCESS_TOKEN` — approved Pinterest data access.
- `SUPABASE_URL` / `SUPABASE_KEY` — account-backed closet and trip storage.
- `RESEND_API_KEY` — waitlist and access email delivery.

## Social preview

The branded Open Graph image is stored at `public/og.png`.
