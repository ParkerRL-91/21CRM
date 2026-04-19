import {
  computeProjectedRevRec,
  ClosedDeal,
  PipelineDeal,
  OpenQuote,
} from './projected-rev-rec';

describe('computeProjectedRevRec', () => {
  // Helper to build a closed deal with a 12-month term
  function closedDeal(id: string, amount: number, startDate = '2026-01-01', endDate = '2026-12-31'): ClosedDeal {
    return { id, amount, startDate, endDate };
  }

  // Helper to build a pipeline deal
  function pipelineDeal(id: string, amount: number, probability: number, startDate = '2026-01-01', endDate = '2026-12-31'): PipelineDeal {
    return { id, amount, probability, startDate, endDate };
  }

  // Helper to build an open quote
  function openQuote(id: string, amount: number, probability: number, startDate = '2026-01-01', endDate = '2026-12-31'): OpenQuote {
    return { id, amount, probability, startDate, endDate };
  }

  describe('closed_only mode', () => {
    it('returns zero for empty input', () => {
      const result = computeProjectedRevRec([], [], [], 'closed_only');

      expect(result.closedOnlyTotal).toBe(0);
      expect(result.pipelineContributionTotal).toBe(0);
      expect(result.quotesContributionTotal).toBe(0);
      expect(result.totalProjected).toBe(0);
      expect(result.schedule).toHaveLength(0);
    });

    it('sums closed won deal amounts spread over their term', () => {
      // $12,000 over 12 months = $1,000/month
      const deal = closedDeal('d1', 12000, '2026-01-01', '2026-12-31');
      const result = computeProjectedRevRec([deal], [], [], 'closed_only');

      expect(result.closedOnlyTotal).toBe(12000);
      expect(result.pipelineContributionTotal).toBe(0);
      expect(result.schedule).toHaveLength(12);
      // Each month should be $1000
      for (const row of result.schedule) {
        expect(row.closedOnly).toBe(1000);
        expect(row.pipelineContribution).toBe(0);
        expect(row.quotesContribution).toBe(0);
        expect(row.total).toBe(1000);
      }
    });

    it('sums multiple closed deals across overlapping months', () => {
      const d1 = closedDeal('d1', 12000, '2026-01-01', '2026-12-31'); // $1000/mo
      const d2 = closedDeal('d2', 6000, '2026-07-01', '2026-12-31');  // $1000/mo (6 months)
      const result = computeProjectedRevRec([d1, d2], [], [], 'closed_only');

      // Jan–Jun: only d1 = $1000/mo; Jul–Dec: d1 + d2 = $2000/mo
      const jan = result.schedule.find((s) => s.month === '2026-01');
      const jul = result.schedule.find((s) => s.month === '2026-07');

      expect(jan?.closedOnly).toBe(1000);
      expect(jul?.closedOnly).toBe(2000);
    });

    it('ignores pipeline deals in closed_only mode', () => {
      const pipeline = [pipelineDeal('p1', 100000, 80)];
      const result = computeProjectedRevRec([], pipeline, [], 'closed_only');

      expect(result.pipelineContributionTotal).toBe(0);
      expect(result.totalProjected).toBe(0);
    });
  });

  describe('plus_pipeline mode', () => {
    it('adds probability-weighted pipeline amounts to closed', () => {
      const closed = [closedDeal('d1', 12000, '2026-01-01', '2026-12-31')]; // $1000/mo
      const pipeline = [pipelineDeal('p1', 12000, 50, '2026-01-01', '2026-12-31')]; // 50% × $1000/mo = $500/mo
      const result = computeProjectedRevRec(closed, pipeline, [], 'plus_pipeline');

      expect(result.pipelineContributionTotal).toBe(6000); // 50% of 12000
      expect(result.closedOnlyTotal).toBe(12000);
      expect(result.totalProjected).toBe(18000);

      const jan = result.schedule.find((s) => s.month === '2026-01');
      expect(jan?.closedOnly).toBe(1000);
      expect(jan?.pipelineContribution).toBe(500);
      expect(jan?.total).toBe(1500);
    });

    it('ignores quotes in plus_pipeline mode', () => {
      const quotes = [openQuote('q1', 100000, 90)];
      const result = computeProjectedRevRec([], [], quotes, 'plus_pipeline');

      expect(result.quotesContributionTotal).toBe(0);
    });

    it('handles 0% probability pipeline deal (contributes nothing)', () => {
      const pipeline = [pipelineDeal('p1', 50000, 0)];
      const result = computeProjectedRevRec([], pipeline, [], 'plus_pipeline');

      expect(result.pipelineContributionTotal).toBe(0);
    });

    it('handles 100% probability pipeline deal (full amount)', () => {
      const pipeline = [pipelineDeal('p1', 12000, 100, '2026-01-01', '2026-12-31')];
      const result = computeProjectedRevRec([], pipeline, [], 'plus_pipeline');

      expect(result.pipelineContributionTotal).toBe(12000);
    });
  });

  describe('plus_quotes mode', () => {
    it('adds probability-weighted quote amounts on top of pipeline', () => {
      const closed = [closedDeal('d1', 12000, '2026-01-01', '2026-12-31')];
      const pipeline = [pipelineDeal('p1', 12000, 50, '2026-01-01', '2026-12-31')];
      const quotes = [openQuote('q1', 12000, 25, '2026-01-01', '2026-12-31')]; // 25% × $1000/mo = $250/mo
      const result = computeProjectedRevRec(closed, pipeline, quotes, 'plus_quotes');

      expect(result.closedOnlyTotal).toBe(12000);
      expect(result.pipelineContributionTotal).toBe(6000);
      expect(result.quotesContributionTotal).toBe(3000); // 25% of 12000
      expect(result.totalProjected).toBe(21000);
    });

    it('returns correct mode label', () => {
      const result = computeProjectedRevRec([], [], [], 'plus_quotes');
      expect(result.mode).toBe('plus_quotes');
    });
  });

  describe('monthly spreading', () => {
    it('spreads a 3-month deal over exactly 3 months', () => {
      const deal = closedDeal('d1', 3000, '2026-01-01', '2026-03-31');
      const result = computeProjectedRevRec([deal], [], [], 'closed_only');

      expect(result.schedule).toHaveLength(3);
      expect(result.schedule[0].month).toBe('2026-01');
      expect(result.schedule[1].month).toBe('2026-02');
      expect(result.schedule[2].month).toBe('2026-03');
      for (const row of result.schedule) {
        expect(row.closedOnly).toBe(1000);
      }
    });

    it('spreads a 1-month deal entirely into that month', () => {
      const deal = closedDeal('d1', 5000, '2026-06-01', '2026-06-30');
      const result = computeProjectedRevRec([deal], [], [], 'closed_only');

      expect(result.schedule).toHaveLength(1);
      expect(result.schedule[0].month).toBe('2026-06');
      expect(result.schedule[0].closedOnly).toBe(5000);
    });

    it('schedule is sorted chronologically by month', () => {
      const d1 = closedDeal('d1', 6000, '2026-03-01', '2026-05-31');
      const d2 = closedDeal('d2', 3000, '2026-01-01', '2026-02-28');
      const result = computeProjectedRevRec([d1, d2], [], [], 'closed_only');

      const months = result.schedule.map((s) => s.month);
      const sorted = [...months].sort();
      expect(months).toEqual(sorted);
    });
  });

  describe('empty input arrays', () => {
    it('returns empty schedule for all-empty input in any mode', () => {
      for (const mode of ['closed_only', 'plus_pipeline', 'plus_quotes'] as const) {
        const result = computeProjectedRevRec([], [], [], mode);
        expect(result.schedule).toHaveLength(0);
        expect(result.totalProjected).toBe(0);
      }
    });
  });
});
