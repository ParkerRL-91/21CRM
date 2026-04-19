import { describe, it, expect } from 'vitest';
import {
  autoLinkTiers,
  validateTiers,
  calculateGraduatedPrice,
  calculateVolumePriceForQuantity,
  addTier,
  removeTier,
  TierRow,
} from './tier-utils';

// ============================================================================
// autoLinkTiers
// ============================================================================

describe('autoLinkTiers', () => {
  it('links sequential tiers with no gaps', () => {
    const tiers: TierRow[] = [
      { from: 1, to: 100, unitPrice: 50 },
      { from: 50, to: 500, unitPrice: 40 }, // wrong "from" — should auto-fix
      { from: 300, to: null, unitPrice: 30 },
    ];
    const linked = autoLinkTiers(tiers);
    expect(linked[0].from).toBe(1);
    expect(linked[0].to).toBe(100);
    expect(linked[1].from).toBe(101); // auto-linked
    expect(linked[1].to).toBe(500);
    expect(linked[2].from).toBe(501); // auto-linked
    expect(linked[2].to).toBe(null); // last tier stays unlimited
  });

  it('handles single tier', () => {
    const linked = autoLinkTiers([{ from: 1, to: null, unitPrice: 50 }]);
    expect(linked).toHaveLength(1);
    expect(linked[0].to).toBe(null);
  });

  it('handles empty array', () => {
    expect(autoLinkTiers([])).toEqual([]);
  });
});

// ============================================================================
// validateTiers
// ============================================================================

