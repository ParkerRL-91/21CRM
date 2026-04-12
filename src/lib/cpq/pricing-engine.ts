import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ============================================================================
// Types
// ============================================================================

export interface PricingContext {
  // Input data
  quantity: Decimal;
  listPrice: Decimal;
  productBaseTermMonths: number;
  quoteTermMonths: number;
  // Discount schedule (if any)
  discountSchedule?: {
    type: 'tiered' | 'volume' | 'term';
    tiers: DiscountTierInput[];
  };
  // Manual discount from rep
  manualDiscountPercent?: Decimal;
  manualDiscountAmount?: Decimal;
  manualPriceOverride?: Decimal;
  // Floor price
  floorPrice?: Decimal;
  // Contracted/special price for the account
  contractedPrice?: Decimal;
  // Current pipeline state
  currentPrice: Decimal;
  auditSteps: PricingAuditStep[];
}

export interface DiscountTierInput {
  lowerBound: number;
  upperBound: number | null;
  discountValue: number; // percent, amount, or price depending on schedule
  sortOrder: number;
}

export interface PricingAuditStep {
  ruleName: string;
  inputPrice: string;
  outputPrice: string;
  parameters?: Record<string, string>;
  timestamp: string;
}

export interface PricingRule {
  name: string;
  priority: number;
  evaluate(ctx: PricingContext): PricingContext;
}

export interface PricingResult {
  netUnitPrice: Decimal;
  netTotal: Decimal;
  listPrice: Decimal;
  specialPrice?: Decimal;
  proratedPrice?: Decimal;
  regularPrice?: Decimal;
  customerPrice?: Decimal;
  discountPercent?: Decimal;
  discountAmount?: Decimal;
  auditSteps: PricingAuditStep[];
}

// ============================================================================
// Pricing Rules (10-step waterfall)
// ============================================================================

/** Step 1: Resolve base price from price book entry */
export const basePriceRule: PricingRule = {
  name: 'base_price',
  priority: 10,
  evaluate(ctx) {
    // listPrice is already set from the price book entry
    return { ...ctx, currentPrice: ctx.listPrice };
  },
};

/** Step 2: Apply contracted/customer-specific price if exists */
export const contractedPriceRule: PricingRule = {
  name: 'contracted_price',
  priority: 20,
  evaluate(ctx) {
    if (ctx.contractedPrice && ctx.contractedPrice.gt(0)) {
      return { ...ctx, currentPrice: ctx.contractedPrice };
    }
    return ctx;
  },
};

/** Step 3: Prorate subscription price based on term ratio */
export const prorationRule: PricingRule = {
  name: 'proration',
  priority: 30,
  evaluate(ctx) {
    if (
      ctx.productBaseTermMonths > 0 &&
      ctx.quoteTermMonths > 0 &&
      ctx.quoteTermMonths !== ctx.productBaseTermMonths
    ) {
      const multiplier = new Decimal(ctx.quoteTermMonths).dividedBy(
        ctx.productBaseTermMonths
      );
      return {
        ...ctx,
        currentPrice: ctx.currentPrice.times(multiplier),
      };
    }
    return ctx;
  },
};

/** Step 4: Apply tiered or volume discount from schedule */
export const discountScheduleRule: PricingRule = {
  name: 'discount_schedule',
  priority: 40,
  evaluate(ctx) {
    if (!ctx.discountSchedule) return ctx;

    const { type, tiers } = ctx.discountSchedule;
    const qty = ctx.quantity.toNumber();

    if (type === 'tiered') {
      const total = calculateTieredPrice(qty, tiers, ctx.currentPrice);
      const effectiveUnitPrice = total.dividedBy(ctx.quantity);
      return { ...ctx, currentPrice: effectiveUnitPrice };
    }

    if (type === 'volume') {
      const unitPrice = calculateVolumePrice(qty, tiers, ctx.currentPrice);
      return { ...ctx, currentPrice: unitPrice };
    }

    // term-based handled in step 5
    return ctx;
  },
};

/** Step 5: Apply term-based discount (multi-year commitment) */
export const termDiscountRule: PricingRule = {
  name: 'term_discount',
  priority: 50,
  evaluate(ctx) {
    if (
      !ctx.discountSchedule ||
      ctx.discountSchedule.type !== 'term'
    ) {
      return ctx;
    }

    const termMonths = ctx.quoteTermMonths;
    const tiers = ctx.discountSchedule.tiers.sort(
      (a, b) => a.lowerBound - b.lowerBound
    );

    // Find applicable tier for the quote term
    const applicableTier = [...tiers]
      .reverse()
      .find((t) => termMonths >= t.lowerBound);

    if (applicableTier) {
      const discountPercent = new Decimal(applicableTier.discountValue);
      const multiplier = new Decimal(1).minus(
        discountPercent.dividedBy(100)
      );
      return {
        ...ctx,
        currentPrice: ctx.currentPrice.times(multiplier),
      };
    }

    return ctx;
  },
};

/** Step 6: Apply manual rep discount (%, amount, or override) */
export const manualDiscountRule: PricingRule = {
  name: 'manual_discount',
  priority: 60,
  evaluate(ctx) {
    if (ctx.manualPriceOverride && ctx.manualPriceOverride.gte(0)) {
      return { ...ctx, currentPrice: ctx.manualPriceOverride };
    }

    if (ctx.manualDiscountPercent && ctx.manualDiscountPercent.gt(0)) {
      const multiplier = new Decimal(1).minus(
        ctx.manualDiscountPercent.dividedBy(100)
      );
      return {
        ...ctx,
        currentPrice: ctx.currentPrice.times(multiplier),
      };
    }

    if (ctx.manualDiscountAmount && ctx.manualDiscountAmount.gt(0)) {
      return {
        ...ctx,
        currentPrice: ctx.currentPrice.minus(ctx.manualDiscountAmount),
      };
    }

    return ctx;
  },
};

