---
title: Forecast Scenario Planner
tags: [#feature, #forecast]
created: 2026-03-22
updated: 2026-03-22
---

# Forecast Scenario Planner

Replaces an Excel-based forecast model with a web app integrated with HubSpot CRM data.

## Architecture

- **Engines** (`src/lib/forecast/engines/`): Contracted, Pipeline, Forecasted, Cash, ARR, Orchestrator
- **Types** (`src/lib/forecast/types.ts`): All TypeScript interfaces
- **Resolver** (`src/lib/forecast/resolver.ts`): Pulls CRM data and resolves field mappings
- **Store** (`src/lib/forecast/scenario-store.ts`): CRUD for scenarios
- **Schema** (`src/lib/db/forecast-schema.ts`): 10 tables prefixed `forecast_*`

## 4-Layer Revenue Model

1. **Contracted**: Closed-won deals — certain revenue
2. **Pipeline**: Open deals × probability × expected close timing
3. **Forecasted**: Statistical projection from historical patterns
4. **Cash**: When revenue actually arrives (billing lag, payment terms)

## Key Features

- Multi-scenario support (create, clone, compare side-by-side)
- Configurable field mapping (any CRM field → model field)
- Per-market assumptions (win rate, deal size, ARR, NRR, time-to-close)
- Staffing planner with hire ramp (0% → 50% → 100% over 3 months)
- Tab-based UI: Summary, Assumptions, Staffing, Cash, Compare, Field Mapping

## API Routes

All under `/api/forecast/`:
- `scenarios/` — CRUD for scenarios
- `scenarios/[id]/compute` — run the model
- `scenarios/[id]/assumptions` — per-market assumptions
- `scenarios/[id]/staffing` — staffing plans
- `scenarios/compare` — side-by-side comparison
- `field-mappings/` — CRM field → model field mapping
- `segments/` — market segments
- `roles/` — team roles for staffing

See [[system-overview]] for how this fits into the overall architecture.
