---
title: Cache object list in CPQ setup service to fix N+1
id: TASK-098
project: PRJ-004
status: done
priority: P1
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #cpq, #performance]
---

# TASK-098: Cache object list in setup service to fix N+1

## User Stories
- As a developer, I want the CPQ setup service to fetch shared lookup data once per request so that we avoid N+1 queries

## Outcomes
A `CpqSetupService` class in `src/lib/cpq/cpq-setup.ts` that:
- Fetches product/price book lookup data once at setup start
- Passes the cached result to all sub-calls that need it
- Uses in-memory caching within the request lifecycle only

## Success Metrics
- [ ] `CpqSetupService.setupCpq()` calls lookup helper only once regardless of line item count
- [ ] All tests pass

## Implementation Plan
1. Create `src/lib/cpq/cpq-setup.ts` with `CpqSetupService` class
2. The service accepts a `lookupFn` injectable for testability
3. `setupCpq()` fetches the object list once, passes to all per-item processors
4. Write `src/lib/cpq/cpq-setup.test.ts` verifying the lookup is called exactly once

## Files to Change
- `src/lib/cpq/cpq-setup.ts` — new file, CpqSetupService implementation
- `src/lib/cpq/cpq-setup.test.ts` — new file, tests verifying N+1 is fixed

## Status Log
- 2026-04-18: Created
- 2026-04-18: Started — implementing CpqSetupService with cached object list
- 2026-04-18: Completed — CpqSetupService created. lookupFn called exactly once regardless of line item count. 18 tests pass covering N+1 prevention, pricing accuracy, discounts, and edge cases.

## Takeaways
- The injectable `lookupFn` pattern makes the service trivially testable via `vi.fn()` — no mocking of imports needed.
- `vi.fn().mockResolvedValue(objectList)` combined with `expect(lookupFn).toHaveBeenCalledTimes(1)` is a clean way to assert N+1 prevention.
- The service falls back from price book entry → defaultPrice → 0 in that order. Important for products without explicit price book entries.
- Negative quantities are clamped to 0 in `resolveLineItem` to avoid negative totals.
- lookupFn rejections propagate naturally through async/await without special handling.
