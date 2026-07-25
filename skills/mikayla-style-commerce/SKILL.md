---
name: mikayla-style-commerce
description: Build MIKAYLA’s city trend, visual search, product matching, and affiliate commerce systems. Use for Pinterest or creator feeds, city style signals, image analysis, exact and similar matches, accessories, price tiers, product links, affiliate disclosure, freshness, and source provenance.
---

# MIKAYLA Style Commerce

Turn current public fashion signals into useful shopping decisions without overstating the data.

## Workflow

1. Read `references/source-contract.md`.
2. Collect only approved public, partner, editorial, or user-owned inputs.
3. Normalize every visual signal into the schema below.
4. Extract complete-look pieces, including shoes, bag, jewellery, eyewear, belt, and headwear.
5. Separate exact-match confidence from similarity confidence.
6. Produce luxury, contemporary, and accessible alternatives for each piece.
7. Route product clicks through the affiliate layer when configured and disclose the commercial relationship.
8. Run `scripts/audit-signals.mjs` against any maintained signal feed before release.

## Signal schema

Require:

- `id`
- `city`
- `image`
- `sourceUrl`
- `source`
- `creator`
- `title`
- `signal`
- `query`
- `pieces`

Prefer:

- `capturedAt`
- `publishedAt`
- `neighborhood`
- `occasion`
- `engagement`
- `rights`
- `confidence`

## Truthfulness

- Say “live” only when the response came from a configured live source and includes a current timestamp.
- Say “trending” only when multiple recent signals support the conclusion.
- Say “exact match” only when brand, product, or distinctive design evidence supports it.
- Otherwise use “similar silhouette”, “similar colour story”, or “shop the effect”.
- Do not imply access to private Instagram or TikTok data.
- Do not invent engagement counts, creator identities, product availability, prices, or affiliate status.

## Commerce hierarchy

For every detected piece, provide:

1. Exact or closest verified match, if available.
2. Luxury alternative.
3. Contemporary alternative.
4. Accessible alternative.
5. Search-again action.
6. Original visual source.

Keep the aesthetic interpretation consistent across price tiers. Budget translation is the product, not a discount badge.
