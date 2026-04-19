# TASK-114 — Auto-Sync Engine (auto-sync.ts)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Implement the `auto-sync.ts` engine that orchestrates scheduled and event-triggered synchronization of CPQ data across connected CRM providers (Salesforce, HubSpot).

## Acceptance Criteria
- `AutoSyncEngine` schedules sync jobs per workspace with configurable interval (min 15 min)
- Conflict resolution: Twenty wins on CPQ-owned fields; source CRM wins on contact/account fields
- Sync log records: last sync time, records synced, errors, duration
- Manual trigger available via `POST /cpq/sync/trigger`
- Dead-letter queue for failed records with retry policy (3 attempts, exponential backoff)
- Unit tested with mock connector and simulated conflict scenarios

## Implementation Notes
- File: `packages/twenty-server/src/modules/cpq/sync/auto-sync.ts`
- Orchestrated via BullMQ repeatable jobs
- Sync status exposed in `GET /cpq/status` response
