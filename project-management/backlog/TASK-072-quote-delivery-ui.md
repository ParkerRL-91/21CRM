---
title: "Quote delivery UI (email action, status tracking)"
id: TASK-072
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #ui]
---

# TASK-072: Quote delivery UI

## User Stories
- As a Sales Rep, I want to send a quote PDF to the customer and track delivery status from the CRM.

## Outcomes
Quote detail page actions for delivery: "Send Quote" opens pre-populated email form with PDF attached. Sending changes status to Presented. Activity timeline logs all delivery events.

## Success Metrics
- [ ] "Send Quote" action on approved quotes
- [ ] Pre-populated email with recipient (primary contact), subject, body
- [ ] PDF auto-attached
- [ ] Sending changes status to Presented
- [ ] Delivery logged in activity timeline
- [ ] "Mark Accepted" / "Mark Rejected" actions on presented quotes
- [ ] Acceptance records method (verbal/email/PO), date, optional PO number

## Files to Change
- `src/components/cpq/quote-delivery-actions.tsx` — NEW
- `src/components/cpq/acceptance-form.tsx` — NEW
- `src/components/cpq/rejection-form.tsx` — NEW
- `src/app/(dashboard)/quotes/[id]/page.tsx` — MODIFY: Add delivery section
