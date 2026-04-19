import { describe, it, expect } from 'vitest';
import {
  createSnapshot,
  compareSnapshots,
  computeAccuracy,
  SnapshotDeal,
} from './forecast-snapshot';

const mkDeal = (
  id: string,
  amount: number,
  probability: number,
  stage = 'qualification',
): SnapshotDeal => ({
  id,
  ownerId: 'rep1',
  ownerName: 'Alice',
  stage,
  amount,
  probability,
  closeDate: '2026-06-30',
});

describe('createSnapshot', () => {
  it('computes totalPipeline as sum of amounts', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [
      mkDeal('d1', 50_000, 50),
      mkDeal('d2', 30_000, 80),
    ]);
    expect(snap.totalPipeline).toBe(80_000);
  });

  it('computes weightedForecast as prob-weighted sum', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [
      mkDeal('d1', 100_000, 50),  // 50,000
      mkDeal('d2', 50_000, 100),  // 50,000
    ]);
    expect(snap.weightedForecast).toBe(100_000);
  });

  it('returns zero totals for empty deal list', () => {
    const snap = createSnapshot('s1', 'Q2 2026', []);
    expect(snap.totalPipeline).toBe(0);
    expect(snap.weightedForecast).toBe(0);
  });

  it('sets takenAt to provided value', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [], '2026-04-01T00:00:00Z');
    expect(snap.takenAt).toBe('2026-04-01T00:00:00Z');
  });

  it('uses current datetime when takenAt omitted', () => {
    const before = Date.now();
    const snap = createSnapshot('s1', 'Q2 2026', []);
    const after = Date.now();
    const snapTime = new Date(snap.takenAt).getTime();
    expect(snapTime).toBeGreaterThanOrEqual(before);
    expect(snapTime).toBeLessThanOrEqual(after);
  });
});

describe('compareSnapshots', () => {
  it('detects added deals', () => {
    const base = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 10_000, 50)], '2026-04-01T00:00:00Z');
    const curr = createSnapshot('s2', 'Q2 2026', [mkDeal('d1', 10_000, 50), mkDeal('d2', 20_000, 60)], '2026-04-15T00:00:00Z');
    const diff = compareSnapshots(base, curr);
    expect(diff.dealsAdded).toBe(1);
    expect(diff.diffs.find((d) => d.dealId === 'd2')?.changeType).toBe('added');
  });

  it('detects removed deals', () => {
    const base = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 10_000, 50), mkDeal('d2', 20_000, 60)], '2026-04-01T00:00:00Z');
    const curr = createSnapshot('s2', 'Q2 2026', [mkDeal('d1', 10_000, 50)], '2026-04-15T00:00:00Z');
    const diff = compareSnapshots(base, curr);
    expect(diff.dealsRemoved).toBe(1);
    expect(diff.diffs.find((d) => d.dealId === 'd2')?.changeType).toBe('removed');
  });

  it('detects amount changes', () => {
    const base = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 10_000, 50)], '2026-04-01T00:00:00Z');
    const curr = createSnapshot('s2', 'Q2 2026', [mkDeal('d1', 15_000, 50)], '2026-04-15T00:00:00Z');
    const diff = compareSnapshots(base, curr);
    expect(diff.dealsChanged).toBe(1);
    const d = diff.diffs.find((x) => x.dealId === 'd1');
    expect(d?.changeType).toBe('amount_changed');
    expect(d?.amountDelta).toBe(5_000);
  });

  it('detects stage changes', () => {
    const base = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 10_000, 50, 'qualification')], '2026-04-01T00:00:00Z');
    const curr = createSnapshot('s2', 'Q2 2026', [mkDeal('d1', 10_000, 50, 'proposal/price quote')], '2026-04-15T00:00:00Z');
    const diff = compareSnapshots(base, curr);
    expect(diff.diffs.find((d) => d.dealId === 'd1')?.changeType).toBe('stage_changed');
  });

  it('computes pipelineDelta', () => {
    const base = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 100_000, 50)], '2026-04-01T00:00:00Z');
    const curr = createSnapshot('s2', 'Q2 2026', [mkDeal('d1', 120_000, 50)], '2026-04-15T00:00:00Z');
    const diff = compareSnapshots(base, curr);
    expect(diff.pipelineDelta).toBe(20_000);
  });

  it('returns empty diffs for identical snapshots', () => {
    const deals = [mkDeal('d1', 50_000, 70)];
    const base = createSnapshot('s1', 'Q2 2026', deals, '2026-04-01T00:00:00Z');
    const curr = createSnapshot('s2', 'Q2 2026', deals, '2026-04-15T00:00:00Z');
    const diff = compareSnapshots(base, curr);
    expect(diff.diffs).toHaveLength(0);
    expect(diff.pipelineDelta).toBe(0);
    expect(diff.forecastDelta).toBe(0);
  });
});

describe('computeAccuracy', () => {
  it('computes zero error when forecast = actual', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 100_000, 100)], '2026-04-01T00:00:00Z');
    const acc = computeAccuracy(snap, 100_000);
    expect(acc.errorAmount).toBe(0);
    expect(acc.errorPercent).toBe(0);
    expect(acc.accurate).toBe(true);
  });

  it('marks as accurate when error within threshold', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 100_000, 100)], '2026-04-01T00:00:00Z');
    const acc = computeAccuracy(snap, 95_000, 10); // 5.26% error
    expect(acc.accurate).toBe(true);
    expect(acc.errorPercent).toBeLessThanOrEqual(10);
  });

  it('marks as inaccurate when error exceeds threshold', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 100_000, 100)], '2026-04-01T00:00:00Z');
    const acc = computeAccuracy(snap, 50_000, 10); // 100% error
    expect(acc.accurate).toBe(false);
    expect(acc.errorPercent).toBeGreaterThan(10);
  });

  it('handles zero actual without dividing by zero', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 10_000, 100)], '2026-04-01T00:00:00Z');
    const acc = computeAccuracy(snap, 0);
    expect(acc.errorPercent).toBe(100);
    expect(acc.accurate).toBe(false);
  });

  it('sets mape equal to errorPercent', () => {
    const snap = createSnapshot('s1', 'Q2 2026', [mkDeal('d1', 80_000, 100)], '2026-04-01T00:00:00Z');
    const acc = computeAccuracy(snap, 100_000);
    expect(acc.mape).toBe(acc.errorPercent);
  });
});
