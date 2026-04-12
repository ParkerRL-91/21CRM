---
title: "Revenue Leakage Detection"
id: TASK-018
project: PRJ-001
status: done
priority: P3
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #rev-rec, #analytics]
---

# TASK-018: Revenue Leakage Detection

## User Stories

- As a finance leader, I want the system to automatically flag revenue that may have been missed — closed-won deals with no line items, line items with $0 amounts, deals closed months ago with no recognition schedule.
- As an ops user, I want alerts when rev-rec schedules don't match deal totals (sum of line item amounts ≠ deal amount).

## Outcomes

1. Rev-rec page shows a "Leakage Alerts" section listing potential issues:
   - Closed-won deals with no rev-rec schedule generated
   - Deals where sum of line item amounts ≠ deal amount (discrepancy)
   - Line items with $0 or negative amounts
   - Schedules that ended months ago but deal is still "active"
   - Deals with amount but no line items (possible missing data)
2. Each alert shows the deal name, discrepancy amount, and a link to investigate
3. Leakage total displayed as a stat card: "Potential Leakage: $X"

## Success Metrics

- [ ] At least 3 leakage detection rules implemented
- [ ] Leakage alerts computed from local data (no additional API calls)
- [ ] Each alert links to the specific deal/schedule for investigation
- [ ] Total potential leakage amount displayed prominently

## Implementation Plan

1. Create `/api/rev-rec/leakage` endpoint that runs detection queries
2. Compare `crm_objects` closed-won deals vs `rev_rec_schedules` to find gaps
3. Compare deal amounts vs sum of associated schedule amounts
4. Add leakage section to rev-rec page

## Files to Change

- `src/app/api/rev-rec/leakage/route.ts` — NEW: leakage detection
- `src/app/(dashboard)/rev-rec/page.tsx` — add leakage alerts section

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-18 (HubiFi core feature).

## Takeaways

_To be filled during execution_
