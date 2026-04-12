---
title: "Full CPQ: Quote-to-Cash Platform"
id: PRJ-003
status: active
created: 2026-04-12
updated: 2026-04-12
tags: [#project, #cpq, #quotes, #pricing, #subscriptions, #reporting]
---

# PRJ-003: Full CPQ — Quote-to-Cash Platform

## Objective

Build a complete Configure, Price, Quote (CPQ) system into 21CRM covering the full quote-to-cash lifecycle: product catalog, price books, quote builder, pricing engine with tiered/volume discounts, approval workflows, PDF generation, quote delivery/acceptance, quote-to-contract conversion, subscription tracking, and reporting/analytics. Combined with PRJ-002 (contract management & renewal), this delivers a self-hosted alternative to Salesforce CPQ.

## Architecture Overview

The CPQ system follows the Salesforce CPQ data model pattern adapted for PostgreSQL/Drizzle:

```
Product Catalog (Epic 1)
  └→ Price Books & Entries
       └→ Quote Builder (Epic 2)
            └→ Line Items with Pricing Engine (Epic 3)
                 └→ Approval Workflow (Epic 4)
                      └→ PDF Generation (Epic 5)
                           └→ Delivery & Acceptance (Epic 6)
                                └→ Contract Conversion (Epic 7)
                                     └→ Contract Management (PRJ-002/Epic 8) ✓
                                          └→ Subscription Tracking (Epic 9)
                                               └→ Reporting & Analytics (Epic 10)
```

## Epics & Tasks

### Epic 1: Product & Price Book Management (6 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-049 | Product catalog schema & API | ready | P0 |
| TASK-050 | Price book schema & API | ready | P0 |
| TASK-051 | Discount schedule schema & API (tiered/volume/term) | ready | P0 |
| TASK-052 | Product catalog management UI | ready | P1 |
| TASK-053 | Price book management UI | ready | P1 |
| TASK-054 | Product bundle support | ready | P2 |

### Epic 2: Quote Creation & Configuration (5 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-055 | Quote & quote line item schema | ready | P0 |
| TASK-056 | Quote CRUD API with line item management | ready | P0 |
| TASK-057 | Quote builder UI (add products, groups, real-time totals) | ready | P0 |
| TASK-058 | Quote cloning & versioning | ready | P1 |
| TASK-059 | Quote expiration management (daily job) | ready | P1 |

### Epic 3: Pricing Engine (4 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-060 | Price waterfall engine (10-step pipeline) | ready | P0 |
| TASK-061 | Tiered & volume discount calculation | ready | P0 |
| TASK-062 | Term-based discount & proration | ready | P0 |
| TASK-063 | Pricing audit trail (per-line JSONB log) | ready | P1 |

### Epic 4: Quote Approval Workflows (4 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-064 | Approval rules schema & engine | ready | P0 |
| TASK-065 | Approval submission & routing API | ready | P0 |
| TASK-066 | Approval UI (submit, preview path, approve/reject) | ready | P1 |
| TASK-067 | Smart approvals (skip unchanged steps on resubmit) | ready | P2 |

### Epic 5: PDF Quote Generation (3 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-068 | PDF generation engine (@react-pdf/renderer) | ready | P0 |
| TASK-069 | Quote template configuration & management | ready | P1 |
| TASK-070 | PDF storage & version history | ready | P1 |

### Epic 6: Quote Delivery & Acceptance (3 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-071 | Quote status machine (presented/accepted/rejected) | ready | P0 |
| TASK-072 | Quote delivery UI (email action, status tracking) | ready | P1 |
| TASK-073 | Rejection tracking with reason codes | ready | P1 |

### Epic 7: Quote-to-Contract Conversion (3 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-074 | Contract creation from accepted quote | ready | P0 |
| TASK-075 | Amendment quote flow (mid-term changes) | ready | P0 |
| TASK-076 | Invoice record generation on contract creation | ready | P2 |

### Epic 9: Subscription Tracking (4 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-077 | Subscription lifecycle state machine & API | ready | P0 |
| TASK-078 | Account subscriptions view (ARR/MRR per account) | ready | P0 |
| TASK-079 | Subscription state change audit log | ready | P1 |
| TASK-080 | Global subscription dashboard (ARR metrics, expiring subs) | ready | P1 |

### Epic 10: CPQ Reporting & Analytics (4 tasks)
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-081 | Quote activity dashboard (created/sent/accepted/rejected) | ready | P1 |
| TASK-082 | Discount analysis report (avg discount by product/rep/segment) | ready | P1 |
| TASK-083 | Renewal forecast report (upcoming renewals, likelihood) | ready | P1 |
| TASK-084 | ARR waterfall report (beginning/new/expansion/contraction/churn/ending) | ready | P1 |

## Execution Order

**Phase A — Data Foundation (Epics 1, 2, 3):**
TASK-049 → 050 → 051 → 055 → 056 → 060 → 061 → 062 → 063 → 052 → 053 → 057

**Phase B — Workflow (Epics 4, 5, 6):**
TASK-064 → 065 → 066 → 068 → 069 → 070 → 071 → 072 → 073

**Phase C — Conversion Bridge (Epic 7):**
TASK-074 → 075 → 076

**Phase D — Execute PRJ-002 (Epic 8):**
TASK-028 → 048 → 029 → 047 → 030 → 031 → 032 → 033 → 037 → 034 → 035 → 036 → 038 → 039 → 042 → 040 → 041 → 043 → 044 → 045 → 046

**Phase E — Subscriptions & Reporting (Epics 9, 10):**
TASK-077 → 078 → 079 → 080 → 081 → 082 → 083 → 084

**Phase F — Polish:**
TASK-054, 058, 059, 067

## Decisions Log

- 2026-04-12: Pricing engine uses pipeline/chain-of-responsibility pattern (not rules engine) per Salesforce CPQ best practice
- 2026-04-12: All prices snapshotted onto quote line items at creation — never reference price book at render time
- 2026-04-12: Quote type field (new/amendment/renewal) designed from day one — not retrofitted
- 2026-04-12: Bundles modeled as parent-child line items via self-referential parent_line_id
- 2026-04-12: PDF generation via @react-pdf/renderer (React components → PDF server-side)
- 2026-04-12: Monetary arithmetic: Decimal.js in TypeScript, NUMERIC(12,2) in PostgreSQL
- 2026-04-12: Gap numbering (10, 20, 30) for line item sort_order to allow insertions
