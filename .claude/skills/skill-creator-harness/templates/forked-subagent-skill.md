# Forked Subagent Skill Template

Use this template for skills that run in an **isolated subagent context**. The
skill spawns a separate agent that works independently and returns results to
the main conversation. This protects the main context window from large
intermediate outputs.

**When to use**: Deep codebase research, large-scale code generation, audit
tasks, analysis that produces lots of intermediate output, or tasks where
isolation prevents accidental side effects.

---

## Template

```yaml
---
name: {{SKILL_NAME}}
description: {{DESCRIPTION_FRONT_LOADED_50_CHARS}}. {{EXTENDED_DESCRIPTION}}
{{#if ARGUMENT_HINT}}
argument-hint: "{{ARGUMENT_HINT}}"
{{/if}}
context: fork
agent: {{AGENT_TYPE}}
{{#if DISABLE_MODEL_INVOCATION}}
disable-model-invocation: true
{{/if}}
allowed-tools: [{{ALLOWED_TOOLS}}]
{{#if MODEL_OVERRIDE}}
model: {{MODEL_OVERRIDE}}
{{/if}}
effort: high
---

# {{SKILL_TITLE}}

## Objective

{{CLEAR_SINGLE_SENTENCE_OBJECTIVE}}

## Scope

{{WHAT_TO_INCLUDE_AND_EXCLUDE}}

## Method

{{NUMBERED_RESEARCH_OR_GENERATION_STEPS}}

## Output Format

{{EXACT_FORMAT_OF_WHAT_THE_SUBAGENT_RETURNS}}

Return your findings in the format above. Be specific — include file paths,
line numbers, and code snippets where relevant.
```

---

## Agent Types

Choose the right agent for the job:

| Agent Type | Best For |
|------------|----------|
| `Explore` | Fast codebase exploration, file search, pattern matching |
| `Plan` | Architecture planning, implementation strategy, design review |
| `general-purpose` | Multi-step tasks, code changes, complex research |

---

## Design Notes

- **Always specify `agent`**: The default (`general-purpose`) is capable but
  slower. Use `Explore` for read-only research tasks — it's significantly
  faster.
- **Define output format explicitly**: The subagent returns a single message.
  If you don't specify the format, you'll get unpredictable output that's hard
  to use downstream.
- **Set scope boundaries**: Without clear scope, subagents will explore
  everything. Constrain the search to relevant directories, file types, or
  concepts.
- **Use `effort: high`**: Forked tasks are typically complex enough to warrant
  high effort. Don't skimp on reasoning for research tasks.
- **Consider `model: opus`**: For tasks requiring deep reasoning or nuanced
  judgment, explicitly request the most capable model.
- **Don't fork simple tasks**: If the task can be done in 2-3 tool calls, run
  it inline. Forking has overhead — use it when the intermediate output would
  be too large for the main context.
