import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';

import { safeDecimal, safeDate, CpqValidationError } from 'src/modules/cpq/utils/cpq-validation.utils';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

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
  // Currently a stub — needs workspace datasource (TASK-087).
  async createFromQuote(quoteId: string): Promise<string> {
    if (!quoteId || typeof quoteId !== 'string') {
      throw new CpqValidationError('quoteId is required');
    }
    this.logger.log(`Creating contract from quote ${quoteId}`);

    // TODO: Wire to Twenty's workspace data source
    // 1. Verify quote status = 'accepted'
    // 2. In a transaction:
    //    a. Create contract record
    //    b. For each line item → create contract subscription
    //    c. Create initial amendment record
    //    d. Create invoice with line items
    //    e. Update quote status → 'contracted'
    // 3. Return contract ID

    return 'new-contract-id';
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

  private daysBetween(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }
}
