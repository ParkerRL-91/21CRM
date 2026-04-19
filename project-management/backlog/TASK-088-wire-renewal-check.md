---
title: "Wire runRenewalCheck to workspace datasource"
id: TASK-088
project: PRJ-004
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #renewals, #orm, #cron]
---

# TASK-088: Wire runRenewalCheck to workspace datasource

## User Stories

- As a **CS manager**, I want the system to automatically find contracts approaching expiration and create renewal opportunities so that I never miss a renewal.
- As an **Admin**, I want to see how many contracts were scanned and how many renewals were created after each job run so that I can verify automation is working.

## Outcomes

`CpqRenewalService.runRenewalCheck()` queries the workspace database for active contracts within the configured lead time, creates renewal records with proposed pricing via the pricing engine, and returns a detailed result with counts and any errors.

## Success Metrics

- [ ] Queries `contract` table in workspace schema for active contracts near expiration
- [ ] Uses advisory lock (`pg_try_advisory_lock`) to prevent concurrent runs
- [ ] For each eligible contract:
  - Fetches active subscriptions
  - Calculates renewal pricing via `generateRenewalQuote()`
  - Creates a renewal-type quote record
  - Creates a renewal-type opportunity record (linked to company)
- [ ] Each contract processed in its own transaction (one failure doesn't stop the batch)
- [ ] Returns: contractsScanned, renewalsCreated, errors, status
- [ ] Releases advisory lock in finally block
- [ ] Tests with mocked datasource and pricing service

## Implementation Plan

1. Inject `WorkspaceDatasourceService` into `CpqRenewalService`

2. Replace the current scaffolding in `runRenewalCheck()` with:
   ```sql
   -- Find eligible contracts
   SELECT c.* FROM contract c
   WHERE c.status = 'active'
   AND c."endDate" <= NOW() + INTERVAL '${leadDays} days'
   AND NOT EXISTS (
     SELECT 1 FROM quote q
     WHERE q."contractId" = c.id
     AND q.type = 'renewal'
     AND q.status IN ('draft', 'in_review', 'approved', 'presented')
   )
   ```

3. For each contract:
   ```sql
   -- Get active subscriptions
   SELECT * FROM "contractSubscription"
   WHERE "contractId" = $1 AND status = 'active' AND "chargeType" = 'recurring'
   ```

4. Generate renewal quote via `this.generateRenewalQuote(subscriptions, ...)`

5. Insert renewal quote and opportunity records

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-renewal.service.ts` — MODIFIED: replaced ObjectMetadataService with @InjectDataSource(), implemented real SQL queries + advisory locking, per-contract transactions
- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-renewal.service.spec.ts` — MODIFIED: added 4 runRenewalCheck tests with mocked dataSource and queryRunner

## Status Log
- 2026-04-12: Created
- 2026-04-12: Completed — full implementation with advisory locking, per-contract transactions, and renewal quote/opportunity creation

## Takeaways
- Advisory lock ID derived from workspace UUID using a deterministic 32-bit hash (Math.imul)
- Each contract is processed in its own queryRunner transaction — one failure doesn't block the batch
- Advisory lock is released in the finally block even on outer failure
- Removed ObjectMetadataService dependency (was only checking if contract object exists — now queries workspace schema directly)
