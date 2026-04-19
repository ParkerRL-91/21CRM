// Projected revenue recognition engine.
//
// Three modes:
//   1. closed_only    — Recognized revenue from closed-won deals only
//   2. plus_pipeline  — Closed-won + probability-weighted open pipeline
//   3. plus_quotes    — Closed-won + pipeline + probability-weighted open quotes
//
// Each mode produces a monthly schedule of projected recognized revenue,
// spreading deal/quote amounts evenly over their subscription term.

import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type RevRecMode = 'closed_only' | 'plus_pipeline' | 'plus_quotes';

export type ClosedDeal = {
  id: string;
  amount: number;          // Total contract value
  startDate: string;       // ISO date — recognition start
  endDate: string;         // ISO date — recognition end (inclusive month)
  ownerId?: string;
};

export type PipelineDeal = {
  id: string;
  amount: number;
  probability: number;     // 0-100
  startDate: string;
  endDate: string;
  ownerId?: string;
};

export type OpenQuote = {
  id: string;
  amount: number;
  probability: number;     // 0-100
  startDate: string;
  endDate: string;
  ownerId?: string;
};

export type MonthlyRevRecSchedule = {
  month: string;           // YYYY-MM
  closedOnly: number;
  pipelineContribution: number;
  quotesContribution: number;
  total: number;
};

export type ProjectedRevRecResult = {
  mode: RevRecMode;
  schedule: MonthlyRevRecSchedule[];
  totalProjected: number;
  closedOnlyTotal: number;
  pipelineContributionTotal: number;
  quotesContributionTotal: number;
};

// ============================================================================
// Date utilities
// ============================================================================

// Parse YYYY-MM or YYYY-MM-DD to { year, month } (1-indexed month)
function parseYearMonth(iso: string): { year: number; month: number } {
  const parts = iso.split('-');
  return { year: parseInt(parts[0]), month: parseInt(parts[1]) };
}

// Format { year, month } to YYYY-MM
function toYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Number of months between two YYYY-MM strings (inclusive).
function monthsBetween(start: string, end: string): number {
  const s = parseYearMonth(start);
  const e = parseYearMonth(end);
  return (e.year - s.year) * 12 + (e.month - s.month) + 1;
}

// Advance by N months.
function addMonths(base: { year: number; month: number }, n: number): { year: number; month: number } {
  const totalMonths = base.year * 12 + (base.month - 1) + n;
  return { year: Math.floor(totalMonths / 12), month: (totalMonths % 12) + 1 };
}

// ============================================================================
// Recognition spreader
// ============================================================================

type SpreadItem = {
  amount: number;
  startDate: string; // YYYY-MM or YYYY-MM-DD
  endDate: string;
  weight: number;    // 0-1 multiplier (probability / 100 for pipeline/quotes; 1 for closed)
};

// Spread a deal's amount evenly over its term and return per-month amounts.
// Returns a map of YYYY-MM → contribution.
function spreadOverTerm(item: SpreadItem): Map<string, number> {
  const result = new Map<string, number>();

  const startYM = item.startDate.substring(0, 7);
  const endYM = item.endDate.substring(0, 7);
  const months = monthsBetween(startYM, endYM);

  if (months <= 0) return result;

  const monthlyAmount = new Decimal(item.amount)
    .times(item.weight)
    .dividedBy(months)
    .toDecimalPlaces(2)
    .toNumber();

  let cursor = parseYearMonth(startYM);
  for (let i = 0; i < months; i++) {
    const key = toYearMonth(cursor.year, cursor.month);
    result.set(key, new Decimal(result.get(key) ?? 0).plus(monthlyAmount).toDecimalPlaces(2).toNumber());
    cursor = addMonths(cursor, 1);
  }

  return result;
}

// ============================================================================
// Core engine
// ============================================================================

function buildEmptySchedule(months: Set<string>): Map<string, MonthlyRevRecSchedule> {
  const map = new Map<string, MonthlyRevRecSchedule>();
  for (const m of months) {
    map.set(m, {
      month: m,
      closedOnly: 0,
      pipelineContribution: 0,
      quotesContribution: 0,
      total: 0,
    });
  }
  return map;
}

function collectMonths(...spreadMaps: Map<string, number>[]): Set<string> {
  const months = new Set<string>();
  for (const m of spreadMaps) {
    for (const k of m.keys()) months.add(k);
  }
  return months;
}

export function computeProjectedRevRec(
  closed: ClosedDeal[],
  pipeline: PipelineDeal[],
  quotes: OpenQuote[],
  mode: RevRecMode,
): ProjectedRevRecResult {
  // Spread each source into monthly maps
  const closedMaps = closed.map((d) =>
    spreadOverTerm({ amount: d.amount, startDate: d.startDate, endDate: d.endDate, weight: 1 }),
  );
  const pipelineMaps = pipeline.map((d) =>
    spreadOverTerm({ amount: d.amount, startDate: d.startDate, endDate: d.endDate, weight: d.probability / 100 }),
  );
  const quoteMaps = quotes.map((q) =>
    spreadOverTerm({ amount: q.amount, startDate: q.startDate, endDate: q.endDate, weight: q.probability / 100 }),
  );

  // Aggregate each source into a single monthly map
  function aggregate(maps: Map<string, number>[]): Map<string, number> {
    const agg = new Map<string, number>();
    for (const m of maps) {
      for (const [k, v] of m) {
        agg.set(k, new Decimal(agg.get(k) ?? 0).plus(v).toDecimalPlaces(2).toNumber());
      }
    }
    return agg;
  }

  const closedAgg = aggregate(closedMaps);
  const pipelineAgg = mode !== 'closed_only' ? aggregate(pipelineMaps) : new Map<string, number>();
  const quotesAgg = mode === 'plus_quotes' ? aggregate(quoteMaps) : new Map<string, number>();

  // Collect all months across all active sources
  const allMonths = collectMonths(closedAgg, pipelineAgg, quotesAgg);
  const scheduleMap = buildEmptySchedule(allMonths);

  for (const [month, entry] of scheduleMap) {
    const c = closedAgg.get(month) ?? 0;
    const p = pipelineAgg.get(month) ?? 0;
    const q = quotesAgg.get(month) ?? 0;
    entry.closedOnly = c;
    entry.pipelineContribution = p;
    entry.quotesContribution = q;
    entry.total = new Decimal(c).plus(p).plus(q).toDecimalPlaces(2).toNumber();
  }

  const schedule = Array.from(scheduleMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );

  const closedOnlyTotal = schedule.reduce((s, r) => new Decimal(s).plus(r.closedOnly).toDecimalPlaces(2).toNumber(), 0);
  const pipelineContributionTotal = schedule.reduce((s, r) => new Decimal(s).plus(r.pipelineContribution).toDecimalPlaces(2).toNumber(), 0);
  const quotesContributionTotal = schedule.reduce((s, r) => new Decimal(s).plus(r.quotesContribution).toDecimalPlaces(2).toNumber(), 0);

  return {
    mode,
    schedule,
    totalProjected: new Decimal(closedOnlyTotal).plus(pipelineContributionTotal).plus(quotesContributionTotal).toDecimalPlaces(2).toNumber(),
    closedOnlyTotal,
    pipelineContributionTotal,
    quotesContributionTotal,
  };
}
