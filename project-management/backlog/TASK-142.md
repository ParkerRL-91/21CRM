# TASK-142 — Integration: Billing System Sync (Stripe / Chargebee)
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Closes the quote-to-cash loop

---

## User Story

**As a** CPQ system,
**I need** to automatically create and maintain subscriptions in the billing system (Stripe or Chargebee) when contracts are activated and amended,
**so that** Finance never has to manually set up billing for a new deal, and the billing system is always in sync with what Sales has contracted.

---

## Background & Context

The handoff from CPQ to billing is one of the most error-prone steps in the quote-to-cash process. Without automation:
- Finance manually re-enters every deal into Stripe
- Data is mis-keyed (wrong quantity, wrong price, wrong billing frequency)
- Delays in billing = delayed revenue recognition

The CPQ system is the source of truth for pricing and terms. The billing system is the source of truth for invoicing and payment. Sync flows one direction at contract activation, then bidirectionally for amendments and failures.

---

## Features Required

### 1. Billing Adapter Interface

```typescript
interface BillingAdapter {
  // Find or create a customer in the billing system
  upsertCustomer(account: Account): Promise<BillingCustomer>

  // Create a subscription from a contract
  createSubscription(contract: Contract, subscriptions: ContractSubscription[]): Promise<BillingSubscription>

  // Modify an existing subscription (quantity changes, add/remove items)
  modifySubscription(billingSubscriptionId: string, changes: SubscriptionChange[]): Promise<void>

  // Cancel a subscription item
  cancelSubscriptionItem(billingSubscriptionId: string, itemId: string, cancelAt: Date): Promise<void>

  // List invoices for an account
  listInvoices(billingCustomerId: string): Promise<BillingInvoice[]>

  // Get subscription status
  getSubscription(billingSubscriptionId: string): Promise<BillingSubscription>
}
```

### 2. Stripe Adapter

```typescript
class StripeAdapter implements BillingAdapter {
  async upsertCustomer(account: Account): Promise<BillingCustomer> {
    // Check if account already has a stripeCustomerId
    if (account.stripeCustomerId) {
      // Update customer metadata
      const customer = await this.stripe.customers.update(account.stripeCustomerId, {
        name: account.name,
        email: account.billingEmail,
        metadata: { crmAccountId: account.id },
      });
      return { id: customer.id, email: customer.email };
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      name: account.name,
      email: account.billingEmail,
      address: this.mapAddress(account.billingAddress),
      metadata: { crmAccountId: account.id, crmAccountName: account.name },
    });

    // Store Stripe customer ID back on the account
    await this.accountRepo.update(account.id, { stripeCustomerId: customer.id });
    return { id: customer.id, email: customer.email };
  }

  async createSubscription(contract: Contract, subs: ContractSubscription[]): Promise<BillingSubscription> {
    const customer = await this.upsertCustomer(contract.account);

    // IMPORTANT: Stripe pricing model used here:
    // - Each product has ONE canonical Stripe Price at its list price (created by syncProductCatalog)
    // - Negotiated discounts are applied as Stripe Coupons at the subscription level (NOT per-item price_data)
    // - This is correct Stripe best practice: anonymous price_data objects create orphaned Price records
    //   that cannot be reused, cannot be reported on in Stripe, and violate Stripe's data model
    // - A Stripe Coupon is created per contract representing the blended discount rate

    // Step 1: Calculate the blended discount across all subscription lines
    const totalListArr = subs.reduce((sum, sub) => sum + sub.listPrice * sub.quantity, 0);
    const totalNetArr = subs.reduce((sum, sub) => sum + sub.contractedNetPrice * sub.quantity, 0);
    const blendedDiscountPercent = totalListArr > 0
      ? Math.round(((totalListArr - totalNetArr) / totalListArr) * 10000) / 100
      : 0;

    // Step 2: Create a coupon for this contract's discount (if any)
    let couponId: string | undefined;
    if (blendedDiscountPercent > 0) {
      const coupon = await this.stripe.coupons.create({
        percent_off: blendedDiscountPercent,
        duration: 'repeating',
        duration_in_months: contract.termMonths,
        name: `Contract ${contract.contractNumber} — ${blendedDiscountPercent}% negotiated discount`,
        metadata: { crmContractId: contract.id },
      });
      couponId = coupon.id;
    }

    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: subs.map(sub => ({
        // Use the canonical Stripe Price (list price), NOT anonymous price_data
        price: sub.product.stripePriceId, // set by syncProductCatalog()
        quantity: sub.quantity,
        metadata: { crmSubscriptionId: sub.id, crmContractId: contract.id },
      })),
      // Apply the negotiated discount as a coupon on the subscription
      coupon: couponId,
      billing_cycle_anchor: Math.floor(contract.startDate.getTime() / 1000),
      proration_behavior: 'create_prorations',
      metadata: {
        crmContractId: contract.id,
        crmAccountId: contract.accountId,
        crmQuoteId: contract.quoteId,
      },
    });

    // Store billing subscription ID on contract
    await this.contractRepo.update(contract.id, { billingSubscriptionId: subscription.id });
    return { id: subscription.id, status: subscription.status };
  }

  mapBillingFrequency(freq: BillingFrequency): 'month' | 'year' | 'week' {
    switch (freq) {
      case 'Monthly': return 'month';
      case 'Quarterly': return 'month'; // Use 3 months interval_count
      case 'Annual': return 'year';
    }
  }
}
```

