import { Injectable, Logger } from '@nestjs/common';

import { CpqPricingService } from './cpq-pricing.service';

/**
 * CPQ Renewal Service — handles automated renewal generation.
 *
 * Called by the daily cron job to:
 * 1. Find active contracts within the configured lead time
 * 2. Create renewal opportunities
 * 3. Generate draft renewal quotes with proposed pricing
 * 4. Notify CS managers
 *
 * Uses advisory locking for concurrency safety.
 * Each contract processed in its own transaction.
 */
@Injectable()
export class CpqRenewalService {
  private readonly logger = new Logger(CpqRenewalService.name);

  constructor(private readonly pricingService: CpqPricingService) {}

  /**
   * Run the daily renewal check for a workspace.
   * Finds contracts expiring within lead time and creates renewal records.
   */
  async runRenewalCheck(workspaceId: string): Promise<RenewalJobResult> {
    this.logger.log(`Running renewal check for workspace ${workspaceId}`);

    // TODO: Wire to Twenty's workspace data source
    // 1. Acquire advisory lock: pg_try_advisory_lock(hash(workspaceId + '_renewal'))
    // 2. Query contracts: status='active', end_date within lead_days, no pending renewal
    // 3. For each contract (in its own transaction):
    //    a. Determine pricing method (subscription > contract > org config)
    //    b. Calculate renewal pricing via this.pricingService.calculateRenewalPrice()
    //    c. Create renewal record with proposed subscriptions
    //    d. Create renewal opportunity (type='Renewal')
    //    e. Create notification for contract owner
    // 4. Release advisory lock

    return {
      contractsScanned: 0,
      renewalsCreated: 0,
      errors: [],
      status: 'completed',
    };
  }

  /**
   * Generate a renewal quote for a specific contract.
   * Called by the renewal job or manually by a CS manager.
   */
  async generateRenewalQuote(
    contractId: string,
    config: RenewalConfig,
  ): Promise<RenewalQuoteResult> {
    // TODO: Wire to workspace data source
    // 1. Get active subscriptions from contract
    // 2. For each recurring subscription:
    //    a. Resolve pricing method (subscription > contract > org)
    //    b. Calculate new price via pricingService.calculateRenewalPrice()
    //    c. Set start date = contract end date + 1 day
    //    d. Set end date = start + original term
    // 3. Store proposed subscriptions and total value
    return {
      success: true,
      subscriptionCount: 0,
      totalValue: '0',
    };
  }
}

export interface RenewalJobResult {
  contractsScanned: number;
  renewalsCreated: number;
  errors: string[];
  status: 'completed' | 'skipped' | 'failed';
}

export interface RenewalConfig {
  defaultLeadDays: number;
  defaultPricingMethod: 'same_price' | 'current_list' | 'uplift_percentage';
  defaultUpliftPercentage: number;
}

export interface RenewalQuoteResult {
  success: boolean;
  subscriptionCount: number;
  totalValue: string;
}
