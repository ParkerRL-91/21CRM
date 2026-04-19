import {
  runDailySync,
  runWithRetry,
  buildSyncResult,
  SyncJob,
  SyncResult,
  SyncHandler,
} from './auto-sync';

function makeJob(overrides: Partial<SyncJob> = {}): SyncJob {
  return {
    id: 'job-1',
    provider: 'mock',
    scheduleExpression: '0 2 * * *',
    enabled: true,
    ...overrides,
  };
}

function makeSuccessResult(provider: SyncJob['provider'] = 'mock'): SyncResult {
  return {
    provider,
    startedAt: '2026-01-01T02:00:00Z',
    completedAt: '2026-01-01T02:01:00Z',
    dealsUpserted: 10,
    contactsUpserted: 5,
    accountsUpserted: 3,
    errors: [],
    success: true,
  };
}

function makeFailureResult(provider: SyncJob['provider'] = 'mock'): SyncResult {
  return {
    provider,
    startedAt: '2026-01-01T02:00:00Z',
    completedAt: '2026-01-01T02:01:00Z',
    dealsUpserted: 0,
    contactsUpserted: 0,
    accountsUpserted: 0,
    errors: ['Connection refused'],
    success: false,
  };
}

// Use 0ms delay to keep tests fast
const NO_DELAY = { maxAttempts: 3, delayMs: 0 };

describe('runDailySync', () => {
  it('returns a skipped result when job is disabled', async () => {
    const job = makeJob({ enabled: false });
    const handler: SyncHandler = jest.fn().mockResolvedValue(makeSuccessResult());

    const { result } = await runDailySync(job, handler, NO_DELAY);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Job is disabled');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns success result when handler succeeds', async () => {
    const job = makeJob();
    const success = makeSuccessResult();
    const handler: SyncHandler = jest.fn().mockResolvedValue(success);

    const { result, job: updatedJob } = await runDailySync(job, handler, NO_DELAY);

    expect(result.success).toBe(true);
    expect(result.dealsUpserted).toBe(10);
    expect(updatedJob.lastResult).toEqual(result);
    expect(updatedJob.lastRunAt).toBeDefined();
  });

  it('updates job.lastRunAt with the result completedAt timestamp', async () => {
    const job = makeJob();
    const success = makeSuccessResult();
    const handler: SyncHandler = jest.fn().mockResolvedValue(success);

    const { job: updatedJob } = await runDailySync(job, handler, NO_DELAY);

    expect(updatedJob.lastRunAt).toBe(success.completedAt);
  });

  it('does not mutate the original job object', async () => {
    const job = makeJob();
    const originalLastRunAt = job.lastRunAt;
    const handler: SyncHandler = jest.fn().mockResolvedValue(makeSuccessResult());

    await runDailySync(job, handler, NO_DELAY);

    expect(job.lastRunAt).toBe(originalLastRunAt);
  });

  it('triggers retry and eventually returns failure after max attempts', async () => {
    const job = makeJob();
    const failure = makeFailureResult();
    const handler: SyncHandler = jest.fn().mockResolvedValue(failure);

    const { result } = await runDailySync(job, handler, NO_DELAY);

    expect(result.success).toBe(false);
    expect(handler).toHaveBeenCalledTimes(3);
  });
});

describe('runWithRetry', () => {
  it('returns first successful result without further attempts', async () => {
    const success = makeSuccessResult();
    const handler: SyncHandler = jest.fn().mockResolvedValue(success);

    const result = await runWithRetry(handler, 'mock', NO_DELAY);

    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and returns success on second attempt', async () => {
    const failure = makeFailureResult();
    const success = makeSuccessResult();
    const handler: SyncHandler = jest.fn()
      .mockResolvedValueOnce(failure)
      .mockResolvedValueOnce(success);

    const result = await runWithRetry(handler, 'mock', NO_DELAY);

    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('exhausts all attempts on persistent failure and returns last result', async () => {
    const failure = makeFailureResult();
    const handler: SyncHandler = jest.fn().mockResolvedValue(failure);

    const result = await runWithRetry(handler, 'mock', { maxAttempts: 3, delayMs: 0 });

    expect(result.success).toBe(false);
    expect(handler).toHaveBeenCalledTimes(3);
    expect(result.errors).toContain('Connection refused');
  });

  it('captures thrown exceptions as error results', async () => {
    const handler: SyncHandler = jest.fn().mockRejectedValue(new Error('Network timeout'));

    const result = await runWithRetry(handler, 'mock', { maxAttempts: 1, delayMs: 0 });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Network timeout');
  });

  it('uses string representation for non-Error exceptions', async () => {
    const handler: SyncHandler = jest.fn().mockRejectedValue('something went wrong');

    const result = await runWithRetry(handler, 'mock', { maxAttempts: 1, delayMs: 0 });

    expect(result.errors).toContain('something went wrong');
  });

  it('respects maxAttempts: 1 (no retry on failure)', async () => {
    const handler: SyncHandler = jest.fn().mockResolvedValue(makeFailureResult());

    await runWithRetry(handler, 'mock', { maxAttempts: 1, delayMs: 0 });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('buildSyncResult', () => {
  it('returns success: true when no errors', () => {
    const result = buildSyncResult(
      'mock',
      '2026-01-01T02:00:00Z',
      { dealsUpserted: 5, contactsUpserted: 3, accountsUpserted: 2 },
    );

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns success: false when errors are provided', () => {
    const result = buildSyncResult(
      'salesforce',
      '2026-01-01T02:00:00Z',
      { dealsUpserted: 0, contactsUpserted: 0, accountsUpserted: 0 },
      ['Timeout connecting to Salesforce'],
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Timeout connecting to Salesforce');
  });

  it('assigns the correct provider', () => {
    const result = buildSyncResult(
      'hubspot',
      '2026-01-01T02:00:00Z',
      { dealsUpserted: 1, contactsUpserted: 2, accountsUpserted: 3 },
    );

    expect(result.provider).toBe('hubspot');
  });

  it('propagates count fields correctly', () => {
    const result = buildSyncResult(
      'mock',
      '2026-01-01T02:00:00Z',
      { dealsUpserted: 42, contactsUpserted: 17, accountsUpserted: 8 },
    );

    expect(result.dealsUpserted).toBe(42);
    expect(result.contactsUpserted).toBe(17);
    expect(result.accountsUpserted).toBe(8);
  });

  it('stores the provided startedAt', () => {
    const startedAt = '2026-04-19T10:00:00Z';
    const result = buildSyncResult('mock', startedAt, { dealsUpserted: 0, contactsUpserted: 0, accountsUpserted: 0 });

    expect(result.startedAt).toBe(startedAt);
  });

  it('sets a completedAt timestamp', () => {
    const result = buildSyncResult('mock', '2026-01-01T02:00:00Z', { dealsUpserted: 0, contactsUpserted: 0, accountsUpserted: 0 });

    expect(result.completedAt).toBeDefined();
    expect(typeof result.completedAt).toBe('string');
  });
});
