# Source and commerce contract

## Approved signal sources

- MIKAYLA-owned Pinterest boards accessed through the approved Pinterest API.
- Public creator or editorial pages linked rather than copied into a private dataset.
- Licensed social-data providers under their permitted use.
- User uploads with explicit consent for the requested analysis.
- Retailer feeds, direct retailer searches, or approved affiliate-network product feeds.

## Restricted practices

- Do not scrape private accounts.
- Do not store individual social images beyond permitted caching.
- Do not remove creator credit.
- Do not claim that a hashtag search represents the entire city.
- Do not use a publication’s image as a product image unless licensed or embedded under permitted terms.
- Do not call retailer search URLs exact product matches.

## City trend calculation

Treat a city trend as a weighted collection of signals:

- recency
- location specificity
- repeated garment or silhouette
- repeated styling pattern
- creator or publication diversity
- engagement quality when legitimately available

Return the evidence window and source count with any confidence score. A trend profile should expire and refresh; it is not evergreen copy.

## Product result requirements

Each result should include:

- retailer
- product title
- current price and currency when supplied by the retailer feed
- image supplied by the retailer feed
- stock status when supplied
- affiliate or direct URL
- match type: exact, close, or inspired
- match rationale
- last checked timestamp

If a live catalogue is unavailable, show retailer search options without fabricated product cards.

## Shopping relationship language

When no affiliate program is active, label the results as direct retailer searches. Do not use a commission disclosure or `sponsored` link attribute.

When affiliate tracking is active, place a concise disclosure near shoppable results:

“MIKAYLA may earn a commission when you shop through selected links. Recommendations are based on style fit, not commission.”

Use `rel="sponsored nofollow noopener"` only on affiliate links.
