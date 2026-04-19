/**
 * Scheduled auto-sync job abstraction.
 *
 * Defines the SyncJob contract and runDailySync runner.
 * Intentionally scheduler-agnostic — can be wired to cron, BullMQ,
 * Vercel Cron, or any other trigger without changing this module.
 */

export type SyncProvider = 'hubspot' | 'salesforce' | 'mock';

export type SyncResult = {
  provider: SyncProvider;
  startedAt: string;
  completedAt: string;
  dealsUpserted: number;
  contactsUpserted: number;
  accountsUpserted: number;
  errors: string[];
  success: boolean;
};

export type SyncJob = {
  id: string;
  provider: SyncProvider;
  scheduleExpression: string; // cron expression, e.g. "0 2 * * *" (2am daily)
  enabled: boolean;
  lastRunAt?: string;
  lastResult?: SyncResult;
};

export type SyncHandler = (provider: SyncProvider) => Promise<SyncResult>;

type RetryOptions = {
  maxAttempts: number;
  delayMs: number;
};

const DEFAULT_RETRY: RetryOptions = { maxAttempts: 3, delayMs: 1000 };

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a single sync attempt with retry logic.
 * Returns the first successful result or the last error result.
 */
export async function runWithRetry(
  handler: SyncHandler,
  provider: SyncProvider,
  options: RetryOptions = DEFAULT_RETRY,
): Promise<SyncResult> {
  let lastResult: SyncResult | null = null;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      const result = await handler(provider);
      if (result.success) return result;
      lastResult = result;
    } catch (err) {
      lastResult = {
        provider,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        dealsUpserted: 0,
        contactsUpserted: 0,
        accountsUpserted: 0,
        errors: [err instanceof Error ? err.message : String(err)],
        success: false,
      };
    }

    if (attempt < options.maxAttempts) {
      await sleep(options.delayMs);
    }
  }

  return lastResult!;
}

/**
 * Execute the daily sync for a given job config.
 * Updates lastRunAt and lastResult on the job object.
 */
export async function runDailySync(
  job: SyncJob,
  handler: SyncHandler,
  retryOptions?: RetryOptions,
): Promise<{ job: SyncJob; result: SyncResult }> {
  if (!job.enabled) {
    const skipped: SyncResult = {
      provider: job.provider,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      dealsUpserted: 0,
      contactsUpserted: 0,
      accountsUpserted: 0,
      errors: ['Job is disabled'],
      success: false,
    };
    return { job, result: skipped };
  }

  const result = await runWithRetry(handler, job.provider, retryOptions);
  const updatedJob: SyncJob = {
    ...job,
    lastRunAt: result.completedAt,
    lastResult: result,
  };

  return { job: updatedJob, result };
}

/**
 * Build a SyncResult from counts (convenience for implementors).
 */
export function buildSyncResult(
  provider: SyncProvider,
  startedAt: string,
  counts: { dealsUpserted: number; contactsUpserted: number; accountsUpserted: number },
  errors: string[] = [],
): SyncResult {
  return {
    provider,
    startedAt,
    completedAt: new Date().toISOString(),
    ...counts,
    errors,
    success: errors.length === 0,
  };
}
