---
title: "Contract detail page with full context"
id: TASK-031
project: PRJ-002
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #ui, #ux]
---

# TASK-031: Contract detail page with full context

## User Stories

- As a **Customer Success manager**, I want to click a contract and see full details: all subscriptions, amendment history, original quote link, and renewal status so that I have complete context for managing the account.

## Outcomes

A comprehensive contract detail page that serves as the single source of truth for a contract's lifecycle — showing all subscriptions, every amendment, the original deal/quote, current renewal status, and key financial metrics.

## Success Metrics

- [ ] Contract header: name, number, status badge, account name (linked), owner
- [ ] Key dates section: start date, end date, days remaining, term length
- [ ] Financial summary: total value, ARR, MRR, currency
- [ ] Subscriptions table: product name, quantity, unit price, annual value, status, billing frequency
- [ ] Amendment history timeline: chronological list of all amendments with type, description, delta, date
- [ ] Renewal status section: current renewal state, linked renewal opportunity, next renewal date
- [ ] Original deal link: clickable link to originating deal in pipeline
- [ ] Action buttons: Edit Contract, Add Subscription, Amend Contract, Create Renewal (manual)
- [ ] Status transitions: buttons for valid state changes (e.g., Activate, Cancel)
- [ ] Responsive layout with tabs or sections

## Implementation Plan

### Page Layout

```
┌─────────────────────────────────────────────────┐
│ ← Back to Account                                │
│                                                   │
│ CON-001-0042: Acme Corp Enterprise License       │
│ Status: [Active]  Owner: Jane Smith              │
│                                                   │
│ ┌─────────┬─────────┬──────────┬───────────┐     │
│ │Start    │End      │Days Left │Total Value│     │
│ │Jan 1 26 │Dec 31 26│264       │$120,000   │     │
│ └─────────┴─────────┴──────────┴───────────┘     │
│                                                   │
│ [Subscriptions] [Amendments] [Renewals] [Details] │
│                                                   │
│ ┌───────────────────────────────────────────┐     │
│ │ Subscriptions (3 active)                   │     │
│ │                                            │     │
│ │ Product        Qty  Price   Annual  Status│     │
│ │ Platform Pro   1    $60K    $60K    Active│     │
│ │ Analytics      5    $6K     $30K    Active│     │
│ │ API Access     1    $30K    $30K    Active│     │
│ │                                            │     │
│ │ Total ARR: $120,000                        │     │
│ │ [+ Add Subscription]                       │     │
│ └───────────────────────────────────────────┘     │
│                                                   │
│ ┌───────────────────────────────────────────┐     │
│ │ Amendment History                          │     │
│ │                                            │     │
│ │ #3 · Apr 1, 2026 · Add Subscription       │     │
│ │    Added API Access (1 × $30,000)          │     │
│ │    Delta: +$30,000  By: John Doe           │     │
│ │                                            │     │
│ │ #2 · Mar 15, 2026 · Quantity Change        │     │
│ │    Analytics: 3 → 5 seats                  │     │
│ │    Delta: +$12,000  By: Jane Smith         │     │
│ │                                            │     │
│ │ #1 · Jan 1, 2026 · Initial Contract       │     │
│ │    3 subscriptions created                 │     │
│ │    Value: $78,000  By: System              │     │
│ └───────────────────────────────────────────┘     │
│                                                   │
│ ┌───────────────────────────────────────────┐     │
│ │ Renewal Status                             │     │
│ │                                            │     │
│ │ Next Renewal: Oct 3, 2026 (90 days before) │     │
│ │ Pricing: 5% uplift                         │     │
│ │ Renewal Opp: Not yet created              │     │
│ │                                            │     │
│ │ [Create Renewal Now]                       │     │
│ └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

### Data Fetching

Single API call to `GET /api/contracts/[id]` which returns:
- Contract record with all fields
- Nested subscriptions array
- Nested amendments array (ordered by amendment_number DESC)
- Nested renewals array
- Computed fields: days_remaining, total_arr, total_mrr, is_expiring_soon

### Subscription Actions

- **Add Subscription**: Opens a modal form → calls `POST /api/contracts/[id]/subscriptions`
- **Edit Subscription**: Inline edit or modal → calls `PUT /api/contracts/[id]/subscriptions/[subId]`
- **Cancel Subscription**: Confirm dialog → calls `DELETE /api/contracts/[id]/subscriptions/[subId]`

### Amendment Timeline

Render amendments as a vertical timeline with:
- Amendment number and date
- Type badge (color-coded by type)
- Description text
- Financial delta (+/- value)
- Who made the change

### Renewal Status Card

Shows:
- When the next renewal check will occur (contract end_date - renewal_lead_days)
- What pricing method will be used
- Current renewal status (if renewal already created)
- Link to renewal opportunity (if exists)
- Manual "Create Renewal Now" button for early renewals
- If renewal quote exists: link to renewal quote review/edit UI (TASK-036)

### Loading, Error, and Empty States

- **Loading**: Skeleton layout matching the page structure (header skeleton, metric card skeletons, table skeletons)
- **Error**: "Contract not found" or "Failed to load contract" with back button and retry
- **404**: "This contract doesn't exist or you don't have access" with navigation back to account

### Responsive Layout

- Desktop: Full layout as wireframed above (tabs side by side, full tables)
- Tablet: Tabs collapse to vertical accordion, tables scroll horizontally
- Mobile: Single-column layout, key metrics stacked, amendment timeline compacted

## Files to Change

- `src/app/(dashboard)/contracts/[id]/page.tsx` — **NEW**: Contract detail page
- `src/components/contracts/contract-header.tsx` — **NEW**: Header with status and key info
- `src/components/contracts/subscription-table.tsx` — **NEW**: Subscriptions table with actions
- `src/components/contracts/amendment-timeline.tsx` — **NEW**: Amendment history timeline
- `src/components/contracts/renewal-status-card.tsx` — **NEW**: Renewal status display
- `src/components/contracts/add-subscription-modal.tsx` — **NEW**: Add subscription form
- `src/hooks/use-contract-detail.ts` — **NEW**: Data fetching hook for single contract

## Status Log

- 2026-04-12: Created — implements US-8.1 contract detail requirements

## Takeaways

_To be filled during implementation._
