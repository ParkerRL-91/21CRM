---
title: "Wire createFromQuote to workspace datasource"
id: TASK-087
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #contracts, #orm]
---

# TASK-087: Wire createFromQuote to workspace datasource

## User Stories

- As a **Sales Rep**, I want to click "Create Contract" on an accepted quote and have the system automatically create a contract with all subscriptions so that I don't have to re-enter deal information.
- As a **Finance user**, I want the quote-to-contract conversion to be atomic so that partial conversions never leave data in an inconsistent state.

## Outcomes

`CpqContractService.createFromQuote()` uses Twenty's `WorkspaceDatasourceService` to query the accepted quote, extract its line items, create a contract record, create subscription records for each recurring line item, create an initial amendment record, and update the quote status to "contracted" — all in a single database transaction.

## Success Metrics

- [ ] Queries quote and line items from workspace schema via Twenty's datasource
- [ ] Creates contract with fields mapped from quote (name, account, dates, total)
- [ ] Creates subscription for each recurring line item (excludes one-time)
- [ ] Creates initial amendment record (amendment_number=1, type=add_subscription)
- [ ] Updates quote status from 'accepted' to 'contracted'
- [ ] Entire operation wrapped in a transaction — atomic or nothing
- [ ] Returns the created contract ID
- [ ] Rejects if quote status is not 'accepted'
- [ ] Tests with mocked datasource

## Implementation Plan

1. Study Twenty's workspace datasource pattern:
   - Read `twenty-server/src/engine/workspace-datasource/workspace-datasource.service.ts`
   - Understand how to get a workspace-scoped query runner
   - Study transaction patterns used by other modules

2. Inject `WorkspaceDatasourceService` into `CpqContractService`

3. Implement `createFromQuote(workspaceId, quoteId)`:
   ```typescript
   async createFromQuote(workspaceId: string, quoteId: string): Promise<string> {
     const dataSource = await this.workspaceDatasourceService
       .connectToWorkspaceDataSource(workspaceId);
     const queryRunner = dataSource.createQueryRunner();

     await queryRunner.startTransaction();
     try {
       // 1. Verify quote exists and status = 'accepted'
       const quote = await queryRunner.query(
         `SELECT * FROM quote WHERE id = $1 AND status = 'accepted'`,
         [quoteId]
       );
       if (!quote.length) throw new Error('Quote not found or not accepted');

       // 2. Get line items
       const lineItems = await queryRunner.query(
         `SELECT * FROM "quoteLineItem" WHERE "quoteId" = $1 ORDER BY "sortOrder"`,
         [quoteId]
       );

       // 3. Create contract
       const contractId = ... // INSERT INTO contract

       // 4. Create subscriptions for recurring items
       for (const item of lineItems.filter(li => li.billingType === 'recurring')) {
         // INSERT INTO "contractSubscription"
       }

       // 5. Create initial amendment
       // INSERT INTO "contractAmendment"

       // 6. Update quote status
       await queryRunner.query(
         `UPDATE quote SET status = 'contracted' WHERE id = $1`,
         [quoteId]
       );

       await queryRunner.commitTransaction();
       return contractId;
     } catch (error) {
       await queryRunner.rollbackTransaction();
       throw error;
     } finally {
       await queryRunner.release();
     }
   }
   ```

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-contract.service.ts` — MODIFY: wire to datasource
- `twenty/packages/twenty-server/src/modules/cpq/cpq.module.ts` — MODIFY: import datasource module
- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-contract.service.spec.ts` — MODIFY: add mock tests
