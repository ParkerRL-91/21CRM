---
title: "ADR-003: Contract Management Architecture"
tags: [#decision, #architecture, #cpq, #contracts]
created: 2026-04-12
updated: 2026-04-12
---

# ADR-003: Contract Management Architecture

## Status

Accepted (2026-04-12)

## Context

21CRM needs contract lifecycle management to support US-8.1, US-8.2, and US-8.3 (Epic 8: Contract Management and Renewal). The system must track contracts, automate renewal opportunity/quote generation, and provide renewal pipeline analytics.

Key questions:
1. Where to store contract data — in `crm_objects` (JSONB) or as first-class relational tables?
2. How to model the renewal automation — event-driven or scheduled batch?
3. How to handle renewal pricing — hardcoded logic or configurable engine?
4. Where renewal deals live — as native `crm_objects` deals or in a separate table?

## Decision

### 1. First-class relational tables for contracts

**Decision:** Contracts, subscriptions, amendments, and renewals are stored in dedicated PostgreSQL tables with Drizzle ORM definitions — NOT in the `crm_objects` JSONB table.

**Rationale:**
- Contracts have complex relationships (contract → subscriptions, amendments, renewals) that benefit from foreign keys and relational integrity
- Amendment tracking requires append-only inserts with deterministic ordering (amendment_number)
- Financial calculations (ARR, proration, delta values) need proper NUMERIC(12,2) columns, not JSONB text extraction
- The contract lifecycle is 21CRM-native logic that goes beyond what HubSpot's data model supports
- Querying patterns (find expiring contracts, calculate NRR, aggregate by status) are more efficient with indexed relational columns

**Trade-off:** This means contract data is separate from synced CRM data. A join between contracts and crm_objects is needed to correlate accounts/deals. This is acceptable because contracts reference crm_objects via `account_hubspot_id` and `deal_hubspot_id`.

### 2. Scheduled batch for renewal automation

**Decision:** A daily cron job scans for expiring contracts and creates renewal records, rather than event-driven triggers.

**Rationale:**
- Simpler to reason about and debug than event-driven chains
- Deterministic: same input always produces same output
- Easy to manually trigger for testing
- Self-healing: if the job misses a day, the next run catches up (contracts are still within the window)
- Audit-friendly: job results logged with scan count, creations, and errors
- Next.js API routes support cron triggers via Vercel Cron or external scheduler

**Alternative considered:** Event-driven (trigger on contract creation / date change). Rejected because: harder to debug, requires background job infrastructure anyway (for timer-based triggers), and the daily batch is sufficient for 21CRM's use case (enterprise contracts don't need sub-day renewal creation latency).

### 3. Configurable renewal pricing engine

**Decision:** Three pricing methods (same_price, current_list, uplift_percentage) configurable at org, contract, and subscription levels with a resolution hierarchy.

**Rationale:**
- Salesforce CPQ uses exactly these three methods — they cover 95%+ of B2B SaaS renewal scenarios
- The hierarchy (subscription > contract > org) allows both broad defaults and per-product exceptions
- Pure functions with Decimal.js arithmetic ensure correctness and testability
- Each calculation produces an audit trail (input, method, formula, output) for finance verification

**Alternative considered:** A generic rules engine. Rejected per Martin Fowler's warning: rules engines create "implicit program flow" that's extremely hard to debug when pricing is wrong. The pipeline/switch pattern is simpler, more debuggable, and sufficient for three methods.

### 4. Renewal deals as crm_objects entries

**Decision:** Renewal deals are created as entries in the existing `crm_objects` table with `object_type = 'deals'` and `properties.deal_type = 'Renewal'`.

**Rationale:**
- Leverages existing pipeline infrastructure (kanban, funnel, stat cards, filtering)
- No need to build duplicate pipeline views for a separate renewal table
- Consistent with the sync-first architecture: deals are deals, regardless of type
- Can be synced to HubSpot as real deals via the existing sync engine
- Filtering by `deal_type` is efficient with the existing JSONB indexes

**Alternative considered:** A separate `renewal_opportunities` table. Rejected because: it would require duplicating all pipeline analytics for a separate data source, increasing maintenance burden significantly.

### 5. Monetary precision

**Decision:** All monetary values use `NUMERIC(12,2)` in PostgreSQL and `Decimal.js` in TypeScript. No floating-point types anywhere in the pricing or financial calculation chain.

**Rationale:**
- `0.1 + 0.2 !== 0.3` in JavaScript — floating-point arithmetic causes real billing errors
- PostgreSQL NUMERIC provides exact decimal arithmetic
- Decimal.js matches this precision in TypeScript
- B2B SaaS contracts involve large sums where cent-level accuracy matters
- Financial audit trails require exact values, not approximations

## Consequences

- Developers must use Decimal.js for all financial calculations (not native JS arithmetic)
- Contract queries require joins with crm_objects for account/deal metadata
- The daily cron job must be monitored for failures (add to operational checklist)
- The pricing engine is limited to three methods initially (extensible via new switch cases)
- Amendment history is immutable — no undo, only corrective amendments

## Related

- [[contract-management]] — Feature documentation
- [[adr-001-sync-first-architecture]] — Why data lives locally
- [[adr-002-rev-rec-line-item-level]] — Line-item-level financial tracking
