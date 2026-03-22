# 21CRM — Agent Operating Instructions

> These instructions are **immutable during execution**. Every agent session MUST follow them exactly. No shortcutting, no skipping steps, no "I'll do it later."

---

## Identity

This is **21CRM** — a self-hosted RevOps platform that replaces 3-4 paid SaaS tools (Clari, Forecastio, HubiFi, etc.) with a single HubSpot-integrated application. It handles pipeline analytics, revenue recognition, forecasting, team performance, subscription tracking, and custom reporting.

---

## Operating Protocol

### Before Writing Any Code

1. **Check the project management system.** Read `project-management/ACTIVE.md` to see what's in progress.
2. **Every code change MUST trace to a task.** If no task exists for the work you're about to do, create one first in `project-management/backlog/` and link it to a project.
3. **Read the relevant knowledge files** in `/knowledge/` before making architectural decisions. The answers to "how does X work?" and "why did we build it this way?" live there.

### While Writing Code

4. **The manager loop runs continuously.** For every block of work:
   - Update the task status in its project management file (`status: in-progress`)
   - List every file you create or modify under the task's `## Files Changed` section
   - After completing a logical unit, write a `## Takeaway` entry in the task noting what was learned, what changed, and any follow-up needed
5. **Update the knowledge base** when you learn something new about the system — a new pattern, a HubSpot API behavior, a schema decision, a gotcha. If it would help the next session, write it down in `/knowledge/`.
6. **Never guess at architecture.** Read the existing code first. Check `/knowledge/architecture/` for system design docs. Understand existing patterns before introducing new ones.

### After Completing Work

7. **Mark the task done** in its file (`status: done`) and add a completion summary.
8. **Update `project-management/ACTIVE.md`** — move completed tasks out, note any new blockers or follow-ups discovered.
9. **Update knowledge base** if the work introduced new patterns, schemas, APIs, or decisions.

---

## Knowledge Base (`/knowledge/`)

The knowledge base is structured as an **Obsidian vault**. Files use YAML frontmatter and wikilink syntax (`[[other-file]]`) for cross-referencing.

### Structure

```
knowledge/
├── architecture/       # System design, tech stack, data flow
├── integrations/       # HubSpot API behavior, OAuth, sync patterns
├── features/           # How each feature works, its scope, edge cases
├── data-model/         # Database schemas, table relationships, JSONB shapes
├── decisions/          # ADRs — why we chose X over Y
└── competitive-intel/  # What competitors do, what we learned from them
```

### Rules

- **Every file has YAML frontmatter** with at minimum: `title`, `tags`, `created`, `updated`
- **Use wikilinks** to connect related concepts: `See [[hubspot-sync-engine]] for details`
- **Tags follow a flat taxonomy**: `#architecture`, `#hubspot`, `#rev-rec`, `#pipeline`, `#forecast`, `#data-model`, `#decision`, `#integration`, `#ux`
- **Keep files atomic** — one concept per file. "HubSpot Rate Limiting" is a file, not a section buried in a larger doc.
- **Update `updated:` date** whenever you modify a knowledge file
- **Never delete knowledge** — mark as `status: deprecated` with a note pointing to the replacement

---

## Project Management (`/project-management/`)

### Structure

```
project-management/
├── ACTIVE.md               # Dashboard: current sprint, blockers, priorities
├── projects/
│   └── PRJ-001-name.md     # Project files (epics)
└── backlog/
    └── TASK-001-name.md    # Individual task/issue files
```

### ACTIVE.md Format

This is the **first file you read** at the start of every session. It's the source of truth for "what are we working on right now?"

```markdown
# Active Work

## Current Sprint
| Task | Project | Status | Assignee | Priority |
|------|---------|--------|----------|----------|
| TASK-XXX | PRJ-XXX | in-progress | agent | P1 |

## Blockers
- [ ] Description of blocker — linked to TASK-XXX

## Recently Completed
- TASK-XXX: brief outcome (completed YYYY-MM-DD)

## Up Next (Priority Order)
1. TASK-XXX: description
2. TASK-XXX: description
```

### Project File Format (`projects/PRJ-XXX-name.md`)

```markdown
---
title: Project Name
id: PRJ-XXX
status: active | completed | on-hold
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [#project, #feature-area]
---

# PRJ-XXX: Project Name

## Objective
One-sentence goal.

## Success Metrics
- [ ] Metric 1
- [ ] Metric 2

## Tasks
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-001 | ... | done | P1 |
| TASK-002 | ... | in-progress | P2 |

## Decisions Log
- YYYY-MM-DD: Decision and rationale
```

### Task File Format (`backlog/TASK-XXX-name.md`)

Every task is an **issue**. Multiple tasks roll up into a **project**.

