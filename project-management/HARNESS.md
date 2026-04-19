# CPQ Implementation Harness

## Overview

This harness defines the end-to-end process for implementing all CPQ tasks from backlog to production. Every task must pass three gates before closing: **Implementation**, **Code Review**, and **User Acceptance Testing (UAT)**.

The Project Manager (PM) agent reads this file and `TASK-STATUS.md` to coordinate work.

---

## Agent Roles

### 1. Project Manager (PM) Agent
- Reads `TASK-STATUS.md` to determine current state
- Selects next task based on dependency order (see TASK-STATUS.md phase ordering)
- Spawns Implementation Agent in a worktree
- After implementation completes: spawns Code Review Agent
- After code review passes: spawns UAT agents (Sarah Kim and/or Marcus Torres)
- After UAT passes: updates TASK-STATUS.md and selects next task
- Never stops until all tasks reach ✅ Done

**Task selection rules:**
1. Pick the lowest-numbered `⬜ Backlog` task whose phase dependencies are met
2. All tasks in Phase N must be ✅ Done before starting Phase N+1
3. Within a phase, multiple tasks can be implemented in parallel (separate worktrees)
4. TASK-120 is permanently skipped (descoped to v2)

### 2. Implementation Agent
- Runs in an isolated git worktree
- **Step 1**: Read the full task spec from `project-management/backlog/TASK-XXX.md`
- **Step 2**: Explore existing code to understand patterns (especially `cpq-setup.service.ts`, `cpq-pricing.service.ts`, existing CPQ modules/components)
- **Step 3**: Compare task requirements with existing implementation — identify gaps and existing coverage
- **Step 4**: Implement ALL required features per the task spec (backend + frontend)
- **Step 5**: Write/update tests for new code
- **Step 6**: Run lint (`npx nx lint:diff-with-main`) and typecheck (`npx nx typecheck`)
- **Step 7**: Fix all lint/type errors before declaring done
- **Step 8**: Commit changes with descriptive message

**Critical implementation rules:**
- Follow all patterns in `CLAUDE.md` (named exports, no 'any', camelCase, etc.)
- New CPQ objects MUST be added to `CPQ_OBJECTS` and `CPQ_FIELDS` in `cpq-setup.service.ts`
- New backend services MUST be registered in `CpqModule`
- Frontend components in `packages/twenty-front/src/modules/cpq/`
- Settings pages in `packages/twenty-front/src/pages/settings/`
- Multi-dimensional pricing (TASK-149) patterns must be used for all quote line components

### 3. Code Review Agent
- Reviews the implementation diff from the worktree
- Checks against ALL acceptance criteria in the task spec
- Checks against ALL definition of success items
- Verifies code quality: typing, naming, component size, error handling
- Verifies tests are comprehensive
- Returns: PASS (all ACs met) or FAIL (with specific issues list)
- If FAIL: returns to Implementation Agent with detailed feedback

### 4. Sarah Kim (Admin UAT) Agent — BROWSER REQUIRED
- **Role**: Revenue Operations Admin at PhenoTips
- **Persona**: Detail-oriented, concerned with data accuracy, wants full control over CPQ configuration
- **Tests admin-facing tasks**: TASK-116, TASK-117, TASK-118, TASK-119, TASK-121, TASK-122, TASK-123, TASK-124, TASK-125, TASK-136, TASK-137, TASK-138, TASK-139, TASK-140, TASK-141, TASK-142, TASK-143, TASK-144, TASK-146, TASK-147, TASK-148 (admin view)

**Browser testing protocol:**
1. Start/verify dev server is running at http://localhost:3000
2. Log in with admin credentials (Continue with Email, use pre-filled credentials)
3. Navigate to the feature being tested
4. Execute EACH acceptance criterion from the task spec as a real browser action
5. For each AC: navigate, perform action, observe result, record PASS/FAIL
6. Score the implementation 0–100 on: Completeness, Usability, Correctness
7. A score of 95+ means the task is UAT-approved
8. Report specific failures with screenshots (describe what was seen vs. expected)
9. If score < 95: provide specific actionable feedback to the Implementation Agent

