import { describe, it, expect } from 'vitest';
import {
  computeQuarterProgression,
  quarterBounds,
  ClosedDeal,
  QuarterBounds,
} from './quarter-progression';

const Q1_2026: QuarterBounds = { start: '2026-01-01', end: '2026-03-31' };
const QUOTA = 300_000;

describe('quarterBounds', () => {
  it('returns Q1 bounds', () => {
    expect(quarterBounds(2026, 1)).toEqual({ start: '2026-01-01', end: '2026-03-31' });
  });
  it('returns Q2 bounds', () => {
    expect(quarterBounds(2026, 2)).toEqual({ start: '2026-04-01', end: '2026-06-30' });
  });
  it('returns Q3 bounds', () => {
    expect(quarterBounds(2026, 3)).toEqual({ start: '2026-07-01', end: '2026-09-30' });
  });
  it('returns Q4 bounds', () => {
    expect(quarterBounds(2026, 4)).toEqual({ start: '2026-10-01', end: '2026-12-31' });
  });
});

describe('computeQuarterProgression', () => {
  it('returns zero totals when no deals', () => {
    const result = computeQuarterProgression([], Q1_2026, QUOTA, '2026-02-01');
    expect(result.totalClosedWon).toBe(0);
    expect(result.paceRate).toBe(0);
  });

  it('sums deals within quarter', () => {
    const deals: ClosedDeal[] = [
      { id: 'd1', closedDate: '2026-01-10', amount: 50_000 },
      { id: 'd2', closedDate: '2026-02-15', amount: 75_000 },
    ];
    const result = computeQuarterProgression(deals, Q1_2026, QUOTA, '2026-03-01');
    expect(result.totalClosedWon).toBe(125_000);
  });

  it('excludes deals outside quarter', () => {
    const deals: ClosedDeal[] = [
      { id: 'd1', closedDate: '2025-12-31', amount: 50_000 }, // Q4 2025
      { id: 'd2', closedDate: '2026-02-01', amount: 20_000 },
      { id: 'd3', closedDate: '2026-04-01', amount: 50_000 }, // Q2 2026
    ];
    const result = computeQuarterProgression(deals, Q1_2026, QUOTA, '2026-03-01');
    expect(result.totalClosedWon).toBe(20_000);
  });

  it('computes data points for every day of the quarter', () => {
    const result = computeQuarterProgression([], Q1_2026, QUOTA, '2026-01-15');
    // Q1 2026: Jan(31) + Feb(28) + Mar(31) = 90 days
    expect(result.dataPoints).toHaveLength(90);
  });

  it('data points have actual=0 for future days', () => {
    const result = computeQuarterProgression([], Q1_2026, QUOTA, '2026-01-15');
    const future = result.dataPoints.find((dp) => dp.date === '2026-02-01');
    expect(future?.actual).toBe(0); // no deals, so 0 even for past days
  });

  it('quota line increases linearly to quota at end of quarter', () => {
    const result = computeQuarterProgression([], Q1_2026, QUOTA, '2026-01-01');
    const lastDp = result.dataPoints[result.dataPoints.length - 1];
    expect(lastDp.quota).toBe(QUOTA);
    const firstDp = result.dataPoints[0];
    expect(firstDp.quota).toBeGreaterThan(0);
    expect(firstDp.quota).toBeLessThan(QUOTA);
  });

  it('onTrack is true when projected >= quota', () => {
    const deals: ClosedDeal[] = [
      { id: 'd1', closedDate: '2026-01-01', amount: 1_000_000 },
    ];
    const result = computeQuarterProgression(deals, Q1_2026, QUOTA, '2026-01-10');
    expect(result.onTrack).toBe(true);
  });

  it('onTrack is false when projected < quota', () => {
    const result = computeQuarterProgression([], Q1_2026, QUOTA, '2026-03-31');
    expect(result.onTrack).toBe(false);
  });

  it('sets quarter metadata', () => {
    const result = computeQuarterProgression([], Q1_2026, QUOTA, '2026-01-15');
    expect(result.quarter).toEqual(Q1_2026);
    expect(result.quota).toBe(QUOTA);
  });

  it('cumulative actual carries forward on days with no deal', () => {
    const deals: ClosedDeal[] = [
      { id: 'd1', closedDate: '2026-01-05', amount: 30_000 },
    ];
    const result = computeQuarterProgression(deals, Q1_2026, QUOTA, '2026-01-20');
    const jan10 = result.dataPoints.find((dp) => dp.date === '2026-01-10');
    expect(jan10?.actual).toBe(30_000);
    const jan04 = result.dataPoints.find((dp) => dp.date === '2026-01-04');
    expect(jan04?.actual).toBe(0);
  });
});