```markdown
---
title: Task Title
id: TASK-XXX
project: PRJ-XXX
status: backlog | ready | in-progress | review | done | blocked
priority: P0 | P1 | P2 | P3
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [#task, #feature-area]
---

# TASK-XXX: Task Title

## User Stories
- As a [role], I want [action] so that [outcome]

## Outcomes
What does "done" look like? Be specific.

## Success Metrics
- [ ] Measurable criterion 1
- [ ] Measurable criterion 2

## Implementation Plan
Step-by-step approach. Include architectural decisions.

## Files to Change
List every file that will be created or modified:
- `src/path/to/file.ts` — what changes
- `src/path/to/new-file.ts` — new file, purpose

## Status Log
- YYYY-MM-DD: Created
- YYYY-MM-DD: Started — notes
- YYYY-MM-DD: Completed — summary of what was done

## Takeaways
Lessons learned, gotchas, follow-up items discovered during execution.
```

---

## Agent Behavior Rules

### Code Quality
- Read the file before editing it. Understand existing patterns.
- Prefer editing existing files over creating new ones.
- Don't over-engineer. Only build what the task asks for.
- Don't add features, refactor code, or make "improvements" beyond the task scope.
- Check `/knowledge/architecture/` before introducing new patterns.

### HubSpot Integration
- Always handle token refresh. Check `/knowledge/integrations/hubspot-auth.md`.
- Respect rate limits (100 req / 10s for OAuth apps).
- Use `client.unsafe()` for raw SQL with parameterized queries — never string interpolation.
- Sync engine reads property overrides from `org.syncConfig.propertyOverrides`.

### Next.js
- This project uses Next.js with breaking changes from what you may know. **Read `node_modules/next/dist/docs/`** before writing any Next.js code. Heed deprecation notices.
- API routes use the App Router pattern (`route.ts` with named exports).
- Client components must have `"use client"` directive.

### Database
- All CRM data lives in `crm_objects` (JSONB `properties` column).
- Use drizzle ORM for typed queries, `client.unsafe()` for dynamic SQL.
- Always use parameterized queries. Never interpolate user input into SQL.
- Run `drizzle-kit push` after schema changes to update the database.
- Run `drizzle-kit generate` to create migration files.

### Testing
- Write tests for business logic (engines, parsers, computation).
- Use vitest. Test files live next to the code they test.
- Run `npx vitest run` before marking a task done.

---

## Manager Agent — Role & Protocol

The **Manager Agent** is a persistent supervisory role that runs **before, during, and after** every code change. It is not optional. It is not a suggestion. It runs every time.

### Role Definition

The Manager Agent is responsible for:
- **Governance**: Ensuring every code change traces to a task with user stories, outcomes, and success metrics
- **Knowledge stewardship**: Keeping the knowledge base current and accurate as the system evolves
- **Project tracking**: Maintaining task status, file lists, takeaways, and the ACTIVE.md dashboard
- **Quality gates**: Enforcing test coverage and type safety before any task is marked done
- **Scope control**: Preventing scope creep by splitting discovered work into new tasks

The Manager Agent does NOT write code itself — it wraps the coding process with accountability.

### Before Code (Pre-Flight)

Every coding session begins with this checklist. No exceptions.

```
□ Read project-management/ACTIVE.md
□ Identify or create the task file for this work
□ Read the task's user stories and success metrics
□ Read relevant knowledge/ files for context
□ Update task status → in-progress
□ List planned files in the task's "Files to Change" section
□ Check no other in-progress task has file conflicts (see Multi-Task Parallelism)
```

If the task file doesn't exist yet, create it BEFORE writing any code. A task without user stories and outcomes is not ready to start.

### During Code (Continuous Loop)

The manager loop runs after every logical unit of work (a completed file, a function, a route):

```
1. EXECUTE → write code for one focused unit
2. RECORD → update task "Files Changed" with what was done and why
3. LEARN → if something surprised you, update the knowledge base
4. SCOPE CHECK → is this still within the task? If not:
   ├── Create a NEW task in backlog/
   ├── Link it to the project
   └── Add a note in current task's Takeaways: "Discovered TASK-XXX"
5. REPEAT until implementation plan is complete
```

### After Code (Post-Flight)

Every coding session ends with this checklist:

```
□ Run tests: npx vitest run (ALL tests, not just new ones)
□ Run type check: npx tsc --noEmit
□ Verify success metrics in the task file are met
□ Write completion summary in task's Status Log
□ Write Takeaways (lessons learned, gotchas, follow-ups)
□ Mark task status → done (or → blocked with explanation)
□ Update project-management/ACTIVE.md
□ Update knowledge base if new patterns/schemas/decisions were introduced
□ Commit with task ID (see Commit Standards)
```

---

## Commit Message Standards

Every commit message MUST reference a task ID. Format:

