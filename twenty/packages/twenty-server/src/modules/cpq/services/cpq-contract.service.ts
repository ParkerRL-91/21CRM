import { Injectable, Logger } from '@nestjs/common';

import { Decimal } from 'src/modules/cpq/utils/cpq-decimal.utils';
import { safeDecimal, safeDate, CpqValidationError } from 'src/modules/cpq/utils/cpq-validation.utils';

// Contract service — lifecycle operations with input validation.
// All date and Decimal inputs are validated before use.
@Injectable()
export class CpqContractService {
  private readonly logger = new Logger(CpqContractService.name);

  // Valid contract status transitions
  private readonly TRANSITIONS: Record<string, string[]> = {
    draft: ['active'],
    active: ['amended', 'pending_renewal', 'expired', 'cancelled'],
    amended: ['active'],
    pending_renewal: ['renewed', 'expired', 'cancelled'],
  };

  // Valid subscription status transitions
  private readonly SUB_TRANSITIONS: Record<string, string[]> = {
    pending: ['active'],
    active: ['pending_amendment', 'pending_cancellation', 'suspended', 'expired'],
    suspended: ['active'],
    pending_amendment: ['active'],
    pending_cancellation: ['cancelled'],
  };

  isValidTransition(from: string, to: string): boolean {
    return this.TRANSITIONS[from]?.includes(to) ?? false;
  }

  isValidSubscriptionTransition(from: string, to: string): boolean {
    return this.SUB_TRANSITIONS[from]?.includes(to) ?? false;
  }

  // Create a contract from an accepted quote.
  // Accepts resolved quote data (caller fetches from workspace datasource).
  // Returns structured contract data for the caller to persist via GraphQL.
  createFromQuote(input: CreateContractInput): CreateContractResult {
    if (!input.quoteId || typeof input.quoteId !== 'string') {
      throw new CpqValidationError('quoteId is required');
    }
    if (input.quoteStatus !== 'accepted') {
      throw new CpqValidationError(
        `Quote must be in "accepted" status to create contract, got "${input.quoteStatus}"`,
      );
    }
    if (!input.lineItems || input.lineItems.length === 0) {
      throw new CpqValidationError('Quote must have at least one line item');
    }

    this.logger.log(`Creating contract from quote ${input.quoteId}`);

    const startDate = safeDate(input.startDate, 'startDate');
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (input.subscriptionTermMonths || 12));

    let totalValue = new Decimal(0);
    const subscriptions: ContractSubscriptionData[] = [];
    const invoiceLineItems: InvoiceLineItemData[] = [];

    for (const lineItem of input.lineItems) {
      const amount = safeDecimal(lineItem.netTotal, 'lineItem.netTotal');
      totalValue = totalValue.plus(amount);

      if (lineItem.billingType === 'recurring') {
        const unitPrice = safeDecimal(lineItem.netUnitPrice, 'lineItem.netUnitPrice');
        const annualValue = unitPrice.times(lineItem.quantity);
        subscriptions.push({
          productName: lineItem.productName,
          quantity: lineItem.quantity,
          unitPrice: unitPrice.toString(),
          annualValue: annualValue.toDecimalPlaces(2).toString(),
          billingFrequency: lineItem.billingFrequency || 'annual',
          chargeType: 'recurring',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'active',
        });
      }

      invoiceLineItems.push({
        productName: lineItem.productName,
        quantity: lineItem.quantity,
        unitPrice: lineItem.netUnitPrice,
        total: lineItem.netTotal,
        billingType: lineItem.billingType || 'one_time',
        billingPeriodStart: startDate.toISOString(),
        billingPeriodEnd: lineItem.billingType === 'recurring'
          ? endDate.toISOString()
          : startDate.toISOString(),
        sortOrder: lineItem.sortOrder || 0,
      });
    }

