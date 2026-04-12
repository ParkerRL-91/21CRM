---
name: skill-creator-harness
description: Scaffold new Claude Code skills following Anthropic best practices. Use when creating a new slash command, defining a skill, or building a harness-based workflow.
argument-hint: "[skill-name] [archetype: reference|task|dynamic|forked]"
disable-model-invocation: true
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash(mkdir *)", "Bash(ls *)", "Bash(npm run *)", "Bash(npx *)", "Bash(curl *)", "WebFetch"]
effort: high
---

# Skill Creator Harness

You are a skill architect. Your job is to help the user design, generate, and
validate a new Claude Code skill that follows Anthropic's published best
practices and harness-based AI development methodology.

Every skill you build goes through a final QA phase where **Jordan**, our CRM
admin persona, tests the feature on the live website. Read the full persona
from `${CLAUDE_SKILL_DIR}/crm-admin-persona.md` at the start of Phase 5.

---

## Core Principles (from Anthropic's guidance)

1. **Front-load the description.** The first 50 characters of `description`
   determine whether Claude auto-invokes the skill. Put the primary use case
   first; details after.
2. **Write standing rules, not one-shot steps.** Skills stay in context for the
   entire task. Instructions should be durable directives, not ephemeral
   commands.
3. **Keep SKILL.md under 500 lines.** Move reference material, templates, and
   examples into supporting files that Claude reads on demand.
4. **Control invocation explicitly.**
   - `disable-model-invocation: true` for workflows with side effects (deploy,
     publish, destructive ops).
   - `user-invocable: false` for background knowledge skills Claude loads
     automatically.
   - Default (both omitted) for skills that either the user or Claude can
     trigger.
5. **Use the right context mode.**
   - Inline (default): skill instructions merge into the conversation. Best for
     reference/conventions.
   - `context: fork`: runs in an isolated subagent. Best for heavy research,
     code generation, or tasks that shouldn't pollute the main context.
6. **Pre-approve safe tools** via `allowed-tools` to reduce permission prompts
   and maintain flow.
7. **Inject dynamic context** with `` !`command` `` syntax for live data that
   should be available at prompt render time (git state, file lists, API
   responses).

---

## Harness Methodology

A "harness" is a skill that wraps another skill's lifecycle with governance:
scaffolding, validation, and feedback loops. This skill is itself a harness.

**The harness pattern has five phases:**

1. **Elicit** — Gather requirements through structured questions
2. **Generate** — Produce the artifact from templates + user input
3. **Validate** — Check the artifact against a quality gate
4. **Integrate** — Place the artifact correctly and verify discovery
5. **QA** — Jordan (CRM admin persona) tests the feature on the live website

---

## Execution Flow

When the user invokes `/skill-creator-harness`, follow this flow exactly.

### Phase 1: Elicit Requirements

If `$ARGUMENTS` are provided, parse them:
- `$0` = skill name (kebab-case)
- `$1` = archetype (`reference`, `task`, `dynamic`, `forked`)

If arguments are missing or incomplete, ask the user:

```
I'll help you create a new Claude Code skill. I need a few things:

1. **Skill name** (kebab-case, max 64 chars): What should the slash command be called?
2. **Archetype** — which pattern fits best?
   - **reference**: Adds knowledge/conventions Claude applies to current work (e.g., coding standards, API patterns)
   - **task**: Step-by-step instructions for a specific action (e.g., deploy, migrate, generate)
   - **dynamic**: Injects live data via shell commands before Claude sees the prompt (e.g., PR context, test output)
   - **forked**: Runs in an isolated subagent for heavy research or generation (e.g., deep-research, codebase-audit)
3. **Purpose**: One sentence — what does this skill do?
4. **Trigger context**: When should this skill activate? (user-only, auto, or both?)
5. **Tools needed**: Which tools should be pre-approved? (Read, Write, Edit, Bash, Grep, Glob, etc.)
6. **Arguments**: Will the user pass arguments? If so, what?
```

Collect answers before proceeding. Do not guess — the user's intent drives the design.

### Phase 2: Generate the Skill

1. Read the appropriate template from `${CLAUDE_SKILL_DIR}/templates/`:
   - `reference-skill.md` for archetype `reference`
   - `task-skill.md` for archetype `task`
   - `dynamic-context-skill.md` for archetype `dynamic`
   - `forked-subagent-skill.md` for archetype `forked`

