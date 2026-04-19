---
title: Edge case tests for CPQ services
id: TASK-097
project: PRJ-004
status: done
priority: P1
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #cpq, #testing]
---

# TASK-097: Edge case tests for CPQ services

## User Stories
- As a developer, I want comprehensive edge case test coverage for CPQ services so that regressions are caught early

## Outcomes
Co-located `.spec.ts` / `.test.ts` files in `src/lib/cpq/` with edge cases covering:
- Zero quantity inputs
- Negative prices
- NaN inputs
- Empty tier arrays
- Null/undefined fields
- Currency conversion edge cases
- Zero-duration proration

## Success Metrics
- [ ] All CPQ service functions have edge case coverage
- [ ] All tests pass via `npx vitest run`
- [ ] No TypeScript errors

## Implementation Plan
Add edge case test blocks to existing test files:
- `src/lib/cpq/pricing-engine.test.ts` — zero qty, NaN inputs, negative prices, zero-duration proration
- `src/lib/cpq/tier-utils.test.ts` — empty tier arrays, NaN quantities, null upper bounds
- `src/lib/cpq/quote-to-contract.test.ts` — null/undefined fields, zero grandTotal, zero-duration terms
- `src/lib/cpq/amendment-flow.test.ts` — zero-duration contract, empty changes array

## Files to Change
- `src/lib/cpq/pricing-engine.test.ts` — add edge case describe blocks
- `src/lib/cpq/tier-utils.test.ts` — add edge case describe blocks
- `src/lib/cpq/quote-to-contract.test.ts` — add edge case describe blocks
- `src/lib/cpq/amendment-flow.test.ts` — add edge case describe blocks

## Status Log
- 2026-04-18: Created
- 2026-04-18: Started — adding edge case coverage to all CPQ test files
- 2026-04-18: Completed — added 101 edge case tests across pricing-engine, tier-utils, quote-to-contract, and amendment-flow. All 330 tests pass, zero type errors.

## Takeaways
- The `PricingEngine` clamps negative prices to zero via `totalRule`, so negative discount amounts that overshoot work as expected.
- `calculateVolumePrice` returns base price when no tier matches (quantity below minimum tier) — this is the correct fallback but is easy to miss.
- `buildAmendmentQuote` with `effectiveDate = contractEndDate` correctly returns `daysRemaining = 0` and `totalProratedDelta = '0'`.
- Zero-quantity edge cases in amendment line items produce zero deltas, which is correct financial behaviour.
- Empty tier arrays in discount schedules don't throw — functions return zero gracefully.
