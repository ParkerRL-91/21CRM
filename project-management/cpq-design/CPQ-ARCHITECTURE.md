# CPQ Architecture & Design Specification
**Project:** 21CRM — PhenoTips Configure, Price, Quote
**Version:** 1.0
**Date:** 2026-04-19
**Status:** Approved for Development

---

## 1. What Is CPQ and Why It Matters

Configure, Price, Quote (CPQ) is the system of record for a B2B company's revenue-generation process from first pricing conversation through signed contract. A complete CPQ covers:

- **Configure** — Help sales reps select the right products, options, and bundles, enforcing business rules so they never quote incompatible combinations
- **Price** — Apply the correct list prices, discount schedules, volume discounts, promotional rates, and regional pricing in the correct order
- **Quote** — Generate a professional, branded, legally correct document for the customer, route for internal approvals, and capture acceptance (signature or PO)
- **Contract** — Convert an accepted quote into a contract with subscription tracking, renewal scheduling, and amendment history
- **Renewal** — Proactively identify upcoming renewals, generate renewal quotes, and track churn risk

For PhenoTips, CPQ manages:
- Complex multi-module deals (PT Core + PPQ + CRAT + integrations + professional services)
- Multi-currency (USD, GBP, CAD)
- Volume user-tier pricing (0–10 included, 11–50, 51–99, 100+)
- Multi-year ramp deals with term discounts
- Healthcare/academic/government institutional pricing
- Contract amendments (add/remove modules mid-term, quantity changes)
- Annual renewal with uplift

---

## 2. Core Principles

1. **Single source of truth** — Price books, not spreadsheets, are the canonical pricing reference
2. **Audit trail everywhere** — Every price change, discount, approval, and signature is logged
3. **Guardrails, not walls** — Admins set rules; reps work within them without constant friction
4. **Quote = Contract seed** — Every field on a quote is designed to become a contract field
5. **Renewals are quotes** — Renewal quotes go through the same approval and signature flow
6. **Separation of concerns** — Admin configures; reps quote; system enforces
7. **Multi-currency by design** — Every monetary value stores currency code alongside amount

---

## 3. Full Data Model

### 3.1 Product (PriceConfiguration — enhanced)

The central catalog record. One row per SKU per region per price book.

| Field | Type | Notes |
|-------|------|-------|
| `name` | TEXT | Display name (e.g., "PhenoTips Core — Platform Fee") |
| `sku` | TEXT | Unique identifier (e.g., `PT-CORE-PLATFORM-US`) |
| `productFamily` | SELECT | PT Core / PPQ / CRAT / Add-Ons / Integrations / Professional Services |
| `productCode` | TEXT | Internal code for ERP/billing sync |
| `description` | RICH_TEXT | Marketing copy shown on quote doc |
| `billingType` | SELECT | Recurring / One-Time / Usage / Milestone |
| `billingFrequency` | SELECT | Monthly / Quarterly / Semi-Annual / Annual |
| `configType` | SELECT | Flat / Per-Unit / Tiered-Graduated / Volume-All-Units / Term-Based / Ramp |
| `listPrice` | CURRENCY | List price per unit per billing period |
| `floorPrice` | CURRENCY | Minimum allowed net price after discount |
| `costBasis` | CURRENCY | Internal cost (for margin calculation) |
| `tiers` | RAW_JSON | For tiered/volume configs: [{from, to, price, priceType}] |
| `rampSchedule` | RAW_JSON | Year-over-year price changes: [{year, multiplier}] |
| `minQuantity` | NUMBER | Minimum orderable quantity |
| `maxQuantity` | NUMBER | Maximum orderable quantity (null = unlimited) |
| `defaultQuantity` | NUMBER | Pre-fills quantity field on line item |
| `priceBook` | SELECT | Standard / Healthcare / Government / Research-Cloud |
| `region` | SELECT | US / UK / GLOBAL |
| `currency` | SELECT | USD / GBP / CAD |
| `taxCode` | TEXT | Tax category for tax engine |
| `taxable` | BOOLEAN | Is this product taxable? |
| `isActive` | BOOLEAN | Inactive products cannot be added to quotes |
| `effectiveDate` | DATE | When this pricing takes effect |
| `expirationDate` | DATE | When this pricing expires |
| `sortOrder` | NUMBER | Display order in product selector |
| `tags` | TEXT | Comma-separated searchable tags |
| `allowManualPrice` | BOOLEAN | Can rep override price on line item? |
| `allowManualDiscount` | BOOLEAN | Can rep apply an ad-hoc discount? |
| `maxManualDiscount` | NUMBER | Maximum % a rep can discount without approval |
| `requiredProducts` | RAW_JSON | SKUs that must also be on the quote |
| `excludedProducts` | RAW_JSON | SKUs that cannot coexist on the same quote |
| `bundleComponents` | RAW_JSON | For bundle parents: [{sku, quantity, optional}] |
| `isBundle` | BOOLEAN | Is this a bundle parent? |
| `isBundleComponent` | BOOLEAN | Is this sold as part of a bundle? |

