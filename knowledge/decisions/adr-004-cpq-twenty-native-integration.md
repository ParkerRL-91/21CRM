---
title: "ADR-004: CPQ Integration via Twenty's Native Custom Object System"
tags: [#decision, #architecture, #cpq, #twenty]
created: 2026-04-12
updated: 2026-04-12
---

# ADR-004: CPQ Integration via Twenty's Native Custom Object System

## Status

Accepted (2026-04-12). Supersedes the abandoned standalone approach.

## Context

The first CPQ implementation attempt (v2.0) built a standalone system with Drizzle ORM schemas, Next.js API routes, and React pages — completely disconnected from Twenty CRM. This was wrong. Twenty has a metadata-driven architecture where objects, fields, relations, views, and GraphQL are all auto-generated from metadata. Building outside this system means none of it works.

## Decision

### Use Twenty's Custom Object API, not workspace entities

**Decision:** Create CPQ objects (Quote, QuoteLineItem, Contract, ContractSubscription, etc.) as **custom objects** via Twenty's `createOneObject()` / `createOneField()` GraphQL mutations. Do NOT create `.workspace-entity.ts` files in the standard objects folder.

**Rationale:**
- Custom objects get automatic: table creation, GraphQL CRUD, record index pages, record detail pages, navigation menu items, command palette entries, search, views, and field configuration UI
- Standard objects require registration in `twenty-shared` with universal identifiers — this is for Twenty's core team, not extensions
- Custom objects are the intended extension point for applications built on Twenty

### What's automatic (free from metadata)

| Feature | How |
|---------|-----|
| Database tables | Created by `createOneObject()` in workspace schema |
| GraphQL CRUD | Auto-generated from object + field metadata |
| Record list page | `RecordIndexPage.tsx` renders any object generically |
| Record detail page | `RecordShowPage.tsx` renders any object generically |
| Sidebar navigation | Auto-created `NavigationMenuItem` |
| Command palette | Auto-created `CommandMenuItem` |
| Search | `searchVector` field auto-indexed |
| Views (table, kanban) | Default "All {objects}" view auto-created |
| Field configuration | Available in Settings > Data Model |
| Relations | Created via `FieldMetadataType.RELATION` |
| Filtering & sorting | Automatic from field types |

### What we build custom

| Feature | Why custom |
|---------|-----------|
| CPQ setup wizard | Bootstrap script that creates all objects + fields + relations at once |
| Pricing engine | Business logic (10-step waterfall) — no metadata equivalent |
| Renewal automation | Daily cron job — business logic |
| Risk scoring | Business logic — no metadata equivalent |
| Quote builder UI | Custom page for line item editing with pricing engine integration |
| Quote PDF generation | Custom render pipeline |
| Tier editor component | Custom pricing configuration UI |

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Twenty CRM Platform                    │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Metadata Layer (automatic)                  │ │
│  │  Quote, Contract, Subscription, Amendment objects     │ │
│  │  → Tables, GraphQL, Record pages, Navigation, Search │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ↕                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           CPQ Module (custom NestJS)                   │ │
│  │  CpqPricingService — price waterfall engine           │ │
│  │  CpqRenewalService — daily job + quote generation     │ │
│  │  CpqContractService — conversion + proration          │ │
│  │  CpqRiskService — at-risk scoring                     │ │
│  │  CpqSetupService — bootstraps objects + fields        │ │
│  └──────────────────────────────────────────────────────┘ │
│                          ↕                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Custom Frontend (React)                      │ │
│  │  CPQ Settings page (pricing wizard, tier editor)      │ │
│  │  Quote builder (line items + pricing engine)          │ │
│  │  Renewal dashboard (risk scores, pipeline)            │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### CPQ Object Model (custom objects)

**6 custom objects** created via metadata API:

1. **Quote** — linked to Company + Opportunity
   - Fields: quoteNumber, status (SELECT), type (SELECT), versionNumber, subscriptionTermMonths, startDate, endDate, expirationDate, subtotal (CURRENCY), discountTotal, taxTotal, grandTotal, paymentTerms, acceptanceMethod, rejectionReason, notes
   
2. **QuoteLineItem** — linked to Quote (MANY_TO_ONE)
   - Fields: productName, quantity (NUMBER), listPrice (CURRENCY), netUnitPrice (CURRENCY), netTotal (CURRENCY), discountPercent (NUMBER), billingType (SELECT), sortOrder (NUMBER), pricingAudit (RAW_JSON)

3. **Contract** — linked to Company + Opportunity + Quote
   - Fields: contractNumber, status (SELECT), startDate, endDate, totalValue (CURRENCY), renewalStatus (SELECT), renewalPricingMethod (SELECT), notes

4. **ContractSubscription** — linked to Contract (MANY_TO_ONE)
   - Fields: productName, quantity (NUMBER), unitPrice (CURRENCY), annualValue (CURRENCY), billingFrequency (SELECT), status (SELECT), chargeType (SELECT), startDate, endDate

5. **ContractAmendment** — linked to Contract (MANY_TO_ONE)
   - Fields: amendmentNumber (NUMBER), amendmentType (SELECT), description, deltaValue (CURRENCY), effectiveDate, changes (RAW_JSON)

6. **PriceConfiguration** — standalone config object
   - Fields: name, type (SELECT: tiered/volume/term), tiers (RAW_JSON), productFamily, isActive (BOOLEAN)

### Setup Flow

A `CpqSetupService` (NestJS) bootstraps all 6 objects with their fields and relations in a single transaction. This runs:
- Automatically on first access to CPQ settings page
- Manually via `/api/cpq/setup` endpoint
- Idempotently — skips objects that already exist

### Cleanup: What to remove

The old standalone code (`src/lib/db/cpq-schema.ts`, `src/lib/cpq/`, `src/app/`, `drizzle/`, `package.json` deps) should be archived or deleted. The business logic (pricing engine, risk scoring, proration) is ported into the NestJS services that live inside Twenty's module system.

## Consequences

- CPQ objects look and feel native in Twenty's UI — same record pages, same navigation, same search
- No custom database migrations needed — metadata system handles table creation
- GraphQL CRUD is free — no resolvers to write for basic operations
- Custom UI only needed for CPQ-specific workflows (quote builder, pricing wizard)
- Business logic lives in NestJS services, queried via Twenty's workspace ORM
- Setup is a one-time bootstrap that creates all objects/fields/relations

## Related

- [[adr-003-contract-management-architecture]] — original architecture (now superseded for integration approach)
- [[contract-management]] — feature documentation
- [[guided-pricing-ux]] — UX patterns for pricing setup
