---
id: PRJ-006
title: CPQ Production Polish
status: active
created: 2026-04-29
updated: 2026-04-29
owner: RevOps Team
tags: [cpq, usability, production-readiness, dana-chen-review]
---

# PRJ-006 — CPQ Production Polish

## Objective

Transform the CPQ module from a developer prototype into a production-ready RevOps tool that a VP of Revenue Operations would confidently demo to their CRO.

## Background

A comprehensive persona-based review by "Dana Chen" (VP Revenue Operations at a 200-person B2B SaaS company, $18M ARR) identified 22 specific usability gaps across the CPQ frontend. The review concluded that the CPQ has a "9/10 engine wrapped in a 3/10 interface" — the business logic is enterprise-grade but the user experience is pre-alpha.

Full review: `/home/user/21CRM/CPQ-REVIEW-DANA-CHEN.md`

Key findings:
- Template gallery click handlers are stubs (console.log only)
- No product catalog picker in quote builder — just a raw text input
- No approval rules admin UI — requires JSON via API
- No PDF generation from real quotes
- No success/error feedback on any action
- Emoji icons throughout instead of proper icon library
- fetch() calls instead of Apollo Client (breaks caching, auth patterns)
- CPQ pages not registered in Twenty navigation
- No mobile responsiveness on any CPQ page

## Success Metric

> "Dana Chen would demo this to her CRO."

Specifically: a VP RevOps can enable CPQ, configure discount rules without engineering help, build a quote with product search in under 5 minutes, submit it for approval with visible status tracking, generate a PDF, and export renewal data to a board deck — all from a phone on Monday morning.

## Personas

- **Dana (VP RevOps)** — evaluates and buys tools, preps board decks
- **Raj (Deal Desk Specialist)** — builds quotes daily, configures rules
- **Alex (Sales Rep)** — needs to quote fast, hates admin work
- **Jordan (CRM Admin)** — manages the system, trains users

## Tiers

### Tier 1 — Blockers (P0) — 18 days
"I can't use this without these."

| Task | Title | Effort | Dependencies |
|------|-------|--------|--------------|
| TASK-116 | Product catalog picker with search/autocomplete | 3 days | — |
| TASK-117 | Template gallery navigation (fix stub handler) | 1 day | — |
| TASK-118 | Approval rules admin UI (no-code rule builder) | 5 days | — |
| TASK-119 | PDF generation from real quotes | 3 days | TASK-116 |
| TASK-120 | Approval status visibility on quotes | 3 days | TASK-118 |
| TASK-121 | Success/error feedback on every action (toast system) | 2 days | — |
| TASK-122 | Confirmation dialogs for destructive actions | 1 day | TASK-121 |

### Tier 2 — Confidence Builders (P1) — 13 days
"This would make me trust it."

| Task | Title | Effort | Dependencies |
|------|-------|--------|--------------|
| TASK-123 | Replace emoji icons with Twenty icon library | 1 day | — |
| TASK-124 | Loading states with contextual messages | 1 day | — |
| TASK-125 | Audit trail visible on every quote | 3 days | — |
| TASK-126 | Discount guardrails with visual feedback | 2 days | TASK-118 |
| TASK-127 | Quote versioning (v1 -> v2 comparison) | 3 days | TASK-125 |
| TASK-128 | CSV export on renewal dashboard | 1 day | — |
| TASK-129 | Form validation (prevent invalid quotes) | 2 days | TASK-116 |

### Tier 3 — Differentiators (P2) — 15 days
"This would make me switch from Salesforce CPQ."

| Task | Title | Effort | Dependencies |
|------|-------|--------|--------------|
| TASK-130 | Mobile responsive (all CPQ pages) | 5 days | TASK-123 |
| TASK-131 | Migrate fetch() to Apollo Client | 2 days | — |
| TASK-132 | Register CPQ pages in Twenty navigation | 1 day | — |
| TASK-133 | Billing type toggle (recurring vs one-time) | 1 day | TASK-116 |
| TASK-134 | Line item grouping UI (sections) | 3 days | TASK-116 |
| TASK-135 | Quote duplication ("Clone this quote") | 1 day | TASK-127 |
| TASK-136 | Renewal dashboard actions (outreach, mark contacted) | 2 days | TASK-128 |
| TASK-137 | Unsaved changes warning on editors | 1 day | — |

