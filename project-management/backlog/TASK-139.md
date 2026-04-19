# TASK-139 — Backend: Contract Lifecycle Management Service
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Core post-sale infrastructure

---

## User Story

**As a** CPQ system,
**I need** a Contract Lifecycle Management service that creates contracts from orders, manages subscription records throughout their lifecycle, triggers billing integrations, and handles the transition states from New to Active to Amended to Expired/Renewed,
**so that** every contract is consistently structured, every subscription is traceable to its source quote line, and the system always reflects the current state of every customer relationship.

---

## Background & Context

The contract is the definitive record of what a customer has agreed to pay for and for how long. Unlike a quote (which is a proposal), a contract is legally binding. The CLM (Contract Lifecycle Management) service must:
- Create contracts with referential integrity to quotes and subscriptions
- Track subscription records through their full lifecycle
- Handle co-termination on amendments
- Update ARR metrics in real-time as contracts change
- Enforce immutability of contracted prices (prices cannot change retroactively)

---

## Features Required

### 1. ContractService

```typescript
class ContractService {
  // Create contract + subscriptions from an activated order
  async createFromOrder(orderId: string): Promise<Contract>

  // Get contract with all relations
  async getContract(contractId: string): Promise<ContractWithRelations>

  // Update CSM-editable fields (health, notes, renewal settings, CSM assignment)
  async updateContract(contractId: string, dto: UpdateContractDto, updatedByUserId: string): Promise<Contract>

  // Apply amendment: update subscriptions per amendment order
  async applyAmendment(amendmentOrderId: string): Promise<Contract>

  // Initiate renewal: create renewal quote from contract subscriptions
  async createRenewalQuote(contractId: string, renewalSettings: RenewalSettings): Promise<Quote>

  // Expire a contract (called by scheduler or manually)
  async expireContract(contractId: string, reason: ContractExpiry): Promise<void>

  // Record a churn event
  async recordChurn(contractId: string, reason: string, churnedByUserId: string): Promise<void>

  // Recalculate contract ARR from subscriptions
  async recalculateARR(contractId: string): Promise<void>
}
```

### 2. Contract Creation (from Order)

```typescript
async createFromOrder(orderId: string): Promise<Contract> {
  const order = await this.orderRepo.findWithLines(orderId);
  const quote = await this.quoteRepo.findWithLines(order.quoteId);

  // Create the contract header
  const contract = await this.contractRepo.create({
    contractNumber: await this.generateContractNumber(),
    orderId, quoteId: quote.id, accountId: quote.accountId,
    startDate: quote.startDate,
    endDate: this.calculateEndDate(quote.startDate, quote.subscriptionTerm),
    term: quote.subscriptionTerm,
    status: 'Active',
    billingFrequency: quote.billingFrequency,
    paymentTerms: quote.paymentTerms,
    currency: quote.currency,
    autoRenew: this.getGlobalSettings().defaultAutoRenew,
    renewalTerm: this.getGlobalSettings().defaultRenewalTerm,
    renewalPricingMethod: this.getGlobalSettings().defaultRenewalPricingMethod,
    renewalUpliftPercent: this.getGlobalSettings().defaultRenewalUplift,
    totalARR: 0, // Will be recalculated after subscriptions are created
    repId: quote.ownerId,
    signedDate: quote.acceptedDate,
  });

  // Create subscription records for recurring lines
  const subscriptions = await Promise.all(
    order.lines
      .filter(line => line.billingType === 'Recurring')
      .map(line => this.createSubscription(contract.id, line))
  );

  // Create asset records for one-time lines
  await Promise.all(
    order.lines
      .filter(line => line.billingType === 'One-Time')
      .map(line => this.createAsset(contract.id, line))
  );

  // Recalculate ARR
  await this.recalculateARR(contract.id);

  return contract;
}
```

### 3. Subscription Record Creation

