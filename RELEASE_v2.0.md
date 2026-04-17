# v2.0 — Full CPQ Quote-to-Cash Platform

**Release Date:** 2026-04-12
**Tag:** v2.0

Complete Configure, Price, Quote (CPQ) and contract management system for 21CRM, delivering a self-hosted alternative to Salesforce CPQ.

---

## Highlights

- **10 epics, 58 tasks, 260 tests** — full quote-to-cash lifecycle
- **23 PostgreSQL tables** with 23 CHECK constraints and 46 indexes
- **10-step price waterfall engine** with Decimal.js precision and audit trails
- **Contract lifecycle management** with automated renewal generation and risk scoring
- **Quote-to-contract conversion** with amendment flow, co-termination, and invoice generation
- **5,976 lines of TypeScript**, zero type errors

---

## Epics Delivered

| Epic | Description | Tasks |
|:----:|-------------|:-----:|
| 1 | Product catalog, price books, discount schedules | 6 |
| 2 | Quote creation, line items, groups, versioning | 5 |
| 3 | 10-step price waterfall engine (tiered/volume/term) | 4 |
| 4 | Approval rules engine with sequential chains | 4 |
| 5 | PDF generation via @react-pdf/renderer | 3 |
| 6 | Quote delivery, acceptance, rejection tracking | 3 |
| 7 | Quote-to-contract conversion, amendment flow | 3 |
| 8 | Contract management, renewal automation, risk assessment | 22 |
| 9 | Subscription lifecycle, ARR/MRR tracking | 4 |
| 10 | Quote analytics, discount analysis, ARR waterfall | 4 |

---

## Business Logic Engines

### Pricing Engine (10-step waterfall)
1. Base Price Resolution
2. Contracted/Customer-Specific Price
3. Subscription Proration (effective term / base term)
4. Tiered (slab) / Volume (all-units) Discounts
5. Term-Based Discounts (multi-year commitment)
6. Manual Discount (%, amount, or override)
7. Floor Price Enforcement
8. Currency Conversion
9. Rounding (2 decimal places, ROUND_HALF_UP)
10. Total Calculation (net unit price x quantity)

### Renewal Pricing (3 methods)
- **Same Price** — current contract price unchanged
- **Current List** — latest price book entry (fallback to same)
- **Uplift Percentage** — annual increase with 50% cap
- Resolution hierarchy: subscription > contract > org default

### Risk Assessment (6 weighted signals)
- Stage stagnation (25%) — deal hasn't progressed in 14+ days
- Close date slippage (20%) — past contract end date
- Time pressure (20%) — <30 days to expiry, not in final stage
- Value decrease (15%) — renewal value < current contract
- No activity (10%) — no deal changes in 21+ days
- Previous churn (10%) — account had prior cancelled renewal
- Levels: low (0-25), medium (26-50), high (51-75), critical (76+)

### Quote Status Machine (9 states)
```
draft -> in_review -> approved -> presented -> accepted -> contracted
              \-> denied -> draft (revision)
         approved -> expired -> draft (re-open)
              presented -> rejected (terminal)
```

### Contract Status Machine (7 states)
```
draft -> active -> amended -> active
           \-> pending_renewal -> renewed | expired | cancelled
```

### Subscription State Machine (9 states)
```
pending -> active -> pending_amendment -> active
              \-> pending_cancellation -> cancelled
              \-> suspended -> active
              \-> expired
```

---

## Database Schema (23 tables)

**Contract tables (6):** contracts, contract_subscriptions, contract_amendments, renewal_config, contract_renewals, notifications

**CPQ tables (17):** products, price_books, price_book_entries, discount_schedules, discount_tiers, quotes, quote_line_items, quote_line_groups, quote_snapshots, quote_audit_log, approval_rules, approval_requests, quote_templates, quote_attachments, invoices, invoice_line_items, subscription_state_log

---

## Architecture Decisions

- **ADR-001:** Sync-first architecture (query local DB, never HubSpot directly)
- **ADR-002:** Line-item-level revenue recognition
- **ADR-003:** Contract management — relational tables over JSONB, batch cron over event-driven, pipeline pricing over rules engine, renewal deals as crm_objects

---

## Technical Stats

| Metric | Value |
|--------|-------|
| PostgreSQL tables | 23 |
| CHECK constraints | 23 |
| Indexes | 46 |
| Drizzle migrations | 2 |
| Business logic modules | 8 |
| Test suites | 8 |
| Tests passing | 260 |
| API routes | 11 |
| UI pages | 8 |
| TypeScript lines | 5,976 |
| Type errors | 0 |
| Task files | 85 |
| Knowledge files | 21 |
| ADRs | 3 |

---

## Security

- All monetary arithmetic: Decimal.js (TypeScript) + NUMERIC(12,2) (PostgreSQL)
- Zero floating-point operations in financial code
- Zero hardcoded secrets
- All SQL parameterized via Drizzle ORM (no string interpolation)
- Advisory locking for cron job concurrency
- Uplift cap (50%) prevents misconfiguration
- Zero-price floor prevents negative pricing