### 3. Billing Sync Service

```typescript
class BillingSyncService {
  async onContractActivated(contractId: string): Promise<BillingSyncResult> {
    const contract = await this.contractRepo.findWithSubscriptions(contractId);

    try {
      const billing = await this.adapter.createSubscription(contract, contract.subscriptions);

      await this.contractRepo.update(contractId, {
        billingSubscriptionId: billing.id,
        billingSyncStatus: 'Synced',
        billingSyncedAt: new Date(),
      });

      return { success: true, billingSubscriptionId: billing.id };
    } catch (error) {
      // Don't fail the contract activation — just flag it
      await this.contractRepo.update(contractId, {
        billingSyncStatus: 'Failed',
        billingSyncError: error.message,
      });

      // Create a high-priority task for Finance to resolve manually
      await this.taskService.create({
        title: `Billing sync failed for Contract ${contract.contractNumber}`,
        description: `Error: ${error.message}. Please manually set up billing for this contract.`,
        assignedTo: this.settings.financeTeamUserId,
        priority: 'high',
        relatedTo: { type: 'Contract', id: contractId },
      });

      return { success: false, error: error.message };
    }
  }

  async onAmendmentContracted(contractId: string, amendedSubscriptions: SubscriptionChange[]): Promise<void> {
    const contract = await this.contractRepo.findById(contractId);
    if (!contract.billingSubscriptionId) {
      await this.onContractActivated(contractId);
      return;
    }

    await this.adapter.modifySubscription(contract.billingSubscriptionId, amendedSubscriptions);
    await this.contractRepo.update(contractId, { billingSyncedAt: new Date() });
  }
}
```

### 4. Stripe Product Catalog Sync

Ensure all CPQ products have corresponding Stripe Products/Prices:

```typescript
async syncProductCatalog(): Promise<ProductSyncResult> {
  const cpqProducts = await this.productRepo.findAll({ isActive: true });
  const results = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const product of cpqProducts) {
    try {
      if (!product.stripePriceId) {
        // Create Stripe Product + Price
        const stripeProduct = await this.stripe.products.create({
          name: product.name,
          description: product.description,
          metadata: { cpqSku: product.sku, cpqProductId: product.id },
        });
        // Create a default price (list price)
        const stripePrice = await this.stripe.prices.create({
          product: stripeProduct.id,
          currency: product.currency.toLowerCase(),
          unit_amount: Math.round(product.listPrice * 100),
          recurring: product.billingType === 'Recurring' ? {
            interval: this.mapBillingFrequency(product.billingFrequency),
          } : undefined,
        });
        await this.productRepo.update(product.id, { stripePriceId: stripePrice.id });
        results.created++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      results.errors.push(`${product.sku}: ${error.message}`);
    }
  }

  return results;
}
```