### 3.2 Price Book

Controls which price list applies to which accounts.

| Field | Type | Notes |
|-------|------|-------|
| `name` | TEXT | "Standard", "Healthcare Institutional", "Government/Non-Profit" |
| `code` | TEXT | `STANDARD`, `HEALTHCARE`, `GOVT`, `RESEARCH` |
| `description` | TEXT | When to use this price book |
| `currency` | SELECT | Primary currency |
| `isDefault` | BOOLEAN | Applied when no price book specified on account |
| `isActive` | BOOLEAN | |
| `discountFromStandard` | NUMBER | % discount applied over standard pricing |
| `applicableRegions` | TEXT | Comma-separated region codes |
| `approvalRequired` | BOOLEAN | Does using this price book require approval? |

### 3.3 Discount Schedule

Defines volume/term discount tiers applied automatically by the pricing engine.

| Field | Type | Notes |
|-------|------|-------|
| `name` | TEXT | "Volume Discount — PT Core Users" |
| `type` | SELECT | Volume / Term / Promotional / Loyalty |
| `scope` | SELECT | Product / ProductFamily / Quote |
| `tiers` | RAW_JSON | [{from, to, discountPercent, discountAmount}] |
| `startDate` | DATE | Promotional schedule start |
| `endDate` | DATE | Promotional schedule end |
| `stackable` | BOOLEAN | Can stack with other discounts? |
| `priority` | NUMBER | Lower = applied first |
| `condition` | RAW_JSON | JSON rule: {field, operator, value} |

### 3.4 Price Rule

Formula-based pricing overrides run by the pricing engine after standard discounts.

| Field | Type | Notes |
|-------|------|-------|
| `name` | TEXT | "3-Year Term Discount — 10%" |
| `active` | BOOLEAN | |
| `evaluationOrder` | NUMBER | |
| `conditionsMet` | SELECT | All / Any |
| `conditions` | RAW_JSON | [{field, operator, value}] |
| `actions` | RAW_JSON | [{targetField, operator, value}] |
| `scope` | SELECT | LineItem / Quote |

### 3.5 Quote (enhanced)

