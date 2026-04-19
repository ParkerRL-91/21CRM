import {
  computePipelineForecast,
  computeHistoricalForecast,
  computeBlendedForecast,
  computeMultiMethodForecast,
  OpenDeal,
  HistoricalPeriod,
} from './multi-method-forecast';

const makeDeals = (overrides: Partial<OpenDeal>[] = []): OpenDeal[] =>
  overrides.map((o, i) => ({
    id: `deal-${i}`,
    amount: 10000,
    probability: 50,
    ownerId: 'rep-1',
    ownerName: 'Alice',
    stage: 'Qualification',
    ...o,
  }));

describe('computePipelineForecast', () => {
  it('should return 0 for an empty deal list', () => {
    expect(computePipelineForecast([])).toBe(0);
  });

  it('should compute probability-weighted sum', () => {
    const deals = makeDeals([
      { amount: 10000, probability: 50 },
      { amount: 20000, probability: 25 },
    ]);
    // 10000*0.5 + 20000*0.25 = 5000 + 5000 = 10000
    expect(computePipelineForecast(deals)).toBe(10000);
  });

  it('should cap weighted value correctly for 100% probability deals', () => {
    const deals = makeDeals([{ amount: 5000, probability: 100 }]);
    expect(computePipelineForecast(deals)).toBe(5000);
  });
});

describe('computeHistoricalForecast', () => {
  it('should return 0 with no history', () => {
    const deals = makeDeals([{ amount: 10000, probability: 50 }]);
    expect(computeHistoricalForecast(deals, [])).toBe(0);
  });

  it('should return 0 when total pipeline entered is 0', () => {
    const deals = makeDeals([{ amount: 10000, probability: 50 }]);
    const history: HistoricalPeriod[] = [{ totalPipelineEntered: 0, totalClosedWon: 0 }];
    expect(computeHistoricalForecast(deals, history)).toBe(0);
  });

  it('should apply historical win rate to open pipeline', () => {
    const deals = makeDeals([{ amount: 100000, probability: 50 }]);
    // win rate = 20000/100000 = 0.2; forecast = 100000 * 0.2 = 20000
    const history: HistoricalPeriod[] = [{ totalPipelineEntered: 100000, totalClosedWon: 20000 }];
    expect(computeHistoricalForecast(deals, history)).toBe(20000);
  });

  it('should average win rate across multiple periods', () => {
    const deals = makeDeals([{ amount: 100000, probability: 50 }]);
    // total entered = 200000, total won = 40000, rate = 0.2
    const history: HistoricalPeriod[] = [
      { totalPipelineEntered: 100000, totalClosedWon: 30000 },
      { totalPipelineEntered: 100000, totalClosedWon: 10000 },
    ];
    expect(computeHistoricalForecast(deals, history)).toBe(20000);
  });
});

describe('computeBlendedForecast', () => {
  it('should blend 50/50 by default', () => {
    expect(computeBlendedForecast(10000, 20000)).toBe(15000);
  });

  it('should weight pipeline forecast when pipelineWeight > 0.5', () => {
    const result = computeBlendedForecast(10000, 0, 1);
    expect(result).toBe(10000);
  });

  it('should weight historical forecast when pipelineWeight = 0', () => {
    const result = computeBlendedForecast(0, 10000, 0);
    expect(result).toBe(10000);
  });

  it('should clamp weight to [0, 1]', () => {
    const overweighted = computeBlendedForecast(10000, 20000, 1.5);
    const valid = computeBlendedForecast(10000, 20000, 1);
    expect(overweighted).toBe(valid);
  });
});

describe('computeMultiMethodForecast', () => {
  const deals = makeDeals([
    { id: 'a', amount: 10000, probability: 50, ownerId: 'rep-1', ownerName: 'Alice' },
    { id: 'b', amount: 20000, probability: 25, ownerId: 'rep-2', ownerName: 'Bob' },
  ]);
  const history: HistoricalPeriod[] = [{ totalPipelineEntered: 100000, totalClosedWon: 20000 }];

  it('should return all three methods', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.methods.pipeline).toBeDefined();
    expect(result.methods.historical).toBeDefined();
    expect(result.methods.blended).toBeDefined();
  });

  it('should include per-rep breakdown', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.byRep).toHaveLength(2);
    const alice = result.byRep.find((r) => r.ownerId === 'rep-1');
    expect(alice).toBeDefined();
    expect(alice!.pipeline).toBe(5000); // 10000 * 0.5
  });

  it('should compute attainment when quota is provided', () => {
    const result = computeMultiMethodForecast(deals, history, { quota: 10000 });
    expect(result.quota).toBe(10000);
    expect(result.attainmentPercent).toBeDefined();
    expect(result.attainmentPercent!.pipeline).toBeGreaterThan(0);
  });

  it('should not set attainmentPercent when no quota provided', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.attainmentPercent).toBeUndefined();
  });

  it('should reflect custom pipeline weight in blended description', () => {
    const result = computeMultiMethodForecast(deals, history, { pipelineWeight: 0.7 });
    expect(result.methods.blended.description).toContain('70%');
    expect(result.methods.blended.description).toContain('30%');
  });
});
