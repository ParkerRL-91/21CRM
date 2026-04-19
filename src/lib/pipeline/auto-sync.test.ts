import { describe, it, expect, vi } from 'vitest';
import {
  runDailySync,
  runWithRetry,
  buildSyncResult,
  SyncJob,
  SyncHandler,
  SyncResult,
} from './auto-sync';

const makeJob = (enabled = true): SyncJob => ({
  id: 'job-1',
  provider: 'hubspot',
  scheduleExpression: '0 2 * * *',
  enabled,
});

const successHandler: SyncHandler = async (provider) => ({
  provider,
  startedAt: '2026-04-18T02:00:00Z',
  completedAt: '2026-04-18T02:00:30Z',
  dealsUpserted: 42,
  contactsUpserted: 10,
  accountsUpserted: 5,
  errors: [],
  success: true,
});

const failHandler: SyncHandler = async (provider) => ({
  provider,
  startedAt: '2026-04-18T02:00:00Z',
  completedAt: '2026-04-18T02:00:01Z',
  dealsUpserted: 0,
  contactsUpserted: 0,
  accountsUpserted: 0,
  errors: ['API timeout'],
  success: false,
});

describe('runDailySync', () => {
  it('returns success result when handler succeeds', async () => {
    const { result } = await runDailySync(makeJob(), successHandler, { maxAttempts: 1, delayMs: 0 });
    expect(result.success).toBe(true);
    expect(result.dealsUpserted).toBe(42);
  });

  it('skips when job is disabled', async () => {
    const { result } = await runDailySync(makeJob(false), successHandler);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Job is disabled');
  });

  it('updates job.lastRunAt after successful sync', async () => {
    const { job } = await runDailySync(makeJob(), successHandler, { maxAttempts: 1, delayMs: 0 });
    expect(job.lastRunAt).toBeDefined();
    expect(job.lastResult?.success).toBe(true);
  });

  it('stores last result on job even on failure', async () => {
    const { job } = await runDailySync(makeJob(), failHandler, { maxAttempts: 1, delayMs: 0 });
    expect(job.lastResult?.success).toBe(false);
    expect(job.lastResult?.errors).toContain('API timeout');
  });
});

describe('runWithRetry', () => {
  it('returns immediately on first success', async () => {
    const handler = vi.fn(successHandler);
    const result = await runWithRetry(handler, 'hubspot', { maxAttempts: 3, delayMs: 0 });
    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('retries up to maxAttempts on failure', async () => {
    const handler = vi.fn(failHandler);
    const result = await runWithRetry(handler, 'hubspot', { maxAttempts: 3, delayMs: 0 });
    expect(result.success).toBe(false);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('returns success if retry succeeds on second attempt', async () => {
    let calls = 0;
    const handler: SyncHandler = async (provider) => {
      calls++;
      if (calls < 2) return { ...await failHandler(provider) };
      return { ...await successHandler(provider) };
    };
    const result = await runWithRetry(handler, 'hubspot', { maxAttempts: 3, delayMs: 0 });
    expect(result.success).toBe(true);
    expect(calls).toBe(2);
  });

  it('handles thrown errors gracefully', async () => {
    const handler: SyncHandler = async () => {
      throw new Error('Network failure');
    };
    const result = await runWithRetry(handler, 'salesforce', { maxAttempts: 2, delayMs: 0 });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Network failure');
  });
});

describe('buildSyncResult', () => {
  it('marks success when no errors', () => {
    const r = buildSyncResult(
      'hubspot',
      '2026-04-18T02:00:00Z',
      { dealsUpserted: 10, contactsUpserted: 5, accountsUpserted: 3 },
    );
    expect(r.success).toBe(true);
    expect(r.dealsUpserted).toBe(10);
  });

  it('marks failure when errors present', () => {
    const r = buildSyncResult(
      'salesforce',
      '2026-04-18T02:00:00Z',
      { dealsUpserted: 0, contactsUpserted: 0, accountsUpserted: 0 },
      ['Quota exceeded'],
    );
    expect(r.success).toBe(false);
    expect(r.errors).toContain('Quota exceeded');
  });
});
