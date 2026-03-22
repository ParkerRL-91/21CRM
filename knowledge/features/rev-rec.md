---
title: Revenue Recognition
tags: [#feature, #rev-rec]
created: 2026-03-22
updated: 2026-03-22
---

# Revenue Recognition

## How It Works

Rev-rec operates at the **line item level**, not the deal level. Each line item on a closed-won deal gets its own recognition schedule based on its amount, start date, and term.

## Data Sources

- **Deals**: `crm_objects` where `hs_is_closed_won = 'true'` or `dealstage = 'closedwon'`
- **Line Items**: `crm_objects` with `object_type = 'line_items'`, linked to deals via HubSpot associations
- **Associations**: Fetched on-demand from HubSpot via `batchGetAssociations("deals", "line_items", dealIds)`

## Recognition Logic

For each line item:
1. **Amount**: from line item `amount` property
2. **Start date**: `hs_recurring_billing_start_date` → **fallback to deal `closedate`** if missing
3. **Duration**: `hs_term_in_months` → fallback to `hs_recurring_billing_period` (ISO 8601, e.g. `P12M` = 12 months) → fallback to 1 month (one-time)
4. **Method**: straight-line (also supports front-loaded, back-loaded)

Deals with **no line items** get a single schedule from the deal amount with 1-month duration.

## Product Types

- **Subscription**: Has `hs_recurring_billing_period` set (e.g. `P12M`, `P1M`). Revenue recognized over term.
- **One-time / Services**: No billing period. Revenue recognized immediately (1 month).

## Storage

Computed schedules stored in `rev_rec_schedules` table with monthly allocations in `monthly_schedule` JSONB column. Upserted on `(org_id, deal_hubspot_id, line_item_hubspot_id)`.

## API Routes

- `POST /api/rev-rec/generate` — computes and stores schedules
- `GET /api/rev-rec/schedules` — reads stored schedules with aggregate stats

## Engine

`src/lib/rev-rec/engine.ts` exports:
- `computeStraightLineSchedule(input)` — core computation
- `aggregateSchedules(schedules)` — monthly waterfall across multiple schedules
- `parseBillingPeriodMonths(period)` — ISO 8601 duration parser

See [[crm-objects-table]] for where line item data lives.
See [[hubspot-sync-engine]] for which line item fields are synced.