### 5. Incoming Billing Webhooks

Handle events from Stripe that require CRM action:

```typescript
@Post('/webhooks/stripe')
async stripeWebhook(@Body() body: unknown, @Headers('stripe-signature') sig: string) {
  const event = this.stripe.webhooks.constructEvent(body, sig, this.settings.stripeWebhookSecret);

  switch (event.type) {
    case 'invoice.payment_succeeded':
      await this.handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await this.handlePaymentFailed(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await this.handleSubscriptionCancelled(event.data.object);
      break;
  }
}

async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const contract = await this.contractRepo.findByBillingSubscriptionId(invoice.subscription as string);
  if (!contract) return;

  // Create task for Account Manager
  await this.taskService.create({
    title: `Payment failed — ${contract.account.name}`,
    description: `Invoice ${invoice.id} payment failed. Amount: ${formatCurrency(invoice.amount_due / 100, contract.currency)}`,
    assignedTo: contract.repId,
    priority: 'high',
    relatedTo: { type: 'Contract', id: contract.id },
  });

  // Notify CSM
  await this.notificationService.sendPaymentFailedAlert(contract, invoice);
}
```

### 6. Billing Sync Status Dashboard

On the Contract record (TASK-133), show billing sync status:

```
Billing Sync:
  ✓ Stripe subscription sub_1234abcd (synced 5 days ago)
  [View in Stripe →]  [Re-sync →]
```

Or if failed:
```
⚠ Billing sync failed: API error: Card declined
  [Retry →]  [View Error Details →]  [Create Manual Billing Task →]
```

---

## Definition of Success

- [ ] Contract activation creates a Stripe subscription within 30 seconds
- [ ] All 4 subscription lines are created as Stripe subscription items with correct prices
- [ ] Amendment (add CRAT) modifies the Stripe subscription by adding a new subscription item
- [ ] Payment failed webhook creates a task for the rep within 60 seconds
- [ ] Product catalog sync correctly creates Stripe Products for all 40+ CPQ products
- [ ] Billing sync failure does NOT prevent contract activation — only creates a warning

---

## Method to Complete

1. `BillingAdapter` interface
2. `StripeAdapter` implementation
3. `ChargebeeAdapter` implementation
4. `BillingSyncService` — orchestration
5. `BillingWebhookController` — Stripe + Chargebee webhook endpoints
6. Product catalog sync command: `POST /cpq/integrations/billing/sync-products`
7. Add billing fields to Contract/Account entities: `billingSubscriptionId`, `stripeCustomerId`, `billingSyncStatus`

---

## Acceptance Criteria

- AC1: Stripe subscription created with `metadata.crmContractId = [contractId]`
- AC2: Subscription items in Stripe match CRM subscriptions (product, quantity, price, billing frequency)
- AC3: Amendment adding 1 subscription item: Stripe subscription has N+1 items after sync
- AC4: Billing sync failure: contract status = Active; `billingSyncStatus = Failed`; task created for Finance
- AC5: Payment failed webhook: task created for rep within 60 seconds of webhook receipt

---

## Dependencies

- TASK-125 (Integration Settings) — Stripe API credentials
- TASK-132 (Quote-to-Contract) — `onContractActivated` called here
- TASK-135 (Contract Amendment) — `onAmendmentContracted` called here
- TASK-139 (Contract Lifecycle) — contract entity with billing fields

---

## Estimated Effort
**Backend:** 5 days | **Testing:** 2 days
**Total:** 7 days
