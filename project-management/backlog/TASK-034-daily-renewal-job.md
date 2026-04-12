---
title: "Daily renewal check background job"
id: TASK-034
project: PRJ-002
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #automation, #cron]
---

# TASK-034: Daily renewal check background job

## User Stories

- As a **system**, I want a daily background job that identifies contracts approaching expiration and triggers renewal workflows so that no renewal opportunity is missed.
- As an **Admin**, I want to see the renewal job status and history so that I can verify the automation is working correctly.

## Outcomes

A scheduled background job (cron) that runs daily, scans all active contracts, identifies those within the configured renewal lead time, and creates renewal records. The job is idempotent (safe to re-run), atomic (won't create duplicate renewals), and observable (logs results).

## Success Metrics

- [ ] Cron job runs daily at configurable time (default: 2:00 AM org timezone)
- [ ] Scans all contracts where: status='active' AND end_date within lead_days AND no existing pending renewal
- [ ] For each qualifying contract, creates a `contract_renewals` record
- [ ] Job is idempotent: re-running does not create duplicate renewals
- [ ] Job handles errors gracefully: one contract failure doesn't stop processing others
- [ ] Job logs: contracts scanned, renewals created, errors encountered
- [ ] Job results stored in `renewal_config.job_last_run_at` and `job_last_result`
- [ ] Manual trigger available via `POST /api/renewals/run-job` for testing
- [ ] API route `GET /api/renewals/job-history` returns recent job runs
- [ ] Tests for contract selection logic, idempotency, and error handling

## Implementation Plan

### Job Architecture

Since 21CRM uses Next.js (not NestJS/BullMQ), the renewal job will be implemented as:

1. **API route** (`POST /api/renewals/run-job`) that contains the job logic
2. **Cron trigger** via one of:
   - Vercel Cron (if deployed on Vercel): `vercel.json` with cron config
   - External cron (self-hosted): system cron calling the API route
   - Next.js API route with `cron` header validation

### Multi-Org Orchestration

The cron endpoint runs across ALL orgs:

```typescript
export async function runAllRenewalJobs(): Promise<OrgJobResults[]> {
  const orgs = await db.query.renewalConfig.findMany({
    where: eq(renewalConfig.jobEnabled, true),
  });
  
  const results: OrgJobResults[] = [];
  for (const orgConfig of orgs) {
    try {
      const result = await runRenewalJob(orgConfig.orgId, orgConfig);
      results.push({ orgId: orgConfig.orgId, ...result });
    } catch (error) {
      results.push({ orgId: orgConfig.orgId, error: error.message });
    }
  }
  return results;
}
```

### Job Flow (Per-Org)

```typescript
export async function runRenewalJob(orgId: string, config: RenewalConfig): Promise<RenewalJobResult> {
  // Acquire advisory lock to prevent concurrent runs for this org
  const lockAcquired = await db.execute(
    sql`SELECT pg_try_advisory_lock(hashtext(${orgId} || '_renewal_job'))`
  );
  if (!lockAcquired.rows[0].pg_try_advisory_lock) {
    return { skipped: true, reason: 'Job already running for this org' };
  }

  try {
    const cutoffDate = addDays(new Date(), config.defaultLeadDays);
    
    // Find contracts expiring within lead time that don't already have a pending renewal
    const eligibleContracts = await db.query.contracts.findMany({
      where: and(
        eq(contracts.orgId, orgId),
        eq(contracts.status, 'active'),
        lte(contracts.endDate, cutoffDate),
        // Exclude contracts that already have a pending/in_progress renewal
        notExists(
          db.select().from(contractRenewals)
            .where(and(
              eq(contractRenewals.contractId, contracts.id),
              inArray(contractRenewals.status, ['pending', 'in_progress'])
            ))
        )
      ),
    });

    const results = {
      contractsScanned: eligibleContracts.length,
      renewalsCreated: 0,
      errors: [] as string[],
      checkpoint: 0,
    };

    for (const contract of eligibleContracts) {
      try {
        // Each contract processed in its own transaction
        await db.transaction(async (tx) => {
          await createRenewalForContract(tx, contract, config);
        });
        results.renewalsCreated++;
      } catch (error) {
        results.errors.push(`Contract ${contract.contractNumber}: ${error.message}`);
      }
      
      // Checkpoint: update progress after each contract
      results.checkpoint++;
      if (results.checkpoint % 10 === 0) {
        await updateRenewalConfig(orgId, {
          jobLastRunAt: new Date(),
          jobLastResult: { ...results, status: 'in_progress' },
        });
      }
    }

    // Final update
    await updateRenewalConfig(orgId, {
      jobLastRunAt: new Date(),
      jobLastResult: { ...results, status: 'completed' },
    });

    // Re-assess risk for all pending renewals
    await reassessRenewalRisks(orgId);

    return results;
  } finally {
    // Always release the advisory lock
    await db.execute(
      sql`SELECT pg_advisory_unlock(hashtext(${orgId} || '_renewal_job'))`
    );
  }
}
```

### Idempotency & Concurrency

- **Idempotency**: The `notExists` subquery ensures contracts with existing pending/in_progress renewals are skipped. Re-running the job is always safe.
- **Concurrency guard**: `pg_try_advisory_lock` prevents two simultaneous job runs for the same org. If the lock is held, the second run skips gracefully.
- **Transaction per contract**: Each `createRenewalForContract` runs in its own transaction. If it fails, no partial state is committed. Other contracts continue.
- **Checkpoint writes**: Every 10 contracts, progress is saved. If the process crashes, `job_last_result` shows how far it got.

### Error Handling

- Each contract processed independently in its own transaction and try/catch
- Failures logged but don't stop the batch
- Summary of errors included in job result
- Checkpoint writes prevent complete result loss on crash
- If the entire job fails (e.g., database connection), the advisory lock is still released via `finally`

### Quote Invalidation

When a contract is amended (TASK-029) while a renewal is pending:
- The amendment service checks for pending renewals on the contract
- If found, marks the renewal quote as `stale` and triggers regeneration
- The CS manager receives a notification: "Renewal quote for {contract} updated due to contract amendment"

### Cron Configuration

```json
// vercel.json (if using Vercel)
{
  "crons": [{
    "path": "/api/renewals/run-job",
    "schedule": "0 2 * * *"
  }]
}
```

For self-hosted: `0 2 * * * curl -X POST https://app.21crm.local/api/renewals/run-job -H "Authorization: Bearer $CRON_SECRET"`

### Security

- Cron endpoint protected by either:
  - `CRON_SECRET` header verification (for external cron)
  - Vercel cron header validation (`x-vercel-cron-signature`)
  - Session-based auth (for manual trigger from settings page)

## Files to Change

- `src/app/api/renewals/run-job/route.ts` — **NEW**: Job execution endpoint
- `src/app/api/renewals/job-history/route.ts` — **NEW**: Job history endpoint
- `src/lib/renewals/job.ts` — **NEW**: Core renewal job logic
- `src/lib/renewals/job.test.ts` — **NEW**: Job logic tests
- `vercel.json` — **MODIFY**: Add cron schedule (if applicable)

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
