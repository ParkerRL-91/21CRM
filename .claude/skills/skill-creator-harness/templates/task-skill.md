# Task Skill Template

Use this template for skills that execute **step-by-step actions** — deployments,
migrations, code generation, database operations, or any workflow with discrete
sequential steps.

**When to use**: The user says "do X" and X has a predictable sequence of
operations.

---

## Template

```yaml
---
name: {{SKILL_NAME}}
description: {{DESCRIPTION_FRONT_LOADED_50_CHARS}}. {{EXTENDED_DESCRIPTION}}
disable-model-invocation: true
{{#if ARGUMENT_HINT}}
argument-hint: "{{ARGUMENT_HINT}}"
{{/if}}
allowed-tools: [{{ALLOWED_TOOLS}}]
{{#if HIGH_EFFORT}}
effort: high
{{/if}}
---

# {{SKILL_TITLE}}

## Prerequisites

{{PREREQUISITES_OR_PRECONDITIONS}}

## Steps

{{NUMBERED_SEQUENTIAL_STEPS}}

## Error Handling

{{WHAT_TO_DO_WHEN_STEPS_FAIL}}

## Verification

{{HOW_TO_CONFIRM_SUCCESS}}
```

---

## Design Notes

- **Always set `disable-model-invocation: true`**: Task skills have side effects.
  Only the user should trigger them — never auto-invocation.
- **Pre-approve tools**: List every tool the workflow needs in `allowed-tools` to
  maintain flow. Use glob patterns for Bash: `Bash(npm *)`, `Bash(git *)`.
- **Include prerequisites**: What must be true before the skill runs? (branch
  checked out, env vars set, dependencies installed)
- **Include error handling**: Every step that can fail should have a "what to do
  if this fails" instruction. Don't let Claude guess.
- **Include verification**: How does the user know it worked? A URL to visit, a
  command to run, an output to check.
- **Use arguments for parameterization**: `$0` for the primary target,
  `$1`/`$2` for options. Document what each argument means.
