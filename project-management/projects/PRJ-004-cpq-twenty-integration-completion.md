---
title: "CPQ Twenty Integration Completion"
id: PRJ-004
status: active
created: 2026-04-12
updated: 2026-04-12
tags: [#project, #cpq, #twenty, #integration]
---

# PRJ-004: CPQ Twenty Integration Completion

## Objective

Complete the CPQ module integration into Twenty CRM from 8.0/10 to 9.5/10+ across all quality categories. The business logic (pricing engine, risk scoring, renewal automation, contract lifecycle) is production-ready with 60+ tests. What remains is wiring that logic into Twenty's specific platform patterns: GraphQL resolvers, workspace authentication, Apollo Client frontend, workspace datasource queries, and navigation routing.

## Current State (8.0/10)

| Category | Score | Status |
|----------|:-----:|--------|
| A. Metadata Registration | 8.5 | 6 objects, 50+ fields, 8 relations, teardown, status — needs auth + caching |
| B. Database Migrations | 8.0 | Metadata API handles tables — needs schema evolution |
| C. GraphQL Integration | 7.0 | Auto CRUD works — needs custom resolvers for biz logic |
| D. Frontend UI | 7.0 | Setup page + templates + calculator — needs Apollo + routing + quote builder |
| E. Service Quality | 8.5 | All engines tested — needs createFromQuote + datasource wiring |
| F. Test Coverage | 8.5 | 60+ tests — needs integration tests + edge cases |
| G. Code Cleanup | 9.5 | Complete |
| H. Conventions | 7.5 | Mostly good — needs auth guards, Apollo, test directory convention |

## Prerequisites

- Twenty CRM dev environment running (PostgreSQL + Redis + twenty-server + twenty-front)
- `bash packages/twenty-utils/setup-dev-env.sh` executed
- Access to Twenty's workspace to test custom object creation

## Success Metrics

- [ ] All 8 quality categories score 9.5/10+
- [ ] CPQ objects appear natively in Twenty's sidebar after setup
- [ ] Quote builder page functional with live pricing engine
- [ ] Renewal check endpoint queries real contracts from workspace
- [ ] All tests pass within Twenty's Jest framework
- [ ] Jordan (CRM admin persona) can complete full quote-to-contract flow

---

## Tasks

### Phase 1: Platform Wiring (Backend) — P0

| Task ID | Title | Status | Priority | Effort |
|---------|-------|--------|----------|--------|
| TASK-085 | Add workspace auth to CPQ controller | ready | P0 | Small |
| TASK-086 | Build GraphQL resolvers for CPQ business logic | ready | P0 | Medium |
| TASK-087 | Wire createFromQuote to workspace datasource | ready | P0 | Medium |
| TASK-088 | Wire runRenewalCheck to workspace datasource | ready | P0 | Large |
| TASK-089 | Register renewal check as BullMQ scheduled job | ready | P1 | Medium |
| TASK-090 | Add schema evolution / version upgrade path | ready | P2 | Medium |

### Phase 2: Frontend Integration — P0

| Task ID | Title | Status | Priority | Effort |
|---------|-------|--------|----------|--------|
| TASK-091 | Migrate frontend hooks from fetch to Apollo Client | ready | P0 | Medium |
| TASK-092 | Register CPQ pages in Twenty's navigation system | ready | P0 | Medium |
| TASK-093 | Build quote builder page with line item editing | ready | P0 | Large |
| TASK-094 | Build renewal dashboard with risk scores | ready | P1 | Large |
| TASK-095 | Build contract detail panel with amendment viewer | ready | P1 | Medium |

### Phase 3: Testing & Polish — P1

| Task ID | Title | Status | Priority | Effort |
|---------|-------|--------|----------|--------|
| TASK-096 | Integration tests against running Twenty server | ready | P1 | Large |
| TASK-097 | Edge case tests (negative prices, empty tiers, NaN) | ready | P1 | Small |
| TASK-098 | Cache object list in setup service (N+1 fix) | ready | P1 | Small |
| TASK-099 | Add input validation DTOs with class-validator | ready | P1 | Medium |
| TASK-100 | Jordan QA: full quote-to-contract flow test | ready | P1 | Medium |

## Execution Order

```
Phase 1 (Backend wiring — unblocks everything):
  TASK-085 (auth) → TASK-086 (GraphQL resolvers) →
  TASK-087 (createFromQuote) → TASK-088 (renewalCheck) →
  TASK-089 (BullMQ job)

Phase 2 (Frontend — depends on GraphQL resolvers):
  TASK-091 (Apollo migration) → TASK-092 (navigation) →
  TASK-093 (quote builder) → TASK-094 (renewal dashboard) →
  TASK-095 (contract detail)

Phase 3 (Testing — depends on wired services):
  TASK-097 (edge cases) + TASK-098 (cache fix) + TASK-099 (DTOs)
  → TASK-096 (integration tests) → TASK-100 (Jordan QA)
```

## Decisions Log

- 2026-04-12: ADR-004 adopted — CPQ uses custom objects via metadata API, not workspace entities
- 2026-04-12: Business logic layer complete and tested (60+ tests, production-grade pricing engine)
- 2026-04-12: Remaining work requires running Twenty dev environment for platform integration
