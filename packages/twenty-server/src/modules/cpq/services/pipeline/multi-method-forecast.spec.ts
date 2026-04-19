import {
  computePipelineForecast,
  computeHistoricalForecast,
  computeBlendedForecast,
  computeMultiMethodForecast,
  type OpenDeal,
  type HistoricalPeriod,
} from './multi-method-forecast';

const deals: OpenDeal[] = [
  { id: 'd1', amount: 100000, probability: 80, ownerId: 'rep-1', ownerName: 'Alice', stage: 'Proposal' },
  { id: 'd2', amount: 50000, probability: 60, ownerId: 'rep-2', ownerName: 'Bob', stage: 'Negotiation' },
  { id: 'd3', amount: 200000, probability: 20, ownerId: 'rep-1', ownerName: 'Alice', stage: 'Qualification' },
];

const history: HistoricalPeriod[] = [
  { totalPipelineEntered: 500000, totalClosedWon: 150000 },
  { totalPipelineEntered: 600000, totalClosedWon: 180000 },
];

describe('multi-method-forecast', () => {
  describe('computePipelineForecast', () => {
    it('should return probability-weighted sum', () => {
      // 100000*0.8 + 50000*0.6 + 200000*0.2 = 80000+30000+40000 = 150000
      const result = computePipelineForecast(deals);
      expect(result).toBe(150000);
    });

    it('should return 0 for empty deals', () => {
      expect(computePipelineForecast([])).toBe(0);
    });

    it('should handle 0% probability deals', () => {
      const zeroDeals: OpenDeal[] = [
        { id: 'z1', amount: 100000, probability: 0, ownerId: 'r1', ownerName: 'Rep', stage: 'Lost' },
      ];
      expect(computePipelineForecast(zeroDeals)).toBe(0);
    });

    it('should handle 100% probability deals', () => {
      const wonDeals: OpenDeal[] = [
        { id: 'w1', amount: 50000, probability: 100, ownerId: 'r1', ownerName: 'Rep', stage: 'Won' },
      ];
      expect(computePipelineForecast(wonDeals)).toBe(50000);
    });
  });

  describe('computeHistoricalForecast', () => {
    it('should apply historical win rate to open pipeline', () => {
      // Total entered: 1100000, Total won: 330000, win rate: 30%
      // Open pipeline: 100000+50000+200000 = 350000
      // Forecast: 350000 * 0.3 = 105000
      const result = computeHistoricalForecast(deals, history);
      expect(result).toBeCloseTo(105000, 0);
    });

    it('should return 0 for empty history', () => {
      const result = computeHistoricalForecast(deals, []);
      expect(result).toBe(0);
    });

    it('should return 0 when pipeline entered is zero', () => {
      const zeroHistory: HistoricalPeriod[] = [
        { totalPipelineEntered: 0, totalClosedWon: 0 },
      ];
      expect(computeHistoricalForecast(deals, zeroHistory)).toBe(0);
    });
  });

  describe('computeBlendedForecast', () => {
    it('should compute 50/50 blend by default', () => {
      const result = computeBlendedForecast(100000, 80000);
      expect(result).toBe(90000);
    });

    it('should respect custom pipeline weight', () => {
      const result = computeBlendedForecast(100000, 0, 1.0);
      expect(result).toBe(100000);
    });

    it('should clamp weight to 0-1 range', () => {
      const result = computeBlendedForecast(100000, 80000, 1.5);
      expect(result).toBe(100000);

      const result2 = computeBlendedForecast(100000, 80000, -0.5);
      expect(result2).toBe(80000);
    });
  });

  describe('computeMultiMethodForecast', () => {
    it('should return all three method forecasts', () => {
      const result = computeMultiMethodForecast(deals, history);
      expect(result.methods.pipeline).toBeDefined();
      expect(result.methods.historical).toBeDefined();
      expect(result.methods.blended).toBeDefined();
    });

    it('should break down forecast by rep', () => {
      const result = computeMultiMethodForecast(deals, history);
      expect(result.byRep).toHaveLength(2);
      const alice = result.byRep.find((r) => r.ownerId === 'rep-1');
      expect(alice).toBeDefined();
      // Alice: 100000*0.8 + 200000*0.2 = 80000+40000 = 120000
      expect(alice!.pipeline).toBe(120000);
    });

    it('should include attainment percent when quota is provided', () => {
      const result = computeMultiMethodForecast(deals, history, { quota: 300000 });
      expect(result.quota).toBe(300000);
      expect(result.attainmentPercent).toBeDefined();
      expect(result.attainmentPercent!.pipeline).toBeGreaterThan(0);
    });

    it('should not include attainment when quota is zero', () => {
      const result = computeMultiMethodForecast(deals, history, { quota: 0 });
      expect(result.attainmentPercent).toBeUndefined();
    });

    it('should include method descriptions', () => {
      const result = computeMultiMethodForecast(deals, history);
      expect(result.methods.pipeline.description).toBeTruthy();
      expect(result.methods.historical.description).toBeTruthy();
      expect(result.methods.blended.description).toContain('50%');
    });
  });
});
