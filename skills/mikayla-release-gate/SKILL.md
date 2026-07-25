---
name: mikayla-release-gate
description: Audit MIKAYLA before a website release. Use for functional QA, responsive testing, accessibility, broken links, image provenance, truthful shopping relationship language, API fallbacks, local storage, itinerary flows, closet upload, visual shopping, outfit studio, and Vercel readiness.
---

# MIKAYLA Release Gate

Do not release a beautiful shell. Release complete, honest journeys.

## Workflow

1. Read `references/release-checklist.md`.
2. Run the project’s static checks.
3. Run `scripts/audit-static.mjs` from the project root.
4. Start the local application using the documented command.
5. Test every primary journey at desktop and mobile widths.
6. Verify empty, loading, success, error, and no-API fallback states.
7. Review source labels, shopping relationship language, privacy language, and unsupported claims.
8. Check the browser console and network failures.
9. Re-run the checks after fixes.

## Release decision

Return:

- passed journeys
- failed journeys
- severity
- exact reproduction
- recommended fix
- whether the release is blocked

Block release for:

- a primary navigation destination that does not work
- a form that loses user data without warning
- a broken upload flow
- fabricated live data
- shopping links that do not open
- affiliate tracking is active but the disclosure or sponsored link attributes are missing
- the site implies a commission relationship that is not active
- inaccessible primary actions
- a mobile layout that hides or overlaps essential controls
- secrets committed to the repository
