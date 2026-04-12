---
title: "Renewal kanban board"
id: TASK-041
project: PRJ-002
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #ui, #kanban]
---

# TASK-041: Renewal kanban board

## User Stories

- As a **Sales Manager**, I want to view renewals in a dedicated kanban board by stage so that I can visually track renewal progress and identify bottlenecks.

## Outcomes

A kanban board on the renewal report page that shows renewal opportunities organized by pipeline stage, with drag-and-drop stage transitions and visual indicators for value, risk, and timing.

## Success Metrics

- [ ] Kanban board tab on the renewals page
- [ ] Columns represent pipeline stages (from configured renewal pipeline)
- [ ] Cards show: account name, contract value, expiration date, owner
- [ ] Cards color-coded by urgency: red (<30 days), amber (<60 days), green (>60 days)
- [ ] At-risk renewals have a warning indicator on the card
- [ ] Column headers show: count and total value of cards in that stage
- [ ] Drag-and-drop cards between stages (updates deal stage via API)
- [ ] Card click navigates to contract detail page
- [ ] Filter by owner, date range, risk level
- [ ] Responsive layout that works on tablet and desktop

## Implementation Plan

### Kanban Data Source

The kanban board shows renewal deals (from `crm_objects` where `deal_type = 'Renewal'`), grouped by their `dealstage` property. This reuses the same data as the pipeline kanban but filtered to renewals only.

### Card Component

```
┌────────────────────┐
│ 🟠 Acme Corp        │
│ $120,000 · 45 days │
│ Jane Smith          │
│ ⚠️ At Risk           │
└────────────────────┘
```

Card data:
- Account name (from deal properties or contract link)
- Renewal value
- Days until contract expiration
- Owner name
- Risk indicator (from TASK-042, if implemented)

### Stage Columns

Pull stages from the renewal pipeline configuration:
1. Check `renewal_config.renewal_pipeline_id`
2. Look up pipeline stages from `app_config['hubspot_pipelines']`
3. Render columns in stage order

If no specific renewal pipeline is configured, use the default pipeline stages.

### Drag-and-Drop

Use the same kanban implementation pattern as the existing pipeline page. On drop:
1. Update `crm_objects.properties.dealstage` for the deal
2. Optionally push stage change to HubSpot (if sync configured)
3. Optimistic UI update

### Swim Lanes (Optional Enhancement)

Consider adding optional swim lanes by:
- Owner (horizontal grouping by CS manager)
- Risk level (High / Medium / Low)
- Expiration month

## Files to Change

- `src/components/renewals/renewal-kanban.tsx` — **NEW**: Renewal-specific kanban board
- `src/components/renewals/renewal-kanban-card.tsx` — **NEW**: Kanban card component
- `src/app/(dashboard)/renewals/page.tsx` — **MODIFY**: Add kanban tab
- `src/hooks/use-renewal-kanban.ts` — **NEW**: Kanban data fetching

## Status Log

- 2026-04-12: Created — implements US-8.3 kanban requirement

## Takeaways

_To be filled during implementation._
