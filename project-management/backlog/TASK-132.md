# TASK-132 — User: Quote-to-Contract Conversion
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Converts revenue into committed contracts

---

## User Story

**As a** sales rep at PhenoTips,
**I want** to convert an accepted quote into a contract with one click, automatically creating the contract record, subscription records for each recurring line, and triggering billing system setup,
**so that** I never manually enter deal terms into a contract or billing system and the handoff from Sales to Customer Success is clean and immediate.

---

## Background & Context

Quote acceptance is the inflection point between the sales process and the revenue lifecycle. After a customer signs:
1. An **Order** is generated (the purchase record)
2. A **Contract** is generated (the legal and billing record)
3. **Subscription** records are created (one per recurring product line)
4. The billing system is notified to create the subscription
5. The Opportunity stage → Closed Won

This chain must happen automatically, with no data re-entry. Any manual step introduces error and slows customer onboarding.

---

## Features Required

### 1. "Create Order" Action (Quote → Order)

Available when Quote status = `Accepted`:

**"Create Order" button on Quote record:**
- Confirmation dialog:
  ```
  Create Order from Quote QTE-2026-0042?
  This will:
  ✓ Generate Order ORD-2026-0042
  ✓ Set Opportunity stage to Closed Won
  ✓ Lock quote lines (no further edits)
  
  [Create Order]  [Cancel]
  ```
- Creates `Order` record linked to the Quote and Opportunity
- Copies all quote line items to Order Line Items with quantities and net prices
- Sets `Quote.status = Ordered`
- Sets `Opportunity.stage = Closed Won`
- Creates a CRM Activity: "Order created from Quote QTE-2026-0042"

**Order Record:**
| Field | Value |
|-------|-------|
| `orderNumber` | `ORD-{YYYY}-{NNNN}` (auto-number) |
| `quoteId` | Parent quote |
| `opportunityId` | |
| `accountId` | |
| `effectiveDate` | Quote start date |
| `status` | `Draft` (rep must activate) |
| `type` | `New` / `Amendment` / `Renewal` |
| `netTotal` | Quote net total |
| `currency` | Quote currency |

### 2. "Activate Order" Action (Order → Contract)

On the Order record, the rep (or an automated trigger) clicks "Activate Order":

**"Activate Order" confirmation:**
```
Activating Order ORD-2026-0042 will:
✓ Generate Contract CNT-2026-0042
✓ Create 4 Subscription records (one per recurring product)
✓ Create 1 Asset record (for one-time Professional Services)
✓ Trigger billing system: create Stripe subscriptions
✓ Notify Customer Success team

[Activate Order]  [Cancel]
```

**On activation:**

**Contract record created:**
| Field | Value |
|-------|-------|
| `contractNumber` | `CNT-{YYYY}-{NNNN}` |
| `orderId` | Parent order |
| `quoteId` | Source quote |
| `accountId` | Customer account |
| `startDate` | From quote |
| `endDate` | startDate + subscriptionTerm |
| `term` | Subscription term in months |
| `status` | `Active` |
| `autoRenew` | Per Global Settings default |
| `renewalTerm` | 12 months (default) |
| `renewalPricingMethod` | `Uplift` at 5% (default) |
| `billingFrequency` | From quote |
| `paymentTerms` | From quote |
| `currency` | From quote |
| `ownerRep` | Quote owner |
| `csm` | (To be assigned by CS lead) |
| `signedDate` | Quote acceptance/e-signature date |
| `totalARR` | From quote |
| `totalMRR` | From quote |

**Subscription records created (one per recurring quote line):**
| Field | Value |
|-------|-------|
| `contractId` | Parent contract |
| `productId` | From quote line |
| `quantity` | From quote line |
| `startDate` | From quote line |
| `endDate` | Contract end date |
| `netPrice` | Contracted net unit price |
| `discount` | Locked-in discount % |
| `billingFrequency` | From quote line |
| `status` | `Active` |
| `subscriptionTerm` | Contract term |

**Asset records created (one per one-time quote line):**
- One-time products (Professional Services) become Asset records
- `status = Active`, `installedDate = contract start date`
- `quantity`, `price`, `product` from quote line

### 3. Contract Record UI

**Contract detail page layout:**
- Header: Contract number, Account, Status badge, Start/End/Term, ARR, CSM
- Tabs: Overview | Subscriptions | Amendments | Renewal | Documents | Activity

**Overview tab:**
- Key metrics card: ARR, MRR, Term, Start Date, End Date, Renewal Date, Status
- Contract parties: Account, Primary Contact, Signed By, Signed Date, Internal Owner
- Financial terms: Billing Frequency, Payment Terms, Currency, Price Book used
- Renewal settings: Auto-Renew toggle, Renewal Term, Renewal Pricing Method, Uplift %
- Custom terms: any non-standard terms noted (free text)

