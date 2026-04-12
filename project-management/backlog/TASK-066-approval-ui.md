---
title: "Approval UI (submit, preview path, approve/reject)"
id: TASK-066
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #approvals, #ui]
---

# TASK-066: Approval UI

## User Stories
- As a Sales Rep, I want to preview the approval path and submit for approval from the quote page.
- As an Approver, I want to review and approve/reject quotes with full context.

## Outcomes
Approval components on quote detail page: preview path visualization, submit button, approval status tracker. Approver view with quote details and approve/reject actions.

## Success Metrics
- [ ] "Preview Approval" shows triggered rules and approvers
- [ ] "Submit for Approval" button with confirmation
- [ ] Approval status tracker showing progress through chain
- [ ] Approver notification links to quote with approve/reject buttons
- [ ] Rejection requires comments (text input)
- [ ] Approval history timeline on quote detail

## Files to Change
- `src/components/cpq/approval-preview.tsx` — NEW
- `src/components/cpq/approval-status-tracker.tsx` — NEW
- `src/components/cpq/approval-actions.tsx` — NEW
- `src/app/(dashboard)/quotes/[id]/page.tsx` — MODIFY: Add approval section
