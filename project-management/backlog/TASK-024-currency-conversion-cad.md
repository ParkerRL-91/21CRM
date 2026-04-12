---
title: "Currency Conversion: Normalize All Values to CAD Using Deal Exchange Rate"
id: TASK-024
project: PRJ-001
status: done
priority: P1
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #analytics, #data-model]
---

# TASK-024: Currency Conversion to CAD

## User Stories

- As a finance user, I want all revenue numbers (pipeline, rev-rec, ARR, forecasts) displayed in Canadian dollars since that's our home currency.
- As an ops user, I want the system to use the exchange rate field on each deal to convert foreign-currency deals to CAD automatically.

## Outcomes

1. All monetary values across the app are normalized to CAD
2. Deals with a currency exchange rate field use that rate for conversion
3. Dashboard stats, rev-rec schedules, pipeline values, and forecasts all show CAD
4. The home currency (CAD) is configurable in org settings
5. Original deal currency and exchange rate are preserved for audit

## Success Metrics

- [ ] Identify which HubSpot deal field contains the exchange rate (e.g., `hs_exchange_rate`, `deal_currency_code`, `hs_closed_amount_in_home_currency`)
- [ ] All pipeline value computations apply the exchange rate
- [ ] Rev-rec schedules store amounts in CAD (converted at generation time)
- [ ] Team page pipeline-by-rep values are in CAD
- [ ] Forecast amounts are in CAD

## Implementation Plan

1. Add exchange rate fields to sync: `hs_exchange_rate`, `deal_currency_code`, `hs_closed_amount_in_home_currency` (some may already be synced)
2. Create a `convertToCad(amount, exchangeRate)` utility
3. Apply conversion in:
   - `/api/rev-rec/generate` — convert line item/deal amounts before computing schedules
   - `/api/crm/query` — when aggregating amounts, apply exchange rate
   - `/api/subscriptions/arr` — convert before annualizing
4. Display currency as "CAD" with proper formatting (`$1,234 CAD`)
5. Store home currency preference in `organizations.orgConfig`

## Files to Change

- `src/lib/currency.ts` — NEW: conversion utilities
- `src/lib/sync/engine.ts` — verify exchange rate fields in sync list
- `src/app/api/rev-rec/generate/route.ts` — apply conversion
- `src/app/api/crm/query/route.ts` — apply conversion in aggregations
- `src/app/api/subscriptions/arr/route.ts` — apply conversion
- Various page files — format as CAD

## Status Log

- 2026-03-22: Created. Business operates in CAD, HubSpot deals have exchange rate fields.

## Takeaways

_To be filled during execution_