| Field | Type | Notes |
|-------|------|-------|
| `quoteNumber` | TEXT | Auto-generated: Q-2024-0001 |
| `name` | TEXT | Free-form title |
| `status` | SELECT | Draft / In-Review / Pending-Approval / Approved / Denied / Presented / Accepted / Rejected / Expired / Contracted |
| `type` | SELECT | New Business / Upsell / Cross-Sell / Renewal / Amendment |
| `version` | NUMBER | Auto-incremented; original = 1 |
| `primaryQuote` | BOOLEAN | Is this the active version? |
| `priceBook` | SELECT | Which price book is applied |
| `currency` | SELECT | USD / GBP / CAD |
| `subscriptionTermMonths` | NUMBER | Total contract length in months |
| `startDate` | DATE | Contract start |
| `endDate` | DATE | Contract end (computed from startDate + term) |
| `expirationDate` | DATE | Quote expires if not accepted by this date |
| `owner` | RELATION | → WorkspaceMember |
| `account` | RELATION | → Company |
| `opportunity` | RELATION | → Opportunity |
| `contact` | RELATION | → Person (primary contact) |
| `billingContact` | RELATION | → Person |
| `paymentTerms` | SELECT | Net 15 / Net 30 / Net 45 / Net 60 / Due on Receipt / Custom |
| `billingFrequency` | SELECT | Monthly / Quarterly / Annual / Upfront |
| `autoRenew` | BOOLEAN | |
| `renewalTermMonths` | NUMBER | Renewal term if different from initial |
| `subtotal` | CURRENCY | Sum of net totals before discount |
| `lineDiscountTotal` | CURRENCY | Sum of all line-level discounts |
| `additionalDiscountPercent` | NUMBER | Quote-level additional discount % |
| `additionalDiscountAmount` | CURRENCY | Quote-level additional discount $ |
| `taxTotal` | CURRENCY | Sum of all tax amounts |
| `grandTotal` | CURRENCY | Final total |
| `annualRecurringRevenue` | CURRENCY | ARR (recurring lines annualized) |
| `totalContractValue` | CURRENCY | TCV (all lines × term) |
| `oneTimeFees` | CURRENCY | Sum of one-time lines |
| `approvalStatus` | SELECT | Not Submitted / Pending / Approved / Rejected |
| `approvalChain` | RAW_JSON | [{approver, status, timestamp, comment}] |
| `documentStatus` | SELECT | Not Generated / Draft / Sent / Viewed / Signed / Declined |
| `signedDate` | DATE | |
| `signatureMethod` | SELECT | DocuSign / HelloSign / Verbal / Purchase Order / Email / Wet-Ink |
| `purchaseOrderNumber` | TEXT | |
| `acceptanceMethod` | SELECT | |
| `rejectionReason` | SELECT | |
| `lostToCompetitor` | TEXT | |
| `notes` | RICH_TEXT | Internal notes |
| `termsAndConditions` | RICH_TEXT | Deal-specific T&C |
| `internalNotes` | RICH_TEXT | |
| `templateId` | TEXT | Which document template to use |
| `pdfUrl` | TEXT | Link to generated PDF |
| `parentQuoteId` | TEXT | For versioning / amendments |

### 3.6 Quote Line Item (enhanced)

| Field | Type | Notes |
|-------|------|-------|
| `sortOrder` | NUMBER | Display order |
| `productName` | TEXT | Denormalized from product |
| `productSku` | TEXT | |
| `productFamily` | TEXT | |
| `productCode` | TEXT | |
| `isBundle` | BOOLEAN | |
| `bundleParentLineId` | TEXT | For bundle component lines |
| `quantity` | NUMBER | |
| `uom` | TEXT | Unit of measure (User, GB, Hour, Seat, Instance) |
| `subscriptionTermMonths` | NUMBER | If different from quote-level |
| `listPrice` | CURRENCY | Original catalog price per unit |
| `priceBookPrice` | CURRENCY | After price book discount |
| `discountPercent` | NUMBER | Rep-applied discount % |
| `discountAmount` | CURRENCY | Rep-applied discount $ |
| `scheduleDiscountPercent` | NUMBER | Auto-applied from discount schedule |
| `priceRuleAdjustment` | CURRENCY | Auto-applied from price rules |
| `netUnitPrice` | CURRENCY | Final per-unit price after all adjustments |
| `netTotal` | CURRENCY | netUnitPrice × quantity |
| `taxCode` | TEXT | |
| `taxRate` | NUMBER | Applicable tax rate % |
| `taxAmount` | CURRENCY | |
| `totalWithTax` | CURRENCY | |
| `annualizedAmount` | CURRENCY | Annualized value (for ARR calculation) |
| `contractedAmount` | CURRENCY | Total for the full term |
| `billingType` | SELECT | Recurring / One-Time / Usage |
| `billingFrequency` | SELECT | Monthly / Quarterly / Annual |
| `startDate` | DATE | Line-level start (for ramps) |
| `endDate` | DATE | |
| `proratedAmount` | CURRENCY | If mid-period start |
| `costBasis` | CURRENCY | For margin reporting |
| `marginPercent` | NUMBER | (net - cost) / net |
| `notes` | TEXT | Line-level notes shown on quote doc |
| `isOptional` | BOOLEAN | Optional line (customer can include/exclude) |
| `isSelected` | BOOLEAN | For optional lines — is it included? |
| `overridePrice` | BOOLEAN | Was list price manually overridden? |
| `priceOverrideReason` | TEXT | Required if overridePrice = true |
| `pricingAudit` | RAW_JSON | Full waterfall: {list, priceBook, scheduleDiscount, priceRule, repDiscount, net} |
| `quote` | RELATION | → Quote |