/** Step 7: Enforce floor price */
export const floorPriceRule: PricingRule = {
  name: 'floor_price',
  priority: 70,
  evaluate(ctx) {
    if (ctx.floorPrice && ctx.currentPrice.lt(ctx.floorPrice)) {
      return { ...ctx, currentPrice: ctx.floorPrice };
    }
    return ctx;
  },
};

/** Step 8: Currency conversion (placeholder — returns unchanged for now) */
export const currencyRule: PricingRule = {
  name: 'currency_conversion',
  priority: 80,
  evaluate(ctx) {
    // Future: convert if quote currency != price book currency
    return ctx;
  },
};

/** Step 9: Round to 2 decimal places */
export const roundingRule: PricingRule = {
  name: 'rounding',
  priority: 90,
  evaluate(ctx) {
    return {
      ...ctx,
      currentPrice: ctx.currentPrice.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    };
  },
};

/** Step 10: Calculate total (unit price × quantity) */
export const totalRule: PricingRule = {
  name: 'total_calculation',
  priority: 100,
  evaluate(ctx) {
    // Total is computed outside — this step ensures price is non-negative
    if (ctx.currentPrice.lt(0)) {
      return { ...ctx, currentPrice: new Decimal(0) };
    }
    return ctx;
  },
};

// ============================================================================
// Discount Calculators
// ============================================================================

/**
 * Tiered (slab) pricing: different rates for different portions of quantity.
 * E.g., first 500 at $40/unit, next 1500 at $30/unit
 */
export function calculateTieredPrice(
  quantity: number,
  tiers: DiscountTierInput[],
  baseUnitPrice: Decimal
): Decimal {
  if (quantity <= 0) return new Decimal(0);

  const sorted = [...tiers].sort((a, b) => a.lowerBound - b.lowerBound);
  let remaining = quantity;
  let total = new Decimal(0);

  for (const tier of sorted) {
    if (remaining <= 0) break;

    const tierUpperBound = tier.upperBound ?? Infinity;
    const tierRange = tierUpperBound - tier.lowerBound + 1;
    const tierQty = Math.min(remaining, tierRange);

    // discountValue is the per-unit price for this tier
    const tierUnitPrice = new Decimal(tier.discountValue);
    total = total.plus(tierUnitPrice.times(tierQty));

    remaining -= tierQty;
  }

  return total;
}

/**
 * Volume (all-units) pricing: all units get the rate of the highest applicable tier.
 * E.g., 80 units in the 51-100 tier means all 80 at that tier's rate
 */
export function calculateVolumePrice(
  quantity: number,
  tiers: DiscountTierInput[],
  baseUnitPrice: Decimal
): Decimal {
  if (quantity <= 0) return new Decimal(0);

  const sorted = [...tiers].sort((a, b) => b.lowerBound - a.lowerBound);
  const applicableTier = sorted.find((t) => quantity >= t.lowerBound);

  if (applicableTier) {
    return new Decimal(applicableTier.discountValue);
  }

  // No tier matched — return base price
  return baseUnitPrice;
}

/**
 * Calculate term-based discount percentage for a given term length.
 */
export function getTermDiscountPercent(
  termMonths: number,
  tiers: DiscountTierInput[]
): Decimal {
  const sorted = [...tiers].sort((a, b) => b.lowerBound - a.lowerBound);
  const applicableTier = sorted.find((t) => termMonths >= t.lowerBound);
  return applicableTier
    ? new Decimal(applicableTier.discountValue)
    : new Decimal(0);
}

// ============================================================================
// Pricing Engine
// ============================================================================

const DEFAULT_RULES: PricingRule[] = [
  basePriceRule,
  contractedPriceRule,
  prorationRule,
  discountScheduleRule,
  termDiscountRule,
  manualDiscountRule,
  floorPriceRule,
  currencyRule,
  roundingRule,
  totalRule,
];

export class PricingEngine {
  private rules: PricingRule[];

  constructor(rules?: PricingRule[]) {
    this.rules = (rules ?? DEFAULT_RULES).sort(
      (a, b) => a.priority - b.priority
    );
  }

  calculate(ctx: PricingContext): PricingResult {
    let current = { ...ctx, auditSteps: [] as PricingAuditStep[] };

    for (const rule of this.rules) {
      const inputPrice = current.currentPrice.toString();
      current = rule.evaluate(current);
      const outputPrice = current.currentPrice.toString();

      current.auditSteps.push({
        ruleName: rule.name,
        inputPrice,
        outputPrice,
        timestamp: new Date().toISOString(),
      });
    }

    const netUnitPrice = current.currentPrice;
    const netTotal = netUnitPrice
      .times(current.quantity)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const discountAmount = ctx.listPrice.minus(netUnitPrice);
    const discountPercent = ctx.listPrice.gt(0)
      ? discountAmount
          .dividedBy(ctx.listPrice)
          .times(100)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(0);

    return {
      netUnitPrice,
      netTotal,
      listPrice: ctx.listPrice,
      discountPercent: discountPercent.gt(0) ? discountPercent : undefined,
      discountAmount: discountAmount.gt(0) ? discountAmount : undefined,
      auditSteps: current.auditSteps,
    };
  }
}
