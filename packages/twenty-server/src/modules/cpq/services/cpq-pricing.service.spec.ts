import { CpqPricingService } from './cpq-pricing.service';

describe('CpqPricingService', () => {
  let service: CpqPricingService;

  beforeEach(() => {
    service = new CpqPricingService();
  });

  describe('calculatePriceWaterfall', () => {
    it('should return list price for simple case', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
      });
      expect(result.netUnitPrice).toBe('100');
      expect(result.netTotal).toBe('100');
    });

    it('should calculate net total as unit price times quantity', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '50',
        quantity: 10,
      });
      expect(result.netTotal).toBe('500');
    });

    it('should apply contracted price when provided', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        contractedPrice: '80',
      });
      expect(result.netUnitPrice).toBe('80');
    });

    it('should apply proration for different term lengths', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '12000',
        quantity: 1,
        productBaseTermMonths: 12,
        quoteTermMonths: 18,
      });
      expect(result.netUnitPrice).toBe('18000');
    });

    it('should apply manual discount percentage', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        manualDiscountPercent: 15,
      });
      expect(result.netUnitPrice).toBe('85');
    });

    it('should apply manual discount amount', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        manualDiscountAmount: 20,
      });
      expect(result.netUnitPrice).toBe('80');
    });

    it('should apply manual price override', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        manualPriceOverride: 75,
      });
      expect(result.netUnitPrice).toBe('75');
    });

    it('should enforce floor price', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        manualDiscountPercent: 90,
        floorPrice: '50',
      });
      expect(result.netUnitPrice).toBe('50');
    });

    it('should clamp negative price to zero', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        manualDiscountAmount: 200,
      });
      expect(result.netUnitPrice).toBe('0');
    });

    it('should round to 2 decimal places', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '99.99',
        quantity: 1,
        manualDiscountPercent: 3.5,
      });
      // 99.99 * 0.965 = 96.49035 → 96.49
      expect(result.netUnitPrice).toBe('96.49');
    });

    it('should produce audit trail with steps', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
      });
      expect(result.auditSteps.length).toBeGreaterThan(0);
      expect(result.auditSteps[0].ruleName).toBe('base_price');
    });
  });

  describe('calculateTieredEffectivePrice', () => {
    const tiers = [
      { lowerBound: 1, upperBound: 100, value: 50 },
      { lowerBound: 101, upperBound: 500, value: 40 },
      { lowerBound: 501, upperBound: null, value: 30 },
    ];

    it('should calculate tiered price for first tier', () => {
      const price = service.calculateTieredEffectivePrice(50, tiers);
      expect(price.toString()).toBe('50'); // all in first tier
    });

    it('should calculate blended tiered price across tiers', () => {
      // 100×50 + 150×40 = 5000 + 6000 = 11000 / 250 = 44
      const price = service.calculateTieredEffectivePrice(250, tiers);
      expect(price.toString()).toBe('44');
    });
  });

  describe('calculateVolumePrice', () => {
    const tiers = [
      { lowerBound: 1, upperBound: 100, value: 50 },
      { lowerBound: 101, upperBound: 500, value: 40 },
      { lowerBound: 501, upperBound: null, value: 30 },
    ];

    it('should return first tier rate for low quantity', () => {
      const price = service.calculateVolumePrice(50, tiers, {} as any);
      expect(price.toString()).toBe('50');
    });

    it('should return second tier rate for mid quantity', () => {
      const price = service.calculateVolumePrice(250, tiers, {} as any);
      expect(price.toString()).toBe('40');
    });

    it('should return third tier rate for high quantity', () => {
      const price = service.calculateVolumePrice(600, tiers, {} as any);
      expect(price.toString()).toBe('30');
    });
  });

  describe('calculateRenewalPrice', () => {
    it('should return same price for same_price method', () => {
      const result = service.calculateRenewalPrice({
        currentPrice: '100',
        method: 'same_price',
      });
      expect(result.newUnitPrice).toBe('100');
    });

    it('should return list price for current_list method', () => {
      const result = service.calculateRenewalPrice({
        currentPrice: '100',
        method: 'current_list',
        currentListPrice: '120',
      });
      expect(result.newUnitPrice).toBe('120');
    });

    it('should fallback to same price when list price not available', () => {
      const result = service.calculateRenewalPrice({
        currentPrice: '100',
        method: 'current_list',
      });
      expect(result.newUnitPrice).toBe('100');
      expect(result.method).toContain('fallback');
    });

    it('should apply uplift percentage', () => {
      const result = service.calculateRenewalPrice({
        currentPrice: '100',
        method: 'uplift_percentage',
        upliftPercentage: 5,
      });
      expect(result.newUnitPrice).toBe('105');
    });

    it('should cap uplift at 50%', () => {
      const result = service.calculateRenewalPrice({
        currentPrice: '100',
        method: 'uplift_percentage',
        upliftPercentage: 75,
      });
      expect(result.newUnitPrice).toBe('150'); // capped at 50%
    });
  });

  describe('edge cases', () => {
    it('should return netTotal of 0 when quantity is 0', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 0,
      });
      expect(result.netTotal).toBe('0');
    });

    it('should not throw when listPrice is NaN and should return a defined result', () => {
      expect(() => {
        service.calculatePriceWaterfall({
          listPrice: 'NaN',
          quantity: 1,
        });
      }).not.toThrow();
      const result = service.calculatePriceWaterfall({
        listPrice: 'NaN',
        quantity: 1,
      });
      expect(result).toBeDefined();
      expect(result.netUnitPrice).toBeDefined();
    });

    it('should not throw when discountSchedule has an empty tiers array', () => {
      expect(() => {
        service.calculatePriceWaterfall({
          listPrice: '100',
          quantity: 1,
          discountSchedule: { type: 'tiered', tiers: [] },
        });
      }).not.toThrow();
    });

    it('should handle very large numbers without overflow', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '999999999.99',
        quantity: 1000,
      });
      // 999999999.99 * 1000 = 999999999990
      expect(result.netTotal).toBe('999999999990');
    });

    it('should return correct price for volume schedule with a single tier', () => {
      const tiers = [{ lowerBound: 1, upperBound: null, value: 25 }];
      const price = service.calculateVolumePrice(500, tiers, {} as any);
      expect(price.toString()).toBe('25');
    });

    it('should not throw when term discount schedule has no matching tier for quoteTermMonths', () => {
      expect(() => {
        service.calculatePriceWaterfall({
          listPrice: '100',
          quantity: 1,
          quoteTermMonths: 999,
          discountSchedule: {
            type: 'term',
            tiers: [
              { lowerBound: 12, upperBound: 12, value: 5 },
              { lowerBound: 24, upperBound: 24, value: 10 },
            ],
          },
        });
      }).not.toThrow();
    });
  });
});