```typescript
async createSubscription(contractId: string, orderLine: OrderLine): Promise<Subscription> {
  return this.subscriptionRepo.create({
    contractId,
    productId: orderLine.productId,
    quantity: orderLine.quantity,
    startDate: orderLine.startDate,
    endDate: /* contract end date — co-termination */,
    contractedNetPrice: orderLine.netPrice, // IMMUTABLE — never changes
    contractedDiscount: orderLine.discount, // IMMUTABLE
    billingFrequency: orderLine.billingFrequency,
    subscriptionTerm: orderLine.subscriptionTerm,
    status: 'Active',
    sourceQuoteLineId: orderLine.quoteLineId,
    annualValue: orderLine.arr,
  });
}
```

**Immutability of `contractedNetPrice`:** This field is write-once. Even if the list price changes in the price book, existing subscriptions always show the contracted price. Amendments create NEW subscription records; they do not modify existing ones.

### 4. Amendment Application

```typescript
async applyAmendment(amendmentOrderId: string): Promise<Contract> {
  const order = await this.orderRepo.findWithLines(amendmentOrderId);
  const quote = await this.quoteRepo.findWithLines(order.quoteId);
  const contract = await this.contractRepo.findById(quote.sourceContractId);

  for (const line of order.lines) {
    switch (line.changeType) {
      case 'Added':
        // New subscription: create new record with contractedNetPrice at amendment rate
        await this.createSubscription(contract.id, line);
        break;

      case 'QuantityIncreased':
        // Don't modify existing subscription; create a delta subscription
        // Some implementations prefer to update quantity on existing subscription
        await this.createDeltaSubscription(contract.id, line);
        break;

      case 'Removed':
        // Terminate the subscription at the amendment effective date
        await this.terminateSubscription(line.sourceSubscriptionId, order.effectiveDate);
        break;

      case 'QuantityDecreased':
        await this.decreaseSubscriptionQuantity(line.sourceSubscriptionId, line.quantity, order.effectiveDate);
        break;
    }
  }

  // Recalculate contract ARR after all changes
  await this.recalculateARR(contract.id);

  // Record the amendment in history
  await this.amendmentHistoryRepo.create({
    contractId: contract.id,
    amendmentQuoteId: quote.id,
    effectiveDate: order.effectiveDate,
    deltaARR: await this.computeDeltaARR(contract.id, order.lines),
    createdByUserId: order.createdByUserId,
  });

  return contract;
}
```

### 5. Subscription Termination

```typescript
async terminateSubscription(subscriptionId: string, terminatedDate: Date): Promise<void> {
  await this.subscriptionRepo.update(subscriptionId, {
    status: 'Terminated',
    terminatedDate,
    // Do NOT change startDate or contractedNetPrice — preserve history
  });
  // Trigger billing system: reduce subscription quantity to 0 or remove item
  await this.billingAdapter.terminateSubscriptionItem(subscriptionId, terminatedDate);
}
```

### 6. ARR Recalculation

```typescript
async recalculateARR(contractId: string): Promise<void> {
  const activeSubscriptions = await this.subscriptionRepo.findActive(contractId);

  let totalARR = 0;
  let totalMRR = 0;

  for (const sub of activeSubscriptions) {
    // Annualize based on billing frequency
    const annualValue = this.annualize(sub.contractedNetPrice * sub.quantity, sub.billingFrequency);
    totalARR += annualValue;
    totalMRR += annualValue / 12;
  }

  await this.contractRepo.update(contractId, { totalARR, totalMRR });
}

annualize(amount: number, frequency: BillingFrequency): number {
  switch (frequency) {
    case 'Monthly': return amount * 12;
    case 'Quarterly': return amount * 4;
    case 'Semi-Annual': return amount * 2;
    case 'Annual': return amount;
  }
}
```

### 7. Contract Renewal Scheduler

Nightly job `ContractRenewalSchedulerJob`:

