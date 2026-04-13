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
});

  // Edge case tests (TASK-097)
  describe('edge cases', () => {
    it('should handle zero quantity', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 0,
      });
      expect(result.netTotal).toBe('0');
    });

    it('should handle very large quantities', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '0.01',
        quantity: 10000000,
      });
      expect(result.netTotal).toBe('100000');
    });

    it('should handle very small prices', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '0.001',
        quantity: 1,
      });
      // Rounds to 2 decimal places
      expect(result.netUnitPrice).toBe('0');
    });

    it('should handle empty discount schedule tiers', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 10,
        discountSchedule: { type: 'tiered', tiers: [] },
      });
      // With no tiers, tiered calculation returns 0 (no tiers to match)
      expect(result.netUnitPrice).toBe('0');
    });

    it('should handle single-tier volume pricing', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 5,
        discountSchedule: {
          type: 'volume',
          tiers: [{ lowerBound: 1, upperBound: null, value: 80 }],
        },
      });
      expect(result.netUnitPrice).toBe('80');
      expect(result.netTotal).toBe('400');
    });

    it('should handle 100% manual discount', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        manualDiscountPercent: 100,
      });
      expect(result.netUnitPrice).toBe('0');
    });

    it('should handle manual discount exceeding 100%', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 1,
        manualDiscountPercent: 150,
      });
      // Should clamp to 0 (non-negative enforcement)
      expect(result.netUnitPrice).toBe('0');
    });

    it('should handle zero list price', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '0',
        quantity: 10,
      });
      expect(result.netUnitPrice).toBe('0');
      expect(result.netTotal).toBe('0');
    });

    it('should handle proration with equal terms (no change)', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '12000',
        quantity: 1,
        productBaseTermMonths: 12,
        quoteTermMonths: 12,
      });
      // Same term — no proration applied
      expect(result.netUnitPrice).toBe('12000');
    });

    it('should handle floor price higher than list price', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '50',
        quantity: 1,
        floorPrice: '100',
      });
      // Floor is higher — price set to floor
      expect(result.netUnitPrice).toBe('100');
    });

    it('should handle manual override to zero', () => {
      const result = service.calculatePriceWaterfall({
        listPrice: '100',
        quantity: 5,
        manualPriceOverride: 0,
      });
      expect(result.netUnitPrice).toBe('0');
      expect(result.netTotal).toBe('0');
    });
  });
