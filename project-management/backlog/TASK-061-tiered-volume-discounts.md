---
title: "Tiered & volume discount calculation"
id: TASK-061
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pricing, #discounts, #engine]
---

# TASK-061: Tiered & volume discount calculation

## User Stories
- As a Sales Rep, I want the system to automatically calculate tiered pricing based on quantity so I don't manually look up pricing tables.

## Outcomes
Two discount calculation functions: tiered (slab) where different rates apply to different portions, and volume (all-units) where all units get the rate of the highest applicable tier. Both integrate as steps in the pricing engine pipeline.

## Success Metrics
- [ ] `calculateTieredPrice(quantity, tiers)` — slab pricing
- [ ] `calculateVolumePrice(quantity, tiers)` — all-units pricing
- [ ] Both functions use Decimal.js
- [ ] Audit trail records which tier(s) applied
- [ ] Edge cases: quantity exactly on tier boundary, single-tier, zero quantity
- [ ] Tests for both methods with multi-tier scenarios

## Files to Change
- `src/lib/cpq/discount-calculator.ts` — NEW
- `src/lib/cpq/discount-calculator.test.ts` — NEW
- `src/lib/cpq/pricing-engine.ts` — MODIFY: Wire in as pipeline step
