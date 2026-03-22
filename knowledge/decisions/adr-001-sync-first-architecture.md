---
title: "ADR-001: Sync-First Architecture"
tags: [#decision, #architecture]
created: 2026-03-22
updated: 2026-03-22
status: accepted
---

# ADR-001: Sync-First Architecture

## Context

We need to query CRM data for dashboards, reports, and analytics. Two options:
1. Query HubSpot API directly on every page load
2. Sync data to a local database and query locally

## Decision

**Sync-first.** All CRM data is synced to `crm_objects` and queried locally.

## Rationale

- HubSpot rate limits (100 req/10s) make real-time queries impractical for dashboards
- Local queries are fast and don't depend on HubSpot uptime
- Enables change detection (stage history, property changes)
- Enables complex joins and aggregations not possible via HubSpot API
- JSONB properties column provides schema flexibility without migrations per field

## Consequences

- Data is as fresh as the last sync (not real-time)
- Need to handle token refresh on every sync
- Need incremental sync to avoid re-fetching everything
- Associations not available locally unless explicitly synced
