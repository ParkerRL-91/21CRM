---
title: System Overview
tags: [#architecture, #overview]
created: 2026-03-22
updated: 2026-03-22
---

# System Overview

21CRM is a self-hosted RevOps platform built on **Next.js** (App Router) with **PostgreSQL** (via Drizzle ORM) and **HubSpot** as the primary CRM integration.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js (HubSpot OAuth + credentials) |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Custom components (bar, line, pie, funnel, kanban) |
| Testing | Vitest |
| CRM | HubSpot (OAuth, REST API v3/v4) |

## Architecture Pattern

```
Browser (React) → Next.js API Routes → PostgreSQL
                                      ↕
                               HubSpot API (sync)
```

- **Sync-first model**: CRM data is synced to a local `crm_objects` table (JSONB properties). All queries run against local data, never HubSpot directly.
- **Multi-tenant**: Organizations table with encrypted tokens. RLS planned but not yet implemented.
- **Config-driven**: Field mappings, pipeline labels, and sync properties are stored in `organizations.syncConfig` and `app_config` table.

## Module Map

| Module | Purpose | Key Files |
|--------|---------|-----------|
| Sync Engine | Pulls data from HubSpot → local DB | `src/lib/sync/engine.ts` |
| Pipeline | Deal pipeline inspection, kanban | `src/app/(dashboard)/pipeline/` |
| Forecast | Scenario-based revenue forecasting | `src/lib/forecast/`, `src/app/(dashboard)/forecast/` |
| Rev-Rec | Line-item revenue recognition schedules | `src/lib/rev-rec/`, `src/app/(dashboard)/rev-rec/` |
| Team | Rep scorecards, leaderboards | `src/app/(dashboard)/team/` |
| Recipes | Custom data queries (saved reports) | `src/lib/recipes/`, `src/app/(dashboard)/recipes/` |
| Dashboards | Configurable metric dashboards | `src/app/(dashboard)/dashboards/` |
| Subscriptions | Product-level subscription tracking | `src/app/(dashboard)/subscriptions/` |
| Settings | Sync config, field picker, integrations | `src/app/(dashboard)/settings/` |

See [[data-flow]] for how data moves through the system.
See [[hubspot-sync-engine]] for sync architecture details.
