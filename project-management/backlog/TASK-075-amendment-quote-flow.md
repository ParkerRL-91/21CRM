---
title: "Amendment quote flow (mid-term changes)"
id: TASK-075
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #amendments, #quotes]
---

# TASK-075: Amendment quote flow

## User Stories
- As a CS manager, I want to create an amendment quote on an active contract so I can process mid-term changes (add seats, add modules, upgrade tier).

## Outcomes
"Amend Contract" creates a new quote with type=amendment, pre-loaded with current subscriptions. Delta pricing (only changes priced). New lines co-terminated to contract end date. After acceptance, contract subscriptions updated.

## Success Metrics
- [ ] `POST /api/contracts/[id]/create-amendment` — creates amendment quote
- [ ] Amendment quote pre-loads current subscription lines as read-only reference
- [ ] New/changed lines editable; total reflects delta only
- [ ] New subscriptions co-terminated to existing contract end date with proration
- [ ] After amendment accepted + contracted: contract subscriptions updated (not new contract)
- [ ] Amendment recorded in contract_amendments table
- [ ] Tests for co-termination, delta pricing, subscription update

## Files to Change
- `src/app/api/contracts/[id]/create-amendment/route.ts` — NEW
- `src/lib/cpq/amendment-flow.ts` — NEW
- `src/lib/cpq/amendment-flow.test.ts` — NEW