```
TASK-XXX: short imperative description

Longer explanation if needed. What changed and why.
Reference related tasks if applicable.

Co-Authored-By: Claude <noreply@anthropic.com>
```

Examples:
```
TASK-012: add deal risk flags to pipeline page
TASK-003: fix rev-rec Date serialization in generate route
TASK-007: add owner sync to sync engine and team page name resolution
```

**Rules:**
- One task per commit when possible. If a commit spans tasks, list all IDs.
- Never commit without a task ID. If work was exploratory, create a task retroactively.
- Use imperative mood ("add", "fix", "update"), not past tense ("added", "fixed").

---

## Test Coverage Requirements

A task is **not done** until tests pass. Specifically:

1. **All existing tests must pass**: `npx vitest run` — zero failures
2. **New business logic must have tests**: If you wrote a function that computes, transforms, parses, or decides, it needs tests. UI components and API route handlers are exempt.
3. **Type check must pass**: `npx tsc --noEmit` — zero errors
4. **Test files live next to the code**: `engine.ts` → `engine.test.ts` in the same directory

What counts as "business logic" that requires tests:
- Computation engines (rev-rec, forecast, scoring)
- Parsers (billing period, date, currency)
- Data transformers (aggregation, mapping, normalization)
- Validation functions

What does NOT require tests:
- React components (UI)
- API route handlers (integration-level, tested manually)
- Database queries (tested via the functions that use them)
- Config/constants

---

## Knowledge Base Review Cadence

The knowledge base is only useful if it's current. Follow these rules:

### On Every Session
- **Read before you write**: Check relevant knowledge files before making architectural decisions
- **Write when you learn**: If you discovered a gotcha, API behavior, or pattern — write it down immediately, not "later"

### On Every Task Completion
- **Audit touched areas**: For each knowledge file related to the feature area you worked on, verify it's still accurate. Update `updated:` dates.
- **Create new files** for new concepts introduced (new table, new integration behavior, new decision)

### Weekly (or every ~5 tasks)
- **Scan for staleness**: Skim through `/knowledge/` looking for files that reference code or patterns that no longer exist. Mark as `status: deprecated` or update.
- **Check for gaps**: Are there features or patterns with no knowledge file? Create stubs at minimum.

### On Architecture Changes
- **Mandatory ADR**: Any change to system architecture, data model, or integration pattern requires a new `decisions/adr-XXX-*.md` file explaining the decision, alternatives considered, and rationale.

---

## Multi-Task Parallelism

When working on multiple tasks concurrently (or when multiple agents may be running), use the **Files to Change** section in each task to prevent conflicts.

### Rules

1. **Check before starting**: Before marking a task `in-progress`, scan all other `in-progress` tasks' "Files to Change" lists. If there's overlap, either:
   - Sequence the tasks (finish one first)
   - Coordinate the changes (document in both tasks which sections each owns)
   - Merge the tasks if they're actually the same work

2. **File ownership during execution**: Once a task lists a file in "Files to Change" and is `in-progress`, that file belongs to that task. Other tasks must not modify it until the owning task is done or explicitly releases it.

3. **Shared files**: Some files are inherently shared (`schema.ts`, `ACTIVE.md`, knowledge files). For these:
   - Append-only changes are always safe (adding exports, adding knowledge entries)
   - Modifying existing content requires checking the other task's scope

4. **Conflict resolution**: If two tasks must modify the same section of the same file:
   - Complete one task fully before starting the other
   - Note the dependency in both tasks' Status Log
   - Update ACTIVE.md to reflect the sequencing

### ACTIVE.md as Coordination Hub

The ACTIVE.md file is the single source of truth for "what's being worked on now." Before starting any task:

```
1. Read ACTIVE.md → see what's in-progress
2. Check file lists of in-progress tasks → identify conflicts
3. If no conflicts → add your task to ACTIVE.md, proceed
4. If conflicts → resolve before starting (sequence, coordinate, or merge)
```

---

## File Reference

Key paths in the codebase (update this section as the project evolves):

| Area | Path |
|------|------|
| App pages | `src/app/(dashboard)/*/page.tsx` |
| API routes | `src/app/api/*/route.ts` |
| DB schema | `src/lib/db/schema.ts`, `*-schema.ts` |
| Sync engine | `src/lib/sync/engine.ts` |
| HubSpot client | `src/lib/hubspot/client.ts` |
| Auth | `src/lib/auth/` |
| Forecast engines | `src/lib/forecast/engines/` |
| Rev-rec engine | `src/lib/rev-rec/engine.ts` |
| UI components | `src/components/` |
| Charts | `src/components/charts/` |
| Hooks | `src/hooks/` |
| Drizzle config | `drizzle.config.ts` |
| Migrations | `drizzle/` |
| Knowledge base | `knowledge/` |
| Project management | `project-management/` |
