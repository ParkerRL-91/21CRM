import {
  computePipelineForecast,
  computeHistoricalForecast,
  computeBlendedForecast,
  computeMultiMethodForecast,
  OpenDeal,
  HistoricalPeriod,
} from './multi-method-forecast';

function makeDeal(overrides: Partial<OpenDeal> & Pick<OpenDeal, 'id'>): OpenDeal {
  return {
    ownerId: 'rep1',
    ownerName: 'Alice',
    stage: 'qualification',
    amount: 10000,
    probability: 50,
    ...overrides,
  };
}

describe('computePipelineForecast', () => {
  it('returns 0 for empty deal list', () => {
    expect(computePipelineForecast([])).toBe(0);
  });

  it('computes weighted sum of amount × probability / 100', () => {
    const deals = [
      makeDeal({ id: 'd1', amount: 10000, probability: 50 }),  // 5000
      makeDeal({ id: 'd2', amount: 20000, probability: 75 }),  // 15000
    ];
    expect(computePipelineForecast(deals)).toBe(20000);
  });

  it('handles a single deal at 100% probability', () => {
    const deals = [makeDeal({ id: 'd1', amount: 50000, probability: 100 })];
    expect(computePipelineForecast(deals)).toBe(50000);
  });

  it('handles a single deal at 0% probability', () => {
    const deals = [makeDeal({ id: 'd1', amount: 50000, probability: 0 })];
    expect(computePipelineForecast(deals)).toBe(0);
  });

  it('sums three deals with different probabilities', () => {
    const deals = [
      makeDeal({ id: 'd1', amount: 100000, probability: 10 }),  // 10000
      makeDeal({ id: 'd2', amount: 50000, probability: 40 }),   // 20000
      makeDeal({ id: 'd3', amount: 25000, probability: 80 }),   // 20000
    ];
    expect(computePipelineForecast(deals)).toBe(50000);
  });
});

describe('computeHistoricalForecast', () => {
  it('returns 0 for empty history', () => {
    const deals = [makeDeal({ id: 'd1', amount: 50000, probability: 60 })];
    expect(computeHistoricalForecast(deals, [])).toBe(0);
  });

  it('returns 0 when total entered pipeline is 0', () => {
    const history: HistoricalPeriod[] = [{ totalPipelineEntered: 0, totalClosedWon: 0 }];
    const deals = [makeDeal({ id: 'd1', amount: 50000, probability: 50 })];
    expect(computeHistoricalForecast(deals, history)).toBe(0);
  });

  it('applies historical win rate to current open pipeline', () => {
    // Historical: $100k entered, $30k won → 30% win rate
    const history: HistoricalPeriod[] = [{ totalPipelineEntered: 100000, totalClosedWon: 30000 }];
    // Current open pipeline: $200k total amount
    const deals = [
      makeDeal({ id: 'd1', amount: 100000, probability: 50 }),
      makeDeal({ id: 'd2', amount: 100000, probability: 50 }),
    ];
    // Expected: 200000 × 0.30 = 60000
    expect(computeHistoricalForecast(deals, history)).toBe(60000);
  });

  it('averages win rates across multiple periods', () => {
    // Period 1: $100k entered, $20k won → 20% win rate (weight: $100k / $200k = 50%)
    // Period 2: $100k entered, $40k won → 40% win rate (weight: $100k / $200k = 50%)
    // Combined: $60k won / $200k entered = 30%
    const history: HistoricalPeriod[] = [
      { totalPipelineEntered: 100000, totalClosedWon: 20000 },
      { totalPipelineEntered: 100000, totalClosedWon: 40000 },
    ];
    const deals = [makeDeal({ id: 'd1', amount: 100000, probability: 50 })];
    // 100000 × 0.30 = 30000
    expect(computeHistoricalForecast(deals, history)).toBe(30000);
  });

  it('uses total open pipeline (not probability-weighted) for historical method', () => {
    const history: HistoricalPeriod[] = [{ totalPipelineEntered: 100000, totalClosedWon: 50000 }]; // 50% win rate
    const deals = [
      makeDeal({ id: 'd1', amount: 10000, probability: 10 }),  // low prob, but raw amount is 10k
    ];
    // 10000 × 0.50 = 5000
    expect(computeHistoricalForecast(deals, history)).toBe(5000);
  });
});