### 3.7 Approval Rule

| Field | Type | Notes |
|-------|------|-------|
| `name` | TEXT | "20%+ Discount — Manager Approval" |
| `active` | BOOLEAN | |
| `priority` | NUMBER | Lower runs first |
| `conditionsMet` | SELECT | All / Any |
| `conditions` | RAW_JSON | [{field, operator, value}] |
| `approvalType` | SELECT | User / Role / Queue / Manager-of-Submitter |
| `approver` | RELATION | → WorkspaceMember |
| `approverRole` | TEXT | Role name if approvalType = Role |
| `escalationDays` | NUMBER | Auto-escalate after N days |
| `escalateTo` | RELATION | → WorkspaceMember |
| `requireAllApprovers` | BOOLEAN | Sequential if true; any-one if false |
| `preventEdit` | BOOLEAN | Lock quote during approval |

### 3.8 Approval Request

| Field | Type | Notes |
|-------|------|-------|
| `quote` | RELATION | → Quote |
| `approvalRule` | RELATION | → ApprovalRule |
| `status` | SELECT | Pending / Approved / Rejected / Recalled / Escalated |
| `requestedBy` | RELATION | → WorkspaceMember |
| `assignedTo` | RELATION | → WorkspaceMember |
| `submittedAt` | DATE_TIME | |
| `decidedAt` | DATE_TIME | |
| `comment` | RICH_TEXT | |
| `escalatedAt` | DATE_TIME | |

### 3.9 Contract (enhanced)

| Field | Type | Notes |
|-------|------|-------|
| `contractNumber` | TEXT | Auto: C-2024-0001 |
| `name` | TEXT | |
| `status` | SELECT | Draft / Active / Amended / Pending-Renewal / Renewed / Expired / Cancelled |
| `account` | RELATION | → Company |
| `opportunity` | RELATION | → Opportunity |
| `originQuote` | RELATION | → Quote |
| `owner` | RELATION | → WorkspaceMember |
| `startDate` | DATE | |
| `endDate` | DATE | |
| `signedDate` | DATE | |
| `termMonths` | NUMBER | |
| `totalContractValue` | CURRENCY | |
| `annualRecurringRevenue` | CURRENCY | |
| `oneTimeFees` | CURRENCY | |
| `currency` | SELECT | |
| `priceBook` | SELECT | |
| `billingFrequency` | SELECT | |
| `paymentTerms` | SELECT | |
| `autoRenew` | BOOLEAN | |
| `renewalTermMonths` | NUMBER | |
| `renewalPricingMethod` | SELECT | Same-Price / Current-List / Uplift-% |
| `renewalUpliftPercent` | NUMBER | |
| `renewalStatus` | SELECT | Not-Started / Opportunity-Created / Quote-Generated / Renewed / Churned |
| `renewalDate` | DATE | When renewal process should begin (e.g., 90 days before end) |
| `renewalOwner` | RELATION | → WorkspaceMember |
| `notes` | RICH_TEXT | |
| `specialTerms` | RICH_TEXT | |
| `pdfUrl` | TEXT | Signed contract document |

### 3.10 Contract Subscription (enhanced)

Per-product entitlement line within a contract.

