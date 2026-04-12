---
title: "Term-based discount & proration"
id: TASK-062
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pricing, #proration]
---

# TASK-062: Term-based discount & proration

## User Stories
- As a Sales Manager, I want term-based discounts (5% off 2-year, 10% off 3-year) so multi-year deals are incentivized.
- As a Sales Rep, I want subscription pricing automatically prorated based on the quote term.

## Outcomes
Term discount schedules and subscription proration logic. Proration multiplier = effective_term / product_base_term. Term discounts stack with volume discounts per waterfall order.

## Success Metrics
- [ ] Term discount lookup from discount_schedules where type='term'
- [ ] Proration: subscription price × (quote_term / product_base_term)
- [ ] Term discounts and proration both integrated as pipeline steps
- [ ] Proration handles: same term (1x), longer term (>1x), shorter term (<1x)
- [ ] Tests for proration edge cases and term discount stacking

## Files to Change
- `src/lib/cpq/term-pricing.ts` — NEW
- `src/lib/cpq/term-pricing.test.ts` — NEW
- `src/lib/cpq/pricing-engine.ts` — MODIFY: Wire in proration + term discount steps
