---
title: Data Flow
tags: [#architecture, #data-model]
created: 2026-03-22
updated: 2026-03-22
---

# Data Flow

## Sync → Store → Query → Display

```
HubSpot API
  │
  ├─ getObjects() ─── properties ──→ crm_objects (JSONB)
  ├─ getOwners() ──── owner list ──→ app_config["hubspot_owners"]
  ├─ getPipelines() ─ stage map ───→ app_config["hubspot_pipelines"]
  └─ batchGetAssociations() ───────→ used on-demand (rev-rec generation)
  │
  ▼
Local PostgreSQL
  │
  ├─ crm_objects ─── raw CRM data (deals, contacts, companies, etc.)
  ├─ deal_stage_history ─── change tracking (auto-populated on sync)
  ├─ lifecycle_history ──── contact lifecycle changes
  ├─ property_change_log ── amount/closedate changes
  ├─ rev_rec_schedules ──── computed recognition schedules
  ├─ forecast_* tables ──── scenario planner data
  ├─ goals ───────────────── goal targets and tracking
  └─ recipes / dashboards ─ saved configs
  │
  ▼
API Routes (/api/crm/query, /api/rev-rec/*, etc.)
  │
  ▼
React Pages (client components with hooks)
```

## Key Patterns

1. **JSONB properties**: All CRM data lives in `crm_objects.properties` as JSONB. Queries extract fields with `properties->>'field_name'`.
2. **Change detection**: The sync engine compares old vs new properties and writes to history tables automatically.
3. **Config-driven field selection**: Users can override which HubSpot fields to sync per object type via `organizations.syncConfig.propertyOverrides`.
4. **On-demand computation**: Rev-rec schedules are generated on button click, not during sync. This keeps syncs fast.

See [[crm-objects-table]] for the core data model.
See [[hubspot-sync-engine]] for sync implementation.
