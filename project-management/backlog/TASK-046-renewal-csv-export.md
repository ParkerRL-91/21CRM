---
title: "Renewal analytics CSV export"
id: TASK-046
project: PRJ-002
status: done
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #export, #reporting]
---

# TASK-046: Renewal analytics CSV export

## User Stories

- As a **Finance user**, I want to export renewal pipeline data to CSV so that I can analyze it in Excel or share it with stakeholders who don't have 21CRM access.

## Outcomes

CSV export capability on the renewal pipeline report page (TASK-040) that exports all renewal data with full detail.

## Success Metrics

- [ ] "Export CSV" button on renewal report page
- [ ] Export includes: account, contract number, contract value, start date, end date, renewal status, proposed value, pricing method, owner, risk level, risk factors
- [ ] Export respects current filters (date range, owner, status)
- [ ] Filename format: `renewal_pipeline_{org}_{date}.csv`
- [ ] Handles large datasets (stream to file, not buffer in memory)
- [ ] UTF-8 encoding with BOM for Excel compatibility

## Implementation Plan

Server-side CSV generation via API route:
```
GET /api/renewals/export?period=Q2-2026&format=csv
```

Use streaming response to handle large datasets efficiently.

## Files to Change

- `src/app/api/renewals/export/route.ts` — **NEW**: CSV export endpoint
- `src/lib/renewals/csv-formatter.ts` — **NEW**: CSV formatting logic
- `src/app/(dashboard)/renewals/page.tsx` — **MODIFY**: Add export button

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
