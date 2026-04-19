import {
  createSnapshot,
  compareSnapshots,
  computeAccuracy,
  SnapshotDeal,
} from './forecast-snapshot';

const makeDeal = (overrides: Partial<SnapshotDeal> & { id: string }): SnapshotDeal => ({
  ownerId: 'rep-1',
  ownerName: 'Alice',
  stage: 'qualification',
  amount: 10000,
  probability: 50,
  closeDate: '2026-06-30',
  ...overrides,
});

describe('createSnapshot', () => {
  it('should compute totalPipeline as sum of all deal amounts', () => {
    const deals = [makeDeal({ id: 'a', amount: 10000 }), makeDeal({ id: 'b', amount: 5000 })];
    const snapshot = createSnapshot('snap-1', 'Q2 2026', deals);
    expect(snapshot.totalPipeline).toBe(15000);
  });

  it('should compute weightedForecast as probability-weighted sum', () => {
    const deals = [makeDeal({ id: 'a', amount: 10000, probability: 50 })];
    const snapshot = createSnapshot('snap-1', 'Q2 2026', deals);
    expect(snapshot.weightedForecast).toBe(5000);
  });

  it('should use provided takenAt timestamp', () => {
    const snapshot = createSnapshot('snap-1', 'Q2 2026', [], '2026-04-01T00:00:00Z');
    expect(snapshot.takenAt).toBe('2026-04-01T00:00:00Z');
  });

  it('should set takenAt to current time when not provided', () => {
    const before = new Date().toISOString();
    const snapshot = createSnapshot('snap-1', 'Q2 2026', []);
    const after = new Date().toISOString();
    expect(snapshot.takenAt >= before).toBe(true);
    expect(snapshot.takenAt <= after).toBe(true);
  });
});

describe('compareSnapshots', () => {
  it('should detect added deals', () => {
    const baseline = createSnapshot('s1', 'Q2 2026', [makeDeal({ id: 'a' })]);
    const current = createSnapshot('s2', 'Q2 2026', [
      makeDeal({ id: 'a' }),
      makeDeal({ id: 'b' }),
    ]);
    const comparison = compareSnapshots(baseline, current);
    expect(comparison.dealsAdded).toBe(1);
    const added = comparison.diffs.find((d) => d.changeType === 'added');
    expect(added?.dealId).toBe('b');
  });

  it('should detect removed deals', () => {
    const baseline = createSnapshot('s1', 'Q2 2026', [
      makeDeal({ id: 'a' }),
      makeDeal({ id: 'b' }),
    ]);
    const current = createSnapshot('s2', 'Q2 2026', [makeDeal({ id: 'a' })]);
    const comparison = compareSnapshots(baseline, current);
    expect(comparison.dealsRemoved).toBe(1);
  });

  it('should detect amount changes', () => {
    const baseline = createSnapshot('s1', 'Q2 2026', [makeDeal({ id: 'a', amount: 10000 })]);
    const current = createSnapshot('s2', 'Q2 2026', [makeDeal({ id: 'a', amount: 15000 })]);
    const comparison = compareSnapshots(baseline, current);
    expect(comparison.dealsChanged).toBe(1);
    const diff = comparison.diffs.find((d) => d.changeType === 'amount_changed');
    expect(diff?.amountDelta).toBe(5000);
  });

  it('should detect stage changes', () => {
    const baseline = createSnapshot('s1', 'Q2 2026', [makeDeal({ id: 'a', stage: 'qualification' })]);
    const current = createSnapshot('s2', 'Q2 2026', [makeDeal({ id: 'a', stage: 'proposal' })]);
    const comparison = compareSnapshots(baseline, current);
    expect(comparison.diffs.some((d) => d.changeType === 'stage_changed')).toBe(true);
  });

  it('should compute pipeline and forecast deltas', () => {
    const baseline = createSnapshot('s1', 'Q2 2026', [makeDeal({ id: 'a', amount: 10000, probability: 50 })]);
    const current = createSnapshot('s2', 'Q2 2026', [makeDeal({ id: 'a', amount: 12000, probability: 50 })]);
    const comparison = compareSnapshots(baseline, current);
    expect(comparison.pipelineDelta).toBe(2000);
    expect(comparison.forecastDelta).toBe(1000);
  });
});

describe('computeAccuracy', () => {
  it('should flag accurate when error is within threshold', () => {
    const snapshot = createSnapshot('s1', 'Q2 2026', [makeDeal({ id: 'a', amount: 10000, probability: 100 })]);
    // forecasted = 10000, actual = 9500 → 5% error
    const metrics = computeAccuracy(snapshot, 9500, 10);
    expect(metrics.accurate).toBe(true);
    expect(metrics.errorPercent).toBeCloseTo(5.26, 1);
  });

  it('should flag inaccurate when error exceeds threshold', () => {
    const snapshot = createSnapshot('s1', 'Q2 2026', [makeDeal({ id: 'a', amount: 10000, probability: 100 })]);
    const metrics = computeAccuracy(snapshot, 5000, 10);
    expect(metrics.accurate).toBe(false);
    expect(metrics.errorPercent).toBe(100);
  });

  it('should return 100% error when actual is 0 and forecast is positive', () => {
    const snapshot = createSnapshot('s1', 'Q2 2026', [makeDeal({ id: 'a', amount: 5000, probability: 100 })]);
    const metrics = computeAccuracy(snapshot, 0);
    expect(metrics.errorPercent).toBe(100);
  });

  it('should return 0% error when both actual and forecast are 0', () => {
    const snapshot = createSnapshot('s1', 'Q2 2026', []);
    const metrics = computeAccuracy(snapshot, 0);
    expect(metrics.errorPercent).toBe(0);
    expect(metrics.accurate).toBe(true);
  });
});
