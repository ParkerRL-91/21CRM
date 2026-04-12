---
title: "Quote status machine (presented/accepted/rejected)"
id: TASK-071
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #lifecycle]
---

# TASK-071: Quote status machine

## User Stories
- As a Sales Rep, I want to track quote delivery status and record customer acceptance/rejection.

## Outcomes
Complete quote status machine: draft → in_review → approved → presented → accepted → rejected → expired. Status transition validation, acceptance tracking (method, date, PO number), rejection tracking (reason, notes).

## Success Metrics
- [ ] Status transitions enforced in API
- [ ] `PUT /api/quotes/[id]/present` — mark as presented
- [ ] `PUT /api/quotes/[id]/accept` — record acceptance (method, date, PO#)
- [ ] `PUT /api/quotes/[id]/reject` — record rejection (reason picklist, notes)
- [ ] Accepted quotes become read-only
- [ ] Status history logged in quote_audit_log
- [ ] Tests for all valid/invalid transitions

## Files to Change
- `src/lib/cpq/quote-status.ts` — NEW: Transition validation
- `src/lib/cpq/quote-status.test.ts` — NEW
- `src/app/api/quotes/[id]/present/route.ts` — NEW
- `src/app/api/quotes/[id]/accept/route.ts` — NEW
- `src/app/api/quotes/[id]/reject/route.ts` — NEW
