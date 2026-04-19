import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
// CPQ Pricing Service — 10-step price waterfall engine.
// Steps:
// 1. Base Price (from price book entry)
// 2. Contracted Price (account-specific override)
// 3. Proration (subscription term ratio)
// 4. Tiered/Volume Discount (from discount schedule)
// 5. Term Discount (multi-year commitment)
// 6. Manual Discount (rep-entered %, amount, or override)
// 7. Floor Price Enforcement
// 8. Currency Conversion (placeholder)
// 9. Rounding (2 decimal places)
// 10. Total Calculation (net unit × quantity)
// All arithmetic uses Decimal.js. No floating-point.
//
@Injectable()
export class CpqPricingService {
  calculatePriceWaterfall(input: PricingInput): PricingResult {
    let price = new Decimal(input.listPrice);
    const audit: PricingAuditStep[] = [];
    // Step 1: Base price
    audit.push(this.step('base_price', price, price));
    // Step 2: Contracted price
    if (input.contractedPrice) {
      const before = price;
      price = new Decimal(input.contractedPrice);
      audit.push(this.step('contracted_price', before, price));
    }
    // Step 3: Proration
    if (input.quoteTermMonths && input.productBaseTermMonths &&
        input.quoteTermMonths !== input.productBaseTermMonths) {
      const before = price;
      const multiplier = new Decimal(input.quoteTermMonths).dividedBy(input.productBaseTermMonths);
      price = price.times(multiplier);
      audit.push(this.step('proration', before, price, {
        quoteTermMonths: String(input.quoteTermMonths),
        productBaseTermMonths: String(input.productBaseTermMonths),
      }));
    }
    // Step 4: Tiered/Volume discount
    if (input.discountSchedule) {
      const before = price;
      if (input.discountSchedule.type === 'tiered') {
        price = this.calculateTieredEffectivePrice(input.quantity, input.discountSchedule.tiers);
      } else if (input.discountSchedule.type === 'volume') {
        price = this.calculateVolumePrice(input.quantity, input.discountSchedule.tiers, price);
      }
      audit.push(this.step('discount_schedule', before, price, {
        scheduleType: input.discountSchedule.type,
      }));
    }
    // Step 5: Term discount
    if (input.discountSchedule?.type === 'term' && input.quoteTermMonths) {
      const before = price;
      const discountPercent = this.getTermDiscount(input.quoteTermMonths, input.discountSchedule.tiers);
      if (discountPercent.gt(0)) {
        price = price.times(new Decimal(1).minus(discountPercent.dividedBy(100)));
      }
      audit.push(this.step('term_discount', before, price, {
        discountPercent: discountPercent.toString(),
      }));
    }
    // Step 6: Manual discount
    if (input.manualPriceOverride !== undefined) {
      const before = price;
      price = new Decimal(input.manualPriceOverride);
      audit.push(this.step('manual_discount', before, price, { type: 'override' }));
    } else if (input.manualDiscountPercent) {
      const before = price;
      price = price.times(new Decimal(1).minus(new Decimal(input.manualDiscountPercent).dividedBy(100)));
      audit.push(this.step('manual_discount', before, price, {
        type: 'percent',
        value: String(input.manualDiscountPercent),
      }));
    } else if (input.manualDiscountAmount) {
      const before = price;
      price = price.minus(new Decimal(input.manualDiscountAmount));
      audit.push(this.step('manual_discount', before, price, {
        type: 'amount',
        value: String(input.manualDiscountAmount),
      }));
    }
    // Step 7: Floor price
    if (input.floorPrice && price.lt(new Decimal(input.floorPrice))) {
      const before = price;
      price = new Decimal(input.floorPrice);
      audit.push(this.step('floor_price', before, price));
    }
    // Step 8: Currency (placeholder)
    // Step 9: Rounding
    price = price.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    // Step 10: Ensure non-negative
    if (price.lt(0)) price = new Decimal(0);
    const netTotal = price.times(input.quantity).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    return {
      netUnitPrice: price.toString(),
      netTotal: netTotal.toString(),
      listPrice: input.listPrice,
      auditSteps: audit,
    };
  }
  calculateTieredEffectivePrice(quantity: number, tiers: DiscountTier[]): Decimal {
    if (quantity <= 0) return new Decimal(0);
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
    return total.dividedBy(quantity); // effective unit price
  }
  calculateVolumePrice(quantity: number, tiers: DiscountTier[], basePrice: Decimal): Decimal {
    if (quantity <= 0) return new Decimal(0);
    const sorted = [...tiers].sort((a, b) => b.lowerBound - a.lowerBound);
    const applicable = sorted.find((t) => quantity >= t.lowerBound);
    return applicable ? new Decimal(applicable.value) : basePrice;
  }
  getTermDiscount(termMonths: number, tiers: DiscountTier[]): Decimal {
    const sorted = [...tiers].sort((a, b) => b.lowerBound - a.lowerBound);
    const applicable = sorted.find((t) => termMonths >= t.lowerBound);
    return applicable ? new Decimal(applicable.value) : new Decimal(0);
  }
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
        let uplift = new Decimal(input.upliftPercentage ?? 0);
        if (uplift.gt(maxUplift)) uplift = maxUplift;
        const newPrice = new Decimal(input.currentPrice)
          .times(new Decimal(1).plus(uplift.dividedBy(100)))
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        return { newUnitPrice: newPrice.toString(), method: 'uplift_percentage' };
      }
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
  discountSchedule?: { type: 'tiered' | 'volume' | 'term'; tiers: DiscountTier[] };
  manualDiscountPercent?: number;
  manualDiscountAmount?: number;
  manualPriceOverride?: number;
  floorPrice?: string;
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
