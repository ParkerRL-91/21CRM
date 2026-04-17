import { RevenueWaterfallEngine } from './revenue-waterfall';
import type { RevRecScheduleRecord, WaterfallPeriod } from './revenue-waterfall';

describe('RevenueWaterfallEngine', () => {
  let engine: RevenueWaterfallEngine;

  beforeEach(() => {
    engine = new RevenueWaterfallEngine();
  });

  const makeSchedule = (overrides: Partial<RevRecScheduleRecord> = {}): RevRecScheduleRecord => ({
    dealHubspotId: 'deal-1',
    totalAmount: '12000',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    monthlySchedule: {
      '2026-01': 1000, '2026-02': 1000, '2026-03': 1000,
      '2026-04': 1000, '2026-05': 1000, '2026-06': 1000,
      '2026-07': 1000, '2026-08': 1000, '2026-09': 1000,
      '2026-10': 1000, '2026-11': 1000, '2026-12': 1000,
    },
    ...overrides,
  });

  const q1Period: WaterfallPeriod = { startMonth: '2026-01', endMonth: '2026-03' };

  it('computes correct waterfall for single schedule over Q1', () => {
    const result = engine.computeWaterfall([makeSchedule()], q1Period);

    expect(result.rows).toHaveLength(3);

    // Month 1: Opening=12000 (full contract deferred), new bookings=12000, recognition=1000
    expect(result.rows[0].month).toBe('2026-01');
    expect(result.rows[0].openingDeferred).toBe('12000');
    expect(result.rows[0].newBookings).toBe('12000');
    expect(result.rows[0].recognition).toBe('1000');
    expect(result.rows[0].closingDeferred).toBe('23000'); // 12000 + 12000 - 1000

    // Closing of last month = opening of next
    expect(result.rows[1].openingDeferred).toBe(result.rows[0].closingDeferred);
  });

  it('computes correct summary totals', () => {
    const result = engine.computeWaterfall([makeSchedule()], q1Period);
    expect(result.summary.totalRecognized).toBe('3000'); // 1000 * 3 months
    expect(result.summary.periodCount).toBe(3);
  });

  it('handles multiple schedules', () => {
    const schedules = [
      makeSchedule({ dealHubspotId: 'deal-1', totalAmount: '12000' }),
      makeSchedule({ dealHubspotId: 'deal-2', totalAmount: '6000', monthlySchedule: {
        '2026-01': 500, '2026-02': 500, '2026-03': 500,
        '2026-04': 500, '2026-05': 500, '2026-06': 500,
        '2026-07': 500, '2026-08': 500, '2026-09': 500,
        '2026-10': 500, '2026-11': 500, '2026-12': 500,
      }}),
    ];
    const result = engine.computeWaterfall(schedules, q1Period);
    expect(result.summary.totalRecognized).toBe('4500'); // (1000 + 500) * 3
  });

  it('handles empty schedules', () => {
    const result = engine.computeWaterfall([], q1Period);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].recognition).toBe('0');
    expect(result.rows[0].openingDeferred).toBe('0');
  });

  it('handles mid-year start with pre-existing deferred', () => {
    const schedule = makeSchedule();
    const q2Period: WaterfallPeriod = { startMonth: '2026-04', endMonth: '2026-06' };
    const result = engine.computeWaterfall([schedule], q2Period);

    // By Q2, 3 months already recognized (3000), so deferred = 12000 - 3000 = 9000
    expect(result.rows[0].openingDeferred).toBe('9000');
  });

  it('generates correct month range', () => {
    const fullYear: WaterfallPeriod = { startMonth: '2026-01', endMonth: '2026-12' };
    const result = engine.computeWaterfall([], fullYear);
    expect(result.rows).toHaveLength(12);
    expect(result.rows[0].month).toBe('2026-01');
    expect(result.rows[11].month).toBe('2026-12');
  });

  it('handles cross-year ranges', () => {
    const crossYear: WaterfallPeriod = { startMonth: '2025-11', endMonth: '2026-02' };
    const result = engine.computeWaterfall([], crossYear);
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0].month).toBe('2025-11');
    expect(result.rows[3].month).toBe('2026-02');
  });
});
