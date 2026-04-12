# Reference Skill Template

Use this template for skills that add **knowledge and conventions** Claude
applies to current work. Reference skills run inline — their instructions merge
into the conversation context.

**When to use**: Coding standards, API patterns, style guides, domain knowledge,
architectural conventions.

---

## Template

```yaml
---
name: {{SKILL_NAME}}
description: {{DESCRIPTION_FRONT_LOADED_50_CHARS}}. {{EXTENDED_DESCRIPTION}}
{{#if PATHS}}
paths: {{PATHS}}
{{/if}}
{{#if NOT_USER_INVOCABLE}}
user-invocable: false
{{/if}}
---

# {{SKILL_TITLE}}

## When This Applies

{{TRIGGER_CONDITIONS}}

## Rules

{{NUMBERED_OR_BULLETED_RULES}}

## Examples

### Good

{{GOOD_EXAMPLE}}

### Bad

{{BAD_EXAMPLE}}
```

---

## Design Notes

- **No `context: fork`**: Reference skills run inline so their rules stay in
  context for the entire task.
- **No `allowed-tools`**: Reference skills observe and advise — they don't
  perform actions that need tool pre-approval.
- **Use `paths`**: If the conventions only apply to certain files (e.g.,
  `src/**/*.ts`), scope them with `paths` so Claude doesn't load the skill
  for unrelated work.
- **Use `user-invocable: false`**: If the skill is pure background knowledge
  that Claude should auto-load based on context, hide it from the `/` menu.
- **Include examples**: Good/bad pairs are the most effective way to communicate
  conventions. Show, don't just tell.
