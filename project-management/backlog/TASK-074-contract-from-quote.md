---
title: "Contract creation from accepted quote"
id: TASK-074
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #conversion]
---

# TASK-074: Contract creation from accepted quote

## User Stories
- As a Sales Rep, I want to convert an accepted quote into a contract so subscription terms are formally recorded.

## Outcomes
"Create Contract" action on accepted quotes. System creates Contract (from PRJ-002 schema) with subscriptions mapped from quote line items. Quote status changes to Contracted.

## Success Metrics
- [ ] `POST /api/quotes/[id]/create-contract` — available only on accepted quotes
- [ ] Contract record created with: account, start/end dates, total value, link to quote
- [ ] Each subscription line item → contract_subscription record
- [ ] One-time items recorded but not as recurring subscriptions
- [ ] Contract initializes as Active
- [ ] Quote status → Contracted
- [ ] Deal linked to contract
- [ ] Transaction: all records created atomically
- [ ] Tests for mapping logic

## Files to Change
- `src/app/api/quotes/[id]/create-contract/route.ts` — NEW
- `src/lib/cpq/quote-to-contract.ts` — NEW: Conversion logic
- `src/lib/cpq/quote-to-contract.test.ts` — NEW
