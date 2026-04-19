import {
  createSnapshot,
  compareSnapshots,
  computeAccuracy,
  SnapshotDeal,
  ForecastSnapshot,
} from './forecast-snapshot';

function makeDeal(overrides: Partial<SnapshotDeal> & Pick<SnapshotDeal, 'id'>): SnapshotDeal {
  return {
    ownerId: 'rep1',
    ownerName: 'Alice',
    stage: 'qualification',
    amount: 10000,
    probability: 50,
    closeDate: '2026-03-31',
    ...overrides,
  };
}

describe('createSnapshot', () => {
  it('captures total pipeline (sum of all amounts)', () => {
    const deals = [
      makeDeal({ id: 'd1', amount: 10000, probability: 50 }),
      makeDeal({ id: 'd2', amount: 20000, probability: 75 }),
    ];
    const snapshot = createSnapshot('snap1', 'Q1 2026', deals, '2026-01-01T00:00:00Z');

    expect(snapshot.totalPipeline).toBe(30000);
  });

  it('captures weighted forecast (sum of amount × probability / 100)', () => {
    const deals = [
      makeDeal({ id: 'd1', amount: 10000, probability: 50 }),  // 5000
      makeDeal({ id: 'd2', amount: 20000, probability: 75 }),  // 15000
    ];
    const snapshot = createSnapshot('snap1', 'Q1 2026', deals, '2026-01-01T00:00:00Z');

    expect(snapshot.weightedForecast).toBe(20000);
  });

  it('stores provided takenAt timestamp', () => {
    const takenAt = '2026-01-15T12:00:00Z';
    const snapshot = createSnapshot('snap1', 'Q1 2026', [], takenAt);

    expect(snapshot.takenAt).toBe(takenAt);
  });

  it('stores the correct id and periodLabel', () => {
    const snapshot = createSnapshot('snap-abc', 'April 2026', [], '2026-04-01T00:00:00Z');

    expect(snapshot.id).toBe('snap-abc');
    expect(snapshot.periodLabel).toBe('April 2026');
  });

  it('returns zero totals for empty deal list', () => {
    const snapshot = createSnapshot('snap1', 'Q1 2026', [], '2026-01-01T00:00:00Z');

    expect(snapshot.totalPipeline).toBe(0);
    expect(snapshot.weightedForecast).toBe(0);
  });

  it('handles a 100% probability deal (weighted = amount)', () => {
    const deals = [makeDeal({ id: 'd1', amount: 50000, probability: 100 })];
    const snapshot = createSnapshot('snap1', 'Q1 2026', deals);

    expect(snapshot.weightedForecast).toBe(50000);
  });
});

describe('compareSnapshots', () => {
  const BASE_TAKEN_AT = '2026-01-01T00:00:00Z';

  function makeSnapshot(id: string, deals: SnapshotDeal[]): ForecastSnapshot {
    return createSnapshot(id, 'Q1 2026', deals, BASE_TAKEN_AT);
  }

  it('detects added deal (present in current but not baseline)', () => {
    const baseline = makeSnapshot('snap1', []);
    const current = makeSnapshot('snap2', [makeDeal({ id: 'd1' })]);

    const comparison = compareSnapshots(baseline, current);

    expect(comparison.dealsAdded).toBe(1);
    expect(comparison.diffs[0].changeType).toBe('added');
    expect(comparison.diffs[0].dealId).toBe('d1');
  });

  it('detects removed deal (present in baseline but not current)', () => {
    const baseline = makeSnapshot('snap1', [makeDeal({ id: 'd1' })]);
    const current = makeSnapshot('snap2', []);

    const comparison = compareSnapshots(baseline, current);

    expect(comparison.dealsRemoved).toBe(1);
    expect(comparison.diffs[0].changeType).toBe('removed');
  });

  it('detects amount change', () => {
    const deal = makeDeal({ id: 'd1', amount: 10000 });
    const baseline = makeSnapshot('snap1', [deal]);
    const current = makeSnapshot('snap2', [{ ...deal, amount: 15000 }]);

    const comparison = compareSnapshots(baseline, current);

    expect(comparison.dealsChanged).toBe(1);
    const diff = comparison.diffs.find((d) => d.changeType === 'amount_changed');
    expect(diff).toBeDefined();
    expect(diff?.amountDelta).toBe(5000);
    expect(diff?.before?.amount).toBe(10000);
    expect(diff?.after?.amount).toBe(15000);
  });

  it('detects stage change', () => {
    const deal = makeDeal({ id: 'd1', stage: 'qualification' });
    const baseline = makeSnapshot('snap1', [deal]);
    const current = makeSnapshot('snap2', [{ ...deal, stage: 'proposal/price quote' }]);

    const comparison = compareSnapshots(baseline, current);

    const diff = comparison.diffs.find((d) => d.changeType === 'stage_changed');
    expect(diff).toBeDefined();
    expect(diff?.before?.stage).toBe('qualification');
    expect(diff?.after?.stage).toBe('proposal/price quote');
  });

  it('detects probability change', () => {
    const deal = makeDeal({ id: 'd1', probability: 50 });
    const baseline = makeSnapshot('snap1', [deal]);
    const current = makeSnapshot('snap2', [{ ...deal, probability: 75 }]);

    const comparison = compareSnapshots(baseline, current);

    const diff = comparison.diffs.find((d) => d.changeType === 'probability_changed');
    expect(diff).toBeDefined();
    expect(diff?.before?.probability).toBe(50);
    expect(diff?.after?.probability).toBe(75);
  });

  it('computes pipelineDelta correctly', () => {
    const baseline = makeSnapshot('snap1', [makeDeal({ id: 'd1', amount: 10000 })]);
    const current = makeSnapshot('snap2', [
      makeDeal({ id: 'd1', amount: 10000 }),
      makeDeal({ id: 'd2', amount: 5000 }),
    ]);

    const comparison = compareSnapshots(baseline, current);

    expect(comparison.pipelineDelta).toBe(5000);
  });

  it('returns zero diffs for identical snapshots', () => {
    const deals = [makeDeal({ id: 'd1' }), makeDeal({ id: 'd2' })];
    const baseline = makeSnapshot('snap1', deals);
    const current = makeSnapshot('snap2', deals);

    const comparison = compareSnapshots(baseline, current);

    expect(comparison.diffs).toHaveLength(0);
    expect(comparison.dealsAdded).toBe(0);
    expect(comparison.dealsRemoved).toBe(0);
    expect(comparison.dealsChanged).toBe(0);
    expect(comparison.pipelineDelta).toBe(0);
    expect(comparison.forecastDelta).toBe(0);
  });

  describe('empty snapshot comparison', () => {
    it('returns zero deltas when both snapshots are empty', () => {
      const baseline = makeSnapshot('snap1', []);
      const current = makeSnapshot('snap2', []);

      const comparison = compareSnapshots(baseline, current);

      expect(comparison.diffs).toHaveLength(0);
      expect(comparison.pipelineDelta).toBe(0);
      expect(comparison.forecastDelta).toBe(0);
    });
  });
});

