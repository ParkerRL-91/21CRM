import { CpqContractService } from '../cpq-contract.service';

describe('CpqContractService', () => {
  let service: CpqContractService;

  beforeEach(() => {
    service = new CpqContractService();
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
});