describe('validateTiers', () => {
  it('passes for valid tiers', () => {
    const result = validateTiers([
      { from: 1, to: 100, unitPrice: 50 },
      { from: 101, to: 500, unitPrice: 40 },
      { from: 501, to: null, unitPrice: 30 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects negative prices', () => {
    const result = validateTiers([
      { from: 1, to: null, unitPrice: -10 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('unitPrice');
  });

  it('detects overlapping ranges', () => {
    const result = validateTiers([
      { from: 1, to: 100, unitPrice: 50 },
      { from: 50, to: null, unitPrice: 40 }, // overlaps
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('overlaps');
  });

  it('detects gaps', () => {
    const result = validateTiers([
      { from: 1, to: 100, unitPrice: 50 },
      { from: 200, to: null, unitPrice: 40 }, // gap: 101-199
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('Gap');
  });

  it('warns on ascending prices', () => {
    const result = validateTiers([
      { from: 1, to: 100, unitPrice: 30 },
      { from: 101, to: null, unitPrice: 50 }, // price goes UP
    ]);
    expect(result.valid).toBe(true); // warning, not error
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain('intentional');
  });

  it('requires at least one tier', () => {
    const result = validateTiers([]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('At least one tier');
  });

  it('detects invalid to < from', () => {
    const result = validateTiers([
      { from: 100, to: 50, unitPrice: 30 },
    ]);
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// calculateGraduatedPrice
// ============================================================================

describe('calculateGraduatedPrice', () => {
  const tiers: TierRow[] = [
    { from: 1, to: 100, unitPrice: 50 },
    { from: 101, to: 500, unitPrice: 40 },
    { from: 501, to: null, unitPrice: 30 },
  ];

  it('calculates for quantity in first tier', () => {
    const result = calculateGraduatedPrice(50, tiers);
    expect(result.totalPrice).toBe('2500');
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].quantity).toBe(50);
  });

  it('calculates across two tiers', () => {
    const result = calculateGraduatedPrice(250, tiers);
    // 100 × $50 + 150 × $40 = 5000 + 6000 = 11000
    expect(result.totalPrice).toBe('11000');
    expect(result.breakdown).toHaveLength(2);
  });

  it('calculates across all three tiers', () => {
    const result = calculateGraduatedPrice(600, tiers);
    // 100×50 + 400×40 + 100×30 = 5000 + 16000 + 3000 = 24000
    expect(result.totalPrice).toBe('24000');
    expect(result.breakdown).toHaveLength(3);
  });

  it('calculates effective rate', () => {
    const result = calculateGraduatedPrice(250, tiers);
    // 11000 / 250 = 44
    expect(result.effectiveRate).toBe('44');
  });

  it('returns 0 for zero quantity', () => {
    expect(calculateGraduatedPrice(0, tiers).totalPrice).toBe('0');
  });

  it('returns 0 for empty tiers', () => {
    expect(calculateGraduatedPrice(100, []).totalPrice).toBe('0');
  });

  it('handles flat fees', () => {
    const tiersWithFees: TierRow[] = [
      { from: 1, to: 100, unitPrice: 50, flatFee: 100 },
      { from: 101, to: null, unitPrice: 40, flatFee: 50 },
    ];
    const result = calculateGraduatedPrice(150, tiersWithFees);
    // (100×50 + 100) + (50×40 + 50) = 5100 + 2050 = 7150
    expect(result.totalPrice).toBe('7150');
  });
});

// ============================================================================
// calculateVolumePriceForQuantity
// ============================================================================

describe('calculateVolumePriceForQuantity', () => {
  const tiers: TierRow[] = [
    { from: 1, to: 100, unitPrice: 50 },
    { from: 101, to: 500, unitPrice: 40 },
    { from: 501, to: null, unitPrice: 30 },
  ];

  it('uses first tier for low quantity', () => {
    const result = calculateVolumePriceForQuantity(50, tiers);
    expect(result.totalPrice).toBe('2500'); // 50 × $50
    expect(result.effectiveRate).toBe('50');
  });

  it('uses second tier for mid quantity', () => {
    const result = calculateVolumePriceForQuantity(250, tiers);
    expect(result.totalPrice).toBe('10000'); // 250 × $40
  });

  it('uses third tier for high quantity', () => {
    const result = calculateVolumePriceForQuantity(600, tiers);
    expect(result.totalPrice).toBe('18000'); // 600 × $30
  });

  it('returns 0 for zero quantity', () => {
    expect(calculateVolumePriceForQuantity(0, tiers).totalPrice).toBe('0');
  });
});

// ============================================================================
// addTier / removeTier
// ============================================================================

describe('addTier', () => {
  it('adds a tier after the last one', () => {
    const tiers: TierRow[] = [
      { from: 1, to: null, unitPrice: 50 },
    ];
    const result = addTier(tiers, 40);
    expect(result).toHaveLength(2);
    expect(result[0].to).not.toBeNull(); // previous last tier now has a "to"
    expect(result[1].to).toBeNull(); // new tier is last (unlimited)
    expect(result[1].unitPrice).toBe(40);
  });

  it('auto-links new tier range', () => {
    const tiers: TierRow[] = [
      { from: 1, to: 100, unitPrice: 50 },
      { from: 101, to: null, unitPrice: 40 },
    ];
    const result = addTier(tiers, 30);
    expect(result).toHaveLength(3);
    expect(result[1].to).not.toBeNull();
    expect(result[2].from).toBe((result[1].to ?? 0) + 1);
    expect(result[2].to).toBeNull();
  });
});

describe('removeTier', () => {
  it('removes a tier and re-links', () => {
    const tiers: TierRow[] = [
      { from: 1, to: 100, unitPrice: 50 },
      { from: 101, to: 500, unitPrice: 40 },
      { from: 501, to: null, unitPrice: 30 },
    ];
    const result = removeTier(tiers, 1); // remove middle tier
    expect(result).toHaveLength(2);
    expect(result[0].from).toBe(1);
    expect(result[1].to).toBeNull(); // last tier unlimited
  });

  it('does not remove the last tier', () => {
    const tiers: TierRow[] = [{ from: 1, to: null, unitPrice: 50 }];
    const result = removeTier(tiers, 0);
    expect(result).toHaveLength(1); // unchanged
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('validateTiers — edge cases', () => {
  it('rejects tier with zero unitPrice (valid — free tier is allowed)', () => {
    const result = validateTiers([{ from: 1, to: null, unitPrice: 0 }]);
    expect(result.valid).toBe(true);
  });

  it('detects multiple tiers with negative prices', () => {
    const result = validateTiers([
      { from: 1, to: 100, unitPrice: -5 },
      { from: 101, to: null, unitPrice: -10 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('validates a single tier with unlimited upper bound', () => {
    const result = validateTiers([{ from: 1, to: null, unitPrice: 50 }]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects gap with three tiers', () => {
    const result = validateTiers([
      { from: 1, to: 100, unitPrice: 50 },
      { from: 200, to: 500, unitPrice: 40 }, // gap: 101-199
      { from: 501, to: null, unitPrice: 30 },
    ]);
    expect(result.valid).toBe(false);
    const gapErrors = result.errors.filter((e) => e.message.includes('Gap'));
    expect(gapErrors.length).toBeGreaterThan(0);
  });
});

describe('calculateGraduatedPrice — edge cases', () => {
  it('handles quantity of 1 — charged for only first tier', () => {
    const tiers: TierRow[] = [
      { from: 1, to: 100, unitPrice: 50 },
      { from: 101, to: null, unitPrice: 30 },
    ];
    const result = calculateGraduatedPrice(1, tiers);
    expect(result.totalPrice).toBe('50');
    expect(result.breakdown[0].quantity).toBe(1);
  });

  it('handles tiers with flat fee only (unitPrice = 0)', () => {
    const tiers: TierRow[] = [
      { from: 1, to: null, unitPrice: 0, flatFee: 500 },
    ];
    const result = calculateGraduatedPrice(100, tiers);
    expect(result.totalPrice).toBe('500');
  });

  it('returns empty breakdown for zero quantity', () => {
    const tiers: TierRow[] = [{ from: 1, to: null, unitPrice: 50 }];
    const result = calculateGraduatedPrice(0, tiers);
    expect(result.breakdown).toHaveLength(0);
    expect(result.totalPrice).toBe('0');
    expect(result.effectiveRate).toBe('0');
  });

  it('returns empty breakdown for empty tiers', () => {
    const result = calculateGraduatedPrice(100, []);
    expect(result.breakdown).toHaveLength(0);
    expect(result.totalPrice).toBe('0');
  });

  it('handles very large quantity in last unlimited tier', () => {
    const tiers: TierRow[] = [
      { from: 1, to: 100, unitPrice: 50 },
      { from: 101, to: null, unitPrice: 10 },
    ];
    const result = calculateGraduatedPrice(1_000_000, tiers);
    // 100×50 + 999900×10 = 5000 + 9999000 = 10004000
    expect(result.totalPrice).toBe('10004000');
  });
});

describe('calculateVolumePriceForQuantity — edge cases', () => {
  it('returns zero total for zero quantity', () => {
    const tiers: TierRow[] = [{ from: 1, to: null, unitPrice: 50 }];
    const result = calculateVolumePriceForQuantity(0, tiers);
    expect(result.totalPrice).toBe('0');
  });

  it('returns zero total for empty tier array', () => {
    const result = calculateVolumePriceForQuantity(100, []);
    expect(result.totalPrice).toBe('0');
    expect(result.breakdown).toHaveLength(0);
  });

  it('returns zero when no tier matches quantity', () => {
    const tiers: TierRow[] = [{ from: 50, to: null, unitPrice: 30 }];
    // quantity 10 is below the minimum tier start of 50
    const result = calculateVolumePriceForQuantity(10, tiers);
    expect(result.totalPrice).toBe('0');
  });

  it('handles a tier with unitPrice of 0 (free)', () => {
    const tiers: TierRow[] = [{ from: 1, to: null, unitPrice: 0 }];
    const result = calculateVolumePriceForQuantity(100, tiers);
    expect(result.totalPrice).toBe('0');
    expect(result.effectiveRate).toBe('0');
  });
});

describe('autoLinkTiers — edge cases', () => {
  it('handles a tier where previous tier has null to', () => {
    // Edge: if previous tier.to is null but it's not the last
    // autoLinkTiers should still compute from = (null ?? 0) + 1 = 1
    const tiers: TierRow[] = [
      { from: 1, to: null, unitPrice: 50 },
      { from: 999, to: null, unitPrice: 30 },
    ];
    const linked = autoLinkTiers(tiers);
    expect(linked[1].from).toBe(1); // (null ?? 0) + 1 = 1
    expect(linked[1].to).toBeNull(); // last tier stays null
  });
});
