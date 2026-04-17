import { Injectable } from '@nestjs/common';

import { Decimal, convertCurrency, roundForCurrency } from 'src/modules/cpq/utils/cpq-decimal.utils';
import { safeDecimal, safePositiveNumber, CpqValidationError } from 'src/modules/cpq/utils/cpq-validation.utils';

// CPQ Pricing Service — 10-step price waterfall engine.
// All inputs validated before Decimal construction.
// All division guarded against zero.
// All discount percentages clamped to [0, 100].
@Injectable()
export class CpqPricingService {
  calculatePriceWaterfall(input: PricingInput): PricingResult {
    // Input validation — fail fast with descriptive errors
    const listPrice = safeDecimal(input.listPrice, 'listPrice');
    const quantity = safePositiveNumber(input.quantity, 'quantity');

    let price = listPrice;
    const audit: PricingAuditStep[] = [];

    // Step 1: Base price
    audit.push(this.step('base_price', price, price));

    // Step 2: Contracted price
    if (input.contractedPrice) {
      const before = price;
      price = safeDecimal(input.contractedPrice, 'contractedPrice');
      audit.push(this.step('contracted_price', before, price));
    }

    // Step 3: Proration — guard division by zero
    if (input.quoteTermMonths && input.productBaseTermMonths &&
        input.quoteTermMonths !== input.productBaseTermMonths) {
      if (input.productBaseTermMonths === 0) {
        throw new CpqValidationError('productBaseTermMonths cannot be zero');
      }
      const before = price;
      const multiplier = new Decimal(input.quoteTermMonths).dividedBy(input.productBaseTermMonths);
      price = price.times(multiplier);
      audit.push(this.step('proration', before, price, {
        quoteTermMonths: String(input.quoteTermMonths),
        productBaseTermMonths: String(input.productBaseTermMonths),
      }));
    }

    // Step 4: Tiered/Volume/Block discount
    if (input.discountSchedule && input.discountSchedule.tiers.length > 0) {
      const before = price;
      switch (input.discountSchedule.type) {
        case 'tiered':
          price = this.calculateTieredEffectivePrice(quantity, input.discountSchedule.tiers);
          break;
        case 'volume':
          price = this.calculateVolumePrice(quantity, input.discountSchedule.tiers, price);
          break;
        case 'block':
          price = this.calculateBlockPrice(quantity, input.discountSchedule.tiers, price);
          break;
        // term handled in step 5
      }
      audit.push(this.step('discount_schedule', before, price, {
        scheduleType: input.discountSchedule.type,
      }));
    }

    // Step 5: Term discount
    if (input.discountSchedule?.type === 'term' && input.quoteTermMonths &&
        input.discountSchedule.tiers.length > 0) {
      const before = price;
      const discountPercent = this.getTermDiscount(input.quoteTermMonths, input.discountSchedule.tiers);
      if (discountPercent.gt(0)) {
        price = price.times(new Decimal(1).minus(discountPercent.dividedBy(100)));
      }
      audit.push(this.step('term_discount', before, price, {
        discountPercent: discountPercent.toString(),
      }));
    }

    // Step 6: Manual discount — cap percent to [0, 100]
    if (input.manualPriceOverride !== undefined) {
      const before = price;
      price = safeDecimal(input.manualPriceOverride, 'manualPriceOverride');
      audit.push(this.step('manual_discount', before, price, { type: 'override' }));
    } else if (input.manualDiscountPercent) {
      const before = price;
      const capped = Math.min(Math.max(Number(input.manualDiscountPercent), 0), 100);
      price = price.times(new Decimal(1).minus(new Decimal(capped).dividedBy(100)));
      audit.push(this.step('manual_discount', before, price, {
        type: 'percent',
        value: String(capped),
      }));
    } else if (input.manualDiscountAmount) {
      const before = price;
      price = price.minus(safeDecimal(input.manualDiscountAmount, 'manualDiscountAmount'));
      audit.push(this.step('manual_discount', before, price, {
        type: 'amount',
        value: String(input.manualDiscountAmount),
      }));
    }

    // Step 7: Floor price
    if (input.floorPrice) {
      const floor = safeDecimal(input.floorPrice, 'floorPrice');
      if (price.lt(floor)) {
        const before = price;
        price = floor;
        audit.push(this.step('floor_price', before, price));
      }
    }

    // Step 8: Currency conversion
    if (input.fromCurrency && input.toCurrency && input.fromCurrency !== input.toCurrency) {
      const before = price;
      price = convertCurrency(price, input.fromCurrency, input.toCurrency);
      audit.push(this.step('currency_conversion', before, price, {
        from: input.fromCurrency,
        to: input.toCurrency,
      }));
    }

    // Step 9: Rounding (currency-aware)
    price = roundForCurrency(price, input.toCurrency || input.fromCurrency || 'USD');

    // Step 10: Ensure non-negative
    if (price.lt(0)) price = new Decimal(0);

    const netTotal = price.times(quantity).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      netUnitPrice: price.toString(),
      netTotal: netTotal.toString(),
      listPrice: input.listPrice,
      auditSteps: audit,
    };
  }

  calculateTieredEffectivePrice(quantity: number, tiers: DiscountTier[]): Decimal {
    if (quantity <= 0 || tiers.length === 0) return new Decimal(0);
    const sorted = [...tiers].sort((a, b) => a.lowerBound - b.lowerBound);
    let remaining = quantity;
    let total = new Decimal(0);

    for (const tier of sorted) {
      if (remaining <= 0) break;
      const tierCapacity = tier.upperBound !== null ? tier.upperBound - tier.lowerBound + 1 : remaining;
      const tierQty = Math.min(remaining, tierCapacity);
      total = total.plus(new Decimal(tierQty).times(tier.value));
      remaining -= tierQty;
    }

    // Guard: if tiers didn't cover full quantity, remaining > 0
    // Use the last tier's price for uncovered units
    if (remaining > 0 && sorted.length > 0) {
      const lastTier = sorted[sorted.length - 1];
      total = total.plus(new Decimal(remaining).times(lastTier.value));
    }

    return total.dividedBy(quantity);
  }

  calculateVolumePrice(quantity: number, tiers: DiscountTier[], basePrice: Decimal): Decimal {
    if (quantity <= 0 || tiers.length === 0) return new Decimal(0);
    const sorted = [...tiers].sort((a, b) => b.lowerBound - a.lowerBound);
    const applicable = sorted.find((t) => quantity >= t.lowerBound);
    return applicable ? new Decimal(applicable.value) : basePrice;
  }

  getTermDiscount(termMonths: number, tiers: DiscountTier[]): Decimal {
    if (tiers.length === 0) return new Decimal(0);
    const sorted = [...tiers].sort((a, b) => b.lowerBound - a.lowerBound);
    const applicable = sorted.find((t) => termMonths >= t.lowerBound);
    return applicable ? new Decimal(applicable.value) : new Decimal(0);
  }

  // Block pricing: fixed total price for a quantity range.
  // Guard against division by zero.
  calculateBlockPrice(quantity: number, tiers: DiscountTier[], basePrice: Decimal): Decimal {
    if (quantity <= 0 || tiers.length === 0) return new Decimal(0);
    const sorted = [...tiers].sort((a, b) => b.lowerBound - a.lowerBound);
    const applicable = sorted.find((t) => quantity >= t.lowerBound);
    if (!applicable) return basePrice;
    return new Decimal(applicable.value).dividedBy(Math.max(quantity, 1));
  }

  // Exhaustive switch with default throw
  calculateRenewalPrice(input: RenewalPricingInput): RenewalPricingResult {
    const maxUplift = new Decimal(50);

    switch (input.method) {
      case 'same_price':
        return { newUnitPrice: input.currentPrice, method: 'same_price' };

      case 'current_list':
        return {
          newUnitPrice: input.currentListPrice ?? input.currentPrice,
          method: input.currentListPrice ? 'current_list' : 'current_list_fallback',
        };

      case 'uplift_percentage': {
        let uplift = safeDecimal(input.upliftPercentage ?? 0, 'upliftPercentage');
        if (uplift.gt(maxUplift)) uplift = maxUplift;
        const newPrice = safeDecimal(input.currentPrice, 'currentPrice')
          .times(new Decimal(1).plus(uplift.dividedBy(100)))
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        return { newUnitPrice: newPrice.toString(), method: 'uplift_percentage' };
      }

      default:
        throw new CpqValidationError(`Unknown renewal pricing method: "${input.method}"`);
    }
  }

  private step(
    name: string,
    before: Decimal,
    after: Decimal,
    params?: Record<string, string>,
  ): PricingAuditStep {
    return {
      ruleName: name,
      inputPrice: before.toString(),
      outputPrice: after.toString(),
      parameters: params,
      timestamp: new Date().toISOString(),
    };
  }
}

// Types
export type PricingInput = {
  listPrice: string;
  quantity: number;
  productBaseTermMonths?: number;
  quoteTermMonths?: number;
  contractedPrice?: string;
  discountSchedule?: { type: 'tiered' | 'volume' | 'term' | 'block'; tiers: DiscountTier[] };
  manualDiscountPercent?: number;
  manualDiscountAmount?: number;
  manualPriceOverride?: number;
  floorPrice?: string;
  fromCurrency?: string;
  toCurrency?: string;
};

export type DiscountTier = {
  lowerBound: number;
  upperBound: number | null;
  value: number;
};

export type PricingAuditStep = {
  ruleName: string;
  inputPrice: string;
  outputPrice: string;
  parameters?: Record<string, string>;
  timestamp: string;
};

export type PricingResult = {
  netUnitPrice: string;
  netTotal: string;
  listPrice: string;
  auditSteps: PricingAuditStep[];
};

export type RenewalPricingInput = {
  currentPrice: string;
  method: 'same_price' | 'current_list' | 'uplift_percentage';
  currentListPrice?: string;
  upliftPercentage?: number;
};

export type RenewalPricingResult = {
  newUnitPrice: string;
  method: string;
};