    const contractNumber = `CTR-${Date.now().toString(36).toUpperCase()}`;
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    return {
      contract: {
        contractNumber,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalValue: totalValue.toDecimalPlaces(2).toString(),
        renewalStatus: 'not_due',
        renewalPricingMethod: 'same_price',
        renewalUpliftPercentage: 0,
        notes: `Created from quote ${input.quoteId}`,
        // Relations to set via GraphQL: company, opportunity, originQuote
        sourceQuoteId: input.quoteId,
        companyId: input.companyId,
        opportunityId: input.opportunityId,
      },
      subscriptions,
      amendment: {
        amendmentNumber: `${contractNumber}-001`,
        amendmentType: 'initial',
        description: 'Initial contract creation',
        deltaValue: totalValue.toDecimalPlaces(2).toString(),
        effectiveDate: startDate.toISOString(),
        changes: {
          type: 'initial',
          lineItemCount: input.lineItems.length,
          subscriptionCount: subscriptions.length,
        },
      },
      invoice: {
        invoiceNumber,
        status: 'draft',
        issueDate: new Date().toISOString(),
        dueDate: this.addDays(new Date(), 30).toISOString(),
        subtotal: totalValue.toDecimalPlaces(2).toString(),
        total: totalValue.toDecimalPlaces(2).toString(),
        paymentTerms: input.paymentTerms || 'Net 30',
        notes: `Invoice for contract ${contractNumber}`,
        lineItems: invoiceLineItems,
      },
      quoteStatusUpdate: 'contracted',
      // Caller must:
      // 1. Create contract via GraphQL mutation
      // 2. Create subscriptions linked to contract
      // 3. Create amendment linked to contract
      // 4. Create invoice + line items linked to contract
      // 5. Update quote status to 'contracted'
      instruction: 'Persist all records via GraphQL mutations in a single transaction',
    };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Prorate a value using actual contract days (not hardcoded 365).
  // Validates all inputs before calculation.
  calculateProratedValue(
    annualValue: string,
    contractStartDate: Date | string,
    contractEndDate: Date | string,
    effectiveDate: Date | string,
  ): string {
    const value = safeDecimal(annualValue, 'annualValue');
    const startDate = safeDate(contractStartDate, 'contractStartDate');
    const endDate = safeDate(contractEndDate, 'contractEndDate');
    const effective = safeDate(effectiveDate, 'effectiveDate');

    const totalDays = this.daysBetween(startDate, endDate);
    if (totalDays <= 0) return '0';

    // Warn-worthy: effective date is at or past contract end
    const remainingDays = Math.max(0, this.daysBetween(effective, endDate));

    return value
      .times(remainingDays)
      .dividedBy(totalDays)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toString();
  }

  // Calculate amendment delta with proration.
  // Validates effective date is within contract range.
  calculateAmendmentDelta(
    oldPrice: string,
    oldQuantity: number,
    newPrice: string,
    newQuantity: number,
    contractStart: Date | string,
    contractEnd: Date | string,
    effectiveDate: Date | string,
  ): string {
    const oldP = safeDecimal(oldPrice, 'oldPrice');
    const newP = safeDecimal(newPrice, 'newPrice');
    const startDate = safeDate(contractStart, 'contractStart');
    const endDate = safeDate(contractEnd, 'contractEnd');
    const effective = safeDate(effectiveDate, 'effectiveDate');

    if (effective < startDate || effective > endDate) {
      throw new CpqValidationError(
        `effectiveDate (${effective.toISOString()}) must be between ` +
        `contract start (${startDate.toISOString()}) and end (${endDate.toISOString()})`,
      );
    }

    const oldAnnual = oldP.times(oldQuantity);
    const newAnnual = newP.times(newQuantity);
    const delta = newAnnual.minus(oldAnnual);

    return this.calculateProratedValue(delta.toString(), startDate, endDate, effective);
  }

