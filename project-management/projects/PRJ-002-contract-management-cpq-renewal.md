---
title: "Contract Management, CPQ & Renewal Automation"
id: PRJ-002
status: active
created: 2026-04-12
updated: 2026-04-12
tags: [#project, #cpq, #contracts, #renewals, #subscriptions, #pipeline]
---

# PRJ-002: Contract Management, CPQ & Renewal Automation

## Objective

Build a complete contract lifecycle management system into 21CRM that enables proactive contract tracking, automated renewal opportunity/quote generation, and dedicated renewal pipeline analytics — replacing the need for external CLM tools and closing the gap with Salesforce CPQ's contract/renewal capabilities.

## Strategic Context

This project implements **Epic 8: Contract Management and Renewal** from the product roadmap, with foundational CPQ elements required to support it. It builds on 21CRM's existing sync-first architecture and line-item-level data model to deliver:

1. **Contract objects** with full lifecycle tracking (Active → Amended → Renewed → Expired)
2. **Automated renewal engine** that creates renewal opportunities and draft quotes ahead of contract expiration
3. **Renewal pipeline analytics** with dedicated views, forecasting, and churn tracking

This directly supports 21CRM's competitive positioning: no competitor (Clari, HubiFi, Kluster) offers integrated contract lifecycle + revenue recognition + pipeline analytics in a single self-hosted platform.

## Success Metrics

- [ ] Account detail page displays all active contracts with key dates, values, and expiration countdown
- [ ] Contracts within 90 days of expiration are visually flagged
- [ ] Contract detail view shows subscriptions, amendment history, original quote link, and renewal status
- [ ] Daily background job creates renewal opportunities for contracts within configured lead time
- [ ] Renewal quotes auto-generated with all active subscriptions from expiring contract
- [ ] Renewal pricing supports three methods: same price, current list price, uplift percentage
- [ ] Renewal lead time configurable at system level (30/60/90 days)
- [ ] CS manager notified on renewal opportunity creation
- [ ] Renewal opportunities typed as "Renewal" and filterable in pipeline views
- [ ] Renewal pipeline report: total value, renewal rate, at-risk, churned
- [ ] Dedicated renewal kanban board by stage
- [ ] All tests pass (`npx vitest run`)
- [ ] Type check passes (`npx tsc --noEmit`)

## Architecture Overview

### Data Model

This project introduces 6 new database tables and extends 2 existing ones. The design follows the Salesforce CPQ pattern of Contract → Subscription → Renewal, adapted for 21CRM's PostgreSQL + Drizzle ORM stack with JSONB properties.

```
organizations (existing)
  └── contracts (NEW)
        ├── contract_subscriptions (NEW)
        ├── contract_amendments (NEW)
        └── contract_renewals (NEW — links to renewal opportunity)

crm_objects (existing, extended)
  ├── object_type = 'deals' (existing — extended with deal_type: "New Business" | "Renewal")
  └── object_type = 'line_items' (existing)

renewal_config (NEW — system-level renewal settings)
notifications (NEW — in-app notification system)
```

### System Flow

```
Quote Accepted (future Epic)  ─or─  Manual Contract Creation
                    │
                    ▼
           Contract (Active)
                    │
        ┌───────────┼───────────┐
        │           │           │
    Amendment   Daily Cron   Expiration
    (mid-term)  (renewal     (no renewal)
        │        check)          │
        ▼           │            ▼
   Contract         ▼       Contract
   (Amended)   Create        (Expired)
                Renewal Opp
                    │
                    ▼
               Auto-generate
               Renewal Quote
                    │
                    ▼
               CS Notification
                    │
                    ▼
            Renewal Pipeline
            Analytics & Reports
```

## Tasks

### Phase 1 — Data Model & Foundation (P0)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-027 | Design and implement contract management schema | ready | P0 |
| TASK-028 | Build contract CRUD API routes | ready | P0 |
| TASK-029 | Build contract subscription management | ready | P0 |

### Phase 2 — Contract UI & Account Integration (P0)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-030 | Account contracts related list (US-8.1) | ready | P0 |
| TASK-031 | Contract detail page with full context | ready | P0 |
| TASK-032 | Contract amendment tracking UI | ready | P1 |

### Phase 3 — Renewal Automation Engine (P0)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-033 | Renewal configuration system | ready | P0 |
| TASK-037 | Renewal pricing engine (same/list/uplift) | ready | P0 |
| TASK-034 | Daily renewal check background job | ready | P0 |
| TASK-035 | Renewal opportunity auto-creation | ready | P0 |
| TASK-036 | Renewal quote auto-generation | ready | P0 |
| TASK-038 | CS notification on renewal creation | ready | P1 |

### Phase 4 — Renewal Pipeline Analytics (P1)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-039 | Renewal opportunity type and pipeline filtering (US-8.3) | ready | P1 |
| TASK-040 | Renewal pipeline report page | ready | P1 |
| TASK-041 | Renewal kanban board | ready | P1 |
| TASK-042 | At-risk renewal identification engine | ready | P1 |

### Phase 5 — Integration & Polish (P2)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-043 | HubSpot contract sync (bidirectional) | ready | P2 |
| TASK-044 | Renewal-to-rev-rec integration | ready | P2 |
| TASK-045 | Contract expiration dashboard widget | ready | P2 |
| TASK-046 | Renewal analytics CSV export | ready | P2 |
| TASK-047 | Global contracts list page | ready | P1 |
| TASK-048 | Add test coverage for contract CRUD (TASK-028) | ready | P1 |

## Recommended Execution Order

**Phase 1 (Foundation):** TASK-027 → TASK-028 → TASK-029
**Phase 2 (UI):** TASK-030 → TASK-031 → TASK-032
**Phase 3 (Automation):** TASK-033 → TASK-037 → TASK-034 → TASK-035 → TASK-036 → TASK-038
  *(Note: TASK-037 pricing engine must be built before TASK-036 quote generation, since quote generation calls the pricing engine)*
**Phase 4 (Analytics):** TASK-039 → TASK-040 + TASK-041 (parallel) → TASK-042
**Phase 5 (Polish):** TASK-043 + TASK-044 (parallel) → TASK-045 → TASK-046

## Dependencies

- **PRJ-001 Phase 1** (bug fixes) should be complete before starting this project
- **Existing crm_objects data**: Contracts will reference deals and line items already synced
- **Sync engine**: Must be operational for deal/line_item data to exist
- **Rev-rec engine**: TASK-044 extends the existing rev-rec to handle renewal projections

## Decisions Log

- 2026-04-12: Contract data model follows Salesforce CPQ pattern (Contract → Subscription → Renewal) adapted for JSONB/Drizzle
- 2026-04-12: Contracts stored as first-class entities (not crm_objects) because they contain 21CRM-native lifecycle logic beyond HubSpot's data model
- 2026-04-12: Renewal pricing engine supports three methods: same_price, current_list, uplift_percentage — configurable per product
- 2026-04-12: Daily cron job pattern chosen over event-driven (simpler, deterministic, auditable)
- 2026-04-12: Amendment tracking uses append-only log pattern (never mutate history)
- 2026-04-12: Renewal opportunities created as deals in crm_objects with `deal_type = "Renewal"` to leverage existing pipeline infrastructure
- 2026-04-12: In-app notifications preferred over email-only (system boundary stays self-hosted)
- 2026-04-12: All monetary values use NUMERIC(12,2) in PostgreSQL, Decimal.js in TypeScript
