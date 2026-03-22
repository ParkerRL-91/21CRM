---
title: Database Schema Map
tags: [#data-model, #architecture]
created: 2026-03-22
updated: 2026-03-22
---

# Database Schema Map

## Core Tables

| Table | Purpose | Schema File |
|-------|---------|-------------|
| `organizations` | Tenant config, encrypted tokens | `schema.ts` |
| `users` | App users per org | `schema.ts` |
| `invitations` | Pending team invites | `schema.ts` |
| `crm_objects` | All synced HubSpot data (JSONB) | `schema.ts` |
| `app_config` | Key-value config (pipelines, owners) | `schema.ts` |
| `sync_cursors` | Sync state per object type | `schema.ts` |

## History Tables

| Table | Purpose |
|-------|---------|
| `deal_stage_history` | Deal stage transitions with timestamps |
| `lifecycle_history` | Contact lifecycle stage changes |
| `property_change_log` | Amount/closedate changes on deals |

## Feature Tables

| Table | Purpose | Schema File |
|-------|---------|-------------|
| `goals` | Revenue/pipeline/activity goals | `schema.ts` |
| `recipes` | Saved data queries (config as JSONB) | `schema.ts` |
| `recipe_results` | Cached recipe execution results | `schema.ts` |
| `dashboards` | Dashboard widget configs | `schema.ts` |
| `alerts` | Alert rules and channels | `schema.ts` |
| `reports` | Custom report definitions | `reports-schema.ts` |
| `report_snapshots` | Point-in-time report data | `reports-schema.ts` |
| `rev_rec_schedules` | Line-item recognition schedules | `rev-rec-schema.ts` |
| `forecast_snapshots` | Historical forecast snapshots | `schema.ts` |

## Forecast Tables (10 tables)

All prefixed `forecast_*`, defined in `forecast-schema.ts`:
- `forecast_segments` — market segments
- `forecast_roles` — team roles for staffing
- `forecast_field_mappings` — CRM field → model field
- `forecast_scenarios` — named scenarios
- `forecast_assumptions` — per-segment assumptions
- `forecast_performance_targets` — quota/target data
- `forecast_staffing_plans` — hiring plans
- `forecast_outputs` — computed forecast results
- `forecast_scenario_snapshots` — point-in-time snapshots

## Key Relationships

```
organizations ─┬─ users
               ├─ crm_objects
               ├─ sync_cursors
               ├─ goals
               ├─ recipes ─── recipe_results
               ├─ dashboards
               ├─ alerts
               ├─ reports ─── report_snapshots
               ├─ rev_rec_schedules
               ├─ deal_stage_history
               ├─ lifecycle_history
               ├─ property_change_log
               └─ forecast_scenarios ─┬─ forecast_assumptions
                                      ├─ forecast_performance_targets
                                      ├─ forecast_staffing_plans
                                      ├─ forecast_outputs
                                      └─ forecast_scenario_snapshots
```

See [[crm-objects-table]] for the core CRM data model.
