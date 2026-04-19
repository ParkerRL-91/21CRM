import {
  createSnapshot,
  compareSnapshots,
  computeAccuracy,
  type SnapshotDeal,
} from './forecast-snapshot';

const deals: SnapshotDeal[] = [
  { id: 'd1', ownerId: 'r1', ownerName: 'Alice', stage: 'Proposal', amount: 100000, probability: 80, closeDate: '2026-06-30' },
  { id: 'd2', ownerId: 'r2', ownerName: 'Bob', stage: 'Negotiation', amount: 50000, probability: 60, closeDate: '2026-06-15' },
];

describe('forecast-snapshot', () => {
  describe('createSnapshot', () => {
    it('should create a snapshot with computed totals', () => {
      const snap = createSnapshot('snap-1', 'Q2 2026', deals, '2026-04-01T00:00:00.000Z');
      expect(snap.id).toBe('snap-1');
      expect(snap.periodLabel).toBe('Q2 2026');
      expect(snap.totalPipeline).toBe(150000);
      // 100000*0.8 + 50000*0.6 = 80000+30000 = 110000
      expect(snap.weightedForecast).toBe(110000);
      expect(snap.deals).toHaveLength(2);
    });

    it('should default takenAt to current time when not provided', () => {
      const before = Date.now();
      const snap = createSnapshot('snap-2', 'Q2 2026', deals);
      const after = Date.now();
      const takenAtMs = new Date(snap.takenAt).getTime();
      expect(takenAtMs).toBeGreaterThanOrEqual(before);
      expect(takenAtMs).toBeLessThanOrEqual(after);
    });

    it('should handle empty deals', () => {
      const snap = createSnapshot('snap-3', 'Q2 2026', []);
      expect(snap.totalPipeline).toBe(0);
      expect(snap.weightedForecast).toBe(0);
    });
  });

  describe('compareSnapshots', () => {
    const baseline = createSnapshot('b1', 'Q2 2026', deals, '2026-04-01T00:00:00.000Z');

    it('should detect added deals', () => {
      const newDeal: SnapshotDeal = { id: 'd3', ownerId: 'r1', ownerName: 'Alice', stage: 'Qualification', amount: 75000, probability: 40, closeDate: '2026-06-30' };
      const current = createSnapshot('c1', 'Q2 2026', [...deals, newDeal], '2026-04-15T00:00:00.000Z');
      const comparison = compareSnapshots(baseline, current);
      expect(comparison.dealsAdded).toBe(1);
      expect(comparison.diffs.find((d) => d.dealId === 'd3' && d.changeType === 'added')).toBeDefined();
    });

    it('should detect removed deals', () => {
      const current = createSnapshot('c2', 'Q2 2026', [deals[0]], '2026-04-15T00:00:00.000Z');
      const comparison = compareSnapshots(baseline, current);
      expect(comparison.dealsRemoved).toBe(1);
    });

    it('should detect amount changes', () => {
      const updatedDeals: SnapshotDeal[] = [
        { ...deals[0], amount: 120000 },
        deals[1],
      ];
      const current = createSnapshot('c3', 'Q2 2026', updatedDeals, '2026-04-15T00:00:00.000Z');
      const comparison = compareSnapshots(baseline, current);
      expect(comparison.dealsChanged).toBe(1);
      const diff = comparison.diffs.find((d) => d.changeType === 'amount_changed');
      expect(diff?.amountDelta).toBe(20000);
    });

    it('should detect stage changes', () => {
      const updatedDeals: SnapshotDeal[] = [
        deals[0],
        { ...deals[1], stage: 'Closed Won' },
      ];
      const current = createSnapshot('c4', 'Q2 2026', updatedDeals, '2026-04-15T00:00:00.000Z');
      const comparison = compareSnapshots(baseline, current);
      const stageDiff = comparison.diffs.find((d) => d.changeType === 'stage_changed');
      expect(stageDiff).toBeDefined();
    });

    it('should compute pipeline and forecast deltas', () => {
      const current = createSnapshot('c5', 'Q2 2026', [deals[0]], '2026-04-15T00:00:00.000Z');
      const comparison = compareSnapshots(baseline, current);
      expect(comparison.pipelineDelta).toBe(-50000);
    });

    it('should handle identical snapshots with no diffs', () => {
      const current = createSnapshot('c6', 'Q2 2026', deals, '2026-04-15T00:00:00.000Z');
      const comparison = compareSnapshots(baseline, current);
      expect(comparison.diffs).toHaveLength(0);
      expect(comparison.pipelineDelta).toBe(0);
    });
  });

  describe('computeAccuracy', () => {
    const snapshot = createSnapshot('s1', 'Q2 2026', deals, '2026-04-01T00:00:00.000Z');

    it('should return accurate=true when error is within threshold', () => {
      // weightedForecast = 110000
      const metrics = computeAccuracy(snapshot, 105000, 10);
      expect(metrics.accurate).toBe(true);
      expect(metrics.errorPercent).toBeLessThanOrEqual(10);
    });

    it('should return accurate=false when error exceeds threshold', () => {
      const metrics = computeAccuracy(snapshot, 50000, 10);
      expect(metrics.accurate).toBe(false);
    });

    it('should compute error amount correctly', () => {
      const metrics = computeAccuracy(snapshot, 100000);
      // forecast=110000, actual=100000, error=10000
      expect(metrics.errorAmount).toBe(10000);
    });

    it('should return 100% error when actual is 0 and forecast is positive', () => {
      const metrics = computeAccuracy(snapshot, 0);
      expect(metrics.errorPercent).toBe(100);
      expect(metrics.accurate).toBe(false);
    });

    it('should return 0% error when both are 0', () => {
      const emptySnap = createSnapshot('s2', 'Q2 2026', []);
      const metrics = computeAccuracy(emptySnap, 0);
      expect(metrics.errorPercent).toBe(0);
    });
  });
});