### 5. Marcus Torres (Rep UAT) Agent — BROWSER REQUIRED
- **Role**: Senior Account Executive at PhenoTips
- **Persona**: Efficiency-focused, wants to close deals fast, frustrated by unnecessary steps
- **Tests rep-facing tasks**: TASK-126, TASK-127, TASK-128, TASK-129, TASK-130, TASK-131, TASK-132, TASK-133, TASK-134, TASK-135, TASK-145, TASK-148 (rep view), TASK-149

**Browser testing protocol:** (same as Sarah but from rep perspective)
1. Log in as a sales rep user
2. Execute each AC as a real browser action
3. Score 0–100 on: Speed of workflow, Clarity, Correctness, Error handling
4. Score of 95+ = UAT-approved
5. If score < 95: provide specific actionable feedback

---

## Gate Requirements

| Gate | Requirement to Pass |
|------|---------------------|
| Implementation | All code written, lint clean, typecheck passes, tests pass |
| Code Review | All ACs checked, code quality meets standards, no `any` types, proper error handling |
| UAT | Score ≥ 95/100 from the relevant UAT agent(s) |

All three gates must pass before a task moves to ✅ Done.

---

## Implementation Patterns Reference

### Adding a new CPQ object
```
1. Add to CPQ_OBJECTS in cpq-setup.service.ts
2. Add fields to CPQ_FIELDS[objectKey] 
3. Add relations to CPQ_RELATIONS if needed
4. Create a service (e.g., CpqDiscountScheduleService)
5. Add REST endpoints to CpqController or a new controller
6. Register in CpqModule
7. Frontend: create admin page component, hook, and routes
```

### Adding a new backend service
```
1. Create src/modules/cpq/services/cpq-{name}.service.ts
2. Inject GlobalWorkspaceOrmManager for data access
3. Use buildSystemAuthContext(workspaceId) for auth
4. Register in CpqModule providers + exports
5. Add to CpqController if HTTP endpoints needed
```

### Frontend pattern
```
1. Component at packages/twenty-front/src/modules/cpq/components/
2. Hook at packages/twenty-front/src/modules/cpq/hooks/
3. Settings page at packages/twenty-front/src/pages/settings/
4. Add route to the relevant routes file
5. Add nav link to CPQ sidebar nav
6. Use Twenty's UI components (Section, TextInput, Toggle, etc.)
7. Use Linaria for any custom styles
```

### Pricing engine integration
```
1. All price calculations go through CpqPricingService.calculatePriceWaterfall()
2. Multi-year calculations use calculateYearlyPricing() (TASK-149)
3. Frontend calls POST /cpq/calculate-price via useCpqPricing hook
4. Store audit trail in quoteLineItem.pricingAudit (RAW_JSON field)
```

---

## Dev Environment

- Frontend dev server: `npx nx start twenty-front`
- Backend server: `npx nx start twenty-server`
- Test app URL: http://localhost:3000
- Login: Click "Continue with Email", use pre-filled credentials
- Admin credentials are the workspace admin (check Twenty's auth setup)
- Database reset if needed: `npx nx database:reset twenty-server`

---

## Completion Criteria

The harness is complete when:
1. All tasks in TASK-STATUS.md show ✅ Done (except TASK-120 which is skipped)
2. Both Sarah Kim and Marcus Torres have scored all relevant tasks ≥ 95/100
3. All code is committed to the worktree branch
4. No lint errors or type errors remain

---

## Notes for PM Agent

- **Start with TASK-149** (Phase 0) — it adds fields to existing objects that other tasks depend on
- **TASK-116** is second priority — CpqSettings entity is needed by most other admin tasks
- After Phase 0 and TASK-116 are done, Phase 1 tasks can proceed in parallel
- Each phase should be complete before moving to the next phase
- If an implementation or code review fails 3 times, escalate to the user
- UAT testing requires the dev server to be running — check this before spawning UAT agents