**Subscriptions tab:**
Table of all active subscription records:
```
Product Name          SKU         Qty    Net Price    ARR       Status    Start     End
PhenoTips Core        PT-CORE      1     $34,999      $34,999   Active    5/1/26    4/30/27
PPQ Module            PT-PPQ       1     $12,999      $12,999   Active    5/1/26    4/30/27
SSO Integration       PT-SSO       1      $5,999       $5,999   Active    5/1/26    4/30/27
CRAT Module           PT-CRAT      1      $9,999       $9,999   Active    5/1/26    4/30/27
─────────────────────────────────────────────────────────────────────────────────────────
Total ARR:                                                       $63,996
```

**Documents tab:**
- Signed quote PDF (uploaded from e-signature)
- Contract PDF (if generated separately)
- Amendment documents (added over time)
- NDA, MSA (attached manually)

### 4. Contract Activation — Billing Trigger

On Order activation, the system automatically:
1. Calls the billing system adapter (Stripe/Chargebee via TASK-142)
2. Creates a Customer in Stripe (linked to CRM Account)
3. Creates Subscriptions in Stripe (one per subscription record)
4. Sets billing start date = contract start date
5. Emits a `contract.activated` event to the webhook log

If billing creation fails:
- Contract is still created in CRM (do not block)
- Warning banner on contract: "Billing subscription not yet created. Manual action required."
- Retry button + link to billing integration logs

### 5. Opportunity Stage Update

On order creation:
- Opportunity Stage → `Closed Won`
- Opportunity Close Date → today
- Opportunity Amount stays as the quote net total
- Activity logged: "Won — order created from Quote QTE-2026-0042"

If customer rejects (Quote → `Rejected`):
- Opportunity Stage → `Closed Lost` (optional, rep must confirm)
- Lost reason captured (configurable picklist)

---

## UX Requirements

- "Create Order" and "Activate Order" are two separate deliberate steps (reduces accidental activation)
- Progress indicator shown during contract creation (async, takes 2–10 seconds)
- Success screen after activation: "Contract CNT-2026-0042 activated! 4 subscriptions created. Billing system notified."
- Email notification sent to CSM assigned to the account: "New contract activated for [Account]"
- Error handling: if any downstream step fails (billing, CSM notification), the contract is still created; warnings shown

---

## Definition of Success

- [ ] Clicking "Create Order" from an Accepted quote creates an Order linked to the quote
- [ ] Opportunity stage updates to Closed Won on order creation
- [ ] Clicking "Activate Order" creates a Contract + 4 Subscriptions + 1 Asset from a PhenoTips platform deal
- [ ] Contract record shows correct ARR, term, start/end dates from the quote
- [ ] Subscription records are created with the correct contracted prices (not current list price)
- [ ] Stripe subscription is created automatically on contract activation
- [ ] If Stripe fails, contract is still created with a warning (not a hard failure)

---

## Method to Complete

### Backend
1. `Order` entity: `orderNumber`, `quoteId`, `opportunityId`, `accountId`, `status`, `type`, `effectiveDate`, `netTotal`, `currency`
2. `OrderLine` entity: mirrors quote lines
3. `Contract` entity: all fields defined above (enhance existing Contract CPQ object)
4. `ContractSubscription` entity: enhance existing entity
5. `Asset` entity: simple record for one-time products
6. `OrderService`:
   - `createFromQuote(quoteId)` — creates Order + OrderLines; updates Opportunity
   - `activateOrder(orderId)` — creates Contract + Subscriptions + Assets; triggers billing
7. `ContractService`:
   - `getContract(contractId)` — with subscriptions
   - `updateContract(contractId, dto)` — update header fields (CSM, renewal settings, custom terms)
8. Routes: `POST /cpq/quotes/:id/create-order`, `POST /cpq/orders/:id/activate`
9. Billing trigger: calls `BillingAdapter.createSubscription()` async (TASK-142)

### Frontend
1. `CreateOrderModal.tsx` — confirmation modal
2. `ActivateOrderModal.tsx` — confirmation with checklist
3. `ContractDetailPage.tsx` — tabbed contract view
4. `ContractOverviewTab.tsx` — key metrics + terms
5. `ContractSubscriptionsTab.tsx` — subscription table
6. `ContractActivationSuccess.tsx` — post-activation success screen
7. `useContract` hook, `useOrder` hook

---

## Acceptance Criteria

- AC1: "Create Order" is only available when Quote status = `Accepted`
- AC2: Order creation locks the quote (no further edits to lines or prices)
- AC3: Opportunity stage updates to `Closed Won` within 5 seconds of order creation
- AC4: Activating the order creates exactly N subscriptions where N = number of recurring quote lines
- AC5: Each subscription's `netPrice` equals the quote line's contracted net price (not current list price)
- AC6: One-time lines create Asset records, not Subscription records
- AC7: Billing adapter is called and Stripe subscription is created if integration is configured
- AC8: Contract ARR = sum of all subscription annual values

---

## Dependencies

- TASK-126 (Quote Builder) — quote must be in Accepted status
- TASK-131 (Quote Document Generation) — signed PDF stored before order creation
- TASK-139 (Contract Lifecycle Service) — service layer for contract management
- TASK-142 (Billing Sync) — billing subscription creation triggered here

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 3 days | **Testing:** 2 days
**Total:** 9 days
