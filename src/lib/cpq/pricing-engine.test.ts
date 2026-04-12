import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  PricingEngine,
  PricingContext,
  calculateTieredPrice,
  calculateVolumePrice,
  getTermDiscountPercent,
  DiscountTierInput,
} from './pricing-engine';

function makeContext(overrides: Partial<PricingContext> = {}): PricingContext {
  return {
    quantity: new Decimal(1),
    listPrice: new Decimal(100),
    productBaseTermMonths: 12,
    quoteTermMonths: 12,
    currentPrice: new Decimal(0),
    auditSteps: [],
    ...overrides,
  };
}

const engine = new PricingEngine();

// ============================================================================
// Full pipeline tests
// ============================================================================

describe('PricingEngine — full pipeline', () => {
  it('returns list price for simple case (no discounts, no proration)', () => {
    const result = engine.calculate(makeContext({ listPrice: new Decimal(100) }));
    expect(result.netUnitPrice.toString()).toBe('100');
    expect(result.netTotal.toString()).toBe('100');
    expect(result.auditSteps).toHaveLength(10);
  });

  it('calculates net total = unit price × quantity', () => {
    const result = engine.calculate(
      makeContext({ listPrice: new Decimal(50), quantity: new Decimal(10) })
    );
    expect(result.netUnitPrice.toString()).toBe('50');
    expect(result.netTotal.toString()).toBe('500');
  });

  it('applies manual discount percentage', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(100),
        manualDiscountPercent: new Decimal(15),
      })
    );
    expect(result.netUnitPrice.toString()).toBe('85');
    expect(result.discountPercent?.toString()).toBe('15');
  });

  it('applies manual discount amount', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(100),
        manualDiscountAmount: new Decimal(20),
      })
    );
    expect(result.netUnitPrice.toString()).toBe('80');
  });

  it('applies manual price override', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(100),
        manualPriceOverride: new Decimal(75),
      })
    );
    expect(result.netUnitPrice.toString()).toBe('75');
  });

  it('uses contracted price when available', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(100),
        contractedPrice: new Decimal(80),
      })
    );
    expect(result.netUnitPrice.toString()).toBe('80');
  });

  it('applies proration for different term lengths', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(12000),
        productBaseTermMonths: 12,
        quoteTermMonths: 18,
      })
    );
    expect(result.netUnitPrice.toString()).toBe('18000');
  });

  it('prorates down for shorter terms', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(12000),
        productBaseTermMonths: 12,
        quoteTermMonths: 6,
      })
    );
    expect(result.netUnitPrice.toString()).toBe('6000');
  });

  it('enforces floor price', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(100),
        manualDiscountPercent: new Decimal(90),
        floorPrice: new Decimal(50),
      })
    );
    expect(result.netUnitPrice.toString()).toBe('50');
  });

  it('clamps negative price to zero', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(100),
        manualDiscountAmount: new Decimal(200),
      })
    );
    expect(result.netUnitPrice.toString()).toBe('0');
  });

  it('rounds to 2 decimal places', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(99.99),
        manualDiscountPercent: new Decimal(3.5),
      })
    );
    // 99.99 * 0.965 = 96.49035 → rounds to 96.49
    expect(result.netUnitPrice.toString()).toBe('96.49');
  });

  it('produces 10 audit steps', () => {
    const result = engine.calculate(makeContext());
    expect(result.auditSteps).toHaveLength(10);
    expect(result.auditSteps[0].ruleName).toBe('base_price');
    expect(result.auditSteps[9].ruleName).toBe('total_calculation');
  });

  it('handles zero list price', () => {
    const result = engine.calculate(
      makeContext({ listPrice: new Decimal(0) })
    );
    expect(result.netUnitPrice.toString()).toBe('0');
    expect(result.netTotal.toString()).toBe('0');
  });

  it('handles combined proration + discount', () => {
    // $12,000/yr product, 18-month quote, 15% discount
    // Prorated: 12000 * 18/12 = 18000
    // After 15% discount: 18000 * 0.85 = 15300
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(12000),
        productBaseTermMonths: 12,
        quoteTermMonths: 18,
        manualDiscountPercent: new Decimal(15),
      })
    );
    expect(result.netUnitPrice.toString()).toBe('15300');
  });
});

// ============================================================================
// Tiered (slab) pricing
// ============================================================================

