# Active Projects

## PRJ-005 — CPQ Pipeline Intelligence & Forecasting
**Status:** Complete
**Completed:** 2026-04-19

### Delivered
- Pipeline Risk Flags UI (TASK-101)
- Change Feed UI (TASK-102)
- Subscription Health Dashboard (TASK-103)
- Revenue Waterfall Chart (TASK-104)
- RevRec Toggle (TASK-105)
- Pipeline Movement Engine (TASK-106)
- Quarter Progression Engine (TASK-107)
- Projected RevRec Engine (TASK-108)
- Multi-Method Forecast (TASK-109)
- Deal Scoring Engine (TASK-110)
- Forecast Snapshot Engine (TASK-111)
- Mobile Responsive CPQ (TASK-112)
- Salesforce Connector (TASK-113)
- Auto-Sync Engine (TASK-114)
- Deal Score Badge UI (TASK-115)
- Integration Tests — CpqController (TASK-096)
- Backlog documentation (TASK-100)

## PRJ-006 — CPQ Settings & Product Catalog
**Status:** Complete
**Completed:** 2026-04-19

### Delivered
- Fixed SELECT field `position: number` bug — all CPQ SELECT fields now create (50 fields total, up from 39)
- Added missing fields: taxTotal, currency, autoRenew, signedDate, productFamily, sku, region, floorPrice, listPrice, effectiveDate
- Full CPQ Settings page at `/settings/cpq` with setup/teardown controls, data model overview, product catalog import
- PhenoTips 2024 pricing catalog — 28 US (USD) + 14 UK (GBP) products from spreadsheet, importable in one click
- `POST /cpq/seed-catalog` REST endpoint — seeds PriceConfiguration records via TwentyORM
- CPQ link in Settings navigation sidebar (Workspace section)
- `runTeardown`, `seedCatalog` added to `useCpqSetup` hook
- Updated `CpqSetupService` constructor test mock

All backlog files: `project-management/backlog/TASK-101.md` through `TASK-115.md`

## PRJ-007 — CPQ Full Build-Out (Quote-to-Cash)
**Status:** Planning
**Started:** 2026-04-19

### Scope
Full CPQ system: admin configuration screens, user-facing quote builder, pricing engine, approval workflow, document generation, contract lifecycle, renewal automation, billing integration, and analytics.

### Research Complete
- Salesforce CPQ, Zuora, Conga/Apttus, HubSpot CPQ, DealHub best practices compiled
- Full data model reference (all standard CPQ objects and fields) documented
- Pricing waterfall (10-step), approval routing patterns, document generation, integration patterns all documented

### Architecture
- `project-management/cpq-design/CPQ-ARCHITECTURE.md` — comprehensive design doc

### Naming Convention
- All field and object names use descriptive CPQ naming (e.g., `quoteLineItem`, `priceBook`, `discountSchedule`)
- No external brand-specific prefixes (no SBQQ__, no Salesforce-specific naming)
- Uses CPQ best practices from Salesforce et al. as a framework, not as a copy

### Task Breakdown (TASK-116 through TASK-149)

**Foundation (Phase 0 — implement first):**
- TASK-149: Multi-Dimensional Quoting & Per-Year Pricing Grid ← NEW

**Admin Configuration (P0–P2):**
- TASK-116: Global CPQ Settings Screen (includes CPQ role matrix, notification settings)
- TASK-117: Product Catalog Management
- TASK-118: Price Book Configuration (includes Bulk Price Adjustment wizard, effectiveDate/expirationDate)
- TASK-119: Discount Schedule Builder
- TASK-120: Price Rules Engine ← DESCOPED to v2
- TASK-121: Approval Workflow Configuration (includes Step Conditions, SLA enforcement)
- TASK-122: Quote Template Manager (includes Multi-Year Pricing Table section)
- TASK-123: Tax Configuration (includes VAT/reverse charge)
- TASK-124: Bundle & Product Configuration Rules
- TASK-125: CPQ Integration Settings
- TASK-146: Currency & Exchange Rate Management ← NEW
- TASK-147: Contracted Prices (Account-Level Price Overrides) ← NEW

**User Quote Flow (P0–P1):**
- TASK-126: Quote Builder — Create & Manage Quotes
- TASK-127: Product Configurator — Product Selector & Bundles
- TASK-128: Quote Line Editor — Pricing & Discount Controls (multi-dim pricing grid)
- TASK-129: Quote Summary Panel & Totals (multi-year column breakdown)
- TASK-130: Approval Submission & Tracking Flow (SLA enforcement, Slack buttons)
- TASK-131: Quote Document Generation & Delivery
- TASK-132: Quote-to-Contract Conversion
- TASK-133: Contract Management Screen
- TASK-134: Renewal Queue & Renewal Quote
- TASK-135: Contract Amendment Flow
- TASK-145: Quick Quote — Express Lane for Standard Deals ← NEW

**Backend Infrastructure (P0–P1):**
- TASK-136: Pricing Engine — 10-Step Calculation Service (yearly pricing support)
- TASK-137: Approval Engine — Rule Evaluation & Routing
- TASK-138: Quote Document PDF Generation Service (multi-year pricing table)
- TASK-139: Contract Lifecycle Management Service
- TASK-140: Renewal Automation — Scheduled Jobs

**Integrations & Analytics (P1–P2):**
- TASK-141: E-Signature Integration (DocuSign / PandaDoc)
- TASK-142: Billing System Sync (Stripe / Chargebee)
- TASK-143: CPQ Reporting & Analytics Dashboard (USD normalization)
- TASK-144: CPQ Setup Wizard & Data Migration

**Home & Dashboard (P1):**
- TASK-148: CPQ Home Dashboard ← NEW

### Implementation Harness
- `project-management/HARNESS.md` — harness spec and agent roles
- `project-management/TASK-STATUS.md` — live task status tracker

### Total Estimated Effort
~215 developer-days across backend, frontend, and testing (updated with TASK-145–149)
Recommended team: 2 FE + 2 BE + 0.5 QA for ~22 weeks
