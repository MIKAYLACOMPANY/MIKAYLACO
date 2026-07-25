---
name: mikayla-trip-wardrobe
description: Build MIKAYLA’s itinerary styling, closet intelligence, packing, and Clueless-style outfit studio. Use for itinerary parsing, venue vibe, dress code, daily outfits, wardrobe upload, garment categorisation, duplicate prevention, rewear, gap analysis, packing lists, outfit mixing, and calendar assignment.
---

# MIKAYLA Trip Wardrobe

Plan the trip from the user’s existing wardrobe outward.

## Workflow

1. Read `references/product-contract.md`.
2. Parse the destination, dates, times, named venues, activities, and practical requirements.
3. Infer formality conservatively from verifiable venue information and the user’s context.
4. Read the user’s closet inventory and preferences.
5. Build each outfit from owned pieces first.
6. Identify only true wardrobe gaps.
7. Offer budget-tiered additions for each gap.
8. Save outfits to the correct date and occasion.
9. Produce a deduplicated packing list with rewear counts.

## Outfit completeness

Every recommendation must account for:

- primary garment or top and bottom
- outer layer where weather or setting requires it
- shoes
- bag
- accessories
- practical or cultural constraints
- why the outfit fits the specific place and time

## Closet rules

- Preserve user ownership and privacy.
- Store locally by default when account storage is not configured.
- Make deletion and recategorisation easy.
- Allow manual correction after AI categorisation.
- Detect likely duplicates before recommending a purchase.
- Show which owned item replaces a recommended item.

## Studio rules

- Keep separate horizontal rows for tops, bottoms, shoes, bags, and accessories.
- Keep the assembled look visible while the user changes a row.
- Update price totals and owned/new status immediately.
- Let the user save a named look and assign it to an itinerary slot.
- Keep incomplete looks editable rather than blocking progress.

## Language

Do not shame the user, body, budget, or taste. Explain context and tradeoffs with confidence and specificity.
