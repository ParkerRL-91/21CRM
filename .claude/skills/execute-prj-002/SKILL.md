---
name: execute-prj-002
description: Execute PRJ-002 contract management tasks with governance. Use when implementing any TASK-027 through TASK-048 from the CPQ/renewal project plan.
argument-hint: "[TASK-ID] — e.g., TASK-027, or 'next' for the next ready task"
disable-model-invocation: true
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Agent", "TodoWrite"]
effort: high
---

# PRJ-002 Execution Harness

You are executing tasks from **PRJ-002: Contract Management, CPQ & Renewal
Automation**. This skill enforces the CLAUDE.md manager protocol: every task
gets pre-flight checks, continuous tracking, and post-flight verification.

---

## Standing Rules

These rules apply to EVERY task execution, every time:

1. **Never write code without reading the task file first.** The task file is
   the specification. Read it completely before touching any source code.
2. **All monetary math uses Decimal.js in TypeScript, NUMERIC(12,2) in SQL.**
   Never use native JS arithmetic for prices or financial values.
3. **All database mutations use parameterized queries.** Never interpolate
   user input into SQL strings.
4. **Every business logic function gets a test file.** If it computes,
   transforms, validates, or decides — it needs tests.
5. **Contracts are first-class relational tables, not crm_objects.** See
   ADR-003 for rationale.
6. **Renewal deals ARE crm_objects** with `deal_type = 'Renewal'` to leverage
   existing pipeline infrastructure.
7. **Commit after each task** with message format:
   `TASK-XXX: short imperative description`

---

## Task Dependency Graph

Execute in this order. A task cannot start until its dependencies are done.

```
Phase 1 — Foundation
  TASK-027 (schema)
    → TASK-028 (CRUD API) + TASK-048 (CRUD tests)
      → TASK-029 (subscriptions)

Phase 2 — UI
  TASK-047 (global contracts list)
  TASK-030 (account contracts list) → TASK-031 (contract detail)
  TASK-032 (amendment wizard)

Phase 3 — Automation
  TASK-033 (renewal config)
    → TASK-037 (pricing engine)  ← BUILD THIS BEFORE TASK-036
      → TASK-034 (daily job) → TASK-035 (renewal opp) → TASK-036 (quote gen)
        → TASK-038 (notifications)

Phase 4 — Analytics
  TASK-039 (pipeline filtering)
  TASK-042 (risk engine)
  TASK-040 (renewal report) + TASK-041 (kanban)

Phase 5 — Integration
  TASK-043 (HubSpot sync)
  TASK-044 (rev-rec integration)
  TASK-045 (dashboard widget)
  TASK-046 (CSV export)
```

---

## Execution Flow

When the user invokes `/execute-prj-002 [TASK-ID|next]`:

### Step 1: Resolve the Task

If `$ARGUMENTS` is a specific task ID (e.g., `TASK-027`):
  - Read the task file: `project-management/backlog/TASK-{id}-*.md`
  - Verify its status is `ready` or `in-progress`
  - Verify all dependency tasks are `done`

If `$ARGUMENTS` is `next` or empty:
  - Read `project-management/ACTIVE.md`
  - Find the first PRJ-002 task with status `ready` whose dependencies are all `done`
  - Announce which task will be executed and why

If the task has unmet dependencies, list them and stop.

### Step 2: Pre-Flight (Manager Protocol)

Run this checklist before writing any code:

```
□ Read the task file completely
□ Read the project file: project-management/projects/PRJ-002-*.md
□ Read relevant knowledge files:
  - knowledge/features/contract-management.md
  - knowledge/decisions/adr-003-contract-management-architecture.md
  - knowledge/architecture/system-overview.md
  - Any feature-specific knowledge files mentioned in the task
□ Check for file conflicts with other in-progress tasks
□ Update task status → in-progress
□ Update task "Files to Change" if the plan has evolved
□ Create TodoWrite items for the implementation steps
```

### Step 3: Implement

Follow the task's **Implementation Plan** section step by step:

1. **Read before writing.** For every file you modify, read it first. For
   new files, read neighboring files to match patterns.
2. **One logical unit at a time.** After completing each function, route, or
   component:
   - Update the task's "Files Changed" section
   - If something surprised you, update the knowledge base
   - If you discovered new work, create a new task file in
     `project-management/backlog/`
3. **Write tests alongside code.** Don't defer tests to "later" — write
   them as you implement each function.
4. **Use transactions for multi-table mutations.** Especially in:
   - Contract creation from deal (TASK-028)
   - Subscription modifications (TASK-029)
   - Renewal job processing (TASK-034)
   - Renewal opportunity + quote creation (TASK-035, TASK-036)

### Step 4: Post-Flight (Manager Protocol)

Run this checklist after implementation:

```
□ Run tests: npx vitest run
□ Run type check: npx tsc --noEmit
□ Verify every success metric in the task file is met
  (read each checkbox — is it actually done?)
□ Write completion summary in task's Status Log
□ Write Takeaways (lessons learned, gotchas, follow-ups)
□ Mark task status → done
□ Update project-management/ACTIVE.md
□ Update knowledge base if new patterns were introduced
□ Commit: TASK-XXX: description
```

### Step 5: QA (Jordan Tests)

If the task produced a UI page or visual change, run Jordan's QA:

1. Ensure dev server is running (`curl -s http://localhost:3000`)
2. Map the feature to Jordan's test scenarios
3. Execute the QA checklist (functional, edge case, regression, UX)
4. Fix any failures before marking the task done

**Tasks that skip QA** (no UI changes): TASK-027 (schema), TASK-037
(pricing engine), TASK-042 (risk engine), TASK-048 (tests). Note the skip.

---

## Task Quick Reference

| ID | Title | Phase | Deps |
|----|-------|-------|------|
| 027 | Contract schema | 1 | none |
| 028 | Contract CRUD API | 1 | 027 |
| 048 | CRUD tests | 1 | 028 |
| 029 | Subscription management | 1 | 028 |
| 047 | Global contracts list | 2 | 028 |
| 030 | Account contracts list | 2 | 028 |
| 031 | Contract detail page | 2 | 030 |
| 032 | Amendment wizard | 2 | 029, 031 |
| 033 | Renewal config | 3 | 027 |
| 037 | Pricing engine | 3 | 033 |
| 034 | Daily renewal job | 3 | 037 |
| 035 | Renewal opp creation | 3 | 034 |
| 036 | Renewal quote gen | 3 | 035, 037 |
| 038 | CS notifications | 3 | 035 |
| 039 | Pipeline filtering | 4 | 035 |
| 042 | Risk engine | 4 | 034 |
| 040 | Renewal report | 4 | 039, 042 |
| 041 | Renewal kanban | 4 | 039 |
| 043 | HubSpot sync | 5 | 035 |
| 044 | Rev-rec integration | 5 | 036 |
| 045 | Dashboard widget | 5 | 028 |
| 046 | CSV export | 5 | 040 |

---

## Error Handling

If a task cannot be completed:

1. **Blocked by missing dependency**: List what's missing, mark task as
   `blocked` with explanation, suggest which task to do instead.
2. **Test failure**: Diagnose the failure. If it's in your new code, fix it.
   If it's in existing code, create a bug task and note the blocker.
3. **Architectural surprise**: If the existing code doesn't match what the
   knowledge base says, update the knowledge base first, then proceed.
4. **Scope creep detected**: If implementation reveals work beyond the
   task's scope, create a new task in `project-management/backlog/` and
   add a Takeaway note in the current task. Do NOT expand scope.
