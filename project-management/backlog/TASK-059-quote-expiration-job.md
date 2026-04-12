---
title: "Quote expiration management (daily job)"
id: TASK-059
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #automation]
---

# TASK-059: Quote expiration management

## User Stories
- As a Sales Rep, I want quotes to auto-expire after the expiration date so stale quotes are managed automatically.

## Outcomes
Daily cron job marks quotes past expiration_date as "expired". Warning banner on quotes within 7 days. Expired quotes cannot be presented/accepted without updating expiration date.

## Success Metrics
- [ ] Daily job sets status → expired for quotes past expiration_date
- [ ] Default expiration: 30 days from creation
- [ ] Warning banner within 7 days of expiration
- [ ] Expired quotes blocked from presentation/acceptance
- [ ] Expiration date updatable to return to draft

## Files to Change
- `src/lib/cpq/quote-expiration-job.ts` — NEW
- `src/app/api/quotes/run-expiration/route.ts` — NEW
