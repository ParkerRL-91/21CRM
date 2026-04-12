import Decimal from 'decimal.js';
import { addMonths } from 'date-fns';

/**
 * Maps an accepted quote with its line items into a contract creation payload.
 * This is the bridge between Epic 2 (Quotes) and Epic 8 (Contracts).
 *
 * Flow: Accepted Quote → Contract + Contract Subscriptions + Amendment #1 (initial)
 */

export interface QuoteForConversion {
  id: string;
  orgId: string;
  quoteNumber: string;
  accountHubspotId?: string;
  accountName?: string;
  opportunityHubspotId?: string;
  startDate: string; // ISO date
  subscriptionTermMonths: number;
  currencyCode: string;
  grandTotal: string; // Decimal string
  createdBy?: string;
  lineItems: QuoteLineItemForConversion[];
}

export interface QuoteLineItemForConversion {
  id: string;
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: string; // Decimal string
  netUnitPrice: string;
  netTotal: string;
  billingType: string; // recurring, one_time
  billingFrequency?: string;
  subscriptionTermMonths?: number;
}

export interface ContractCreationPayload {
  orgId: string;
  contractName: string;
  accountHubspotId?: string;
  accountName?: string;
  dealHubspotId?: string;
  quoteId: string;
  status: 'active';
  startDate: string;
  endDate: string;
  totalValue: string;
  currencyCode: string;
  createdBy?: string;
  subscriptions: SubscriptionCreationPayload[];
  initialAmendment: {
    amendmentNumber: 1;
    amendmentType: 'add_subscription';
    description: string;
    deltaValue: string;
    effectiveDate: string;
  };
}

export interface SubscriptionCreationPayload {
  productHubspotId?: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  annualValue: string;
  billingFrequency: string;
  startDate: string;
  endDate: string;
  chargeType: string;
  subscriptionType: string;
  status: 'active';
}

/**
 * Convert an accepted quote into a contract creation payload.
 * Prices are already finalized on the quote — no re-calculation.
 */
export function quoteToContractPayload(
  quote: QuoteForConversion
): ContractCreationPayload {
  const startDate = new Date(quote.startDate);
  const endDate = addMonths(startDate, quote.subscriptionTermMonths);
  const endDateStr = endDate.toISOString().split('T')[0];

  const subscriptions = quote.lineItems.map((li) =>
    lineItemToSubscription(li, quote.startDate, endDateStr)
  );

  const contractName = `${quote.accountName || 'Contract'} - ${quote.quoteNumber}`;

  return {
    orgId: quote.orgId,
    contractName,
    accountHubspotId: quote.accountHubspotId,
    accountName: quote.accountName,
    dealHubspotId: quote.opportunityHubspotId,
    quoteId: quote.id,
    status: 'active',
    startDate: quote.startDate,
    endDate: endDateStr,
    totalValue: quote.grandTotal,
    currencyCode: quote.currencyCode,
    createdBy: quote.createdBy,
    subscriptions,
    initialAmendment: {
      amendmentNumber: 1,
      amendmentType: 'add_subscription',
      description: `Initial contract created from quote ${quote.quoteNumber}`,
      deltaValue: quote.grandTotal,
      effectiveDate: quote.startDate,
    },
  };
}

function lineItemToSubscription(
  li: QuoteLineItemForConversion,
  startDate: string,
  endDate: string
): SubscriptionCreationPayload {
  const isRecurring = li.billingType === 'recurring';

  // Annualize the value
  const netTotal = new Decimal(li.netTotal);
  const termMonths = li.subscriptionTermMonths || 12;
  const annualValue = isRecurring
    ? netTotal.times(12).dividedBy(termMonths).toDecimalPlaces(2)
    : netTotal;

  return {
    productHubspotId: li.productId,
    productName: li.productName,
    quantity: li.quantity,
    unitPrice: li.netUnitPrice,
    annualValue: annualValue.toString(),
    billingFrequency: li.billingFrequency || 'annual',
    startDate,
    endDate,
    chargeType: li.billingType,
    subscriptionType: isRecurring ? 'renewable' : 'one_time',
    status: 'active',
  };
}

/**
 * Calculate ARR waterfall components for a given period.
 * Used by TASK-084 (ARR waterfall report).
 */
export interface ARRWaterfallInput {
  beginningARR: Decimal;
  newARR: Decimal;         // from new contracts in period
  expansionARR: Decimal;   // from amendments with positive delta
  contractionARR: Decimal; // from amendments with negative delta
  churnARR: Decimal;       // from expired/cancelled contracts without renewal
}

export interface ARRWaterfallOutput {
  beginningARR: string;
  newARR: string;
  expansionARR: string;
  contractionARR: string;
  churnARR: string;
  endingARR: string;
  netChange: string;
  netRetentionRate: string; // percentage
}

export function calculateARRWaterfall(
  input: ARRWaterfallInput
): ARRWaterfallOutput {
  const ending = input.beginningARR
    .plus(input.newARR)
    .plus(input.expansionARR)
    .minus(input.contractionARR)
    .minus(input.churnARR);

  const netChange = ending.minus(input.beginningARR);

  const netRetention = input.beginningARR.gt(0)
    ? input.beginningARR
        .plus(input.expansionARR)
        .minus(input.contractionARR)
        .minus(input.churnARR)
        .dividedBy(input.beginningARR)
        .times(100)
        .toDecimalPlaces(1)
    : new Decimal(0);

  return {
    beginningARR: input.beginningARR.toDecimalPlaces(2).toString(),
    newARR: input.newARR.toDecimalPlaces(2).toString(),
    expansionARR: input.expansionARR.toDecimalPlaces(2).toString(),
    contractionARR: input.contractionARR.toDecimalPlaces(2).toString(),
    churnARR: input.churnARR.toDecimalPlaces(2).toString(),
    endingARR: ending.toDecimalPlaces(2).toString(),
    netChange: netChange.toDecimalPlaces(2).toString(),
    netRetentionRate: netRetention.toString(),
  };
}
