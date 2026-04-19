import { CpqContractService } from './cpq-contract.service';

// Mock queryRunner returned by createQueryRunner()
const mockQueryRunner = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  query: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

describe('CpqContractService', () => {
  let service: CpqContractService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CpqContractService(mockDataSource as never);
  });

  describe('isValidTransition', () => {
    it('should allow draft to active', () => {
      expect(service.isValidTransition('draft', 'active')).toBe(true);
    });

    it('should allow active to cancelled', () => {
      expect(service.isValidTransition('active', 'cancelled')).toBe(true);
    });

    it('should allow active to pending_renewal', () => {
      expect(service.isValidTransition('active', 'pending_renewal')).toBe(true);
    });

    it('should allow pending_renewal to renewed', () => {
      expect(service.isValidTransition('pending_renewal', 'renewed')).toBe(true);
    });

    it('should reject draft to cancelled', () => {
      expect(service.isValidTransition('draft', 'cancelled')).toBe(false);
    });

    it('should reject expired to active', () => {
      expect(service.isValidTransition('expired', 'active')).toBe(false);
    });
  });

  describe('isValidSubscriptionTransition', () => {
    it('should allow active to pending_cancellation', () => {
      expect(service.isValidSubscriptionTransition('active', 'pending_cancellation')).toBe(true);
    });

    it('should reject active to cancelled directly', () => {
      expect(service.isValidSubscriptionTransition('active', 'cancelled')).toBe(false);
    });

    it('should allow pending_cancellation to cancelled', () => {
      expect(service.isValidSubscriptionTransition('pending_cancellation', 'cancelled')).toBe(true);
    });
  });

  describe('calculateProratedValue', () => {
    it('should return full value at start date', () => {
      const result = service.calculateProratedValue(
        '120000',
        new Date('2026-01-01'),
        new Date('2027-01-01'),
        new Date('2026-01-01'),
      );
      expect(result).toBe('120000');
    });

    it('should return zero at end date', () => {
      const result = service.calculateProratedValue(
        '120000',
        new Date('2026-01-01'),
        new Date('2027-01-01'),
        new Date('2027-01-01'),
      );
      expect(result).toBe('0');
    });

    it('should prorate half-year correctly', () => {
      const result = service.calculateProratedValue(
        '120000',
        new Date('2026-01-01'),
        new Date('2028-01-01'), // 2 years
        new Date('2027-01-01'), // 1 year remaining
      );
      expect(result).toBe('60000');
    });

    it('should return zero for zero-length contract', () => {
      const result = service.calculateProratedValue(
        '120000',
        new Date('2026-01-01'),
        new Date('2026-01-01'),
        new Date('2026-01-01'),
      );
      expect(result).toBe('0');
    });
  });

  describe('calculateAmendmentDelta', () => {
    it('should calculate positive delta for quantity increase', () => {
      const result = service.calculateAmendmentDelta(
        '1000', 5, // old: $1000 × 5 = $5000
        '1000', 10, // new: $1000 × 10 = $10000
        new Date('2026-01-01'),
        new Date('2028-01-01'),
        new Date('2027-01-01'),
      );
      // delta = $5000, prorated for 1 year of 2 years = $2500
      expect(result).toBe('2500');
    });

    it('should calculate negative delta for quantity decrease', () => {
      const result = service.calculateAmendmentDelta(
        '1000', 10,
        '1000', 5,
        new Date('2026-01-01'),
        new Date('2028-01-01'),
        new Date('2027-01-01'),
      );
      expect(result).toBe('-2500');
    });
  });

  describe('createFromQuote', () => {
    it('should create contract in a transaction and return contract ID', async () => {
      // Quote is accepted with a recurring line item
      mockQueryRunner.query
        .mockResolvedValueOnce([{ id: 'quote-1', status: 'accepted', grandTotal: '60000' }])
        .mockResolvedValueOnce([
          { id: 'li-1', productName: 'Platform', quantity: 1, listPrice: '60000', netUnitPrice: '60000', billingType: 'recurring', sortOrder: 1 },
        ])
        .mockResolvedValueOnce([{ id: 'contract-1' }]) // INSERT contract
        .mockResolvedValueOnce(undefined) // INSERT subscription
        .mockResolvedValueOnce(undefined) // INSERT amendment
        .mockResolvedValueOnce(undefined); // UPDATE quote status

      const contractId = await service.createFromQuote('00000000-0000-0000-0000-000000000001', 'quote-1');

      expect(contractId).toBe('contract-1');
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should skip one-time line items when creating subscriptions', async () => {
      mockQueryRunner.query
        .mockResolvedValueOnce([{ id: 'quote-2', status: 'accepted', grandTotal: '10000' }])
        .mockResolvedValueOnce([
          { id: 'li-1', productName: 'Setup', quantity: 1, listPrice: '10000', netUnitPrice: '10000', billingType: 'one_time', sortOrder: 1 },
        ])
        .mockResolvedValueOnce([{ id: 'contract-2' }])
        .mockResolvedValueOnce(undefined) // amendment only — no subscription inserted
        .mockResolvedValueOnce(undefined);

      const contractId = await service.createFromQuote('00000000-0000-0000-0000-000000000001', 'quote-2');

      expect(contractId).toBe('contract-2');
      // subscription INSERT should not have been called (only 4 query calls: quote, lineItems, contract, amendment, updateQuote)
      const insertSubscriptionCalls = mockQueryRunner.query.mock.calls.filter(
        (call) => String(call[0]).includes('"contractSubscription"') && String(call[0]).includes('INSERT'),
      );
      expect(insertSubscriptionCalls).toHaveLength(0);
    });

    it('should rollback and rethrow if quote is not accepted', async () => {
      mockQueryRunner.query.mockResolvedValueOnce([]); // empty — not found

      await expect(service.createFromQuote('00000000-0000-0000-0000-000000000001', 'quote-missing'))
        .rejects.toThrow('not found or not in accepted status');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });
});
