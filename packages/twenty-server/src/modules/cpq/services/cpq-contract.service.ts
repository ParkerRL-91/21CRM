import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import Decimal from 'decimal.js';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

//
// CPQ Contract Service — handles contract lifecycle operations.
//
// - Create contract from accepted quote (atomic transaction)
// - Amendment flow (co-termination, delta pricing)
// - Invoice generation
// - Status transitions with validation
//
@Injectable()
export class CpqContractService {
  private readonly logger = new Logger(CpqContractService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

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
  // Queries the workspace schema, creates contract + subscriptions + amendment,
  // and updates quote status — all in a single transaction.
  //
  async createFromQuote(workspaceId: string, quoteId: string): Promise<string> {
    this.logger.log(`Creating contract from quote ${quoteId} in workspace ${workspaceId}`);

    const schema = getWorkspaceSchemaName(workspaceId);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.startTransaction();

    try {
      // 1. Verify quote exists and is accepted
      const quoteRows = await queryRunner.query(
        `SELECT * FROM ${schema}."quote" WHERE id = $1 AND status = 'accepted'`,
        [quoteId],
      );

      if (quoteRows.length === 0) {
        throw new Error(`Quote ${quoteId} not found or not in accepted status`);
      }

      const quote = quoteRows[0];

      // 2. Fetch line items ordered by sortOrder
      const lineItems: LineItemRow[] = await queryRunner.query(
        `SELECT * FROM ${schema}."quoteLineItem" WHERE "quoteId" = $1 ORDER BY "sortOrder" ASC`,
        [quoteId],
      );

      // 3. Create contract record
      const contractNumber = `CTR-${Date.now()}`;
      const contractRows = await queryRunner.query(
        `INSERT INTO ${schema}."contract"
           (id, "contractNumber", status, "startDate", "endDate", "totalValue",
            "companyId", "opportunityId", "quoteId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, 'draft', $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [
          contractNumber,
          quote.startDate ?? new Date(),
          quote.endDate ?? null,
          quote.grandTotal ?? '0',
          quote.companyId ?? null,
          quote.opportunityId ?? null,
          quoteId,
        ],
      );

      const contractId: string = contractRows[0].id;

      // 4. Create subscriptions for recurring line items
      for (const item of lineItems) {
        if (item.billingType !== 'recurring') continue;

        await queryRunner.query(
          `INSERT INTO ${schema}."contractSubscription"
             (id, "productName", quantity, "unitPrice", "annualValue",
              "billingFrequency", status, "chargeType", "contractId",
              "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending', 'recurring', $6, NOW(), NOW())`,
          [
            item.productName,
            item.quantity,
            item.netUnitPrice ?? item.listPrice,
            new Decimal(item.netUnitPrice ?? item.listPrice)
              .times(item.quantity)
              .toDecimalPlaces(2)
              .toString(),
            quote.paymentTerms ?? 'annual',
            contractId,
          ],
        );
      }

      // 5. Create initial amendment record (amendment_number=1, type=add_subscription)
      await queryRunner.query(
        `INSERT INTO ${schema}."contractAmendment"
           (id, "amendmentNumber", "amendmentType", description, "deltaValue",
            "effectiveDate", "contractId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), 1, 'add_subscription',
                 'Initial contract created from quote', $1, NOW(), $2, NOW(), NOW())`,
        [quote.grandTotal ?? '0', contractId],
      );

      // 6. Update quote status from 'accepted' to 'contracted'
      await queryRunner.query(
        `UPDATE ${schema}."quote" SET status = 'contracted', "updatedAt" = NOW() WHERE id = $1`,
        [quoteId],
      );

      await queryRunner.commitTransaction();

      this.logger.log(`Contract ${contractId} created from quote ${quoteId}`);
      return contractId;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

type LineItemRow = {
  id: string;
  productName: string;
  quantity: number;
  listPrice: string;
  netUnitPrice: string | null;
  netTotal: string | null;
  billingType: string;
  sortOrder: number | null;
};
