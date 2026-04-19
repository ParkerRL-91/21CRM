import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import Decimal from 'decimal.js';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

import { CpqPricingService } from './cpq-pricing.service';

// Renewal service — orchestrates automated renewal generation.
// Called by the daily cron job to find expiring contracts,
// create renewal opportunities, and generate draft renewal quotes.
// Uses advisory locking for concurrency safety.
@Injectable()
export class CpqRenewalService {
  private readonly logger = new Logger(CpqRenewalService.name);

  constructor(
    private readonly pricingService: CpqPricingService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // Run the daily renewal check for all contracts in a workspace.
  // Uses pg_try_advisory_lock to prevent concurrent runs.
  // Each contract is processed in its own transaction so one failure
  // doesn't stop the rest of the batch.
  async runRenewalCheck(
    workspaceId: string,
    config: RenewalConfig = DEFAULT_CONFIG,
  ): Promise<RenewalJobResult> {
    this.logger.log(`Running renewal check for workspace ${workspaceId}`);

    const schema = getWorkspaceSchemaName(workspaceId);

    // Stable advisory lock ID derived from the workspace string
    const lockId = this.workspaceLockId(workspaceId);
    const lockResult: { pg_try_advisory_lock: boolean }[] = await this.dataSource.query(
      'SELECT pg_try_advisory_lock($1)',
      [lockId],
    );

    if (!lockResult[0].pg_try_advisory_lock) {
      this.logger.warn(`Renewal check already running for workspace ${workspaceId}, skipping`);
      return {
        contractsScanned: 0,
        renewalsCreated: 0,
        errors: ['Renewal check already in progress (advisory lock held)'],
        status: 'skipped',
      };
    }

    const result: RenewalJobResult = {
      contractsScanned: 0,
      renewalsCreated: 0,
      errors: [],
      status: 'completed',
    };

    try {
      // Find active contracts approaching expiration that don't already have
      // an open renewal quote
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + config.defaultLeadDays);
      const contracts: ContractRow[] = await this.dataSource.query(
        `SELECT c.* FROM ${schema}."contract" c
         WHERE c.status = 'active'
           AND c."endDate" <= $1
           AND NOT EXISTS (
             SELECT 1 FROM ${schema}."quote" q
             WHERE q."contractId" = c.id
               AND q.type = 'renewal'
               AND q.status IN ('draft', 'in_review', 'approved', 'presented')
           )`,
        [cutoffDate],
      );

      result.contractsScanned = contracts.length;

      for (const contract of contracts) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.startTransaction();

        try {
          // Get active recurring subscriptions for this contract
          const subscriptions: SubscriptionRecord[] = await queryRunner.query(
            `SELECT "productName", quantity, "unitPrice", "chargeType", status
             FROM ${schema}."contractSubscription"
             WHERE "contractId" = $1
               AND status = 'active'
               AND "chargeType" = 'recurring'`,
            [contract.id],
          );

          if (subscriptions.length === 0) {
            await queryRunner.commitTransaction();
            continue;
          }

          const termMonths = contract.renewalTermMonths ?? 12;
          const contractEndDate = new Date(contract.endDate);
          const renewalQuote = this.generateRenewalQuote(
            subscriptions,
            contractEndDate,
            termMonths,
            config,
          );

          if (!renewalQuote.success) {
            await queryRunner.commitTransaction();
            continue;
          }

          // Create renewal quote record
          const quoteNumber = `RNW-${Date.now()}`;
          const renewalStart = new Date(contractEndDate);
          renewalStart.setDate(renewalStart.getDate() + 1);
          const renewalEnd = new Date(renewalStart);
          renewalEnd.setMonth(renewalEnd.getMonth() + termMonths);

          const quoteRows: { id: string }[] = await queryRunner.query(
            `INSERT INTO ${schema}."quote"
               (id, "quoteNumber", status, type, "startDate", "endDate",
                "grandTotal", "contractId", "companyId", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, 'draft', 'renewal', $2, $3, $4, $5, $6, NOW(), NOW())
             RETURNING id`,
            [
              quoteNumber,
              renewalStart,
              renewalEnd,
              renewalQuote.totalValue,
              contract.id,
              contract.companyId ?? null,
            ],
          );

          const renewalQuoteId = quoteRows[0].id;

          // Create renewal opportunity record linked to the company
          if (contract.companyId) {
            await queryRunner.query(
              `INSERT INTO ${schema}."opportunity"
                 (id, name, stage, "closeDate", amount, "companyId", "renewalQuoteId", "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), $1, 'RENEWAL', $2, $3, $4, $5, NOW(), NOW())`,
              [
                `Renewal — ${quoteNumber}`,
                renewalEnd,
                renewalQuote.totalValue,
                contract.companyId,
                renewalQuoteId,
              ],
            );
          }

          await queryRunner.commitTransaction();
          result.renewalsCreated++;
        } catch (contractError) {
          await queryRunner.rollbackTransaction();
          const message = contractError instanceof Error
            ? contractError.message
            : String(contractError);
          this.logger.error(`Failed to create renewal for contract ${contract.id}: ${message}`);
          result.errors.push(`Contract ${contract.id}: ${message}`);
        } finally {
          await queryRunner.release();
        }
      }

      if (result.errors.length > 0) {
        result.status = 'completed';
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Renewal check failed for workspace ${workspaceId}: ${message}`);
      return { ...result, status: 'failed', errors: [message] };
    } finally {
      // Always release the advisory lock
      await this.dataSource.query('SELECT pg_advisory_unlock($1)', [lockId]);
    }
  }

  // Generate a renewal quote for a specific contract.
  // Calculates new pricing for each active subscription and returns
  // proposed values for the renewal period.
  generateRenewalQuote(
    subscriptions: SubscriptionRecord[],
    contractEndDate: Date,
    termMonths: number,
    config: RenewalConfig,
  ): RenewalQuoteResult {
    if (subscriptions.length === 0) {
      return { success: false, subscriptionCount: 0, totalValue: '0', lines: [] };
    }

    const proposedStartDate = new Date(contractEndDate);
    proposedStartDate.setDate(proposedStartDate.getDate() + 1);

    let totalValue = new Decimal(0);
    const lines: RenewalQuoteLine[] = [];

    for (const subscription of subscriptions) {
      // Skip one-time and cancelled subscriptions
      if (subscription.chargeType !== 'recurring') continue;
      if (subscription.status === 'cancelled' || subscription.status === 'expired') continue;

      const pricingResult = this.pricingService.calculateRenewalPrice({
        currentPrice: subscription.unitPrice,
        method: config.defaultPricingMethod,
        upliftPercentage: config.defaultUpliftPercentage,
      });

      const newAnnualValue = new Decimal(pricingResult.newUnitPrice)
        .times(subscription.quantity)
        .toDecimalPlaces(2);

      totalValue = totalValue.plus(newAnnualValue);

      lines.push({
        productName: subscription.productName,
        quantity: subscription.quantity,
        oldUnitPrice: subscription.unitPrice,
        newUnitPrice: pricingResult.newUnitPrice,
        newAnnualValue: newAnnualValue.toString(),
        pricingMethod: pricingResult.method,
      });
    }

    return {
      success: true,
      subscriptionCount: lines.length,
      totalValue: totalValue.toString(),
      lines,
    };
  }

  // Resolve pricing method from the hierarchy:
  // subscription override → contract override → org default
  resolvePricingMethod(
    subscriptionMethod: string | null | undefined,
    contractMethod: string | null | undefined,
    orgDefault: string,
  ): string {
    return subscriptionMethod || contractMethod || orgDefault;
  }

  // Deterministic 32-bit lock ID from workspace UUID
  private workspaceLockId(workspaceId: string): number {
    let hash = 0;
    for (let i = 0; i < workspaceId.length; i++) {
      hash = (Math.imul(31, hash) + workspaceId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}

const DEFAULT_CONFIG: RenewalConfig = {
  defaultLeadDays: 90,
  defaultPricingMethod: 'same_price',
  defaultUpliftPercentage: 3,
};

export type RenewalJobResult = {
  contractsScanned: number;
  renewalsCreated: number;
  errors: string[];
  status: 'completed' | 'skipped' | 'failed';
};

export type RenewalConfig = {
  defaultLeadDays: number;
  defaultPricingMethod: 'same_price' | 'current_list' | 'uplift_percentage';
  defaultUpliftPercentage: number;
};

export type SubscriptionRecord = {
  productName: string;
  quantity: number;
  unitPrice: string;
  chargeType: string;
  status: string;
};

export type RenewalQuoteLine = {
  productName: string;
  quantity: number;
  oldUnitPrice: string;
  newUnitPrice: string;
  newAnnualValue: string;
  pricingMethod: string;
};

export type RenewalQuoteResult = {
  success: boolean;
  subscriptionCount: number;
  totalValue: string;
  lines?: RenewalQuoteLine[];
};

type ContractRow = {
  id: string;
  status: string;
  endDate: string;
  companyId: string | null;
  renewalTermMonths: number | null;
};
