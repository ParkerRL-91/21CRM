import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  generateContractNumber,
  generateQuoteNumber,
  generateInvoiceNumber,
  isValidContractTransition,
  getValidContractTransitions,
  isValidSubscriptionTransition,
  daysBetween,
  calculateProratedValue,
  calculateAmendmentDelta,
  calculateRenewalPrice,
  resolvePricingMethod,
  resolveUpliftPercentage,
} from './service';

// ============================================================================
// Number generators
// ============================================================================

describe('generateContractNumber', () => {
  it('generates padded number', () => {
    expect(generateContractNumber(1)).toBe('CON-0001');
    expect(generateContractNumber(42)).toBe('CON-0042');
    expect(generateContractNumber(9999)).toBe('CON-9999');
  });
});

describe('generateQuoteNumber', () => {
  it('generates with year and sequence', () => {
    expect(generateQuoteNumber(1, 2026)).toBe('Q-2026-0001');
    expect(generateQuoteNumber(42, 2026)).toBe('Q-2026-0042');
  });
});

describe('generateInvoiceNumber', () => {
  it('generates with year and sequence', () => {
    expect(generateInvoiceNumber(1, 2026)).toBe('INV-2026-0001');
  });
});

// ============================================================================
// Contract transitions
// ============================================================================

describe('isValidContractTransition', () => {
  it('allows draft → active', () => {
    expect(isValidContractTransition('draft', 'active')).toBe(true);
  });

  it('allows active → cancelled', () => {
    expect(isValidContractTransition('active', 'cancelled')).toBe(true);
  });

  it('allows active → pending_renewal', () => {
    expect(isValidContractTransition('active', 'pending_renewal')).toBe(true);
  });

  it('allows pending_renewal → renewed', () => {
    expect(isValidContractTransition('pending_renewal', 'renewed')).toBe(true);
  });

  it('rejects draft → cancelled', () => {
    expect(isValidContractTransition('draft', 'cancelled')).toBe(false);
  });

  it('rejects expired → active', () => {
    expect(isValidContractTransition('expired', 'active')).toBe(false);
  });
});

describe('getValidContractTransitions', () => {
  it('returns valid next states for active', () => {
    const next = getValidContractTransitions('active');
    expect(next).toContain('amended');
    expect(next).toContain('pending_renewal');
    expect(next).toContain('expired');
    expect(next).toContain('cancelled');
  });

  it('returns empty for terminal states', () => {
    expect(getValidContractTransitions('expired')).toEqual([]);
    expect(getValidContractTransitions('cancelled')).toEqual([]);
  });
});

// ============================================================================
// Subscription transitions
// ============================================================================

describe('isValidSubscriptionTransition', () => {
  it('allows active → pending_cancellation', () => {
    expect(isValidSubscriptionTransition('active', 'pending_cancellation')).toBe(true);
  });

  it('allows pending_cancellation → cancelled', () => {
    expect(isValidSubscriptionTransition('pending_cancellation', 'cancelled')).toBe(true);
  });

  it('rejects active → cancelled directly', () => {
    expect(isValidSubscriptionTransition('active', 'cancelled')).toBe(false);
  });

  it('allows suspended → active', () => {
    expect(isValidSubscriptionTransition('suspended', 'active')).toBe(true);
  });
});

// ============================================================================
// Proration
// ============================================================================

describe('daysBetween', () => {
  it('calculates days correctly', () => {
    expect(daysBetween(new Date('2026-01-01'), new Date('2026-12-31'))).toBe(364);
    expect(daysBetween(new Date('2026-01-01'), new Date('2027-01-01'))).toBe(365);
  });

  it('handles same date', () => {
    expect(daysBetween(new Date('2026-06-15'), new Date('2026-06-15'))).toBe(0);
  });
});

describe('calculateProratedValue', () => {
  it('prorates half-year correctly', () => {
    const result = calculateProratedValue(
      new Decimal(120000),
      new Date('2026-01-01'),
      new Date('2027-01-01'),
      new Date('2026-07-01')
    );
    // 184 remaining days / 365 total × 120000 ≈ 60493.15
    expect(result.toNumber()).toBeCloseTo(60493.15, 0);
  });

  it('returns full value at start date', () => {
    const result = calculateProratedValue(
      new Decimal(120000),
      new Date('2026-01-01'),
      new Date('2027-01-01'),
      new Date('2026-01-01')
    );
    expect(result.toString()).toBe('120000');
  });

  it('returns 0 at end date', () => {
    const result = calculateProratedValue(
      new Decimal(120000),
      new Date('2026-01-01'),
      new Date('2027-01-01'),
      new Date('2027-01-01')
    );
    expect(result.toString()).toBe('0');
  });

  it('returns 0 for zero-length contract', () => {
    const result = calculateProratedValue(
      new Decimal(120000),
      new Date('2026-01-01'),
      new Date('2026-01-01'),
      new Date('2026-01-01')
    );
    expect(result.toString()).toBe('0');
  });

  it('handles multi-year contracts', () => {
    const result = calculateProratedValue(
      new Decimal(120000),
      new Date('2026-01-01'),
      new Date('2028-01-01'),
      new Date('2027-01-01')
    );
    // 365 remaining / 730 total × 120000 = 60000
    expect(result.toString()).toBe('60000');
  });
});

