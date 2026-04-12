---
title: "CPQ Gap Analysis: Research vs Implementation"
tags: [#cpq, #gaps, #research, #status]
created: 2026-04-12
updated: 2026-04-12
---

# CPQ Gap Analysis: Salesforce CPQ Research vs 21CRM Implementation

## Summary

Compared the comprehensive Salesforce CPQ research document against the actual implementation in `twenty/packages/twenty-server/src/modules/cpq/`. The business logic layer (pricing engine, risk scoring, renewal automation) is strong. The upstream catalog layer and downstream output features have critical gaps.

## Gap Table

| Area | Research Requirement | Status | Gap | Priority |
|------|---------------------|--------|-----|----------|
| **Product & Price Book** | Product catalog, PriceBook, PriceBookEntry objects | MISSING | Setup creates Quote/Contract/Subscription but NO Product, PriceBook, or PriceBookEntry objects. Line items use free-text productName with no catalog FK. | **P0** |
| **Price Snapshotting** | Copy price onto line item at creation, never re-read | INTENT ONLY | Schema supports it (listPrice field exists) but no Product/PriceBook to snapshot FROM. Blocked by Product gap. | **P0** |
| **Approval Workflows** | Rules, chains, parallel routing, smart re-approvals | MISSING | Quote has in_review/approved/denied status values but zero approval logic — no ApprovalRule object, no routing engine, no endpoints. | **P0** |
| **QuoteLineGroup** | Section grouping for line items | MISSING | Not in setup service. Line items have sortOrder but no groupId. | **P1** |
| **QuoteSnapshot** | Immutable version history | MISSING | Not created by setup. No versioning beyond versionNumber field. | **P1** |
| **QuoteAuditLog** | Change tracking per quote | MISSING | pricingAudit exists on line items but no quote-level audit log object. | **P1** |
| **PDF Generation** | @react-pdf/renderer with templates | MISSING | Zero PDF code anywhere. No QuoteTemplate object. | **P1** |
| **Invoice Generation** | Invoice records on contracting | MISSING | No Invoice object. createFromQuote is a stub returning hardcoded ID. | **P1** |
| **Quote Expiration Job** | Daily job marks expired quotes | MISSING | expirationDate field exists but nothing reads it. No scheduled job. | **P1** |
| **Order/OrderItem** | Intermediate between Quote and Contract | MISSING | Implementation goes Quote→Contract directly (simpler but less flexible). | **P2** |
| **Asset** | One-time product entitlements | MISSING | Research says one-time items become Assets after contracting. Not implemented. | **P2** |
| **Block Pricing** | Fixed total for quantity range | MISSING | Engine only handles tiered/volume/term. No block type. | **P2** |
| **Cross-Product Aggregation** | Quantities summed across products for tier calculation | MISSING | Each line item priced independently. | **P2** |
| **Cross-Order Aggregation** | Historical quantities included in tier calculation | MISSING | No historical quantity lookup. | **P2** |
| **MDQ (Multi-Dimensional)** | Time-segment pricing (Year 1, Year 2) | MISSING | Single term ratio only. No per-year pricing. | **P2** |
| **SubscriptionStateLog** | Per-subscription state transition log | MISSING | Amendments tracked at contract level but no per-subscription log. | **P2** |
| **Partner/Distributor Discount** | Waterfall steps 8-9 in Salesforce | MISSING | Pricing engine has 10 steps but skips partner and distributor discounts. | **P2** |
| **Currency Conversion** | Step 8 in waterfall | STUB | Comment placeholder only. No implementation. | **P2** |

## What's Strong

| Area | Status | Quality |
|------|--------|---------|
| Pricing waterfall (steps 1-7, 9-10) | Implemented | Production-grade with Decimal.js and audit trail |
| Tiered/volume/term discount calculation | Implemented | Correct math, tested |
| Renewal pricing (same/list/uplift) | Implemented | 50% cap, resolution hierarchy, tested |
| Contract status machine (7 states) | Implemented | Transition validation, tested |
| Subscription status machine (9 states) | Implemented | End-of-term cancellation, tested |
| Risk scoring (6 signals) | Implemented | Weighted scoring, tested |
| Renewal quote generation | Implemented | Filters one-time/cancelled, tested |
| Proration using actual contract days | Implemented | Not hardcoded 365, tested |
| Quote status machine (9 states) | Implemented | In setup service SELECT field |
| Amendment/renewal quote types | Implemented | type field with new/amendment/renewal from day one |
| Co-termination math | Implemented | Proration formula correct, execution path is stub |
| Setup service with teardown | Implemented | 6 objects, 50+ fields, 8 relations, idempotent |

## Prioritized Improvement Plan

### Must Do Before Production (P0)

1. **Add Product, PriceBook, PriceBookEntry objects to setup service** — Without a product catalog, line items have no source of truth for list prices, and price snapshotting cannot be enforced.

2. **Build approval engine** — Without approvals, reps can give away unlimited discounts. Minimum viable: rule conditions, 2-level chain, approve/reject endpoints.

### Should Do (P1)

3. Add QuoteLineGroup, QuoteSnapshot, QuoteAuditLog objects to setup
4. Build PDF generation with @react-pdf/renderer
5. Add Invoice object and wire createFromQuote
6. Build quote expiration daily job
7. Wire co-termination execution path

### Nice to Have (P2)

8. Add Order/OrderItem intermediate (currently Quote→Contract direct)
9. Block pricing type in engine
10. Cross-product/cross-order aggregation
11. MDQ time-segment pricing
12. SubscriptionStateLog object
13. Partner/Distributor discount steps
14. Currency conversion implementation

## Architectural Note

The research document recommends: "Twenty's metadata system for custom objects could be used for quick prototyping, but the pricing engine, approval workflows, and PDF generation require custom business logic that justifies first-class TypeORM entities and NestJS services."

Our implementation (ADR-004) uses custom objects for the data layer (correct for CRUD/UI) and NestJS services for business logic (correct for pricing/renewals). The gap is that the custom object setup is incomplete — it creates the downstream objects (quotes, contracts) but not the upstream catalog (products, price books) that feeds them.