describe('computeBlendedForecast', () => {
  it('computes 50/50 weighted average by default', () => {
    // pipeline=60000, historical=40000 → blended = 50000
    expect(computeBlendedForecast(60000, 40000)).toBe(50000);
  });

  it('applies custom pipeline weight', () => {
    // pipeline=60000, historical=40000, pipelineWeight=0.7
    // blended = 60000×0.7 + 40000×0.3 = 42000 + 12000 = 54000
    expect(computeBlendedForecast(60000, 40000, 0.7)).toBe(54000);
  });

  it('returns only pipeline when weight is 1.0', () => {
    expect(computeBlendedForecast(80000, 20000, 1.0)).toBe(80000);
  });

  it('returns only historical when weight is 0.0', () => {
    expect(computeBlendedForecast(80000, 20000, 0.0)).toBe(20000);
  });

  it('clamps weight above 1 to 1', () => {
    const result = computeBlendedForecast(60000, 40000, 1.5);
    expect(result).toBe(60000);
  });

  it('clamps weight below 0 to 0', () => {
    const result = computeBlendedForecast(60000, 40000, -0.5);
    expect(result).toBe(40000);
  });
});

describe('computeMultiMethodForecast', () => {
  const history: HistoricalPeriod[] = [{ totalPipelineEntered: 100000, totalClosedWon: 40000 }]; // 40% win rate

  const deals = [
    makeDeal({ id: 'd1', ownerId: 'rep1', ownerName: 'Alice', amount: 50000, probability: 60 }),  // pipeline: 30000
    makeDeal({ id: 'd2', ownerId: 'rep2', ownerName: 'Bob', amount: 30000, probability: 50 }),    // pipeline: 15000
  ];

  it('pipeline method produces probability-weighted sum', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.methods.pipeline.amount).toBe(45000); // 30000 + 15000
    expect(result.methods.pipeline.method).toBe('pipeline');
  });

  it('historical method applies win rate to open pipeline total', () => {
    const result = computeMultiMethodForecast(deals, history);
    // Open pipeline = 50000 + 30000 = 80000; win rate = 40%; historical = 32000
    expect(result.methods.historical.amount).toBe(32000);
  });

  it('blended method is weighted average of pipeline and historical', () => {
    const result = computeMultiMethodForecast(deals, history);
    // pipeline=45000, historical=32000, 50/50: (45000+32000)/2 = 38500
    expect(result.methods.blended.amount).toBe(38500);
  });

  it('respects custom pipelineWeight in blended method', () => {
    const result = computeMultiMethodForecast(deals, history, { pipelineWeight: 0.8 });
    // pipeline=45000, historical=32000; 45000×0.8 + 32000×0.2 = 36000 + 6400 = 42400
    expect(result.methods.blended.amount).toBe(42400);
  });

  describe('rep breakdown', () => {
    it('produces one entry per rep', () => {
      const result = computeMultiMethodForecast(deals, history);
      expect(result.byRep).toHaveLength(2);
    });

    it('assigns correct pipeline forecast to each rep', () => {
      const result = computeMultiMethodForecast(deals, history);
      const alice = result.byRep.find((r) => r.ownerId === 'rep1');
      const bob = result.byRep.find((r) => r.ownerId === 'rep2');

      expect(alice?.pipeline).toBe(30000); // 50000 × 60%
      expect(bob?.pipeline).toBe(15000);   // 30000 × 50%
    });
  });

  describe('quota and attainment', () => {
    it('computes attainmentPercent when quota is provided', () => {
      const result = computeMultiMethodForecast(deals, history, { quota: 90000 });
      expect(result.quota).toBe(90000);
      expect(result.attainmentPercent).toBeDefined();
      // pipeline = 45000 / 90000 = 50%
      expect(result.attainmentPercent?.pipeline).toBe(50);
    });

    it('does not include attainmentPercent when no quota provided', () => {
      const result = computeMultiMethodForecast(deals, history);
      expect(result.quota).toBeUndefined();
      expect(result.attainmentPercent).toBeUndefined();
    });
  });

  it('returns zero for all methods with empty deal list', () => {
    const result = computeMultiMethodForecast([], history);
    expect(result.methods.pipeline.amount).toBe(0);
    expect(result.methods.historical.amount).toBe(0);
    expect(result.methods.blended.amount).toBe(0);
    expect(result.byRep).toHaveLength(0);
  });
});