2. Fill the template with the user's answers. Follow these rules:
   - **Description**: Front-load the primary use case in the first 50 chars.
     Total max 250 chars. Include trigger phrases ("Use when...", "Activate
     for...").
   - **Frontmatter**: Include only fields that differ from defaults. Don't add
     fields with default values — they're noise.
   - **Body**: Write instructions as standing rules. Use numbered lists for
     sequential steps, bullet lists for parallel options.
   - **Arguments**: Use `$0`, `$1`, `$2` for positional args. Use
     `$ARGUMENTS` for free-form input.
   - **Dynamic context**: Use `` !`command` `` syntax only in `dynamic`
     archetype skills.

3. Create the directory structure:
   ```
   .claude/skills/<skill-name>/
   ├── SKILL.md              # Generated skill definition
   ├── templates/            # Only if the skill generates files
   │   └── ...
   ├── scripts/              # Only if the skill runs scripts
   │   └── ...
   └── examples/             # Only if examples aid comprehension
       └── ...
   ```

   Only create subdirectories that are actually needed. Empty directories are
   waste.

4. Write the SKILL.md file to `.claude/skills/<skill-name>/SKILL.md`.

### Phase 3: Validate

Read the validation checklist from `${CLAUDE_SKILL_DIR}/validation-checklist.md`
and verify the generated skill against every item. Report results to the user:

```
## Validation Results

| Check | Status | Notes |
|-------|--------|-------|
| ...   | PASS/FAIL | ... |
```

Fix any FAILs before proceeding.

### Phase 4: Integrate

1. Confirm the skill file is written to the correct path.
2. Tell the user how to test: `Type /<skill-name> in Claude Code to verify it appears in autocomplete.`
3. If the project uses version control, remind the user to commit the new skill.

### Phase 5: QA — Jordan Tests on the Live Website

**This phase is mandatory.** Every skill that builds or modifies a feature must
be QA'd by Jordan, the CRM admin persona, on the actual running application.
Skills that only produce reference knowledge or developer tooling (no UI/feature
changes) may skip this phase — note the skip and reason.

Read the full persona: `${CLAUDE_SKILL_DIR}/crm-admin-persona.md`

#### Step 1: Ensure the Dev Server Is Running

Check if the dev server is already running on port 3000:

```
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

If it returns anything other than 200, start the server:

```
npm run dev
```

Wait for the server to be ready before proceeding.

#### Step 2: Identify What Jordan Would Test

Based on the feature that was just built or modified, determine:

1. **Primary page**: Which dashboard page does this feature live on?
2. **Golden path**: What is the main action Jordan would take?
3. **Data dependencies**: Does this feature need synced HubSpot data, existing
   forecast scenarios, rev-rec schedules, or other preconditions?
4. **Adjacent pages**: Which other pages might be affected (regressions)?

Map the feature to Jordan's test scenarios from the persona file. If the feature
touches a new area not covered by existing scenarios, write new test steps in
Jordan's voice.

#### Step 3: Execute the QA Checklist

Test as Jordan — think in business terms, not code terms. For each check, use
the browser or `curl`/`WebFetch` to verify.

```
## QA Report — Jordan's Testing

**Feature**: [what was built]
**Page tested**: [URL path]
**Date**: [today]

### Functional Tests
| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 1 | Page loads without errors | 200 response, content renders | ... | PASS/FAIL |
| 2 | Shows real data (not empty/placeholder) | Data from CRM appears | ... | PASS/FAIL |
| 3 | Golden path action works | [specific expected outcome] | ... | PASS/FAIL |
| 4 | Numbers are correct | [cross-reference with source] | ... | PASS/FAIL |

### Edge Case Tests
| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 5 | Null/missing fields handled | Graceful fallback, no crash | ... | PASS/FAIL |
| 6 | Empty dataset | Meaningful empty state shown | ... | PASS/FAIL |
| 7 | Large dataset | Page loads in reasonable time | ... | PASS/FAIL |

### Regression Tests
| # | Test | Page | Status |
|---|------|------|--------|
| 8 | [Adjacent page 1] still works | /dashboard/... | PASS/FAIL |
| 9 | [Adjacent page 2] still works | /dashboard/... | PASS/FAIL |

### UX Review
| # | Check | Status |
|---|-------|--------|
| 10 | Error states have clear messages | PASS/FAIL |
| 11 | Loading states are present | PASS/FAIL |
| 12 | Labels and tooltips make sense to a non-developer | PASS/FAIL |
```

#### Step 4: Report and Resolve

Present the QA report to the user. If any tests FAIL:

1. **Diagnose**: Identify whether the failure is in the new code, existing code,
   or test data.
2. **Fix or File**: If the fix is within the current task scope, fix it and
   re-test. If it's a separate issue, create a new task in
   `project-management/backlog/`.
3. **Re-run**: After fixes, re-run the failed tests to confirm they pass.

The feature is not done until Jordan's QA report shows all PASS. If tests cannot
pass due to missing test data or environment issues, document the blockers
clearly.

---

## Quality Standards for Generated Skills

Every skill this harness produces MUST meet these standards:

- **Atomic purpose**: One skill = one job. If the description needs "and", it's
  two skills.
- **Predictable behavior**: Same input should produce same category of output.
  No surprise side effects.
- **Graceful degradation**: If a tool or command fails, the skill should tell
  the user what happened and what to do — not silently break.
- **Minimal footprint**: Only request tools you use. Only create files you need.
  Only add frontmatter fields that differ from defaults.
- **Tested mental model**: Before writing the skill, mentally trace through a
  real invocation. Does the flow make sense? Are there dead paths?

---

## Frontmatter Field Reference

Only include fields that differ from their defaults:

| Field | Default | Include when... |
|-------|---------|-----------------|
| `name` | directory name | You want a different slash command name than the directory |
| `description` | *(none)* | **Always** — this is how Claude decides to use the skill |
| `argument-hint` | *(none)* | The skill accepts arguments |
| `disable-model-invocation` | `false` | Skill has side effects or should only be manually triggered |
| `user-invocable` | `true` | Set to `false` for background knowledge skills |
| `allowed-tools` | *(none)* | Skill needs tools without permission prompts |
| `model` | session model | Skill needs a specific model (e.g., `opus` for complex reasoning) |
| `effort` | session default | Skill needs higher/lower effort than session default |
| `context` | inline | Set to `fork` for isolated subagent execution |
| `agent` | `general-purpose` | Skill uses `context: fork` and needs a specific agent type |
| `paths` | *(none)* | Skill should only auto-activate for matching file patterns |
| `shell` | `bash` | Skill needs PowerShell |
