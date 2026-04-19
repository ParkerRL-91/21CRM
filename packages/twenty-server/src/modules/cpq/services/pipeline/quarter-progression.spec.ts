import {
  computeQuarterProgression,
  quarterBounds,
  type ClosedDeal,
} from './quarter-progression';

const quarter = { start: '2026-01-01', end: '2026-03-31' };

const closedDeals: ClosedDeal[] = [
  { id: 'd1', closedDate: '2026-01-10', amount: 50000 },
  { id: 'd2', closedDate: '2026-02-15', amount: 30000 },
  { id: 'd3', closedDate: '2026-03-20', amount: 20000 },
];

describe('computeQuarterProgression', () => {
  it('should compute total closed won correctly', () => {
    const result = computeQuarterProgression(closedDeals, quarter, 200000, '2026-03-31');
    expect(result.totalClosedWon).toBe(100000);
  });

  it('should mark on track when projected total meets quota', () => {
    // 100000 closed in 90 days, 90-day quarter — should be on track for quota ≤ 100000
    const result = computeQuarterProgression(closedDeals, quarter, 90000, '2026-03-31');
    expect(result.onTrack).toBe(true);
  });

  it('should mark off track when projected total is below quota', () => {
    // With asOf at quarter end, paceRate = 100000/90 ≈ 1111/day,
    // projectedTotal ≈ 100000, which is below a quota of 500000.
    const result = computeQuarterProgression(closedDeals, quarter, 500000, '2026-03-31');
    expect(result.onTrack).toBe(false);
  });

  it('should include a data point for every day of the quarter', () => {
    const result = computeQuarterProgression(closedDeals, quarter, 200000, '2026-02-01');
    // Q1 has 90 days (Jan 31 + Feb 28 + Mar 31)
    expect(result.dataPoints).toHaveLength(90);
  });

  it('should show actual values for past dates', () => {
    const result = computeQuarterProgression(closedDeals, quarter, 200000, '2026-03-31');
    const jan10 = result.dataPoints.find((d) => d.date === '2026-01-10');
    expect(jan10?.actual).toBe(50000);
  });

  it('should include projected values for future dates', () => {
    const result = computeQuarterProgression(closedDeals, quarter, 200000, '2026-02-01');
    const march = result.dataPoints.find((d) => d.date === '2026-03-31');
    expect(march?.projected).toBeDefined();
  });

  it('should not show projected for past dates', () => {
    const result = computeQuarterProgression(closedDeals, quarter, 200000, '2026-03-31');
    const jan10 = result.dataPoints.find((d) => d.date === '2026-01-10');
    expect(jan10?.projected).toBeUndefined();
  });

  it('should show a linear quota line', () => {
    const result = computeQuarterProgression([], quarter, 90000, '2026-03-31');
    const lastDay = result.dataPoints[result.dataPoints.length - 1];
    expect(lastDay.quota).toBeCloseTo(90000, 0);
  });

  it('should exclude deals outside the quarter', () => {
    const mixedDeals: ClosedDeal[] = [
      ...closedDeals,
      { id: 'out', closedDate: '2025-12-31', amount: 999999 },
      { id: 'out2', closedDate: '2026-04-01', amount: 999999 },
    ];
    const result = computeQuarterProgression(mixedDeals, quarter, 200000, '2026-03-31');
    expect(result.totalClosedWon).toBe(100000);
  });

  it('should handle empty closed deals', () => {
    const result = computeQuarterProgression([], quarter, 200000, '2026-02-01');
    expect(result.totalClosedWon).toBe(0);
    expect(result.paceRate).toBe(0);
  });

  it('should compute quarter bounds correctly', () => {
    expect(quarterBounds(2026, 1)).toEqual({ start: '2026-01-01', end: '2026-03-31' });
    expect(quarterBounds(2026, 2)).toEqual({ start: '2026-04-01', end: '2026-06-30' });
    expect(quarterBounds(2026, 3)).toEqual({ start: '2026-07-01', end: '2026-09-30' });
    expect(quarterBounds(2026, 4)).toEqual({ start: '2026-10-01', end: '2026-12-31' });
  });
});
