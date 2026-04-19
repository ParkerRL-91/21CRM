import { describe, it, expect } from 'vitest';
import {
  computePipelineForecast,
  computeHistoricalForecast,
  computeBlendedForecast,
  computeMultiMethodForecast,
  OpenDeal,
  HistoricalPeriod,
} from './multi-method-forecast';

const mkDeal = (id: string, amount: number, probability: number, ownerId = 'r1', ownerName = 'Alice'): OpenDeal => ({
  id,
  amount,
  probability,
  ownerId,
  ownerName,
  stage: 'qualification',
});

const history: HistoricalPeriod[] = [
  { totalPipelineEntered: 500_000, totalClosedWon: 100_000 }, // 20% win rate
  { totalPipelineEntered: 500_000, totalClosedWon: 100_000 }, // 20% win rate
];

describe('computePipelineForecast', () => {
  it('returns 0 for empty deals', () => {
    expect(computePipelineForecast([])).toBe(0);
  });

  it('weights deal by probability', () => {
    const deals = [mkDeal('d1', 100_000, 50)];
    expect(computePipelineForecast(deals)).toBe(50_000);
  });

  it('sums multiple deals', () => {
    const deals = [
      mkDeal('d1', 100_000, 50),  // 50,000
      mkDeal('d2', 200_000, 25),  // 50,000
    ];
    expect(computePipelineForecast(deals)).toBe(100_000);
  });

  it('handles 100% probability', () => {
    expect(computePipelineForecast([mkDeal('d1', 75_000, 100)])).toBe(75_000);
  });

  it('handles 0% probability', () => {
    expect(computePipelineForecast([mkDeal('d1', 100_000, 0)])).toBe(0);
  });
});

describe('computeHistoricalForecast', () => {
  it('returns 0 for empty history', () => {
    expect(computeHistoricalForecast([mkDeal('d1', 100_000, 50)], [])).toBe(0);
  });

  it('applies historical win rate to open pipeline', () => {
    // win rate = 200,000 / 1,000,000 = 20%
    // open pipeline = 100,000
    // forecast = 20,000
    const result = computeHistoricalForecast([mkDeal('d1', 100_000, 50)], history);
    expect(result).toBe(20_000);
  });

  it('returns 0 when total pipeline entered is 0', () => {
    const zeroHistory: HistoricalPeriod[] = [
      { totalPipelineEntered: 0, totalClosedWon: 0 },
    ];
    expect(computeHistoricalForecast([mkDeal('d1', 100_000, 50)], zeroHistory)).toBe(0);
  });

  it('averages win rate across periods', () => {
    const unevenHistory: HistoricalPeriod[] = [
      { totalPipelineEntered: 200_000, totalClosedWon: 60_000 },  // 30%
      { totalPipelineEntered: 800_000, totalClosedWon: 80_000 },  // 10%
    ];
    // combined: 140,000 / 1,000,000 = 14%
    // open pipeline = 100,000 → 14,000
    const result = computeHistoricalForecast([mkDeal('d1', 100_000, 50)], unevenHistory);
    expect(result).toBe(14_000);
  });
});

describe('computeBlendedForecast', () => {
  it('returns 50/50 blend by default', () => {
    expect(computeBlendedForecast(100_000, 50_000)).toBe(75_000);
  });

  it('respects custom pipeline weight', () => {
    // 80% pipeline, 20% historical
    expect(computeBlendedForecast(100_000, 0, 0.8)).toBe(80_000);
  });

  it('clamps weight to 0-1', () => {
    expect(computeBlendedForecast(100_000, 0, 2)).toBe(100_000); // clamped to 1.0
    expect(computeBlendedForecast(0, 100_000, -1)).toBe(100_000); // clamped to 0.0
  });

  it('returns historical only when weight=0', () => {
    expect(computeBlendedForecast(100_000, 50_000, 0)).toBe(50_000);
  });
});

describe('computeMultiMethodForecast', () => {
  const deals = [
    mkDeal('d1', 100_000, 50, 'r1', 'Alice'),
    mkDeal('d2', 200_000, 50, 'r2', 'Bob'),
  ];

  it('returns all three methods', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.methods.pipeline).toBeDefined();
    expect(result.methods.historical).toBeDefined();
    expect(result.methods.blended).toBeDefined();
  });

  it('pipeline amount is prob-weighted sum', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.methods.pipeline.amount).toBe(150_000); // (100k+200k) × 50%
  });

  it('byRep has one entry per rep', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.byRep).toHaveLength(2);
  });

  it('attainment percent computed when quota provided', () => {
    const result = computeMultiMethodForecast(deals, history, { quota: 300_000 });
    expect(result.quota).toBe(300_000);
    expect(result.attainmentPercent?.pipeline).toBe(50); // 150k/300k = 50%
  });

  it('no attainmentPercent when quota not provided', () => {
    const result = computeMultiMethodForecast(deals, history);
    expect(result.attainmentPercent).toBeUndefined();
  });

  it('blended description includes weight percentages', () => {
    const result = computeMultiMethodForecast(deals, history, { pipelineWeight: 0.7 });
    expect(result.methods.blended.description).toContain('70%');
    expect(result.methods.blended.description).toContain('30%');
  });
});
