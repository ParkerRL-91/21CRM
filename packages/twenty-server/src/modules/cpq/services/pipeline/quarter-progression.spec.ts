import { computeQuarterProgression, quarterBounds, ClosedDeal, QuarterBounds } from './quarter-progression';

describe('computeQuarterProgression', () => {
  // Q1 2026: Jan 1 – Mar 31 (90 days)
  const Q1_2026: QuarterBounds = { start: '2026-01-01', end: '2026-03-31' };

  function makeDeal(id: string, closedDate: string, amount: number): ClosedDeal {
    return { id, closedDate, amount };
  }

  describe('deals within quarter counted correctly', () => {
    it('counts a single deal closed inside the quarter', () => {
      const deals = [makeDeal('d1', '2026-02-15', 50000)];
      const result = computeQuarterProgression(deals, Q1_2026, 200000, '2026-03-31');

      expect(result.totalClosedWon).toBe(50000);
    });

    it('sums multiple deals closed within the quarter', () => {
      const deals = [
        makeDeal('d1', '2026-01-10', 10000),
        makeDeal('d2', '2026-02-20', 30000),
        makeDeal('d3', '2026-03-15', 20000),
      ];
      const result = computeQuarterProgression(deals, Q1_2026, 200000, '2026-03-31');

      expect(result.totalClosedWon).toBe(60000);
    });
  });

  describe('deals outside quarter excluded', () => {
    it('excludes deals closed before quarter start', () => {
      const deals = [
        makeDeal('d1', '2025-12-31', 99999), // day before Q1 2026
        makeDeal('d2', '2026-01-01', 10000), // first day of quarter
      ];
      const result = computeQuarterProgression(deals, Q1_2026, 200000, '2026-03-31');

      expect(result.totalClosedWon).toBe(10000);
    });

    it('excludes deals closed after quarter end', () => {
      const deals = [
        makeDeal('d1', '2026-03-31', 10000), // last day of quarter
        makeDeal('d2', '2026-04-01', 50000), // first day after quarter
      ];
      const result = computeQuarterProgression(deals, Q1_2026, 200000, '2026-03-31');

      expect(result.totalClosedWon).toBe(10000);
    });
  });

  describe('pace extrapolation to quarter end', () => {
    it('extrapolates correctly when asOf is mid-quarter', () => {
      // 50 days into a 90-day quarter, $50k closed → pace = $1000/day
      // projected = $1000 × 90 = $90000
      const deals = [makeDeal('d1', '2026-01-01', 50000)];
      const result = computeQuarterProgression(deals, Q1_2026, 200000, '2026-02-19');
      // days elapsed = Jan 1 to Feb 19 = 49 days, paceRate = 50000/49 ≈ 1020.41
      // projected = paceRate × 90

      expect(result.paceRate).toBeGreaterThan(0);
      expect(result.projectedTotal).toBeGreaterThan(0);
      expect(result.projectedTotal).toBeCloseTo(result.paceRate * 90, 0);
    });

    it('pace is zero when no deals closed', () => {
      const result = computeQuarterProgression([], Q1_2026, 200000, '2026-02-01');

      expect(result.paceRate).toBe(0);
      expect(result.projectedTotal).toBe(0);
    });
  });

  describe('onTrack flag', () => {
    it('returns onTrack: true when projected >= quota', () => {
      // Fast pace: $150k closed in first 45 days → projects to $300k >= $200k quota
      const deals = [makeDeal('d1', '2026-01-01', 150000)];
      const result = computeQuarterProgression(deals, Q1_2026, 200000, '2026-02-14');

      expect(result.onTrack).toBe(true);
    });

    it('returns onTrack: false when projected < quota', () => {
      // Slow pace: $1k closed in first 45 days → projects to $2k << $200k quota
      const deals = [makeDeal('d1', '2026-01-01', 1000)];
      const result = computeQuarterProgression(deals, Q1_2026, 200000, '2026-02-14');

      expect(result.onTrack).toBe(false);
    });
  });

  describe('data points', () => {
    it('produces one data point per day of the quarter', () => {
      const result = computeQuarterProgression([], Q1_2026, 200000, '2026-03-31');
      // Q1 2026 is 90 days
      expect(result.dataPoints).toHaveLength(90);
    });

    it('data points have quota set proportionally', () => {
      const quota = 90000; // easy: $1000 per day in 90-day quarter
      const result = computeQuarterProgression([], Q1_2026, quota, '2026-03-31');

      // Day 1 quota ≈ 1000 (= 90000 / 90)
      expect(result.dataPoints[0].quota).toBeCloseTo(1000, 0);
      // Last day quota = full quota
      expect(result.dataPoints[89].quota).toBe(quota);
    });

    it('past days have actual values; future days have projected values', () => {
      const asOf = '2026-02-01'; // mid-quarter
      const result = computeQuarterProgression([], Q1_2026, 200000, asOf);
      const firstDay = result.dataPoints[0]; // Jan 1 — past
      const lastDay = result.dataPoints[89]; // Mar 31 — future

      expect(firstDay.actual).toBeDefined();
      expect(lastDay.projected).toBeDefined();
    });
  });

  describe('empty deal list (0 closed won)', () => {
    it('returns zero closed won and zero pace', () => {
      const result = computeQuarterProgression([], Q1_2026, 100000, '2026-03-31');

      expect(result.totalClosedWon).toBe(0);
      expect(result.paceRate).toBe(0);
      expect(result.projectedTotal).toBe(0);
      expect(result.onTrack).toBe(false);
    });
  });
});

describe('quarterBounds', () => {
  it('returns correct bounds for Q1', () => {
    const bounds = quarterBounds(2026, 1);
    expect(bounds.start).toBe('2026-01-01');
    expect(bounds.end).toBe('2026-03-31');
  });

  it('returns correct bounds for Q2', () => {
    const bounds = quarterBounds(2026, 2);
    expect(bounds.start).toBe('2026-04-01');
    expect(bounds.end).toBe('2026-06-30');
  });

  it('returns correct bounds for Q3', () => {
    const bounds = quarterBounds(2026, 3);
    expect(bounds.start).toBe('2026-07-01');
    expect(bounds.end).toBe('2026-09-30');
  });

  it('returns correct bounds for Q4', () => {
    const bounds = quarterBounds(2026, 4);
    expect(bounds.start).toBe('2026-10-01');
    expect(bounds.end).toBe('2026-12-31');
  });
});