| Field | Type | Notes |
|-------|------|-------|
| `contract` | RELATION | → Contract |
| `productName` | TEXT | |
| `productSku` | TEXT | |
| `productFamily` | TEXT | |
| `quantity` | NUMBER | |
| `uom` | TEXT | |
| `unitPrice` | CURRENCY | Contracted net price per unit |
| `annualValue` | CURRENCY | |
| `contractedAmount` | CURRENCY | For full term |
| `billingFrequency` | SELECT | |
| `chargeType` | SELECT | Recurring / One-Time |
| `status` | SELECT | Active / Pending / Suspended / Cancelled / Expired |
| `autoRenew` | BOOLEAN | |
| `startDate` | DATE | |
| `endDate` | DATE | |
| `nextBillingDate` | DATE | |
| `lastBilledDate` | DATE | |
| `priceLockedUntil` | DATE | Price guarantee date |

### 3.11 Contract Amendment

| Field | Type | Notes |
|-------|------|-------|
| `contract` | RELATION | → Contract |
| `originQuote` | RELATION | → Quote (amendment quote) |
| `amendmentNumber` | NUMBER | Sequential per contract |
| `amendmentType` | SELECT | Add-Product / Remove-Product / Quantity-Change / Price-Change / Term-Extension / Cancellation |
| `effectiveDate` | DATE | |
| `description` | TEXT | |
| `deltaARR` | CURRENCY | Change to ARR |
| `deltaTCV` | CURRENCY | Change to TCV |
| `previousState` | RAW_JSON | Snapshot before |
| `newState` | RAW_JSON | Snapshot after |
| `changes` | RAW_JSON | [{field, from, to}] |
| `authorizedBy` | RELATION | → WorkspaceMember |

### 3.12 Quote Template

| Field | Type | Notes |
|-------|------|-------|
| `name` | TEXT | "Standard US Quote", "UK Healthcare Quote" |
| `isDefault` | BOOLEAN | |
| `headerHtml` | RICH_TEXT | Logo, company info |
| `introSection` | RICH_TEXT | Cover letter / intro text |
| `showListPrice` | BOOLEAN | |
| `showDiscount` | BOOLEAN | |
| `showNetPrice` | BOOLEAN | |
| `showTax` | BOOLEAN | |
| `showCostBasis` | BOOLEAN | Always false for customer-facing |
| `showOptionalLines` | BOOLEAN | |
| `groupByFamily` | BOOLEAN | |
| `footerHtml` | RICH_TEXT | |
| `termsAndConditions` | RICH_TEXT | Legal T&C |
| `signatureSection` | BOOLEAN | Include signature block |
| `expirationDisclaimer` | TEXT | |
| `css` | TEXT | Custom CSS for PDF |
| `applicableRegions` | TEXT | |
| `currency` | SELECT | |

### 3.13 Tax Rule

| Field | Type | Notes |
|-------|------|-------|
| `name` | TEXT | "US Software SaaS — State Tax" |
| `country` | TEXT | ISO country code |
| `state` | TEXT | State/province |
| `taxCode` | TEXT | Applies to products with this tax code |
| `rate` | NUMBER | Tax rate % |
| `inclusive` | BOOLEAN | Is tax included in price? |
| `effectiveDate` | DATE | |
| `expirationDate` | DATE | |
| `exemptionCategories` | TEXT | "NONPROFIT,GOVERNMENT" |
| `description` | TEXT | |

