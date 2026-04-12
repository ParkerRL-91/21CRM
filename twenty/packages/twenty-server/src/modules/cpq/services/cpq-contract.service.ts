import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

//
// CPQ Contract Service — handles contract lifecycle operations.
//
// - Create contract from accepted quote
// - Amendment flow (co-termination, delta pricing)
// - Invoice generation
// - Status transitions with validation
///
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

  //
  // Create a contract from an accepted quote.
  // Maps quote line items to contract subscriptions.

  async createFromQuote(quoteId: string): Promise<string> {
    this.logger.log(`Creating contract from quote ${quoteId}`);

    // TODO: Wire to Twenty's workspace data source
    // 1. Verify quote status = 'accepted'
    // 2. In a transaction:
    //    a. Create contract record (name, account, dates, total value)
    //    b. For each quote line item → create contract subscription
    //    c. Create initial amendment record (amendment_number=1)
    //    d. Update quote status → 'contracted'
    //    e. Link contract to opportunity
    // 3. Return contract ID

    return 'new-contract-id';
  }

  //
  // Prorate a value based on actual contract days.

  calculateProratedValue(
    annualValue: string,
    contractStartDate: Date,
    contractEndDate: Date,
    effectiveDate: Date,
  ): string {
    const totalDays = this.daysBetween(contractStartDate, contractEndDate);
    if (totalDays <= 0) return '0';

    const remainingDays = Math.max(0, this.daysBetween(effectiveDate, contractEndDate));
    return new Decimal(annualValue)
      .times(remainingDays)
      .dividedBy(totalDays)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toString();
  }

  //
  // Calculate amendment delta with proration.

  calculateAmendmentDelta(
    oldPrice: string,
    oldQty: number,
    newPrice: string,
    newQty: number,
    contractStart: Date,
    contractEnd: Date,
    effectiveDate: Date,
  ): string {
    const oldAnnual = new Decimal(oldPrice).times(oldQty);
    const newAnnual = new Decimal(newPrice).times(newQty);
    const delta = newAnnual.minus(oldAnnual);
    return this.calculateProratedValue(delta.toString(), contractStart, contractEnd, effectiveDate);
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }
}
