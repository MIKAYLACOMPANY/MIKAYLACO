# Trip and wardrobe product contract

## Inputs

Support:

- pasted itinerary text
- manual day and venue entry
- itinerary screenshots
- PDFs
- city and date selection
- budget
- sizes and fit preferences
- modesty or cultural preferences
- mobility and comfort needs
- user-owned wardrobe images

## Venue interpretation

Build a venue profile from:

- official venue description and reservation requirements
- public review language
- neighbourhood and time of day
- indoor or outdoor context
- likely walking, weather, and transport needs
- explicit cultural rules

Label inferences as inferences. Do not claim to have read a source that was not actually queried.

## Planning output

Each itinerary event should include:

- time
- venue or activity
- inferred atmosphere
- dress code
- complete outfit
- owned pieces used
- suggested additions
- rewear connections
- stylist rationale

## Closet item schema

Use:

- `id`
- `image`
- `type`
- `category`
- `colour`
- `material`
- `season`
- `formality`
- `styleTags`
- `owned: true`
- `createdAt`
- optional size and fit notes

## Packing output

Deduplicate by physical item, not by outfit mention. Show:

- total owned pieces
- total suggested additions
- number of outfits
- rewear count per piece
- day and occasion assignments
- weather or cultural notes
