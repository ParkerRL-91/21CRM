---
title: "Account subscriptions view (ARR/MRR per account)"
id: TASK-078
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #subscriptions, #ui]
---

# TASK-078: Account subscriptions view

## User Stories
- As a CS manager, I want to view all active subscriptions for an account showing product, quantity, pricing, and renewal date.

## Outcomes
Account detail page subscription tab showing: product name, quantity, unit price, annual value, start/end date, status, parent contract. Total ARR for account.

## Success Metrics
- [ ] Subscriptions tab on account detail page
- [ ] Columns: product, qty, unit price, annual value, start, end, status, contract link
- [ ] Filter by status
- [ ] Total ARR calculated and displayed
- [ ] Loading, error, empty states

## Files to Change
- `src/components/subscriptions/account-subscriptions-list.tsx` — NEW
- `src/app/(dashboard)/accounts/[hubspotId]/page.tsx` — MODIFY: Add subscriptions tab
