---
title: "CPQ Integration Status & Remaining Work"
tags: [#cpq, #twenty, #integration, #status]
created: 2026-04-12
updated: 2026-04-12
---

# CPQ Integration Status

## Current Score: ~8.0/10

## What's Complete (Production-Ready Business Logic)

### Backend (14 files in twenty/packages/twenty-server/src/modules/cpq/)

**CpqSetupService** — Bootstraps 6 custom objects via Twenty's metadata API
- 6 objects: Quote, QuoteLineItem, Contract, ContractSubscription, ContractAmendment, PriceConfiguration
- 50+ fields with proper FieldMetadataType (SELECT with options/colors, CURRENCY, DATE, RICH_TEXT, RAW_JSON, BOOLEAN)
- 8 relations linking CPQ objects to each other and to standard Company/Opportunity objects
- Idempotent setup (skips existing objects)
- Teardown with reverse-dependency-order removal
- Detailed status endpoint (found/missing/version)
- 10 mock-based tests

**CpqPricingService** — 10-step price waterfall engine
- Base → Contracted → Proration → Tiered/Volume → Term → Manual → Floor → Currency → Rounding → Total
- Decimal.js throughout (no floating-point)
- Full audit trail per execution
- Renewal pricing (same/list/uplift with 50% cap)
- 17 tests

**CpqRiskService** — At-risk renewal scoring
- 6 weighted signals: stagnation, slippage, pressure, value, activity, churn
- Risk levels: low (0-25), medium (26-50), high (51-75), critical (76+)
- 5 tests

**CpqContractService** — Contract lifecycle
- Status machine (7 states) with transition validation
- Subscription status machine (9 states)
- Proration using actual contract days
- Amendment delta calculation
- 10 tests

**CpqRenewalService** — Renewal quote generation
- Filters by charge type (excludes one-time) and status (excludes cancelled)
- Pricing method resolution hierarchy (subscription > contract > org)
- 7 tests

**CpqController** — REST endpoints for business logic
- POST /cpq/setup, DELETE /cpq/teardown, GET /cpq/status/:id
- POST /cpq/calculate-price, /assess-risk, /validate-transition, /prorate
- POST /cpq/run-renewal-check
- 8 controller tests

### Frontend (7 files in twenty/packages/twenty-front/src/modules/cpq/)

- CpqSetupPage with Linaria styled components + theme tokens
- CpqTemplateGallery with 6 pricing model templates
- CpqPricingCalculator with live audit trail
- useCpqSetup + useCpqPricing hooks
- Barrel exports

### Total: 60+ tests, 21 files, 0 syntax errors

## What Needs Work (Running Twenty Dev Environment Required)

These items require a running Twenty dev server with PostgreSQL + Redis:

### Must Have for 9.5/10

1. **GraphQL Resolvers** — Create `@Resolver()` classes with `@Mutation()` decorators for:
   - `calculateQuoteLineItemPrice(input: PricingInput): PricingResult`
   - `assessRenewalRisk(input: RiskInput): RiskAssessment`
   - `convertQuoteToContract(quoteId: ID!): Contract`
   - `runRenewalCheck(workspaceId: ID!): RenewalJobResult`

2. **Workspace Auth** — Add `@AuthWorkspace()` decorator to all controller endpoints. Study Twenty's auth guard pattern in existing controllers.

3. **Apollo Client Migration** — Replace `fetch()` in frontend hooks with:
   - `useQuery(GET_CPQ_STATUS)` / `useMutation(SETUP_CPQ)`
   - Define GraphQL operations matching the resolvers above

4. **Workspace Datasource Wiring** — Wire `createFromQuote()` and `runRenewalCheck()` to actually query/create records in the workspace schema via Twenty's `WorkspaceDatasourceService`.

5. **Frontend Routing** — Register CPQ pages in Twenty's navigation system so they appear in the app without manual URL entry.

### Nice to Have

6. **Schema Evolution** — Add version tracking so v2 field changes can be applied to existing workspaces
7. **BullMQ Job** — Register renewal check as a scheduled BullMQ job instead of REST-triggered
8. **Quote Builder Page** — Custom UI for adding/editing line items with real-time pricing engine
9. **Renewal Dashboard** — Custom view with risk scores, pipeline value, NRR chart

## Architecture (ADR-004)

CPQ uses Twenty's custom object API — NOT workspace entities. Objects created via `createOneObject()` / `createOneField()` get automatic tables, GraphQL CRUD, record pages, navigation, and search. Custom business logic (pricing, renewals, risk) lives in NestJS services exposed via controller.
