---
title: "Subscription state change audit log"
id: TASK-079
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #subscriptions, #audit]
---

# TASK-079: Subscription state change audit log

## User Stories
- As a Finance user, I want a subscription history timeline showing all state changes and linked quotes/contracts.

## Outcomes
Visual timeline of subscription state changes on contract detail page. Each entry shows: timestamp, from→to state, triggering event, linked quote/contract, user.

## Success Metrics
- [ ] Timeline component on contract detail page
- [ ] Each transition: date, state change, event type, actor
- [ ] Links to related quotes/contracts
- [ ] Chronological order

## Files to Change
- `src/components/subscriptions/subscription-timeline.tsx` — NEW
- `src/app/(dashboard)/contracts/[id]/page.tsx` — MODIFY: Add timeline