  // Co-terminate a new subscription to an existing contract's end date.
  // Returns the prorated amount for the partial period.
  coTerminate(
    annualValue: string,
    contractEndDate: Date | string,
    effectiveDate: Date | string,
  ): CoTerminationResult {
    const value = safeDecimal(annualValue, 'annualValue');
    const endDate = safeDate(contractEndDate, 'contractEndDate');
    const effective = safeDate(effectiveDate, 'effectiveDate');

    if (effective >= endDate) {
      return {
        proratedValue: '0',
        daysRemaining: 0,
        totalDaysInYear: 365,
        coTerminatedEndDate: endDate.toISOString(),
      };
    }

    const daysRemaining = this.daysBetween(effective, endDate);
    const proratedValue = value
      .times(daysRemaining)
      .dividedBy(365)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      proratedValue: proratedValue.toString(),
      daysRemaining,
      totalDaysInYear: 365,
      coTerminatedEndDate: endDate.toISOString(),
    };
  }

  // Calculate amendment delta for multiple subscriptions with co-termination.
  // Each subscription may have a different effective date.
  calculateMultiSubscriptionAmendment(
    changes: SubscriptionChange[],
    contractStart: Date | string,
    contractEnd: Date | string,
  ): MultiAmendmentResult {
    const startDate = safeDate(contractStart, 'contractStart');
    const endDate = safeDate(contractEnd, 'contractEnd');
    let totalDelta = new Decimal(0);
    const lineResults: AmendmentLineResult[] = [];

    for (const change of changes) {
      const effective = safeDate(change.effectiveDate, 'effectiveDate');
      if (effective < startDate || effective > endDate) {
        throw new CpqValidationError(
          `effectiveDate for ${change.productName} is outside contract range`,
        );
      }

      const delta = this.calculateAmendmentDelta(
        change.oldPrice, change.oldQuantity,
        change.newPrice, change.newQuantity,
        startDate, endDate, effective,
      );

      totalDelta = totalDelta.plus(safeDecimal(delta, 'delta'));
      lineResults.push({
        productName: change.productName,
        proratedDelta: delta,
        effectiveDate: effective.toISOString(),
      });
    }

    return {
      totalDelta: totalDelta.toDecimalPlaces(2).toString(),
      lines: lineResults,
    };
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }
}

// Types for createFromQuote
export type CreateContractInput = {
  quoteId: string;
  quoteStatus: string;
  lineItems: ContractLineItemInput[];
  startDate: string;
  subscriptionTermMonths?: number;
  paymentTerms?: string;
  companyId?: string;
  opportunityId?: string;
};

export type ContractLineItemInput = {
  productName: string;
  quantity: number;
  netUnitPrice: string;
  netTotal: string;
  billingType?: string;
  billingFrequency?: string;
  sortOrder?: number;
};

export type ContractSubscriptionData = {
  productName: string;
  quantity: number;
  unitPrice: string;
  annualValue: string;
  billingFrequency: string;
  chargeType: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type InvoiceLineItemData = {
  productName: string;
  quantity: number;
  unitPrice: string;
  total: string;
  billingType: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  sortOrder: number;
};

export type CreateContractResult = {
  contract: Record<string, unknown>;
  subscriptions: ContractSubscriptionData[];
  amendment: Record<string, unknown>;
  invoice: {
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate: string;
    subtotal: string;
    total: string;
    paymentTerms: string;
    notes: string;
    lineItems: InvoiceLineItemData[];
  };
  quoteStatusUpdate: string;
  instruction: string;
};

export type CoTerminationResult = {
  proratedValue: string;
  daysRemaining: number;
  totalDaysInYear: number;
  coTerminatedEndDate: string;
};

export type SubscriptionChange = {
  productName: string;
  oldPrice: string;
  oldQuantity: number;
  newPrice: string;
  newQuantity: number;
  effectiveDate: string;
};

export type AmendmentLineResult = {
  productName: string;
  proratedDelta: string;
  effectiveDate: string;
};

export type MultiAmendmentResult = {
  totalDelta: string;
  lines: AmendmentLineResult[];
};