### 3.14 CPQ Settings (workspace-level configuration)

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| `defaultCurrency` | SELECT | USD | |
| `supportedCurrencies` | TEXT | USD,GBP,CAD | Comma-separated |
| `defaultPriceBook` | SELECT | Standard | |
| `defaultPaymentTerms` | SELECT | Net 30 | |
| `defaultBillingFrequency` | SELECT | Annual | |
| `defaultContractTermMonths` | NUMBER | 12 | |
| `defaultQuoteExpirationDays` | NUMBER | 30 | |
| `defaultRenewalLeadDays` | NUMBER | 90 | How far before expiry to start renewal |
| `quoteNumberPrefix` | TEXT | Q | |
| `quoteNumberFormat` | TEXT | {PREFIX}-{YEAR}-{SEQ:4} | |
| `contractNumberPrefix` | TEXT | C | |
| `autoRenewDefault` | BOOLEAN | true | |
| `requireApprovalAboveDiscountPct` | NUMBER | 20 | |
| `maxRepDiscountPct` | NUMBER | 15 | Hard limit without approval |
| `enableTax` | BOOLEAN | false | Toggle on when tax engine configured |
| `taxProvider` | SELECT | Manual / Avalara / TaxJar | |
| `enableEsignature` | BOOLEAN | false | |
| `esignatureProvider` | SELECT | DocuSign / HelloSign / PandaDoc | |
| `defaultQuoteTemplate` | SELECT | | |
| `showCostBasisToReps` | BOOLEAN | false | |
| `requirePriceOverrideReason` | BOOLEAN | true | |
| `lockQuoteDuringApproval` | BOOLEAN | true | |
| `enableVersioning` | BOOLEAN | true | |
| `enableOptionalProducts` | BOOLEAN | true | |
| `enableBundling` | BOOLEAN | true | |
| `enableRampPricing` | BOOLEAN | false | |
| `enableUsagePricing` | BOOLEAN | false | |
| `crmSyncEnabled` | BOOLEAN | false | |
| `crmProvider` | SELECT | Salesforce / HubSpot / None | |
| `billingSystemEnabled` | BOOLEAN | false | |
| `billingProvider` | SELECT | Stripe / Zuora / Chargebee / None | |

---

## 4. Admin Setup Flow (Step-by-Step)

### Step 1: Global CPQ Settings
Navigate to **Settings > CPQ > Configuration**
- Set default currency, supported currencies
- Set quote number format
- Set default payment terms, billing frequency, contract term
- Set quote expiration days
- Configure discount limits and approval thresholds
- Enable/disable features (tax, e-signature, bundling, ramp)

### Step 2: Price Books
Navigate to **Settings > CPQ > Price Books**
- Standard price book is auto-created
- Create additional price books: Healthcare, Government, Research
- Set discount from standard for each
- Assign price books to account segments (future: via account field)

### Step 3: Product Catalog
Navigate to **Settings > CPQ > Products**
- Create products for each SKU
- Set list price, floor price, cost basis
- Set billing type, billing frequency
- Configure tiers for volume/tiered products
- Set quantity limits, default quantity
- Set discount permissions (allow manual discount, max %)
- Mark products as bundle parents and add components
- Define product inclusion/exclusion rules

### Step 4: Discount Schedules
Navigate to **Settings > CPQ > Discount Schedules**
- Create volume schedules (e.g., 11–50 users = $899, 51–99 = $799)
- Create term schedules (1-year = 0%, 2-year = 5%, 3-year = 10%)
- Set scope (product, product family, quote-level)
- Set stackability and priority

### Step 5: Price Rules
Navigate to **Settings > CPQ > Price Rules**
- Create rules for complex pricing logic
- Example: "If contract term ≥ 36 months, apply 10% discount to all recurring lines"
- Set conditions, actions, and evaluation order

### Step 6: Approval Workflows
Navigate to **Settings > CPQ > Approvals**
- Create approval rules for each threshold
- Example: "If total discount > 20%, require Manager approval"
- Example: "If total contract value > $500K, require VP of Sales"
- Set approver (user, role, or manager-of-submitter)
- Set escalation rules
- Configure approval notifications

### Step 7: Quote Templates
Navigate to **Settings > CPQ > Quote Templates**
- Upload company logo
- Edit header (company name, address, contact)
- Configure line item display (show/hide list price, discount, etc.)
- Write terms and conditions
- Set up signature block
- Preview and save

### Step 8: Tax Configuration
Navigate to **Settings > CPQ > Tax**
- Enable tax module
- Create tax rules by country/state/taxCode
- Or configure Avalara/TaxJar integration

### Step 9: Integrations
Navigate to **Settings > CPQ > Integrations**
- Configure CRM sync (Salesforce/HubSpot)
- Configure billing system (Stripe/Zuora/Chargebee)
- Configure e-signature provider (DocuSign/HelloSign)
- Set up auto-sync schedule

