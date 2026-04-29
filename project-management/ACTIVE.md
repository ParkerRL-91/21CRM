# Active Projects

## PRJ-006 — CPQ Production Polish
**Status:** Active
**Started:** 2026-04-29
**Objective:** Transform CPQ from developer prototype to production-ready RevOps tool
**Success Metric:** Dana Chen would demo this to her CRO
**Review:** `/home/user/21CRM/CPQ-REVIEW-DANA-CHEN.md`
**Project File:** `project-management/projects/PRJ-006-cpq-production-polish.md`

### Tier 1 — Blockers (P0) — 18 days
"I can't use this without these."

| Task | Title | Effort | Status | Dependencies |
|------|-------|--------|--------|--------------|
| TASK-116 | Product catalog picker with search/autocomplete | 3 days | ready | — |
| TASK-117 | Template gallery navigation (fix stub handler) | 1 day | ready | — |
| TASK-118 | Approval rules admin UI (no-code rule builder) | 5 days | ready | — |
| TASK-119 | PDF generation from real quotes | 3 days | ready | TASK-116 |
| TASK-120 | Approval status visibility on quotes | 3 days | ready | TASK-118 |
| TASK-121 | Success/error feedback on every action (toast system) | 2 days | ready | — |
| TASK-122 | Confirmation dialogs for destructive actions | 1 day | ready | TASK-121 |

### Tier 2 — Confidence Builders (P1) — 13 days
"This would make me trust it."

| Task | Title | Effort | Status | Dependencies |
|------|-------|--------|--------|--------------|
| TASK-123 | Replace emoji icons with Twenty icon library | 1 day | ready | — |
| TASK-124 | Loading states with contextual messages | 1 day | ready | — |
| TASK-125 | Audit trail visible on every quote | 3 days | ready | — |
| TASK-126 | Discount guardrails with visual feedback | 2 days | ready | TASK-118 |
| TASK-127 | Quote versioning (v1 -> v2 comparison) | 3 days | ready | TASK-125 |
| TASK-128 | CSV export on renewal dashboard | 1 day | ready | — |
| TASK-129 | Form validation (prevent invalid quotes) | 2 days | ready | TASK-116 |

### Tier 3 — Differentiators (P2) — 15 days
"This would make me switch from Salesforce CPQ."

| Task | Title | Effort | Status | Dependencies |
|------|-------|--------|--------|--------------|
| TASK-130 | Mobile responsive (all CPQ pages) | 5 days | ready | TASK-123 |
| TASK-131 | Migrate fetch() to Apollo Client | 2 days | ready | — |
| TASK-132 | Register CPQ pages in Twenty navigation | 1 day | ready | — |
| TASK-133 | Billing type toggle (recurring vs one-time) | 1 day | ready | TASK-116 |
| TASK-134 | Line item grouping UI (sections) | 3 days | ready | TASK-116 |
| TASK-135 | Quote duplication ("Clone this quote") | 1 day | ready | TASK-127 |
| TASK-136 | Renewal dashboard actions (outreach, mark contacted) | 2 days | ready | TASK-128 |
| TASK-137 | Unsaved changes warning on editors | 1 day | ready | — |

All backlog files: `project-management/backlog/TASK-116.md` through `TASK-137.md`

---

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

All backlog files: `project-management/backlog/TASK-101.md` through `TASK-115.md`
