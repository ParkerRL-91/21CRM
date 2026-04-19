import { describe, it, expect } from 'vitest';
import {
  computeProjectedRevRec,
  ClosedDeal,
  PipelineDeal,
  OpenQuote,
} from './projected-rev-rec';

// ============================================================================
// Fixtures
// ============================================================================

const closedAnnual: ClosedDeal = {
  id: 'c1',
  amount: 12_000,  // $1,000/month over 12 months
  startDate: '2026-01-01',
  endDate: '2026-12-31',
};

const closedQuarterly: ClosedDeal = {
  id: 'c2',
  amount: 6_000,   // $2,000/month over 3 months
  startDate: '2026-04-01',
  endDate: '2026-06-30',
};

const pipelineDeal: PipelineDeal = {
  id: 'p1',
  amount: 24_000,  // 12-month deal, 50% probability → $1,000/month weighted
  probability: 50,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
};

const openQuote: OpenQuote = {
  id: 'q1',
  amount: 6_000,   // 3-month deal, 80% probability → $1,600/month weighted
  probability: 80,
  startDate: '2026-07-01',
  endDate: '2026-09-30',
};

// ============================================================================
// closed_only mode
// ============================================================================

describe('computeProjectedRevRec — closed_only', () => {
  it('returns only closed deal contributions', () => {
    const result = computeProjectedRevRec([closedAnnual], [pipelineDeal], [openQuote], 'closed_only');
    expect(result.mode).toBe('closed_only');
    expect(result.pipelineContributionTotal).toBe(0);
    expect(result.quotesContributionTotal).toBe(0);
  });

  it('spreads annual deal evenly across 12 months', () => {
    const result = computeProjectedRevRec([closedAnnual], [], [], 'closed_only');
    expect(result.schedule).toHaveLength(12);
    const jan = result.schedule.find((r) => r.month === '2026-01');
    expect(jan?.closedOnly).toBe(1_000);
  });

  it('sums total closed amount', () => {
    const result = computeProjectedRevRec([closedAnnual], [], [], 'closed_only');
    expect(result.closedOnlyTotal).toBe(12_000);
    expect(result.totalProjected).toBe(12_000);
  });

  it('handles empty inputs', () => {
    const result = computeProjectedRevRec([], [], [], 'closed_only');
    expect(result.schedule).toHaveLength(0);
    expect(result.totalProjected).toBe(0);
  });

  it('merges multiple closed deals in the same month', () => {
    const result = computeProjectedRevRec([closedAnnual, closedQuarterly], [], [], 'closed_only');
    const apr = result.schedule.find((r) => r.month === '2026-04');
    expect(apr?.closedOnly).toBe(3_000); // 1,000 (annual) + 2,000 (quarterly)
  });
});

// ============================================================================
// plus_pipeline mode
// ============================================================================

describe('computeProjectedRevRec — plus_pipeline', () => {
  it('includes pipeline contribution', () => {
    const result = computeProjectedRevRec([closedAnnual], [pipelineDeal], [], 'plus_pipeline');
    expect(result.pipelineContributionTotal).toBeGreaterThan(0);
    expect(result.quotesContributionTotal).toBe(0);
  });

  it('applies probability weighting to pipeline deals', () => {
    const result = computeProjectedRevRec([], [pipelineDeal], [], 'plus_pipeline');
    // $24,000 × 50% = $12,000 total weighted, spread over 12 months = $1,000/mo
    expect(result.pipelineContributionTotal).toBe(12_000);
    const jan = result.schedule.find((r) => r.month === '2026-01');
    expect(jan?.pipelineContribution).toBe(1_000);
  });

  it('totals include both closed and pipeline', () => {
    const result = computeProjectedRevRec([closedAnnual], [pipelineDeal], [], 'plus_pipeline');
    expect(result.totalProjected).toBe(result.closedOnlyTotal + result.pipelineContributionTotal);
  });

  it('0% probability pipeline deal contributes nothing', () => {
    const zeroPipeline: PipelineDeal = { ...pipelineDeal, probability: 0 };
    const result = computeProjectedRevRec([], [zeroPipeline], [], 'plus_pipeline');
    expect(result.pipelineContributionTotal).toBe(0);
  });

  it('100% probability pipeline deal contributes full amount', () => {
    const certain: PipelineDeal = { ...pipelineDeal, probability: 100 };
    const result = computeProjectedRevRec([], [certain], [], 'plus_pipeline');
    expect(result.pipelineContributionTotal).toBe(24_000);
  });
});

// ============================================================================
// plus_quotes mode
// ============================================================================

describe('computeProjectedRevRec — plus_quotes', () => {
  it('includes all three contributions', () => {
    const result = computeProjectedRevRec(
      [closedAnnual],
      [pipelineDeal],
      [openQuote],
      'plus_quotes',
    );
    expect(result.closedOnlyTotal).toBeGreaterThan(0);
    expect(result.pipelineContributionTotal).toBeGreaterThan(0);
    expect(result.quotesContributionTotal).toBeGreaterThan(0);
  });

  it('applies probability weighting to quotes', () => {
    const result = computeProjectedRevRec([], [], [openQuote], 'plus_quotes');
    // $6,000 × 80% = $4,800 total weighted, spread over 3 months = $1,600/mo
    expect(result.quotesContributionTotal).toBe(4_800);
    const jul = result.schedule.find((r) => r.month === '2026-07');
    expect(jul?.quotesContribution).toBe(1_600);
  });

  it('closed_only mode ignores quotes even when provided', () => {
    const result = computeProjectedRevRec([], [], [openQuote], 'closed_only');
    expect(result.quotesContributionTotal).toBe(0);
  });

  it('plus_pipeline mode ignores quotes even when provided', () => {
    const result = computeProjectedRevRec([], [pipelineDeal], [openQuote], 'plus_pipeline');
    expect(result.quotesContributionTotal).toBe(0);
  });
});

// ============================================================================
// Schedule ordering
// ============================================================================

describe('schedule ordering', () => {
  it('returns months in chronological order', () => {
    const result = computeProjectedRevRec([closedAnnual], [], [], 'closed_only');
    const months = result.schedule.map((r) => r.month);
    expect(months).toEqual([...months].sort());
  });

  it('schedule month total equals sum of contributions', () => {
    const result = computeProjectedRevRec([closedAnnual], [pipelineDeal], [openQuote], 'plus_quotes');
    for (const row of result.schedule) {
      const expected = Math.round((row.closedOnly + row.pipelineContribution + row.quotesContribution) * 100) / 100;
      expect(row.total).toBeCloseTo(expected, 2);
    }
  });
});
