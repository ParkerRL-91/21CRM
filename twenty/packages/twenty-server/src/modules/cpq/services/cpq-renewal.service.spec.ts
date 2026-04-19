import { CpqPricingService } from './cpq-pricing.service';
import { CpqRenewalService } from './cpq-renewal.service';

import type { SubscriptionRecord } from './cpq-renewal.service';

const mockQueryRunner = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  query: jest.fn(),
};

const mockDataSource = {
  query: jest.fn(),
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

describe('CpqRenewalService', () => {
  let renewalService: CpqRenewalService;

  beforeEach(() => {
    jest.clearAllMocks();
    const pricingService = new CpqPricingService();
    renewalService = new CpqRenewalService(pricingService, mockDataSource as never);
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

  describe('runRenewalCheck', () => {
    it('should return skipped if advisory lock is held', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ pg_try_advisory_lock: false }]);

      const result = await renewalService.runRenewalCheck('00000000-0000-0000-0000-000000000001');

      expect(result.status).toBe('skipped');
      expect(result.errors[0]).toContain('advisory lock');
    });

    it('should create renewals for eligible contracts', async () => {
      // Advisory lock granted
      mockDataSource.query.mockResolvedValueOnce([{ pg_try_advisory_lock: true }]);
      // Eligible contracts query
      mockDataSource.query.mockResolvedValueOnce([
        { id: 'c-1', status: 'active', endDate: '2026-05-01', companyId: 'co-1', renewalTermMonths: 12 },
      ]);
      // Advisory unlock
      mockDataSource.query.mockResolvedValueOnce([{}]);

      // Per-contract queryRunner calls
      mockQueryRunner.query
        .mockResolvedValueOnce([
          { productName: 'Platform', quantity: 1, unitPrice: '60000', chargeType: 'recurring', status: 'active' },
        ])
        .mockResolvedValueOnce([{ id: 'quote-new' }]) // INSERT quote
        .mockResolvedValueOnce(undefined); // INSERT opportunity

      const result = await renewalService.runRenewalCheck('00000000-0000-0000-0000-000000000001');

      expect(result.contractsScanned).toBe(1);
      expect(result.renewalsCreated).toBe(1);
      expect(result.status).toBe('completed');
    });

    it('should skip contracts with no active recurring subscriptions', async () => {
      mockDataSource.query.mockResolvedValueOnce([{ pg_try_advisory_lock: true }]);
      mockDataSource.query.mockResolvedValueOnce([
        { id: 'c-2', status: 'active', endDate: '2026-05-01', companyId: null, renewalTermMonths: null },
      ]);
      mockDataSource.query.mockResolvedValueOnce([{}]); // unlock

      // No subscriptions found
      mockQueryRunner.query.mockResolvedValueOnce([]);

      const result = await renewalService.runRenewalCheck('00000000-0000-0000-0000-000000000001');

      expect(result.contractsScanned).toBe(1);
      expect(result.renewalsCreated).toBe(0);
      expect(result.status).toBe('completed');
    });

    it('should release advisory lock even on failure', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockRejectedValueOnce(new Error('DB connection lost')) // contracts query fails
        .mockResolvedValueOnce([{}]); // unlock still called

      const result = await renewalService.runRenewalCheck('00000000-0000-0000-0000-000000000001');

      expect(result.status).toBe('failed');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_unlock($1)',
        expect.any(Array),
      );
    });
  });
});
