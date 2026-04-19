# TASK-123 — Admin: Tax Configuration
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P2 — Required for tax-inclusive markets (UK); deferred for US SaaS

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to configure tax rules that automatically calculate and display tax on quotes based on the customer's location, account type, and product taxability,
**so that** quotes accurately reflect tax obligations without requiring finance team manual adjustments.

---

## Background & Context

Tax is complex and varies by:
- Jurisdiction (US state vs. UK VAT vs. Canadian HST)
- Customer type (commercial vs. non-profit vs. government — often tax-exempt)
- Product type (software = taxable in some US states but not others; professional services = often taxable)

For PhenoTips specifically:
- UK quotes need VAT (20%) added
- US quotes: most SaaS software is sales-tax-exempt in states where PhenoTips has nexus, but this changes
- Government and non-profit accounts are often tax-exempt
- Professional services have different tax treatment than software

This task covers **manual tax configuration** (tax rules defined by admin). Integration with tax calculation engines (TaxJar, Avalara) is scoped in TASK-141.

---

## Features Required

### 1. Tax Rule List
- Table: Name, Tax Rate (%), Region, Customer Types, Product Categories, Active
- Create, edit, deactivate, delete (soft)
- Priority order (first matching rule wins)

### 2. Tax Rule Configuration
- **Name** (required)
- **Tax Rate (%)** — e.g., `20` for UK VAT
- **Tax Name / Label** — shown on quote document (e.g., "VAT 20%", "HST")
- **Tax Code** — for ERP sync (e.g., `TAX-UK-VAT`)
- **Currency** — which currency this rule applies to (USD / GBP / CAD)
- **Region** — which geographic region triggers this rule (US / UK / Global / specific country)
- **Customer Type** — the account types this rule applies to (Commercial, Academic, Government, Non-Profit)
  - "Tax Exempt" customer types are automatically excluded
- **Product Categories** — which product tax categories this rule applies to
  - Matches against product's `Tax Category` field (Software, Services, Hardware)
- **Taxable** — is this a positive tax (add) or a special zero-rate rule?
- **Is Active** toggle
- **Priority** — determines which rule fires first if multiple match

### 3. Tax Exemption Certificates
- Manage exemption certificates per account:
  - Account (lookup)
  - Certificate Number (text)
  - Expiration Date (date)
  - Region (SELECT)
  - Certificate File (attachment)
- When a quote is created for an account with an active exemption certificate, tax is automatically $0 for that region
- Alert when certificate is within 30 days of expiration

### 4. Tax Display on Quotes
- When a tax rule matches: tax line appears in quote summary as:
  ```
  Subtotal:          $100,000
  VAT (20%):         $20,000
  ─────────────────────────────
  Total:             $120,000
  ```
- Tax breakdown visible per product family if `showTaxBreakdown` setting is on
- Tax amount stored on quote as `taxTotal` (already in Quote entity)

### 5. Tax Calculation Logic
When a quote is saved/calculated:
1. Determine account's billing address country/region
2. Check for active exemption certificate — if exists, skip tax
3. Evaluate tax rules by priority; first matching rule wins
4. Rule matches if: region matches AND customer type matches AND product category matches
5. Tax = Subtotal × Tax Rate
6. Apply to `Quote.taxTotal`; show on quote document

### 6. Tax Provider Integration (Stub)
Even if not fully integrated in this task, provide:
- Setting: Tax Provider = `Manual` / `TaxJar` / `Avalara`
- When provider is set: bypass manual rules and call external API
- Integration spec documented for TASK-141

---

## Admin UX Requirements

- Simple rule builder (no complex condition logic — only AND conditions)
- "Test Tax Rule" button: input an account + product → see which rule fires and the calculated tax
- Exemption certificate expiry warnings in admin dashboard

---

## Definition of Success

- [ ] UK quote (GBP, Commercial customer, Software product) correctly calculates VAT at 20%
- [ ] Government/non-profit account is tax-exempt (no tax applied)
- [ ] Account with active exemption certificate has $0 tax
- [ ] Tax amount appears correctly in quote document summary
- [ ] Multiple tax rules with different regions don't interfere with each other
- [ ] Tax rules with priority ordering: rule 1 fires before rule 2 when both match

---

## Method to Complete

### Backend
1. `TaxRule` entity: all fields above
2. `TaxExemptionCertificate` entity: account + cert fields
3. `TaxCalculationService.calculate(quote)` → returns `{ taxTotal, taxLabel, taxRate, ruleApplied }`
4. `GET /cpq/tax-rules`, `POST /cpq/tax-rules`, `PATCH /cpq/tax-rules/:id`
5. `GET /cpq/accounts/:id/exemption-certificates`, `POST /cpq/accounts/:id/exemption-certificates`
6. Called by pricing engine after subtotal is calculated

### Frontend
1. `TaxConfigPage.tsx` at `/settings/cpq/tax`
2. `TaxRuleEditor.tsx`
3. `ExemptionCertificatesTable.tsx` (shown on Account detail page in CPQ context)
4. `useTaxRules` hook

---

## Acceptance Criteria

- AC1: UK Commercial account gets VAT 20% applied on GBP quotes
- AC2: Government account gets 0% tax (matched to tax-exempt rule)
- AC3: Account with valid exemption certificate gets $0 tax regardless of account type
- AC4: Tax appears as line item in the quote document footer totals
- AC5: Expired exemption certificate triggers an admin warning and does not confer exemption

---

## Dependencies

- TASK-116 (Global Settings) — tax provider setting
- TASK-126 (Quote Builder) — tax display in quote summary
- TASK-136 (Pricing Engine) — tax calculation step

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 2 days | **Testing:** 1 day
**Total:** 5 days
