# Dynamic Context Skill Template

Use this template for skills that **inject live data** into the prompt before
Claude processes it. Dynamic context skills use the `` !`command` `` syntax
to execute shell commands at prompt render time, making real-time information
available without Claude having to run tools first.

**When to use**: PR summaries, test failure analysis, git state inspection,
environment diagnostics — anything where Claude needs fresh external data to
do its job.

---

## Template

```yaml
---
name: {{SKILL_NAME}}
description: {{DESCRIPTION_FRONT_LOADED_50_CHARS}}. {{EXTENDED_DESCRIPTION}}
{{#if ARGUMENT_HINT}}
argument-hint: "{{ARGUMENT_HINT}}"
{{/if}}
{{#if DISABLE_MODEL_INVOCATION}}
disable-model-invocation: true
{{/if}}
allowed-tools: [{{ALLOWED_TOOLS}}]
---

# {{SKILL_TITLE}}

## Live Context

{{SECTION_LABEL_1}}:
```!
{{SHELL_COMMAND_1}}
```

{{SECTION_LABEL_2}}:
```!
{{SHELL_COMMAND_2}}
```

## Your Task

Given the context above:

{{INSTRUCTIONS_THAT_REFERENCE_LIVE_DATA}}
```

---

## Design Notes

- **`` !`command` `` runs at render time**: The shell command executes *before*
  Claude sees the prompt. The output replaces the command block. This is faster
  than having Claude run tools, and ensures context is always fresh.
- **Keep commands fast**: These commands run synchronously before Claude starts.
  Avoid commands that take more than a few seconds. If you need slow commands,
  use a task skill with explicit Bash tool calls instead.
- **Handle command failure**: Add `|| echo "COMMAND FAILED: <description>"` to
  commands that might fail, so Claude sees a clear error instead of empty output.
- **Combine with arguments**: Use `$0`, `$1` inside `` !`command` `` blocks to
  parameterize the live context:
  ```
  ```!
  git log --oneline $0..HEAD
  ```
  ```
- **Don't over-inject**: Only include context Claude actually needs. Every line
  of injected output consumes context window. Be selective.
- **Security**: Never inject secrets or credentials via `` !`command` ``. The
  output becomes part of the prompt and may be logged.
