---
title: "Contract expiration dashboard widget"
id: TASK-045
project: PRJ-002
status: done
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #dashboard, #widget]
---

# TASK-045: Contract expiration dashboard widget

## User Stories

- As a **Sales Manager**, I want a dashboard widget showing upcoming contract expirations so that I have visibility into renewal activity at a glance.

## Outcomes

A configurable dashboard widget that shows contracts expiring in the next 30/60/90 days with value, status, and renewal progress. Can be added to any dashboard.

## Success Metrics

- [ ] Widget available in dashboard widget selector
- [ ] Shows contracts expiring within configurable window (default: 90 days)
- [ ] Each row: account name, contract value, expiration date, renewal status
- [ ] Summary: total count, total value at risk
- [ ] Color-coded by urgency (red/amber/green)
- [ ] Click-through to contract detail page
- [ ] Configurable: time window, max rows, show/hide columns

## Implementation Plan

Leverage the existing dashboard widget infrastructure. Create a new widget type `contract_expiration` that queries contracts expiring within the configured window.

Widget config stored in `dashboards` table JSONB config:
```json
{
  "type": "contract_expiration",
  "title": "Expiring Contracts",
  "config": {
    "windowDays": 90,
    "maxRows": 10,
    "showRenewalStatus": true
  }
}
```

## Files to Change

- `src/components/dashboards/widgets/contract-expiration-widget.tsx` — **NEW**
- `src/app/api/contracts/expiring/route.ts` — **NEW**: Expiring contracts endpoint
- `src/components/dashboards/widget-selector.tsx` — **MODIFY**: Add new widget type

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
