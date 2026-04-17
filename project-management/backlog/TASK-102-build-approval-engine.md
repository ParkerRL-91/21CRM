---
title: "Build approval engine with rules, chains, and routing"
id: TASK-102
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #approvals, #critical]
---

# TASK-102: Build approval engine with rules, chains, and routing

## User Stories

- As a Sales Manager, I want approval rules based on discount thresholds so that large discounts require management review before quotes go to customers.
- As a Sales Rep, I want to preview the approval path before submitting so that I know who needs to approve and can set expectations.
- As an Approver, I want to approve or reject quotes with comments so that reps understand my decision and can iterate.

## Why This Is P0

Without approval workflows, reps can give away unlimited discounts with no guardrail. The research warns: "Ignoring approval workflows at launch — without automated discount approval thresholds, reps will give away margin."

## Outcomes

Two new custom objects (ApprovalRule, ApprovalRequest) created by setup service. CpqApprovalService evaluates rules against quote values, creates approval request chains, and routes to designated approvers. Controller endpoints for submit, preview, approve, reject.

## Success Metrics

- [ ] ApprovalRule object: name, conditions (RAW_JSON), approverRole (TEXT), stepNumber (NUMBER), isActive (BOOLEAN)
- [ ] ApprovalRequest object: status (SELECT: pending/approved/rejected/skipped), stepNumber, decidedAt (DATE_TIME), comments (RICH_TEXT)
- [ ] Relations: ApprovalRequest → Quote, ApprovalRule → ApprovalRequest
- [ ] CpqApprovalService with: evaluateRules(quoteId), submitForApproval(quoteId), approve(requestId, comments), reject(requestId, comments)
- [ ] Preview endpoint shows which rules trigger and who approves
- [ ] Smart re-approval: unchanged conditions auto-skip on resubmit
- [ ] Minimum 2-level chain: discount >15% → Manager, >25% → VP
- [ ] Tests for rule evaluation, chain routing, smart skip logic

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` — add 2 objects
- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-approval.service.ts` — NEW
- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-approval.service.spec.ts` — NEW
- `twenty/packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add approval endpoints
- `twenty/packages/twenty-server/src/modules/cpq/cpq.module.ts` — register service
