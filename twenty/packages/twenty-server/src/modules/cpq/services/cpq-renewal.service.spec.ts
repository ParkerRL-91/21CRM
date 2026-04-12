import { CpqPricingService } from './cpq-pricing.service';
import { CpqRenewalService } from './cpq-renewal.service';

import type { SubscriptionRecord } from './cpq-renewal.service';

describe('CpqRenewalService', () => {
  let renewalService: CpqRenewalService;

  beforeEach(() => {
    const pricingService = new CpqPricingService();
    // CpqRenewalService needs ObjectMetadataService for runRenewalCheck,
    // but generateRenewalQuote is a pure function that only needs pricing
    renewalService = new CpqRenewalService(pricingService, {} as never);
  });

  describe('generateRenewalQuote', () => {
    const subscriptions: SubscriptionRecord[] = [
      { productName: 'Platform Pro', quantity: 1, unitPrice: '60000', chargeType: 'recurring', status: 'active' },
      { productName: 'Analytics', quantity: 5, unitPrice: '6000', chargeType: 'recurring', status: 'active' },
      { productName: 'Implementation', quantity: 1, unitPrice: '5000', chargeType: 'one_time', status: 'active' },
    ];

    it('should generate renewal quote with same_price method', () => {
      const result = renewalService.generateRenewalQuote(
        subscriptions,
        new Date('2026-12-31'),
        12,
        { defaultLeadDays: 90, defaultPricingMethod: 'same_price', defaultUpliftPercentage: 3 },
      );

      expect(result.success).toBe(true);
      expect(result.subscriptionCount).toBe(2); // excludes one_time
      expect(result.totalValue).toBe('90000'); // 60000 + 30000
    });

    it('should apply uplift percentage to renewal pricing', () => {
      const result = renewalService.generateRenewalQuote(
        subscriptions,
        new Date('2026-12-31'),
        12,
        { defaultLeadDays: 90, defaultPricingMethod: 'uplift_percentage', defaultUpliftPercentage: 5 },
      );

      expect(result.success).toBe(true);
      // Platform: 60000 * 1.05 = 63000, Analytics: 6000 * 1.05 * 5 = 31500
      expect(result.totalValue).toBe('94500');
    });

    it('should exclude cancelled subscriptions', () => {
      const withCancelled: SubscriptionRecord[] = [
        ...subscriptions,
        { productName: 'Cancelled Module', quantity: 1, unitPrice: '10000', chargeType: 'recurring', status: 'cancelled' },
      ];

      const result = renewalService.generateRenewalQuote(
        withCancelled,
        new Date('2026-12-31'),
        12,
        { defaultLeadDays: 90, defaultPricingMethod: 'same_price', defaultUpliftPercentage: 3 },
      );

      expect(result.subscriptionCount).toBe(2); // still 2, cancelled excluded
    });

    it('should return failure for empty subscriptions', () => {
      const result = renewalService.generateRenewalQuote(
        [],
        new Date('2026-12-31'),
        12,
        { defaultLeadDays: 90, defaultPricingMethod: 'same_price', defaultUpliftPercentage: 3 },
      );

      expect(result.success).toBe(false);
    });

    it('should include line-level detail in result', () => {
      const result = renewalService.generateRenewalQuote(
        subscriptions,
        new Date('2026-12-31'),
        12,
        { defaultLeadDays: 90, defaultPricingMethod: 'same_price', defaultUpliftPercentage: 3 },
      );

      expect(result.lines).toHaveLength(2);
      expect(result.lines?.[0].productName).toBe('Platform Pro');
      expect(result.lines?.[0].oldUnitPrice).toBe('60000');
      expect(result.lines?.[0].newUnitPrice).toBe('60000');
    });
  });

  describe('resolvePricingMethod', () => {
    it('should use subscription-level override first', () => {
      expect(renewalService.resolvePricingMethod('uplift_percentage', 'same_price', 'current_list')).toBe('uplift_percentage');
    });

    it('should fall back to contract-level', () => {
      expect(renewalService.resolvePricingMethod(null, 'same_price', 'current_list')).toBe('same_price');
    });

    it('should fall back to org default', () => {
      expect(renewalService.resolvePricingMethod(null, null, 'current_list')).toBe('current_list');
    });
  });
});
