import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Contract number generator. Produces sequential numbers like CON-0001, CON-0002.
 * In production this would use a database sequence; for now uses a simple counter.
 */
export function generateContractNumber(sequence: number): string {
  return `CON-${String(sequence).padStart(4, '0')}`;
}

/**
 * Quote number generator.
 */
export function generateQuoteNumber(sequence: number, year?: number): string {
  const yr = year ?? new Date().getFullYear();
  return `Q-${yr}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Invoice number generator.
 */
export function generateInvoiceNumber(sequence: number, year?: number): string {
  const yr = year ?? new Date().getFullYear();
  return `INV-${yr}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Valid contract status transitions.
 */
const CONTRACT_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['amended', 'pending_renewal', 'expired', 'cancelled'],
  amended: ['active'],
  pending_renewal: ['renewed', 'expired', 'cancelled'],
};

export function isValidContractTransition(from: string, to: string): boolean {
  return CONTRACT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidContractTransitions(current: string): string[] {
  return CONTRACT_TRANSITIONS[current] ?? [];
}

/**
 * Valid subscription status transitions.
 */
const SUBSCRIPTION_TRANSITIONS: Record<string, string[]> = {
  pending: ['active'],
  active: ['pending_amendment', 'pending_cancellation', 'suspended', 'expired'],
  suspended: ['active'],
  pending_amendment: ['active'],
  pending_cancellation: ['cancelled'],
};

export function isValidSubscriptionTransition(from: string, to: string): boolean {
  return SUBSCRIPTION_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Compute days between two dates.
 */
export function daysBetween(start: Date, end: Date): number {
  const msPerDay = 86400000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Proration calculation using actual contract days (not hardcoded 365).
 */
export function calculateProratedValue(
  annualValue: Decimal,
  contractStartDate: Date,
  contractEndDate: Date,
  effectiveDate: Date
): Decimal {
  const totalDays = daysBetween(contractStartDate, contractEndDate);
  if (totalDays <= 0) return new Decimal(0);

  const remainingDays = Math.max(0, daysBetween(effectiveDate, contractEndDate));
  return annualValue
    .times(remainingDays)
    .dividedBy(totalDays)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Calculate the delta when a subscription is modified.
 */
export function calculateAmendmentDelta(
  oldUnitPrice: Decimal,
  oldQuantity: Decimal,
  newUnitPrice: Decimal,
  newQuantity: Decimal,
  contractStartDate: Date,
  contractEndDate: Date,
  effectiveDate: Date
): Decimal {
  if (effectiveDate < contractStartDate || effectiveDate > contractEndDate) {
    throw new Error('Effective date must be between contract start and end dates');
  }

  const oldAnnual = oldUnitPrice.times(oldQuantity);
  const newAnnual = newUnitPrice.times(newQuantity);
  const delta = newAnnual.minus(oldAnnual);
  return calculateProratedValue(delta, contractStartDate, contractEndDate, effectiveDate);
}

/**
 * Renewal pricing engine — three methods.
 */

export interface RenewalPricingInput {
  currentUnitPrice: Decimal;
  pricingMethod: 'same_price' | 'current_list' | 'uplift_percentage';
  upliftPercentage?: Decimal;
  currentListPrice?: Decimal;
}

export interface RenewalPricingOutput {
  newUnitPrice: Decimal;
  method: string;
  audit: {
    inputPrice: string;
    method: string;
    formula: string;
    outputPrice: string;
  };
}

export function calculateRenewalPrice(input: RenewalPricingInput): RenewalPricingOutput {
  const maxUplift = new Decimal(50); // 50% cap

  switch (input.pricingMethod) {
    case 'same_price':
      return {
        newUnitPrice: input.currentUnitPrice,
        method: 'same_price',
        audit: {
          inputPrice: input.currentUnitPrice.toString(),
          method: 'same_price',
          formula: 'new_price = current_price',
          outputPrice: input.currentUnitPrice.toString(),
        },
      };

    case 'current_list': {
      const listPrice = input.currentListPrice || input.currentUnitPrice;
      return {
        newUnitPrice: listPrice,
        method: 'current_list',
        audit: {
          inputPrice: input.currentUnitPrice.toString(),
          method: input.currentListPrice ? 'current_list' : 'current_list (fallback to same_price)',
          formula: input.currentListPrice
            ? 'new_price = current_list_price'
            : 'new_price = current_price (list price not found)',
          outputPrice: listPrice.toString(),
        },
      };
    }

    case 'uplift_percentage': {
      let uplift = input.upliftPercentage || new Decimal(0);
      // Cap at maxUplift
      if (uplift.gt(maxUplift)) uplift = maxUplift;

      const multiplier = new Decimal(1).plus(uplift.dividedBy(100));
      let uplifted = input.currentUnitPrice
        .times(multiplier)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      // Floor at zero
      if (uplifted.lt(0)) uplifted = new Decimal(0);

      return {
        newUnitPrice: uplifted,
        method: 'uplift_percentage',
        audit: {
          inputPrice: input.currentUnitPrice.toString(),
          method: 'uplift_percentage',
          formula: `new_price = current_price × (1 + ${uplift}%)`,
          outputPrice: uplifted.toString(),
        },
      };
    }
  }
}

/**
 * Resolve pricing method from the hierarchy: subscription > contract > org config.
 */
export function resolvePricingMethod(
  subscriptionMethod: string | null | undefined,
  contractMethod: string | null | undefined,
  orgDefault: string
): string {
  return subscriptionMethod || contractMethod || orgDefault;
}

export function resolveUpliftPercentage(
  subscriptionUplift: string | number | null | undefined,
  contractUplift: string | number | null | undefined,
  orgUplift: string | number | null | undefined
): Decimal {
  const value = subscriptionUplift ?? contractUplift ?? orgUplift ?? 0;
  return new Decimal(value);
}
