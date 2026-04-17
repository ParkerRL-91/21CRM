---
title: "Inline Deal Cards (Hover/Click Detail Popups)"
id: TASK-017
project: PRJ-001
status: done
priority: P3
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #pipeline, #ux]
---

# TASK-017: Inline Deal Cards

## User Stories

- As a sales manager, I want to hover over or click a deal name anywhere in the app and see a quick summary card — amount, stage, owner, close date, risk flags, last activity — without navigating to a full detail page.
- As a rep, I want to see next steps and recent stage changes on a deal without leaving the pipeline view.

## Outcomes

1. Deal names throughout the app are interactive — hover shows a popup card
2. Card shows: deal name, amount, stage, owner (resolved name), close date, days in stage, risk flags (from TASK-004)
3. Card includes recent stage history (last 3 changes)
4. "View in HubSpot" link opens the deal in HubSpot
5. Works in pipeline, dashboard, rev-rec, and team pages

## Success Metrics

- [ ] Popup renders in <200ms (data pre-fetched or cached)
- [ ] Shows at least 6 key deal fields
- [ ] Risk flags visible if applicable
- [ ] Works consistently across all pages with deal references
- [ ] Doesn't block interaction with underlying page (dismissable)

## Implementation Plan

1. Build a `DealCard` popover component
2. Create a `useDealPreview(dealId)` hook that fetches/caches deal data
3. Wrap deal name references in an `InteractiveDealName` component
4. Gradually adopt across pages (pipeline first, then dashboard, rev-rec, team)

## Files to Change

- `src/components/pipeline/deal-card.tsx` — NEW: popover card component
- `src/hooks/use-deal-preview.ts` — NEW: deal data fetching hook
- `src/components/pipeline/interactive-deal-name.tsx` — NEW: wrapper component
- `src/app/(dashboard)/pipeline/page.tsx` — adopt interactive deal names
- Other pages — gradual adoption

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-17 (Kluster + Clari pattern).

## Takeaways

_To be filled during execution_
