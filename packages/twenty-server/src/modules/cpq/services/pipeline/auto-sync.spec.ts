import { runWithRetry, runDailySync, buildSyncResult, SyncJob, SyncHandler, SyncResult } from './auto-sync';

// auto-sync uses setTimeout for retry delays — opt out of global fake timers
beforeAll(() => jest.useRealTimers());
afterAll(() => jest.useFakeTimers());

const makeJob = (overrides: Partial<SyncJob> = {}): SyncJob => ({
  id: 'job-1',
  provider: 'mock',
  scheduleExpression: '0 2 * * *',
  enabled: true,
  ...overrides,
});

const successResult = (provider: SyncJob['provider'] = 'mock'): SyncResult => ({
  provider,
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  dealsUpserted: 10,
  contactsUpserted: 5,
  accountsUpserted: 3,
  errors: [],
  success: true,
});

describe('runWithRetry', () => {
  it('should return immediately on first success', async () => {
    const handler: SyncHandler = jest.fn().mockResolvedValue(successResult());
    const result = await runWithRetry(handler, 'mock', { maxAttempts: 3, delayMs: 0 });
    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and return last result after max attempts', async () => {
    const failResult: SyncResult = {
      ...successResult(),
      success: false,
      errors: ['network error'],
    };
    const handler: SyncHandler = jest.fn().mockResolvedValue(failResult);
    const result = await runWithRetry(handler, 'mock', { maxAttempts: 3, delayMs: 0 });
    expect(result.success).toBe(false);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('should catch thrown errors and continue retrying', async () => {
    const handler: SyncHandler = jest
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue(successResult());
    const result = await runWithRetry(handler, 'mock', { maxAttempts: 3, delayMs: 0 });
    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should capture error message in errors array when handler throws', async () => {
    const handler: SyncHandler = jest.fn().mockRejectedValue(new Error('auth failed'));
    const result = await runWithRetry(handler, 'mock', { maxAttempts: 1, delayMs: 0 });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('auth failed');
  });
});

describe('runDailySync', () => {
  it('should skip execution when job is disabled', async () => {
    const job = makeJob({ enabled: false });
    const handler: SyncHandler = jest.fn();
    const { result } = await runDailySync(job, handler);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Job is disabled');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should run and return result when job is enabled', async () => {
    const job = makeJob();
    const handler: SyncHandler = jest.fn().mockResolvedValue(successResult());
    const { result, job: updatedJob } = await runDailySync(job, handler, { maxAttempts: 1, delayMs: 0 });
    expect(result.success).toBe(true);
    expect(updatedJob.lastResult).toEqual(result);
    expect(updatedJob.lastRunAt).toBe(result.completedAt);
  });

  it('should preserve all other job fields on the updated job', async () => {
    const job = makeJob({ id: 'job-42' });
    const handler: SyncHandler = jest.fn().mockResolvedValue(successResult());
    const { job: updatedJob } = await runDailySync(job, handler, { maxAttempts: 1, delayMs: 0 });
    expect(updatedJob.id).toBe('job-42');
    expect(updatedJob.scheduleExpression).toBe('0 2 * * *');
  });
});

describe('buildSyncResult', () => {
  it('should mark success = true when there are no errors', () => {
    const result = buildSyncResult('mock', new Date().toISOString(), {
      dealsUpserted: 5,
      contactsUpserted: 2,
      accountsUpserted: 1,
    });
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should mark success = false when errors are provided', () => {
    const result = buildSyncResult(
      'salesforce',
      new Date().toISOString(),
      { dealsUpserted: 0, contactsUpserted: 0, accountsUpserted: 0 },
      ['rate limit exceeded'],
    );
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('rate limit exceeded');
  });

  it('should set the correct provider on the result', () => {
    const result = buildSyncResult('hubspot', new Date().toISOString(), {
      dealsUpserted: 1,
      contactsUpserted: 1,
      accountsUpserted: 1,
    });
    expect(result.provider).toBe('hubspot');
  });
});
