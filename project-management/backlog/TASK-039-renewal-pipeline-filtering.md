---
title: "Renewal opportunity type and pipeline filtering (US-8.3)"
id: TASK-039
project: PRJ-002
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #pipeline, #analytics]
---

# TASK-039: Renewal opportunity type and pipeline filtering (US-8.3)

## User Stories

- As a **Sales Manager**, I want to track renewal pipeline separately from new business so that I can forecast recurring revenue accurately.
- As a **Pipeline analyst**, I want to filter pipeline views by deal type (New Business / Renewal / Expansion) so that I can analyze each segment independently.

## Outcomes

Extend the existing pipeline page and `/api/crm/query` endpoint to support deal type filtering. Renewal deals (created by TASK-035) are identifiable and filterable. All existing pipeline views (table, kanban, funnel, stats) respect the deal type filter.

## Success Metrics

- [ ] Deal type filter dropdown on pipeline page: "All", "New Business", "Renewal", "Expansion"
- [ ] Filter persists across pipeline view modes (table, kanban, funnel)
- [ ] `/api/crm/query` supports `deal_type` filter parameter
- [ ] Stat cards update to show filtered totals (e.g., "Renewal Pipeline: $X")
- [ ] Pipeline value breakdown by deal type visible in summary
- [ ] Deals created by renewal job automatically have `deal_type = 'Renewal'`
- [ ] Manual deals default to `deal_type = 'New Business'`
- [ ] Deal type displayed as a badge on deal cards in kanban view
- [ ] URL query params reflect filter state (deep-linkable)

## Implementation Plan

### Deal Type Property

The `deal_type` property is stored in `crm_objects.properties` for deals:

```json
{
  "deal_type": "Renewal",  // or "New Business", "Expansion"
  "dealname": "Renewal: Acme Corp - Annual 2027",
  "amount": "120000",
  ...
}
```

### Pipeline Page Filter Extension

Add a filter bar to the existing pipeline page:

```
Pipeline
────────────────────────────────────────────────
  Type: [All ▼]  Pipeline: [Sales Pipeline ▼]  Quarter: [Q2 2026 ▼]

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Total    │  │ Weighted │  │ New Biz  │  │ Renewal  │
  │ $2.4M   │  │ $1.2M    │  │ $1.8M    │  │ $600K    │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### API Query Extension

The existing `/api/crm/query` endpoint needs to support:

```
GET /api/crm/query?objectType=deals&filter_deal_type=Renewal&...
```

This filters on `properties->>'deal_type' = $1`.

### Kanban Deal Type Badge

On deal cards in the kanban view, add a small badge:
- **New**: blue badge
- **Renewal**: green badge  
- **Expansion**: purple badge

### Deep-Linkable URLs

```
/pipeline?type=Renewal                   — show only renewals
/pipeline?type=New+Business              — show only new business
/pipeline?type=Renewal&pipeline=default  — renewals in default pipeline
```

## Files to Change

- `src/app/(dashboard)/pipeline/page.tsx` — **MODIFY**: Add deal type filter
- `src/app/api/crm/query/route.ts` — **MODIFY**: Support deal_type filter parameter
- `src/components/pipeline/deal-type-filter.tsx` — **NEW**: Deal type filter dropdown
- `src/components/pipeline/deal-card.tsx` — **MODIFY**: Add deal type badge
- `src/components/pipeline/pipeline-stats.tsx` — **MODIFY**: Show per-type breakdown

## Status Log

- 2026-04-12: Created — implements US-8.3 filtering requirements

## Takeaways

_To be filled during implementation._