---

## 5. User Quote Creation Flow (Step-by-Step)

### Step 1: Start a Quote
From **Opportunity** record → click **New Quote**
OR from **Quotes** list → click **New**
- Account and Opportunity auto-populated from context
- Select price book (defaults to account's price book or standard)
- Select currency (defaults to account's currency or system default)
- Set quote type (New Business / Renewal / Amendment)
- Enter start date (end date auto-computed from term)
- Enter expiration date (defaults: today + 30 days)

### Step 2: Add Products
Click **Add Products** → opens Product Selector
- Browse by product family or search by name/SKU
- See list price for selected price book/currency
- Select quantity
- For bundle products: configure options
- Click **Add to Quote** → products appear as line items

### Step 3: Price Line Items
For each line item:
- List price auto-populated from product catalog
- Discount schedule automatically applied (volume, term)
- Rep can manually adjust discount % or $ (within their limit)
- If discount exceeds limit: yellow warning ("requires approval")
- Net unit price and net total auto-calculated
- Pricing waterfall visible on hover/expand

### Step 4: Quote Totals
System automatically calculates:
- Subtotal (sum of net totals)
- Line discount total
- Additional quote-level discount (optional, with approval rules)
- Tax (if enabled)
- Grand total
- ARR (recurring annualized)
- TCV (all lines × term)

### Step 5: Review and Submit for Approval
- Quote shows approval status indicator
- If discount thresholds exceeded → Submit for Approval button appears
- System identifies required approvers
- Rep clicks Submit → approvers notified
- Quote locked during approval (configurable)
- Rep can track approval status in real time

### Step 6: Generate Document
After approval (or if no approval needed):
- Click **Generate Quote Document** → select template
- Preview PDF in-browser
- Edit intro letter text if needed
- Click **Send to Customer** → opens email compose with PDF attached
- Or: **Get Signature Link** → sends DocuSign/HelloSign

### Step 7: Customer Acceptance
- Customer signs electronically OR
- Rep records: accepted verbally / PO received / email acceptance
- Quote status → Accepted
- System prompts: "Convert to Contract?"

### Step 8: Create Contract
- Click **Convert to Contract**
- Contract auto-populated from quote
- Contract subscriptions created for each recurring line
- Contract status → Active (or Draft for review)
- Renewal date set based on end date − renewal lead days

---

## 6. Pricing Engine Architecture

The pricing engine runs as an ordered waterfall for every line item.

```
Step 1: List Price
  → Pulled from PriceConfiguration for the quote's priceBook + currency

Step 2: Price Book Adjustment
  → If using non-standard price book, apply base discount
  → Output: Price Book Price

Step 3: Volume/Tier Discount Schedule
  → Apply matching DiscountSchedule based on quantity
  → Example: quantity=25 → 11-50 tier → $899/user
  → Output: Schedule Price

Step 4: Term Discount Schedule
  → Apply DiscountSchedule based on subscriptionTermMonths
  → Example: 36 months → 10% discount
  → Output: Term-Adjusted Price

Step 5: Price Rules
  → Apply active PriceRules in evaluationOrder
  → Example: "If family = Professional Services and total > $50K, 5% off PS"
  → Output: Rule-Adjusted Price

Step 6: Rep Manual Discount
  → Apply line-level discount entered by rep
  → Validate against maxManualDiscountPct
  → If exceeds → flag for approval
  → Output: Net Unit Price

Step 7: Quote-Level Additional Discount
  → Applied to all lines proportionally
  → Requires approval if configured
  → Output: Final Net Unit Price

Step 8: Proration
  → If start date is mid-period, compute prorated amount
  → prorated = (full period amount × days remaining / days in period)

Step 9: Tax Calculation
  → Apply TaxRule based on product taxCode + customer location
  → Compute tax amount per line

Step 10: Totals
  → Sum all lines: subtotal, discount, tax, grand total
  → Compute ARR: annualize all recurring lines
  → Compute TCV: sum(netTotal × termMultiplier) for all lines
```

All intermediate values stored in `pricingAudit` JSON on each line item.

---

## 7. Approval Workflow Architecture

### Rule Evaluation Order
1. On quote save/submit, system evaluates all active ApprovalRules in priority order
2. Each rule checks its conditions against the quote and line items
3. If conditions match → create ApprovalRequest for that rule's approver
4. Rules can be sequential (all required) or parallel (any one approves = done)

### Standard PhenoTips Approval Rules
| Rule | Condition | Approver |
|------|-----------|----------|
| Rep Discount Threshold | Any line discount > 15% OR additional quote discount > 5% | Direct Manager of Submitter |
| High-Value Deal | TCV > $200,000 | VP of Sales |
| Non-Standard Price Book | Price book = Government or Healthcare | Revenue Operations |
| Price Override | Any line has `overridePrice = true` | Manager |
| Long-Term Deal | Term ≥ 36 months | Finance |
| Below Floor Price | Any line `netUnitPrice < floorPrice` | VP Sales + Finance |

### Approval States
```
Quote submitted → ApprovalRequest created → Approver notified
                → Approver: Approved → next rule or Quote.approvalStatus = Approved
                → Approver: Rejected → Quote.approvalStatus = Rejected + reason
                → N days pass → Escalated to escalateTo user
                → Rep: Recall → ApprovalRequest cancelled → Quote back to Draft
```

---

## 8. Default Settings for PhenoTips

```json
{
  "defaultCurrency": "USD",
  "supportedCurrencies": ["USD", "GBP", "CAD"],
  "defaultPriceBook": "Standard",
  "defaultPaymentTerms": "Net 30",
  "defaultBillingFrequency": "Annual",
  "defaultContractTermMonths": 12,
  "defaultQuoteExpirationDays": 30,
  "defaultRenewalLeadDays": 90,
  "quoteNumberPrefix": "Q",
  "quoteNumberFormat": "{PREFIX}-{YEAR}-{SEQ:4}",
  "contractNumberPrefix": "C",
  "autoRenewDefault": true,
  "requireApprovalAboveDiscountPct": 20,
  "maxRepDiscountPct": 15,
  "enableTax": false,
  "enableEsignature": false,
  "showCostBasisToReps": false,
  "requirePriceOverrideReason": true,
  "lockQuoteDuringApproval": true,
  "enableVersioning": true,
  "enableOptionalProducts": true,
  "enableBundling": false,
  "enableRampPricing": false,
  "enableUsagePricing": false,
  "priceBooks": ["Standard", "Healthcare", "Government", "Research-Cloud"]
}
```

---

## 9. Integration Architecture

### Salesforce Sync
- Quote → Salesforce Opportunity (status, total, close date)
- Contract → Salesforce Contract object
- Bidirectional: Salesforce Opportunity updates pull back to Twenty

### Billing System (Zuora/Stripe/Chargebee)
- Contract → Billing subscription
- Subscription lines → Billing subscription items
- Amendment → Billing subscription amendment
- Renewal → Billing subscription renewal

### E-Signature (DocuSign/HelloSign)
- Quote PDF → Envelope sent via API
- Webhook: signature completed → Quote.documentStatus = Signed + Quote.signedDate

### CRM
- All CPQ objects related to Twenty Company and Opportunity
- Quote, Contract visible on Company record page via relation panels

---

## 10. Key UX Principles

1. **Progressive disclosure** — Show simple fields first; advanced config behind "More options"
2. **Real-time calculation** — Prices recalculate on every keystroke without a save
3. **Inline validation** — Red/yellow warnings on discount limits before submission
4. **One-click from opportunity** — New Quote pre-fills account, contact, deal context
5. **Comparison mode** — Side-by-side quote version comparison
6. **Guided product selection** — Structured wizard for complex multi-module deals
7. **Quote preview** — Live HTML preview of the quote document while editing
8. **Mobile-friendly** — Quote status checking and approval actions work on mobile
9. **Bulk operations** — Clone quote, expire quotes, batch approve (admin)
10. **Activity timeline** — Full audit log on quote and contract records
