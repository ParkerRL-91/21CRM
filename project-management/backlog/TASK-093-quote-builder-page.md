---
title: "Build quote builder page with line item editing"
id: TASK-093
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #frontend, #quotes, #ui]
---

# TASK-093: Build quote builder page with line item editing

## User Stories

- As a **Sales Rep**, I want to build a quote by adding products, adjusting quantities and discounts, and seeing real-time price calculations so that I can create accurate proposals quickly.
- As a **Sales Manager**, I want to review a quote's line items with the full pricing breakdown so that I can verify discounts before approval.

## Outcomes

A custom page within Twenty's frontend for building and editing quotes. Unlike Twenty's generic RecordShowPage (which shows fields in a form), this is a purpose-built CPQ interface with:
- Product selector (search + add)
- Line item table with inline quantity/discount editing
- Real-time pricing engine integration (calls `calculatePrice` mutation)
- Running totals (subtotal, discount, grand total)
- Status bar showing quote lifecycle position
- Action buttons (Save Draft, Submit for Approval, Generate PDF)

## Success Metrics

- [ ] Accessible from quote record detail page via "Edit Quote" action
- [ ] Product search/add using Twenty's object search
- [ ] Line item table: product, qty, list price, discount %, net price, total
- [ ] Pricing recalculates on quantity/discount change via `calculatePrice` mutation
- [ ] Running totals update in real-time
- [ ] Line items reorderable (drag-and-drop using dnd-kit)
- [ ] Quote status badge with valid next actions
- [ ] Save updates quote + line items via GraphQL mutations
- [ ] Uses Linaria for all styling, Jotai for UI state, Apollo for data
- [ ] Responsive layout, loading/error states

## Implementation Plan

1. Study Twenty's custom page patterns:
   - Read side panel pages for custom UI within Twenty's shell
   - Understand how to add a custom action to a record page

2. Build the quote builder as a side panel page or dedicated route
3. Use `useMutation(CALCULATE_PRICE)` for live pricing
4. Use `useQuery` to fetch quote + line items via auto-generated GraphQL
5. Use `useMutation` to save changes

## Dependencies

- TASK-086 (GraphQL resolvers)
- TASK-091 (Apollo Client migration)
- TASK-092 (Navigation routing)

## Files to Change

- `twenty/packages/twenty-front/src/modules/cpq/components/CpqQuoteBuilder.tsx` — NEW
- `twenty/packages/twenty-front/src/modules/cpq/components/CpqLineItemTable.tsx` — NEW
- `twenty/packages/twenty-front/src/modules/cpq/components/CpqQuoteSummary.tsx` — NEW
- `twenty/packages/twenty-front/src/modules/cpq/hooks/use-cpq-quote-builder.ts` — NEW
