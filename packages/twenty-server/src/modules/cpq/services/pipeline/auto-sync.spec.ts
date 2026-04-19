import {
  runWithRetry,
  runDailySync,
  buildSyncResult,
  type SyncJob,
  type SyncResult,
  type SyncHandler,
} from './auto-sync';

const successResult: SyncResult = {
  provider: 'mock',
  startedAt: '2026-04-19T00:00:00.000Z',
  completedAt: '2026-04-19T00:01:00.000Z',
  dealsUpserted: 10,
  contactsUpserted: 5,
  accountsUpserted: 3,
  errors: [],
  success: true,
};

const failureResult: SyncResult = {
  ...successResult,
  success: false,
  errors: ['API timeout'],
};

const job: SyncJob = {
  id: 'job-1',
  provider: 'mock',
  scheduleExpression: '0 2 * * *',
  enabled: true,
};

describe('auto-sync', () => {
  // Global jest config enables fake timers; use real timers here since
  // runWithRetry uses setTimeout internally for its sleep helper.
  beforeAll(() => jest.useRealTimers());
  afterAll(() => jest.useFakeTimers());

  describe('runWithRetry', () => {
    it('should return result immediately on first success', async () => {
      const handler: SyncHandler = jest.fn().mockResolvedValue(successResult);
      const result = await runWithRetry(handler, 'mock', { maxAttempts: 3, delayMs: 0 });
      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on subsequent attempt', async () => {
      const handler: SyncHandler = jest.fn()
        .mockResolvedValueOnce(failureResult)
        .mockResolvedValueOnce(successResult);

      const result = await runWithRetry(handler, 'mock', { maxAttempts: 3, delayMs: 0 });
      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should return last failure after all retries exhausted', async () => {
      const handler: SyncHandler = jest.fn().mockResolvedValue(failureResult);
      const result = await runWithRetry(handler, 'mock', { maxAttempts: 3, delayMs: 0 });
      expect(result.success).toBe(false);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should handle thrown errors and convert to failure result', async () => {
      const handler: SyncHandler = jest.fn().mockRejectedValue(new Error('Network error'));
      const result = await runWithRetry(handler, 'mock', { maxAttempts: 2, delayMs: 0 });
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Network error');
    });
  });

  describe('runDailySync', () => {
    it('should run handler for enabled job and update lastRunAt', async () => {
      const handler: SyncHandler = jest.fn().mockResolvedValue(successResult);
      const { job: updatedJob, result } = await runDailySync(job, handler, { maxAttempts: 1, delayMs: 0 });
      expect(result.success).toBe(true);
      expect(updatedJob.lastRunAt).toBeDefined();
      expect(updatedJob.lastResult?.success).toBe(true);
    });

    it('should skip disabled jobs and return skipped result', async () => {
      const disabledJob: SyncJob = { ...job, enabled: false };
      const handler: SyncHandler = jest.fn();
      const { result } = await runDailySync(disabledJob, handler);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('disabled');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should preserve job identity and update only run metadata', async () => {
      const handler: SyncHandler = jest.fn().mockResolvedValue(successResult);
      const { job: updatedJob } = await runDailySync(job, handler, { maxAttempts: 1, delayMs: 0 });
      expect(updatedJob.id).toBe(job.id);
      expect(updatedJob.scheduleExpression).toBe(job.scheduleExpression);
    });
  });

  describe('buildSyncResult', () => {
    it('should mark success=true when no errors', () => {
      const result = buildSyncResult('mock', '2026-04-19T00:00:00.000Z', {
        dealsUpserted: 5,
        contactsUpserted: 2,
        accountsUpserted: 1,
      });
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should mark success=false when errors are present', () => {
      const result = buildSyncResult(
        'salesforce',
        '2026-04-19T00:00:00.000Z',
        { dealsUpserted: 0, contactsUpserted: 0, accountsUpserted: 0 },
        ['Rate limit exceeded'],
      );
      expect(result.success).toBe(false);
      expect(result.errors[0]).toBe('Rate limit exceeded');
    });

    it('should include a completedAt timestamp', () => {
      const result = buildSyncResult('mock', '2026-04-19T00:00:00.000Z', {
        dealsUpserted: 0,
        contactsUpserted: 0,
        accountsUpserted: 0,
      });
      expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
