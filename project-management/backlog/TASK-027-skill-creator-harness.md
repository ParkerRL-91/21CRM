---
title: Add skill-creator-harness Claude Code skill
id: TASK-027
project: PRJ-001
status: done
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #developer-experience, #skills]
---

# TASK-027: Add skill-creator-harness Claude Code skill

## User Stories
- As a developer, I want a slash command that scaffolds new Claude Code skills so that every skill follows Anthropic's best practices and our project conventions
- As a developer, I want guided skill creation so that I don't have to memorize the SKILL.md format, frontmatter fields, and design patterns

## Outcomes
A `/skill-creator-harness` slash command that:
1. Interviews the user about the skill they want to build
2. Generates a properly structured SKILL.md with correct frontmatter
3. Creates supporting file structure (templates, scripts, examples) as needed
4. Follows Anthropic's published recommendations for prompt engineering and skill design
5. Validates the generated skill against best practices

## Success Metrics
- [ ] Skill is discoverable via `/skill-creator-harness` autocomplete
- [ ] Generated skills have valid YAML frontmatter with all recommended fields
- [ ] Skill covers all archetypes: reference, task, dynamic-context, forked-subagent
- [ ] Includes validation checklist for generated skills
- [ ] Works with `$ARGUMENTS` for quick generation mode

## Implementation Plan
1. Create `.claude/skills/skill-creator-harness/` directory structure
2. Write SKILL.md with comprehensive generation instructions
3. Include template files for each skill archetype
4. Include a validation checklist as a supporting file
5. Test by using the skill to create a sample skill

## Files to Change
- `.claude/skills/skill-creator-harness/SKILL.md` — main skill definition (new)
- `.claude/skills/skill-creator-harness/crm-admin-persona.md` — Jordan persona for QA (new)
- `.claude/skills/skill-creator-harness/templates/reference-skill.md` — template (new)
- `.claude/skills/skill-creator-harness/templates/task-skill.md` — template (new)
- `.claude/skills/skill-creator-harness/templates/dynamic-context-skill.md` — template (new)
- `.claude/skills/skill-creator-harness/templates/forked-subagent-skill.md` — template (new)
- `.claude/skills/skill-creator-harness/validation-checklist.md` — quality gate (new)
- `project-management/backlog/TASK-027-skill-creator-harness.md` — this file (new)
- `project-management/ACTIVE.md` — add task to sprint (edit)

## Status Log
- 2026-04-12: Created
- 2026-04-12: Started — building skill-creator-harness
- 2026-04-12: Completed — all files created, validated structure
- 2026-04-12: Added CRM admin persona (Jordan) and Phase 5: QA — every harness-built feature gets tested on the live site

## Takeaways
- Claude Code skills are discovered automatically from `.claude/skills/<name>/SKILL.md` — no registration needed
- The `!`command`` syntax for dynamic context injection runs at prompt render time, not at Claude execution time — important distinction for harness design
- Four archetype patterns cover most skill use cases: reference (inline knowledge), task (sequential actions), dynamic (live data injection), forked (isolated subagent)
- Anthropic recommends front-loading the first 50 chars of `description` since that's what drives auto-invocation decisions
- `context: fork` with `agent: Explore` is the fast path for read-only research; `general-purpose` is slower but more capable
- Validation checklist should be a separate file, not inline in SKILL.md, to keep the main file under 500 lines
- CRM admin persona (Jordan) is the QA gate — tests in business terms, not code terms. Catches number mismatches, missing labels, broken flows that devs miss
- Phase 5 QA uses curl/WebFetch to verify pages, not just type-checking — catches runtime issues that `tsc --noEmit` and vitest can't
