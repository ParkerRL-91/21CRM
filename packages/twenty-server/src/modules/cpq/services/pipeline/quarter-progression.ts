// Quarter progression chart engine.
// Produces cumulative closed-won vs quota data points with a pace projection
// to quarter-end, suitable for a line/area chart.

import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type ClosedDeal = {
  id: string;
  closedDate: string; // ISO date string — the date the deal closed won
  amount: number;
};

export type QuarterBounds = {
  start: string; // ISO date — first day of quarter
  end: string;   // ISO date — last day of quarter
};

export type ProgressionDataPoint = {
  date: string;       // ISO date
  actual: number;     // cumulative closed-won through this date (null if future)
  quota: number;      // linear quota ramp through this date
  projected?: number; // pace projection (present on future dates)
};

export type QuarterProgressionResult = {
  quarter: QuarterBounds;
  quota: number;
  totalClosedWon: number;
  paceRate: number;        // dollars closed per calendar day so far
  projectedTotal: number;  // extrapolated total at quarter-end
  onTrack: boolean;        // projectedTotal >= quota
  dataPoints: ProgressionDataPoint[];
};

// Parse ISO date string to midnight UTC Date
function parseDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

// Format Date to ISO date string YYYY-MM-DD
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Add N calendar days to a Date
function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}

// Number of days between two dates (inclusive start, exclusive end)
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// Compute the quarter progression data.
// Closed-won deals outside the quarter bounds are ignored.
// asOf defaults to current date for pace projection.
export function computeQuarterProgression(
  deals: ClosedDeal[],
  quarter: QuarterBounds,
  quota: number,
  asOf?: string,
): QuarterProgressionResult {
  const qStart = parseDate(quarter.start);
  const qEnd = parseDate(quarter.end);
  const today = asOf ? parseDate(asOf) : new Date();

  const qTotalDays = daysBetween(qStart, qEnd) + 1; // inclusive

  // Filter deals within quarter, sort by date
  const inQuarter = deals
    .filter((d) => {
      const dt = parseDate(d.closedDate);
      return dt >= qStart && dt <= qEnd;
    })
    .sort((a, b) => a.closedDate.localeCompare(b.closedDate));

  // Build cumulative closed-won by day
  const cumByDate = new Map<string, number>();
  let running = 0;
  for (const deal of inQuarter) {
    running = new Decimal(running).plus(deal.amount).toNumber();
    cumByDate.set(deal.closedDate, running);
  }

  // Fill forward: for each day in quarter, carry last cumulative value
  const filledCum = new Map<string, number>();
  let lastCum = 0;
  let cursor = new Date(qStart);
  while (cursor <= qEnd) {
    const key = formatDate(cursor);
    if (cumByDate.has(key)) lastCum = cumByDate.get(key)!;
    filledCum.set(key, lastCum);
    cursor = addDays(cursor, 1);
  }

  const totalClosedWon = lastCum;

  // Pace = closed won per day elapsed so far in quarter
  const daysElapsed = Math.max(1, daysBetween(qStart, today <= qEnd ? today : addDays(qEnd, 1)));
  const paceRate = new Decimal(totalClosedWon).dividedBy(daysElapsed).toNumber();
  const projectedTotal = new Decimal(paceRate).times(qTotalDays).toDecimalPlaces(2).toNumber();

  // Build data points for every day of the quarter
  const dataPoints: ProgressionDataPoint[] = [];
  cursor = new Date(qStart);
  let dayNum = 0;
  while (cursor <= qEnd) {
    const key = formatDate(cursor);
    dayNum++;
    const quotaLine = new Decimal(quota)
      .times(dayNum)
      .dividedBy(qTotalDays)
      .toDecimalPlaces(2)
      .toNumber();

    const isPast = cursor <= today;
    const actual = isPast ? filledCum.get(key) ?? 0 : undefined;
    const projected = !isPast
      ? new Decimal(paceRate).times(dayNum).toDecimalPlaces(2).toNumber()
      : undefined;

    dataPoints.push({
      date: key,
      actual: actual ?? 0,
      quota: quotaLine,
      ...(projected !== undefined ? { projected } : {}),
    });

    cursor = addDays(cursor, 1);
  }

  return {
    quarter,
    quota,
    totalClosedWon,
    paceRate: new Decimal(paceRate).toDecimalPlaces(2).toNumber(),
    projectedTotal,
    onTrack: projectedTotal >= quota,
    dataPoints,
  };
}

// Helper: derive standard quarter bounds from a year+quarter number (1-4).
export function quarterBounds(year: number, q: 1 | 2 | 3 | 4): QuarterBounds {
  const startMonths: Record<number, number> = { 1: 1, 2: 4, 3: 7, 4: 10 };
  const startMonth = startMonths[q];
  const endMonth = startMonth + 2;
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDays: Record<number, number> = { 3: 31, 6: 30, 9: 30, 12: 31 };
  return {
    start: `${year}-${pad(startMonth)}-01`,
    end: `${year}-${pad(endMonth)}-${lastDays[endMonth]}`,
  };
}