describe('calculateTieredPrice', () => {
  const tiers: DiscountTierInput[] = [
    { lowerBound: 1, upperBound: 500, discountValue: 40, sortOrder: 1 },
    { lowerBound: 501, upperBound: 2000, discountValue: 30, sortOrder: 2 },
    { lowerBound: 2001, upperBound: null, discountValue: 20, sortOrder: 3 },
  ];
  const basePrice = new Decimal(50);

  it('prices all units in first tier', () => {
    // 100 units × $40 = $4,000
    const total = calculateTieredPrice(100, tiers, basePrice);
    expect(total.toString()).toBe('4000');
  });

  it('splits across two tiers', () => {
    // 700 units: 500 × $40 + 200 × $30 = $20,000 + $6,000 = $26,000
    const total = calculateTieredPrice(700, tiers, basePrice);
    expect(total.toString()).toBe('26000');
  });

  it('splits across three tiers', () => {
    // 2500 units: 500×40 + 1500×30 + 500×20 = 20000+45000+10000 = 75000
    const total = calculateTieredPrice(2500, tiers, basePrice);
    expect(total.toString()).toBe('75000');
  });

  it('handles exactly on tier boundary', () => {
    // 500 units: 500 × $40 = $20,000
    const total = calculateTieredPrice(500, tiers, basePrice);
    expect(total.toString()).toBe('20000');
  });

  it('returns 0 for zero quantity', () => {
    expect(calculateTieredPrice(0, tiers, basePrice).toString()).toBe('0');
  });

  it('returns 0 for negative quantity', () => {
    expect(calculateTieredPrice(-5, tiers, basePrice).toString()).toBe('0');
  });

  it('handles single tier', () => {
    const singleTier: DiscountTierInput[] = [
      { lowerBound: 1, upperBound: null, discountValue: 25, sortOrder: 1 },
    ];
    const total = calculateTieredPrice(100, singleTier, basePrice);
    expect(total.toString()).toBe('2500');
  });
});

// ============================================================================
// Volume (all-units) pricing
// ============================================================================

describe('calculateVolumePrice', () => {
  const tiers: DiscountTierInput[] = [
    { lowerBound: 1, upperBound: 50, discountValue: 50, sortOrder: 1 },
    { lowerBound: 51, upperBound: 100, discountValue: 40, sortOrder: 2 },
    { lowerBound: 101, upperBound: null, discountValue: 30, sortOrder: 3 },
  ];
  const basePrice = new Decimal(60);

  it('returns tier 1 price for low quantity', () => {
    expect(calculateVolumePrice(25, tiers, basePrice).toString()).toBe('50');
  });

  it('returns tier 2 price for mid quantity', () => {
    expect(calculateVolumePrice(80, tiers, basePrice).toString()).toBe('40');
  });

  it('returns tier 3 price for high quantity', () => {
    expect(calculateVolumePrice(200, tiers, basePrice).toString()).toBe('30');
  });

  it('returns exact tier boundary price', () => {
    expect(calculateVolumePrice(51, tiers, basePrice).toString()).toBe('40');
    expect(calculateVolumePrice(101, tiers, basePrice).toString()).toBe('30');
  });

  it('returns base price when no tier matches', () => {
    expect(calculateVolumePrice(0, tiers, basePrice).toString()).toBe('0');
  });
});

// ============================================================================
// Term-based discounts
// ============================================================================

describe('getTermDiscountPercent', () => {
  const tiers: DiscountTierInput[] = [
    { lowerBound: 12, upperBound: 23, discountValue: 0, sortOrder: 1 },
    { lowerBound: 24, upperBound: 35, discountValue: 5, sortOrder: 2 },
    { lowerBound: 36, upperBound: null, discountValue: 10, sortOrder: 3 },
  ];

  it('returns 0% for 12-month term', () => {
    expect(getTermDiscountPercent(12, tiers).toString()).toBe('0');
  });

  it('returns 5% for 24-month term', () => {
    expect(getTermDiscountPercent(24, tiers).toString()).toBe('5');
  });

  it('returns 10% for 36-month term', () => {
    expect(getTermDiscountPercent(36, tiers).toString()).toBe('10');
  });

  it('returns 10% for 48-month term (above highest tier)', () => {
    expect(getTermDiscountPercent(48, tiers).toString()).toBe('10');
  });

  it('returns 0% for 6-month term (below any tier)', () => {
    expect(getTermDiscountPercent(6, tiers).toString()).toBe('0');
  });
});

// ============================================================================
// Term discount in pipeline
// ============================================================================

describe('PricingEngine — term discount integration', () => {
  it('applies term discount via pipeline', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(12000),
        quoteTermMonths: 36,
        discountSchedule: {
          type: 'term',
          tiers: [
            { lowerBound: 12, upperBound: 23, discountValue: 0, sortOrder: 1 },
            { lowerBound: 24, upperBound: 35, discountValue: 5, sortOrder: 2 },
            { lowerBound: 36, upperBound: null, discountValue: 10, sortOrder: 3 },
          ],
        },
      })
    );
    // 12000 prorated for 36mo: 12000 * 36/12 = 36000
    // Then 10% term discount: 36000 * 0.90 = 32400
    expect(result.netUnitPrice.toString()).toBe('32400');
  });
});

// ============================================================================
// Volume discount in pipeline
// ============================================================================

describe('PricingEngine — volume discount integration', () => {
  it('applies volume pricing via pipeline', () => {
    const result = engine.calculate(
      makeContext({
        listPrice: new Decimal(50),
        quantity: new Decimal(80),
        discountSchedule: {
          type: 'volume',
          tiers: [
            { lowerBound: 1, upperBound: 50, discountValue: 50, sortOrder: 1 },
            { lowerBound: 51, upperBound: 100, discountValue: 40, sortOrder: 2 },
            { lowerBound: 101, upperBound: null, discountValue: 30, sortOrder: 3 },
          ],
        },
      })
    );
    // 80 units: volume tier = $40/unit
    expect(result.netUnitPrice.toString()).toBe('40');
    expect(result.netTotal.toString()).toBe('3200');
  });
});
