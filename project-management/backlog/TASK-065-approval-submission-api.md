---
title: "Approval submission & routing API"
id: TASK-065
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #approvals, #api]
---

# TASK-065: Approval submission & routing API

## User Stories
- As a Sales Rep, I want to submit a quote for approval and see the approval path before submitting.
- As a Sales Manager, I want to approve or reject quotes with comments.

## Outcomes
API for approval workflow: preview path, submit for approval, approve/reject with comments. Quote becomes read-only while in review. Notifications sent to approvers.

## Success Metrics
- [ ] `POST /api/quotes/[id]/preview-approval` — shows which rules triggered, who approves
- [ ] `POST /api/quotes/[id]/submit-approval` — changes status to in_review, creates requests
- [ ] `POST /api/approval-requests/[id]/approve` — advances to next step or approves
- [ ] `POST /api/approval-requests/[id]/reject` — returns to denied, requires comments
- [ ] Quote read-only while in_review
- [ ] Notification to approver on submission
- [ ] Approval history logged with timestamps

## Files to Change
- `src/app/api/quotes/[id]/preview-approval/route.ts` — NEW
- `src/app/api/quotes/[id]/submit-approval/route.ts` — NEW
- `src/app/api/approval-requests/[id]/route.ts` — NEW
- `src/lib/cpq/approval-routing.ts` — NEW
