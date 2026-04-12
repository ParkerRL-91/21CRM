---
title: "Subscription lifecycle state machine & API"
id: TASK-077
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #subscriptions, #lifecycle]
---

# TASK-077: Subscription lifecycle state machine & API

## User Stories
- As a Finance user, I want to track subscription lifecycle state changes so revenue recognition is accurate.

## Outcomes
Subscription state machine with enforced transitions and audit log. API for state queries and transitions.

## Success Metrics
- [ ] State transitions enforced: active→pending_amendment→active, active→pending_renewal→renewed, active→pending_cancellation→cancelled, active→expired
- [ ] `subscription_state_log` table: timestamp, from_state, to_state, triggering_event, user
- [ ] Subscription history timeline API
- [ ] All transitions logged automatically
- [ ] Tests for state machine

## Files to Change
- `src/lib/db/contract-schema.ts` — MODIFY: Add subscription_state_log table
- `src/lib/contracts/subscription-state-machine.ts` — NEW
- `src/lib/contracts/subscription-state-machine.test.ts` — NEW
- `src/app/api/subscriptions/route.ts` — NEW: List/query subscriptions
