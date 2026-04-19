import { computeProjectedRevRec, ClosedDeal, PipelineDeal, OpenQuote } from './projected-rev-rec';

const closedDeal = (overrides: Partial<ClosedDeal> = {}): ClosedDeal => ({
  id: 'closed-1',
  amount: 12000,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  ...overrides,
});

const pipelineDeal = (overrides: Partial<PipelineDeal> = {}): PipelineDeal => ({
  id: 'pipeline-1',
  amount: 12000,
  probability: 50,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  ...overrides,
});

const openQuote = (overrides: Partial<OpenQuote> = {}): OpenQuote => ({
  id: 'quote-1',
  amount: 12000,
  probability: 80,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  ...overrides,
});

describe('computeProjectedRevRec — closed_only mode', () => {
  it('should spread a 12-month deal evenly across 12 months', () => {
    const result = computeProjectedRevRec([closedDeal()], [], [], 'closed_only');
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule[0].closedOnly).toBe(1000); // 12000 / 12
  });

  it('should not include pipeline or quotes contribution in closed_only mode', () => {
    const result = computeProjectedRevRec(
      [closedDeal()],
      [pipelineDeal()],
      [openQuote()],
      'closed_only',
    );
    result.schedule.forEach((row) => {
      expect(row.pipelineContribution).toBe(0);
      expect(row.quotesContribution).toBe(0);
    });
  });

  it('should return 0 total when no deals provided', () => {
    const result = computeProjectedRevRec([], [], [], 'closed_only');
    expect(result.totalProjected).toBe(0);
    expect(result.schedule).toHaveLength(0);
  });
});

describe('computeProjectedRevRec — plus_pipeline mode', () => {
  it('should include probability-weighted pipeline contribution', () => {
    const result = computeProjectedRevRec([], [pipelineDeal({ probability: 50 })], [], 'plus_pipeline');
    // 12000 * 0.5 / 12 = 500 per month
    expect(result.schedule[0].pipelineContribution).toBe(500);
  });

  it('should not include quotes contribution in plus_pipeline mode', () => {
    const result = computeProjectedRevRec([], [pipelineDeal()], [openQuote()], 'plus_pipeline');
    result.schedule.forEach((row) => {
      expect(row.quotesContribution).toBe(0);
    });
  });
});

describe('computeProjectedRevRec — plus_quotes mode', () => {
  it('should include both pipeline and quotes contributions', () => {
    const result = computeProjectedRevRec(
      [],
      [pipelineDeal({ probability: 50 })],
      [openQuote({ probability: 80 })],
      'plus_quotes',
    );
    // pipeline: 12000*0.5/12 = 500; quotes: 12000*0.8/12 = 800
    expect(result.schedule[0].pipelineContribution).toBe(500);
    expect(result.schedule[0].quotesContribution).toBe(800);
  });

  it('should sum all contributions into total', () => {
    const result = computeProjectedRevRec(
      [closedDeal()],
      [pipelineDeal({ probability: 50 })],
      [openQuote({ probability: 100 })],
      'plus_quotes',
    );
    expect(result.totalProjected).toBe(result.closedOnlyTotal + result.pipelineContributionTotal + result.quotesContributionTotal);
  });
});

describe('computeProjectedRevRec — schedule ordering', () => {
  it('should return schedule sorted chronologically', () => {
    const result = computeProjectedRevRec([closedDeal()], [], [], 'closed_only');
    const months = result.schedule.map((r) => r.month);
    expect(months).toEqual([...months].sort());
  });
});
