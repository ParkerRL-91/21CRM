---
name: prj-005-execution-harness
description: Execute PRJ-005 RevOps market readiness tasks with automated QA. Use when implementing TASK-101 through TASK-115.
disable-model-invocation: true
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash(npm *)", "Bash(npx *)", "Bash(git *)", "Bash(mkdir *)", "Bash(ls *)", "Bash(curl *)", "Agent"]
effort: high
---

# PRJ-005 Execution Harness

You are executing the RevOps Market Readiness project (PRJ-005). This harness
governs the build-test-iterate loop for every task.

## Execution Protocol

For each task (TASK-101 through TASK-115), follow this exact loop:

### Phase 1: Pre-Flight

1. Read the task file from `project-management/backlog/TASK-{id}-*.md`
2. Read all files listed in the task's "Files to Change" section
3. Read the existing code patterns to follow (imports, types, naming)
4. Update the task status to `in-progress`
5. List the success metrics — these are the QA acceptance criteria

### Phase 2: Implement

1. Write the business logic engine first (pure functions, testable)
2. Write unit tests for the engine (all success metric conditions)
3. Run tests: `npx vitest run {test-file}` — fix until green
4. Write the API route (if needed)
5. Write/update UI components
6. Update the dashboard page to integrate new components

**Code Standards:**
- TypeScript strict — no `any` types
- Parameterized queries only — never interpolate user input
- Decimal.js for all monetary arithmetic
- Follow existing import patterns (check neighboring files)
- Export types from barrel index files
- Tests live next to the code they test

### Phase 3: QA Agent

After implementation, spawn a QA agent with this prompt template:

```
You are Jordan, the CRM admin persona. Review the implementation of
TASK-{id} against its user stories and success metrics.

Read these files:
1. The task file: project-management/backlog/TASK-{id}-*.md
2. All files listed in "Files to Change"
3. All test files listed in "Tests to Write"

For each success metric in the task file, verify:
- [ ] Is the metric implemented in code?
- [ ] Is there a test covering this metric?
- [ ] Does the test pass?
- [ ] Would this satisfy the user story it supports?

For each user story, verify:
- [ ] Is the workflow described actually possible with the code written?
- [ ] Are edge cases handled?
- [ ] Is error feedback clear to a non-developer?

Report a QA scorecard:
| Metric | Implemented | Tested | Passing | Score |
|--------|-------------|--------|---------|-------|

Overall: PASS (all metrics met) or FAIL (list failures)
If FAIL, list exactly what needs to be fixed.
```

### Phase 4: Iterate

If the QA agent returns FAIL:
1. Read the failure list
2. Fix each issue
3. Re-run tests
4. Spawn QA agent again
5. Repeat until PASS

### Phase 5: Post-Flight

1. Update task status to `done` in the task file
2. Write completion summary in the Status Log
3. Write Takeaways (lessons learned, patterns discovered)
4. Update `project-management/ACTIVE.md`
5. Commit with message: `TASK-{id}: {short description}`
6. Move to the next task

## Task Execution Order

Execute in dependency order:

**Round 1 (P0 — no dependencies):**
1. TASK-102: Deal risk flags engine (foundation for newsfeed)
2. TASK-101: Clickable drill-down (foundation for all UX)

**Round 2 (P0 — depends on Round 1):**
3. TASK-103: Pipeline change newsfeed (uses risk engine data)
4. TASK-104: NRR calculation + subscription health

**Round 3 (P1):**
5. TASK-105: Deferred revenue waterfall
6. TASK-106: Pipeline movement view
7. TASK-107: Quarter progression chart

**Round 4 (P1 — differentiators):**
8. TASK-108: Projected rev-rec toggle
9. TASK-109: Quote-to-revenue bridge
10. TASK-110: Forecast snapshots

**Round 5 (P1-P2):**
11. TASK-111: Scheduled auto-sync
12. TASK-112: Mobile responsive
13. TASK-113: Multi-method forecast

**Round 6 (P2 — prototypes):**
14. TASK-114: Salesforce connector abstraction
15. TASK-115: AI deal scoring

## QA Agent Configuration

Spawn QA agents with:
- `subagent_type: "Explore"` (read-only verification)
- Include the full task file path in the prompt
- Include all implementation file paths
- Include all test file paths
- Request a structured scorecard

## Completion Criteria

The project is DONE when:
- All 15 tasks have status `done`
- All QA agents returned PASS
- All tests pass: `npx vitest run`
- Type check passes: `npx tsc --noEmit`
- All changes committed and pushed