```typescript
async run(): Promise<void> {
  const today = new Date();

  // Find contracts expiring in 90, 60, 30 days
  const expiringContracts = await this.contractRepo.findExpiringBetween(today, addDays(today, 90));

  for (const contract of expiringContracts) {
    const daysToExpiry = differenceInDays(contract.endDate, today);

    if (daysToExpiry === 90 && !contract.renewalOpportunityId) {
      await this.createRenewalOpportunity(contract);
      await this.notifyCSM(contract, '90-day renewal alert');
    }

    if (daysToExpiry === 60 && !contract.renewalQuoteId) {
      await this.notifyCSM(contract, '60-day no quote warning');
      await this.notifyManager(contract, '60-day no quote warning');
    }

    if (daysToExpiry === 30) {
      await this.notifyCSM(contract, '30-day urgent renewal alert', { priority: 'urgent' });
      await this.createHighPriorityTask(contract);
    }

    if (daysToExpiry <= 0 && contract.status === 'Active') {
      await this.expireContract(contract.id, 'No renewal contracted');
    }
  }
}
```

### 8. Contract Audit Log

Every change to a contract is logged:

```typescript
await this.auditLog.record({
  type: 'CONTRACT_UPDATED',
  contractId,
  changedFields: diff(before, after),
  actorUserId,
  timestamp: new Date(),
});
```

Immutable fields (contractedNetPrice, subscription source quote line) are logged if any attempt is made to change them — should be impossible at the API level but logged for security.

### 9. Contract Number Generation

Sequential, workspace-scoped, formatted: `CNT-{YYYY}-{NNNN}` (e.g., `CNT-2026-0042`).

Uses a database sequence (or Redis counter with fallback) to guarantee uniqueness and no gaps:

```sql
CREATE SEQUENCE contract_number_seq START 1;
SELECT nextval('contract_number_seq'); -- gets 42
-- Format: CNT-{current_year}-{pad(42, 4, '0')}
```

---

## Definition of Success

- [ ] Creating a contract from an order creates the correct number of subscription records (one per recurring line)
- [ ] Subscription `contractedNetPrice` is immutable — price book changes do not affect it
- [ ] Applying an amendment correctly terminates removed subscriptions and adds new ones
- [ ] Contract ARR is recalculated correctly after every amendment
- [ ] 90/60/30-day renewal alerts fire on the correct days for all active contracts
- [ ] Contract expiry fires on the day after the contract end date if no renewal has been contracted
- [ ] Audit log captures every field change with actor identity

---

## Method to Complete

1. `ContractService` — main service with all lifecycle methods
2. `SubscriptionService` — subscription CRUD + termination
3. `AssetService` — one-time product records
4. `AmendmentHistoryService` — amendment recording
5. `ContractARRService` — ARR computation and rollup
6. `ContractRenewalSchedulerJob` — nightly scheduler (BullMQ recurring job)
7. Contract/Subscription/Asset entities: ensure all fields are properly typed and indexed
8. Migration: add any missing fields to existing entities (e.g., `contractedNetPrice`, `terminatedDate`, `renewalOpportunityId`)

---

## Acceptance Criteria

- AC1: Order with 4 recurring lines + 1 one-time line creates 4 subscriptions + 1 asset
- AC2: `contractedNetPrice` on subscription = net price from quote line at time of order activation
- AC3: Amending contract to add CRAT creates new subscription; existing subscriptions unchanged
- AC4: Terminating a subscription sets `status = Terminated`, `terminatedDate = effective date`
- AC5: Contract ARR = sum of (contractedNetPrice × quantity) annualized for all active subscriptions
- AC6: 90-day renewal alert fires exactly on the 90th day before contract end date
- AC7: Expired contract status → `Expired`; if auto-renew = true, auto-contracts the renewal quote if one exists

---

## Dependencies

- TASK-132 (Quote-to-Contract UI) — activation entry point
- TASK-133 (Contract Management UI) — reads from this service
- TASK-134 (Renewal Queue) — uses renewal scheduling from this service
- TASK-135 (Amendment Flow) — calls `applyAmendment`
- TASK-142 (Billing Sync) — billing updates triggered by subscription changes

---

## Estimated Effort
**Backend:** 6 days | **Testing:** 2 days
**Total:** 8 days
