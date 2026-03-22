---
title: Pipeline Analytics
tags: [#feature, #pipeline]
created: 2026-03-22
updated: 2026-03-22
---

# Pipeline Analytics

## Current State

The pipeline page (`src/app/(dashboard)/pipeline/page.tsx`) shows:
- Pipeline value by stage (bar chart)
- Deal kanban board
- Funnel chart (stage-to-stage conversion)
- Data table with deal details

## Data Source

All pipeline data comes from `crm_objects` where `object_type = 'deals'`. Key fields:
- `dealstage` — current stage
- `pipeline` — which pipeline (if multiple)
- `amount` — deal value
- `hubspot_owner_id` — deal owner
- `closedate` — expected close date
- `hs_forecast_category` — commit/best case/pipeline/omit

Pipeline and stage labels are resolved from `app_config["hubspot_pipelines"]`.

## Missing Features (Identified from Clari Analysis)

- **Deal risk flags**: Deals stale in stage, slipped close dates
- **Pipeline movement**: Weekly adds/losses/stage changes (data exists in `deal_stage_history`)
- **Drill-down**: Stat cards should be clickable → filter to underlying deals
- **Quarter progression**: Running closed-won total vs quota line
- **Bubble chart**: Deal prioritization visualization

See [[clari-analysis]] for competitive insights.
See [[crm-objects-table]] for data model.
