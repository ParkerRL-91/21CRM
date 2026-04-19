import { computeQuarterProgression, quarterBounds, ClosedDeal } from './quarter-progression';

const q1 = quarterBounds(2026, 1); // 2026-01-01 to 2026-03-31

const makeDeal = (closedDate: string, amount: number): ClosedDeal => ({
  id: `deal-${closedDate}`,
  closedDate,
  amount,
});

describe('quarterBounds', () => {
  it('should return correct Q1 bounds', () => {
    expect(q1.start).toBe('2026-01-01');
    expect(q1.end).toBe('2026-03-31');
  });

  it('should return correct Q2 bounds', () => {
    const q2 = quarterBounds(2026, 2);
    expect(q2.start).toBe('2026-04-01');
    expect(q2.end).toBe('2026-06-30');
  });

  it('should return correct Q3 bounds', () => {
    const q3 = quarterBounds(2026, 3);
    expect(q3.start).toBe('2026-07-01');
    expect(q3.end).toBe('2026-09-30');
  });

  it('should return correct Q4 bounds', () => {
    const q4 = quarterBounds(2026, 4);
    expect(q4.start).toBe('2026-10-01');
    expect(q4.end).toBe('2026-12-31');
  });
});

describe('computeQuarterProgression', () => {
  it('should return 0 totalClosedWon when no deals are in the quarter', () => {
    const result = computeQuarterProgression([], q1, 100000, '2026-02-15');
    expect(result.totalClosedWon).toBe(0);
  });

  it('should exclude deals outside the quarter', () => {
    const deals = [makeDeal('2025-12-31', 50000), makeDeal('2026-04-01', 50000)];
    const result = computeQuarterProgression(deals, q1, 100000, '2026-03-31');
    expect(result.totalClosedWon).toBe(0);
  });

  it('should sum deals within the quarter', () => {
    const deals = [makeDeal('2026-01-15', 30000), makeDeal('2026-02-20', 20000)];
    const result = computeQuarterProgression(deals, q1, 100000, '2026-03-31');
    expect(result.totalClosedWon).toBe(50000);
  });

  it('should mark onTrack = true when projectedTotal >= quota', () => {
    // All 100000 closed by midpoint — pace will project to well over quota
    const deals = [makeDeal('2026-01-01', 100000)];
    const result = computeQuarterProgression(deals, q1, 100000, '2026-01-31');
    expect(result.onTrack).toBe(true);
  });

  it('should mark onTrack = false when projected falls short of quota', () => {
    const result = computeQuarterProgression([], q1, 1000000, '2026-02-15');
    expect(result.onTrack).toBe(false);
  });

  it('should produce one data point per day in the quarter', () => {
    const result = computeQuarterProgression([], q1, 100000, '2026-03-31');
    // Q1 2026 = Jan(31) + Feb(28) + Mar(31) = 90 days
    expect(result.dataPoints).toHaveLength(90);
  });

  it('should set quota line as linear ramp', () => {
    const result = computeQuarterProgression([], q1, 90000, '2026-01-01');
    // First day: 90000 / 90 days ≈ 1000
    expect(result.dataPoints[0].quota).toBeCloseTo(1000, 0);
    // Last day should equal full quota
    expect(result.dataPoints[89].quota).toBe(90000);
  });

  it('should set projected values only on future dates', () => {
    const result = computeQuarterProgression([], q1, 100000, '2026-02-01');
    const pastPoints = result.dataPoints.filter((d) => d.date <= '2026-02-01');
    const futurePoints = result.dataPoints.filter((d) => d.date > '2026-02-01');
    pastPoints.forEach((p) => expect(p.projected).toBeUndefined());
    futurePoints.forEach((p) => expect(p.projected).toBeDefined());
  });
});
