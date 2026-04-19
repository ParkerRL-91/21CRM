---
title: Add validated DTOs for CPQ module
id: TASK-099
project: PRJ-004
status: done
priority: P1
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #cpq, #validation]
---

# TASK-099: Add validated DTOs for CPQ module

## User Stories
- As a developer, I want strongly-typed, validated DTO objects for the CPQ module so that API boundaries are explicit and validated

## Outcomes
A `src/lib/cpq/dtos/` directory with Zod-validated DTO schemas and inferred TypeScript types for all CPQ domain objects. The project uses Zod (already installed) rather than class-validator (not in deps).

## Success Metrics
- [ ] All CPQ DTOs exist in `src/lib/cpq/dtos/`
- [ ] Each DTO file has named exports only
- [ ] All tests pass

## Implementation Plan
1. Create `src/lib/cpq/dtos/` directory
2. Create `product.dto.ts`, `price-book.dto.ts`, `quote.dto.ts`, `discount.dto.ts`, `approval.dto.ts`
3. Each file re-exports the relevant Zod schemas and inferred types from `validation.ts` plus any additional DTOs
4. Create `index.ts` barrel export
5. Write `src/lib/cpq/dtos/dtos.test.ts` with validation tests

## Files to Change
- `src/lib/cpq/dtos/product.dto.ts` — new file
- `src/lib/cpq/dtos/price-book.dto.ts` — new file
- `src/lib/cpq/dtos/quote.dto.ts` — new file
- `src/lib/cpq/dtos/discount.dto.ts` — new file
- `src/lib/cpq/dtos/approval.dto.ts` — new file
- `src/lib/cpq/dtos/index.ts` — barrel export
- `src/lib/cpq/dtos/dtos.test.ts` — validation tests

## Status Log
- 2026-04-18: Created
- 2026-04-18: Started — building CPQ DTOs with Zod validation
- 2026-04-18: Completed — 5 DTO files + barrel index + 83-test suite. All 330 tests pass, zero type errors.

## Takeaways
- The task originally called for class-validator decorators, but this project uses Zod (already installed, used throughout). Used Zod instead — consistent with existing patterns in validation.ts.
- Splitting DTOs by domain (product, price-book, quote, discount, approval) keeps files atomic and manageable.
- The `ApprovalConditionsDto` uses `z.record(string, ConditionValue)` to model flexible condition maps — works cleanly for the approval engine.
- Named exports only throughout — no default exports.
- Inferred TypeScript types (via `z.infer<>`) provide full type safety with no duplication.
