import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface TierRow {
  from: number;
  to: number | null; // null = unlimited (last tier)
  unitPrice: number;
  flatFee?: number;
}

export interface TierValidationResult {
  valid: boolean;
  errors: TierError[];
  warnings: TierWarning[];
}

export interface TierError {
  tierIndex: number;
  field: string;
  message: string;
}

export interface TierWarning {
  tierIndex: number;
  message: string;
}

export interface TierCalculationResult {
  totalPrice: string;
  effectiveRate: string;
  breakdown: Array<{
    tierIndex: number;
    from: number;
    to: number | null;
    quantity: number;
    unitPrice: number;
    subtotal: string;
  }>;
}

/**
 * Auto-link tier ranges so there are no gaps or overlaps.
 * Each tier's "from" = previous tier's "to" + 1. Last tier's "to" = null.
 */
export function autoLinkTiers(tiers: TierRow[]): TierRow[] {
  if (tiers.length === 0) return [];

  return tiers.map((tier, i) => {
    const from = i === 0 ? tier.from : (tiers[i - 1].to ?? 0) + 1;
    const to = i === tiers.length - 1 ? null : tier.to;
    return { ...tier, from, to };
  });
}

/**
 * Validate tier configuration for errors and warnings.
 */
export function validateTiers(tiers: TierRow[]): TierValidationResult {
  const errors: TierError[] = [];
  const warnings: TierWarning[] = [];

  if (tiers.length === 0) {
    errors.push({ tierIndex: -1, field: 'tiers', message: 'At least one tier is required' });
    return { valid: false, errors, warnings };
  }

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];

    // Negative prices
    if (tier.unitPrice < 0) {
      errors.push({ tierIndex: i, field: 'unitPrice', message: 'Price cannot be negative' });
    }

    // Invalid ranges (non-last tier)
    if (tier.to !== null && tier.to < tier.from) {
      errors.push({ tierIndex: i, field: 'to', message: `"To" (${tier.to}) must be >= "From" (${tier.from})` });
    }

    // Overlap with next tier
    if (i < tiers.length - 1) {
      const next = tiers[i + 1];
      if (tier.to !== null && next.from <= tier.to) {
        errors.push({
          tierIndex: i,
          field: 'to',
          message: `Tier ${i + 1} (to: ${tier.to}) overlaps with tier ${i + 2} (from: ${next.from})`,
        });
      }

      // Gap detection
      if (tier.to !== null && next.from > tier.to + 1) {
        errors.push({
          tierIndex: i,
          field: 'to',
          message: `Gap between tier ${i + 1} (to: ${tier.to}) and tier ${i + 2} (from: ${next.from})`,
        });
      }
    }

    // Warning: ascending price (unusual for volume discounts)
    if (i > 0 && tier.unitPrice > tiers[i - 1].unitPrice) {
      warnings.push({
        tierIndex: i,
        message: `Unit price increases from $${tiers[i - 1].unitPrice} to $${tier.unitPrice} — is this intentional?`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Calculate graduated (tiered/slab) pricing for a given quantity.
 */
export function calculateGraduatedPrice(quantity: number, tiers: TierRow[]): TierCalculationResult {
  if (quantity <= 0 || tiers.length === 0) {
    return { totalPrice: '0', effectiveRate: '0', breakdown: [] };
  }

  let remaining = quantity;
  let total = new Decimal(0);
  const breakdown: TierCalculationResult['breakdown'] = [];

  for (let i = 0; i < tiers.length; i++) {
    if (remaining <= 0) break;
    const tier = tiers[i];
    const tierCapacity = tier.to !== null ? tier.to - tier.from + 1 : remaining;
    const tierQty = Math.min(remaining, tierCapacity);

    const subtotal = new Decimal(tierQty).times(tier.unitPrice)
      .plus(tier.flatFee ?? 0);
    total = total.plus(subtotal);

    breakdown.push({
      tierIndex: i,
      from: tier.from,
      to: tier.to,
      quantity: tierQty,
      unitPrice: tier.unitPrice,
      subtotal: subtotal.toDecimalPlaces(2).toString(),
    });

    remaining -= tierQty;
  }

  const effectiveRate = quantity > 0
    ? total.dividedBy(quantity).toDecimalPlaces(4).toString()
    : '0';

  return {
    totalPrice: total.toDecimalPlaces(2).toString(),
    effectiveRate,
    breakdown,
  };
}

/**
 * Calculate volume (all-units) pricing for a given quantity.
 */
export function calculateVolumePriceForQuantity(quantity: number, tiers: TierRow[]): TierCalculationResult {
  if (quantity <= 0 || tiers.length === 0) {
    return { totalPrice: '0', effectiveRate: '0', breakdown: [] };
  }

  // Find applicable tier (highest tier where quantity >= from)
  const sorted = [...tiers].sort((a, b) => b.from - a.from);
  const applicableTier = sorted.find((t) => quantity >= t.from);

  if (!applicableTier) {
    return { totalPrice: '0', effectiveRate: '0', breakdown: [] };
  }

  const total = new Decimal(quantity).times(applicableTier.unitPrice)
    .plus(applicableTier.flatFee ?? 0);
  const tierIndex = tiers.indexOf(applicableTier);

  return {
    totalPrice: total.toDecimalPlaces(2).toString(),
    effectiveRate: new Decimal(applicableTier.unitPrice).toString(),
    breakdown: [{
      tierIndex,
      from: applicableTier.from,
      to: applicableTier.to,
      quantity,
      unitPrice: applicableTier.unitPrice,
      subtotal: total.toDecimalPlaces(2).toString(),
    }],
  };
}

/**
 * Add a new tier to the list with auto-linked range.
 */
export function addTier(tiers: TierRow[], defaultPrice: number = 0): TierRow[] {
  const lastTier = tiers[tiers.length - 1];
  const newFrom = lastTier && lastTier.to !== null ? lastTier.to + 1 : (lastTier ? lastTier.from + 100 : 1);

  // Update the previous last tier to have a concrete "to"
  const updated = tiers.map((t, i) =>
    i === tiers.length - 1 && t.to === null
      ? { ...t, to: newFrom - 1 }
      : t
  );

  return [...updated, { from: newFrom, to: null, unitPrice: defaultPrice }];
}

/**
 * Remove a tier and re-link ranges.
 */
export function removeTier(tiers: TierRow[], index: number): TierRow[] {
  if (tiers.length <= 1) return tiers; // minimum 1 tier
  const filtered = tiers.filter((_, i) => i !== index);
  return autoLinkTiers(filtered);
}