describe('calculateAmendmentDelta', () => {
  it('calculates positive delta for quantity increase', () => {
    const result = calculateAmendmentDelta(
      new Decimal(1000), new Decimal(5),   // old: 5 × $1000 = $5000
      new Decimal(1000), new Decimal(10),  // new: 10 × $1000 = $10000
      new Date('2026-01-01'),
      new Date('2027-01-01'),
      new Date('2026-07-01')
    );
    // delta = $5000, prorated for ~184/365 days ≈ $2520.55
    expect(result.toNumber()).toBeGreaterThan(0);
    expect(result.toNumber()).toBeLessThan(5000);
  });

  it('calculates negative delta for quantity decrease', () => {
    const result = calculateAmendmentDelta(
      new Decimal(1000), new Decimal(10),
      new Decimal(1000), new Decimal(5),
      new Date('2026-01-01'),
      new Date('2027-01-01'),
      new Date('2026-07-01')
    );
    expect(result.toNumber()).toBeLessThan(0);
  });

  it('throws for effective date outside contract range', () => {
    expect(() =>
      calculateAmendmentDelta(
        new Decimal(1000), new Decimal(5),
        new Decimal(1000), new Decimal(10),
        new Date('2026-01-01'),
        new Date('2027-01-01'),
        new Date('2025-01-01') // before contract
      )
    ).toThrow('Effective date must be between');
  });
});

// ============================================================================
// Renewal pricing
// ============================================================================

describe('calculateRenewalPrice', () => {
  it('same_price returns current price unchanged', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(100),
      pricingMethod: 'same_price',
    });
    expect(result.newUnitPrice.toString()).toBe('100');
    expect(result.audit.method).toBe('same_price');
  });

  it('current_list uses list price when available', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(100),
      pricingMethod: 'current_list',
      currentListPrice: new Decimal(120),
    });
    expect(result.newUnitPrice.toString()).toBe('120');
  });

  it('current_list falls back to same price when no list price', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(100),
      pricingMethod: 'current_list',
    });
    expect(result.newUnitPrice.toString()).toBe('100');
    expect(result.audit.method).toContain('fallback');
  });

  it('uplift applies percentage correctly', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(100),
      pricingMethod: 'uplift_percentage',
      upliftPercentage: new Decimal(5),
    });
    expect(result.newUnitPrice.toString()).toBe('105');
  });

  it('uplift rounds to 2 decimal places', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(99.99),
      pricingMethod: 'uplift_percentage',
      upliftPercentage: new Decimal(3.5),
    });
    // 99.99 × 1.035 = 103.48965 → 103.49
    expect(result.newUnitPrice.toString()).toBe('103.49');
  });

  it('uplift caps at 50%', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(100),
      pricingMethod: 'uplift_percentage',
      upliftPercentage: new Decimal(75), // exceeds 50% cap
    });
    // Capped to 50%: 100 × 1.50 = 150
    expect(result.newUnitPrice.toString()).toBe('150');
  });

  it('uplift with 0% returns same price', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(100),
      pricingMethod: 'uplift_percentage',
      upliftPercentage: new Decimal(0),
    });
    expect(result.newUnitPrice.toString()).toBe('100');
  });

  it('handles zero price', () => {
    const result = calculateRenewalPrice({
      currentUnitPrice: new Decimal(0),
      pricingMethod: 'uplift_percentage',
      upliftPercentage: new Decimal(5),
    });
    expect(result.newUnitPrice.toString()).toBe('0');
  });
});

// ============================================================================
// Pricing method resolution
// ============================================================================

describe('resolvePricingMethod', () => {
  it('uses subscription-level override first', () => {
    expect(resolvePricingMethod('uplift_percentage', 'same_price', 'current_list')).toBe('uplift_percentage');
  });

  it('falls back to contract-level', () => {
    expect(resolvePricingMethod(null, 'same_price', 'current_list')).toBe('same_price');
  });

  it('falls back to org default', () => {
    expect(resolvePricingMethod(null, null, 'current_list')).toBe('current_list');
  });

  it('handles undefined', () => {
    expect(resolvePricingMethod(undefined, undefined, 'same_price')).toBe('same_price');
  });
});

describe('resolveUpliftPercentage', () => {
  it('uses subscription-level first', () => {
    expect(resolveUpliftPercentage(5, 3, 2).toString()).toBe('5');
  });

  it('falls back through hierarchy', () => {
    expect(resolveUpliftPercentage(null, 3, 2).toString()).toBe('3');
    expect(resolveUpliftPercentage(null, null, 2).toString()).toBe('2');
    expect(resolveUpliftPercentage(null, null, null).toString()).toBe('0');
  });
});
