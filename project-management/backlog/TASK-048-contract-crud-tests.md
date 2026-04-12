---
title: "Add test coverage for contract CRUD (TASK-028)"
id: TASK-048
project: PRJ-002
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #testing]
---

# TASK-048: Add test coverage for contract CRUD (TASK-028)

## User Stories

- As a **developer**, I want comprehensive tests for contract CRUD business logic so that status transitions, deal-to-contract mapping, and validation are verified.

## Outcomes

Test suite covering the contract service layer: status transition validation, deal-to-contract mapping, contract number generation, subscription creation from line items, and input validation.

## Success Metrics

- [ ] Status transition tests: all valid transitions pass, all invalid transitions rejected
- [ ] Deal-to-contract mapping tests: line item types, billing period parsing, value calculation
- [ ] Contract number generation: uniqueness, format, concurrency safety
- [ ] Input validation: Zod schema rejects invalid payloads
- [ ] Edge cases: deal with no line items, deal with only one-time items, deal with mixed subscription/one-time
- [ ] All tests pass: `npx vitest run`

## Files to Change

- `src/lib/contracts/service.test.ts` — **NEW**: Contract service tests
- `src/lib/contracts/validation.test.ts` — **NEW**: Validation schema tests
- `src/lib/contracts/number-generator.test.ts` — **NEW**: Number generation tests

## Status Log

- 2026-04-12: Created — identified as gap by QA traceability review

## Takeaways

_To be filled during implementation._
