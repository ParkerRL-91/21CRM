import Decimal from 'decimal.js';
import { calculateProratedValue, daysBetween } from '../contracts/service';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Amendment flow: creates an amendment quote for mid-term contract changes.
 * Handles co-termination (new subscriptions aligned to contract end date)
 * and delta pricing (only changes are priced, not the full contract).
 */

export interface ActiveSubscription {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: string; // Decimal string
  annualValue: string;
  billingFrequency: string;
  startDate: string;
  endDate: string;
}

export interface AmendmentLineItem {
  type: 'existing' | 'new' | 'modified' | 'removed';
  subscriptionId?: string;
  productName: string;
  oldQuantity?: number;
  newQuantity: number;
  oldUnitPrice?: string;
  newUnitPrice: string;
  proratedDelta: string; // prorated financial impact
  annualDelta: string; // annualized financial impact
  coTermEndDate: string; // aligned to contract end
}

export interface AmendmentQuoteResult {
  lineItems: AmendmentLineItem[];
  totalProratedDelta: string;
  totalAnnualDelta: string;
  effectiveDate: string;
  contractEndDate: string;
  daysRemaining: number;
}

/**
 * Build an amendment quote from a set of changes to existing subscriptions.
 */
export function buildAmendmentQuote(params: {
  existingSubscriptions: ActiveSubscription[];
  changes: AmendmentChange[];
  contractStartDate: string;
  contractEndDate: string;
  effectiveDate: string;
}): AmendmentQuoteResult {
  const contractStart = new Date(params.contractStartDate);
  const contractEnd = new Date(params.contractEndDate);
  const effective = new Date(params.effectiveDate);
  const daysRemaining = Math.max(0, daysBetween(effective, contractEnd));

  const lineItems: AmendmentLineItem[] = [];
  let totalProratedDelta = new Decimal(0);
  let totalAnnualDelta = new Decimal(0);

  for (const change of params.changes) {
    const result = processChange(
      change,
      params.existingSubscriptions,
      contractStart,
      contractEnd,
      effective
    );
    lineItems.push(result);
    totalProratedDelta = totalProratedDelta.plus(new Decimal(result.proratedDelta));
    totalAnnualDelta = totalAnnualDelta.plus(new Decimal(result.annualDelta));
  }

  return {
    lineItems,
    totalProratedDelta: totalProratedDelta.toDecimalPlaces(2).toString(),
    totalAnnualDelta: totalAnnualDelta.toDecimalPlaces(2).toString(),
    effectiveDate: params.effectiveDate,
    contractEndDate: params.contractEndDate,
    daysRemaining,
  };
}

export interface AmendmentChange {
  type: 'add' | 'modify_quantity' | 'modify_price' | 'remove';
  subscriptionId?: string; // required for modify/remove
  productName?: string; // required for add
  newQuantity?: number;
  newUnitPrice?: string;
}

function processChange(
  change: AmendmentChange,
  subscriptions: ActiveSubscription[],
  contractStart: Date,
  contractEnd: Date,
  effectiveDate: Date
): AmendmentLineItem {
  const coTermEndDate = contractEnd.toISOString().split('T')[0];

  switch (change.type) {
    case 'add': {
      const qty = change.newQuantity ?? 1;
      const price = new Decimal(change.newUnitPrice ?? '0');
      const annualValue = price.times(qty);
      const prorated = calculateProratedValue(
        annualValue,
        contractStart,
        contractEnd,
        effectiveDate
      );
      return {
        type: 'new',
        productName: change.productName ?? 'New Product',
        newQuantity: qty,
        newUnitPrice: price.toString(),
        proratedDelta: prorated.toString(),
        annualDelta: annualValue.toString(),
        coTermEndDate,
      };
    }

    case 'modify_quantity':
    case 'modify_price': {
      const sub = subscriptions.find((s) => s.id === change.subscriptionId);
      if (!sub) throw new Error(`Subscription ${change.subscriptionId} not found`);

      const oldQty = sub.quantity;
      const oldPrice = new Decimal(sub.unitPrice);
      const newQty = change.newQuantity ?? oldQty;
      const newPrice = change.newUnitPrice
        ? new Decimal(change.newUnitPrice)
        : oldPrice;

      const oldAnnual = oldPrice.times(oldQty);
      const newAnnual = newPrice.times(newQty);
      const annualDelta = newAnnual.minus(oldAnnual);
      const proratedDelta = calculateProratedValue(
        annualDelta,
        contractStart,
        contractEnd,
        effectiveDate
      );

      return {
        type: 'modified',
        subscriptionId: sub.id,
        productName: sub.productName,
        oldQuantity: oldQty,
        newQuantity: newQty,
        oldUnitPrice: sub.unitPrice,
        newUnitPrice: newPrice.toString(),
        proratedDelta: proratedDelta.toString(),
        annualDelta: annualDelta.toString(),
        coTermEndDate,
      };
    }

    case 'remove': {
      const sub = subscriptions.find((s) => s.id === change.subscriptionId);
      if (!sub) throw new Error(`Subscription ${change.subscriptionId} not found`);

      const annualValue = new Decimal(sub.unitPrice).times(sub.quantity);
      const prorated = calculateProratedValue(
        annualValue,
        contractStart,
        contractEnd,
        effectiveDate
      );

      return {
        type: 'removed',
        subscriptionId: sub.id,
        productName: sub.productName,
        oldQuantity: sub.quantity,
        newQuantity: 0,
        oldUnitPrice: sub.unitPrice,
        newUnitPrice: '0',
        proratedDelta: prorated.negated().toString(),
        annualDelta: annualValue.negated().toString(),
        coTermEndDate,
      };
    }
  }
}

/**
 * Generate an invoice from a contract's subscriptions.
 */
export interface InvoiceGenerationResult {
  lineItems: Array<{
    productName: string;
    quantity: string;
    unitPrice: string;
    total: string;
    billingType: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
  }>;
  subtotal: string;
  total: string;
}

export function generateInvoiceFromContract(params: {
  subscriptions: ActiveSubscription[];
  billingPeriodStart: string;
  billingPeriodEnd: string;
}): InvoiceGenerationResult {
  let subtotal = new Decimal(0);

  const lineItems = params.subscriptions.map((sub) => {
    const total = new Decimal(sub.unitPrice).times(sub.quantity);
    subtotal = subtotal.plus(total);

    return {
      productName: sub.productName,
      quantity: String(sub.quantity),
      unitPrice: sub.unitPrice,
      total: total.toDecimalPlaces(2).toString(),
      billingType: sub.billingFrequency === 'annual' ? 'recurring' : 'recurring',
      billingPeriodStart: params.billingPeriodStart,
      billingPeriodEnd: params.billingPeriodEnd,
    };
  });

  return {
    lineItems,
    subtotal: subtotal.toDecimalPlaces(2).toString(),
    total: subtotal.toDecimalPlaces(2).toString(), // tax calculated separately
  };
}