describe('computeAccuracy', () => {
  function makeSnapshotWithForecast(weightedForecast: number): ForecastSnapshot {
    // Build deals whose weighted forecast sums to the desired amount
    // Use a single 100% probability deal
    const deal = makeDeal({ id: 'd1', amount: weightedForecast, probability: 100 });
    return createSnapshot('snap1', 'Q1 2026', [deal], '2026-01-01T00:00:00Z');
  }

  it('computes MAPE as 0 when forecast matches actual exactly', () => {
    const snapshot = makeSnapshotWithForecast(100000);
    const metrics = computeAccuracy(snapshot, 100000);

    expect(metrics.errorAmount).toBe(0);
    expect(metrics.errorPercent).toBe(0);
    expect(metrics.mape).toBe(0);
    expect(metrics.accurate).toBe(true);
  });

  it('computes correct errorAmount and errorPercent for over-forecast', () => {
    // Forecasted 120000, actual 100000 → error = 20000, 20%
    const snapshot = makeSnapshotWithForecast(120000);
    const metrics = computeAccuracy(snapshot, 100000);

    expect(metrics.forecastedAmount).toBe(120000);
    expect(metrics.actualAmount).toBe(100000);
    expect(metrics.errorAmount).toBe(20000);
    expect(metrics.errorPercent).toBe(20);
  });

  it('computes correct errorAmount and errorPercent for under-forecast', () => {
    // Forecasted 80000, actual 100000 → |error| = 20000, 20%
    const snapshot = makeSnapshotWithForecast(80000);
    const metrics = computeAccuracy(snapshot, 100000);

    expect(metrics.errorAmount).toBe(-20000);
    expect(metrics.errorPercent).toBe(20);
  });

  it('marks accurate: true when errorPercent <= threshold (default 10%)', () => {
    const snapshot = makeSnapshotWithForecast(105000);
    const metrics = computeAccuracy(snapshot, 100000); // 5% error

    expect(metrics.accurate).toBe(true);
  });

  it('marks accurate: false when errorPercent > threshold', () => {
    const snapshot = makeSnapshotWithForecast(115000);
    const metrics = computeAccuracy(snapshot, 100000); // 15% error

    expect(metrics.accurate).toBe(false);
  });

  it('respects custom accuracy threshold', () => {
    const snapshot = makeSnapshotWithForecast(125000);
    const metrics = computeAccuracy(snapshot, 100000, 30); // 25% error, threshold 30%

    expect(metrics.accurate).toBe(true);
  });

  it('handles actualAmount of 0 with positive forecast (returns 100% error)', () => {
    const snapshot = makeSnapshotWithForecast(50000);
    const metrics = computeAccuracy(snapshot, 0);

    expect(metrics.errorPercent).toBe(100);
    expect(metrics.accurate).toBe(false);
  });

  it('handles actualAmount of 0 with zero forecast (returns 0% error)', () => {
    const snapshot = makeSnapshotWithForecast(0);
    const metrics = computeAccuracy(snapshot, 0);

    expect(metrics.errorPercent).toBe(0);
  });

  it('stores snapshotId and periodLabel correctly', () => {
    const snapshot = makeSnapshotWithForecast(100000);
    const metrics = computeAccuracy(snapshot, 100000);

    expect(metrics.snapshotId).toBe('snap1');
    expect(metrics.periodLabel).toBe('Q1 2026');
  });
});
