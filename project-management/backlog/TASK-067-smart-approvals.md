---
title: "Smart approvals (skip unchanged steps on resubmit)"
id: TASK-067
project: PRJ-003
status: ready
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #approvals]
---

# TASK-067: Smart approvals

## User Stories
- As a Sales Rep, I want previously-passed approval steps preserved when I resubmit so unchanged conditions don't require re-approval.

## Outcomes
On resubmission, engine re-evaluates rules. If a rule's conditions are unchanged from prior approval, that step auto-skips. Only changed conditions require new approval.

## Success Metrics
- [ ] On resubmit, compare current quote values with values at last approval
- [ ] Auto-skip steps where conditions haven't changed
- [ ] Approval history shows skipped steps with "auto-approved (unchanged)" note
- [ ] Tests for skip logic with various change scenarios

## Files to Change
- `src/lib/cpq/smart-approval.ts` — NEW
- `src/lib/cpq/smart-approval.test.ts` — NEW
- `src/lib/cpq/approval-routing.ts` — MODIFY: Wire in smart logic
