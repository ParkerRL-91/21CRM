import {
  computeProjectedRevRec,
  type ClosedDeal,
  type PipelineDeal,
  type OpenQuote,
} from './projected-rev-rec';

const closedDeals: ClosedDeal[] = [
  { id: 'c1', amount: 12000, startDate: '2026-01', endDate: '2026-12', ownerId: 'r1' },
];

const pipelineDeals: PipelineDeal[] = [
  { id: 'p1', amount: 24000, probability: 50, startDate: '2026-07', endDate: '2026-12', ownerId: 'r1' },
];

const openQuotes: OpenQuote[] = [
  { id: 'q1', amount: 6000, probability: 25, startDate: '2026-10', endDate: '2026-12', ownerId: 'r1' },
];

describe('computeProjectedRevRec', () => {
  describe('closed_only mode', () => {
    it('should spread closed deal evenly over 12 months', () => {
      const result = computeProjectedRevRec(closedDeals, [], [], 'closed_only');
      expect(result.mode).toBe('closed_only');
      expect(result.schedule).toHaveLength(12);
      // 12000 / 12 months = 1000 per month
      result.schedule.forEach((month) => {
        expect(month.closedOnly).toBe(1000);
        expect(month.pipelineContribution).toBe(0);
        expect(month.quotesContribution).toBe(0);
      });
      expect(result.closedOnlyTotal).toBe(12000);
    });

    it('should not include pipeline when mode is closed_only', () => {
      const result = computeProjectedRevRec(closedDeals, pipelineDeals, openQuotes, 'closed_only');
      expect(result.pipelineContributionTotal).toBe(0);
      expect(result.quotesContributionTotal).toBe(0);
    });
  });

  describe('plus_pipeline mode', () => {
    it('should include probability-weighted pipeline contribution', () => {
      const result = computeProjectedRevRec(closedDeals, pipelineDeals, [], 'plus_pipeline');
      // Pipeline: 24000 * 0.5 = 12000 over 6 months = 2000/month
      expect(result.pipelineContributionTotal).toBe(12000);
      expect(result.quotesContributionTotal).toBe(0);
    });

    it('should not include quotes when mode is plus_pipeline', () => {
      const result = computeProjectedRevRec(closedDeals, pipelineDeals, openQuotes, 'plus_pipeline');
      expect(result.quotesContributionTotal).toBe(0);
    });
  });

  describe('plus_quotes mode', () => {
    it('should include pipeline and quote contributions', () => {
      const result = computeProjectedRevRec(closedDeals, pipelineDeals, openQuotes, 'plus_quotes');
      // Quotes: 6000 * 0.25 = 1500 over 3 months = 500/month
      expect(result.quotesContributionTotal).toBe(1500);
      expect(result.pipelineContributionTotal).toBe(12000);
    });

    it('should compute total correctly across all sources', () => {
      const result = computeProjectedRevRec(closedDeals, pipelineDeals, openQuotes, 'plus_quotes');
      expect(result.totalProjected).toBe(
        result.closedOnlyTotal + result.pipelineContributionTotal + result.quotesContributionTotal,
      );
    });
  });

  describe('schedule ordering', () => {
    it('should return months in chronological order', () => {
      const result = computeProjectedRevRec(closedDeals, pipelineDeals, [], 'plus_pipeline');
      for (let i = 1; i < result.schedule.length; i++) {
        expect(result.schedule[i].month >= result.schedule[i - 1].month).toBe(true);
      }
    });

    it('should include correct month keys in YYYY-MM format', () => {
      const result = computeProjectedRevRec(closedDeals, [], [], 'closed_only');
      expect(result.schedule[0].month).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('edge cases', () => {
    it('should return empty schedule for no inputs', () => {
      const result = computeProjectedRevRec([], [], [], 'closed_only');
      expect(result.schedule).toHaveLength(0);
      expect(result.totalProjected).toBe(0);
    });

    it('should handle 0% probability pipeline deal', () => {
      const zeroProbDeal: PipelineDeal = { id: 'p0', amount: 100000, probability: 0, startDate: '2026-07', endDate: '2026-12' };
      const result = computeProjectedRevRec([], [zeroProbDeal], [], 'plus_pipeline');
      expect(result.pipelineContributionTotal).toBe(0);
    });
  });
});