## Dependencies Graph

```
TASK-116 (Product Picker) ──> TASK-119 (PDF Generation)
                           ──> TASK-129 (Form Validation)
                           ──> TASK-133 (Billing Toggle)
                           ──> TASK-134 (Line Item Grouping)

TASK-118 (Approval Rules) ──> TASK-120 (Approval Visibility)
                           ──> TASK-126 (Discount Guardrails)

TASK-121 (Toast System)   ──> TASK-122 (Confirmation Dialogs)

TASK-123 (Icon Library)   ──> TASK-130 (Mobile Responsive)

TASK-125 (Audit Trail)    ──> TASK-127 (Quote Versioning)

TASK-127 (Versioning)     ──> TASK-135 (Quote Duplication)

TASK-128 (CSV Export)     ──> TASK-136 (Renewal Actions)
```

## Timeline — 46 days

| Phase | Weeks | Tasks | Milestone |
|-------|-------|-------|-----------|
| Sprint 1 | Days 1-10 | TASK-116, TASK-117, TASK-121, TASK-122, TASK-123, TASK-124 | Core interactions work, visual polish started |
| Sprint 2 | Days 11-22 | TASK-118, TASK-119, TASK-120, TASK-125, TASK-128, TASK-129 | Approvals, PDF, audit trail, validation |
| Sprint 3 | Days 23-34 | TASK-126, TASK-127, TASK-130, TASK-131, TASK-132 | Trust features, mobile, architecture |
| Sprint 4 | Days 35-46 | TASK-133, TASK-134, TASK-135, TASK-136, TASK-137 | Differentiators, final polish |

## Risk Factors

- **Twenty icon library scope**: Need to verify all required icons exist in `twenty-ui`; may need to add new ones.
- **Apollo Client migration**: The fetch()-to-Apollo migration (TASK-131) touches every CPQ hook; schedule early to unblock caching benefits.
- **PDF generation**: May need a server-side rendering library (Puppeteer, React-PDF); evaluate before committing to approach.
- **Mobile responsive**: Five CPQ pages with complex tables; may need dedicated mobile layouts rather than just media queries.

## Key Source Files

### Frontend Components
- `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — quote builder page
- `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx` — CPQ setup/settings page
- `packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx` — template gallery (broken click handlers)
- `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx` — pricing calculator
- `packages/twenty-front/src/modules/cpq/components/CpqHealthDashboard.tsx` — health dashboard
- `packages/twenty-front/src/pages/settings/cpq/SettingsCpq.tsx` — settings route wrapper

### Hooks
- `packages/twenty-front/src/modules/cpq/hooks/use-cpq-setup.ts` — setup hook (uses fetch())
- `packages/twenty-front/src/modules/cpq/hooks/use-cpq-pricing.ts` — pricing hook (uses fetch())

### Constants
- `packages/twenty-front/src/modules/cpq/constants/cpq-pricing-templates.ts` — template definitions
- `packages/twenty-front/src/modules/cpq/constants/cpq-phenotips-catalog.ts` — product catalog data

### Backend
- `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — REST controller
- `packages/twenty-server/src/modules/cpq/services/cpq-pricing.service.ts` — pricing engine
- `packages/twenty-server/src/modules/cpq/services/cpq-renewal.service.ts` — renewal engine
- `packages/twenty-server/src/modules/cpq/services/cpq-risk.service.ts` — risk scoring
- `packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` — setup/teardown

### Framework Patterns (reference for new code)
- `packages/twenty-front/src/modules/ui/feedback/snack-bar-manager/hooks/useSnackBar.ts` — toast/snackbar system
- `packages/twenty-front/src/modules/ui/layout/modal/components/ConfirmationModal.tsx` — confirmation dialog
- `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx` — route registration pattern
- `packages/twenty-front/src/modules/app/components/AppRouter.tsx` — top-level routing
