# Skill Validation Checklist

Run every generated skill through this checklist before declaring it ready.
Every item must PASS.

---

## Frontmatter Validation

| # | Check | How to Verify |
|---|-------|---------------|
| F1 | YAML frontmatter is syntactically valid | Parse between `---` markers — no YAML errors |
| F2 | `description` exists and is non-empty | Field present, length > 0 |
| F3 | `description` front-loads the use case | First 50 chars convey the primary purpose |
| F4 | `description` is under 250 characters | `description.length <= 250` |
| F5 | `name` is kebab-case, max 64 chars | Matches `/^[a-z0-9]+(-[a-z0-9]+)*$/`, length <= 64 |
| F6 | `disable-model-invocation` is `true` for side-effect skills | If skill writes files, runs commands, or deploys, this must be set |
| F7 | `allowed-tools` lists only tools the skill actually uses | No phantom tool approvals |
| F8 | `context: fork` is set only when isolation is needed | Not set for simple reference or lightweight task skills |
| F9 | `argument-hint` matches the arguments used in the body | If body uses `$0`, hint documents what `$0` means |
| F10 | No default-value fields included | Don't include `user-invocable: true`, `shell: bash`, etc. |

## Content Validation

| # | Check | How to Verify |
|---|-------|---------------|
| C1 | SKILL.md is under 500 lines | `wc -l SKILL.md` |
| C2 | Instructions are standing rules, not one-shot steps | Re-read after imagining the skill running 3 times — do the instructions still make sense? |
| C3 | No hallucinated tool names | Every tool referenced exists in Claude Code's tool set |
| C4 | Arguments are documented | If `$0`/`$1`/`$ARGUMENTS` appear, their meaning is explained |
| C5 | Error handling exists for fallible operations | Steps that can fail have "if this fails..." guidance |
| C6 | Output format is specified (for forked skills) | Subagent skills define what to return |
| C7 | No secrets or credentials in the skill | No API keys, tokens, passwords, or env var values |

## Architectural Validation

| # | Check | How to Verify |
|---|-------|---------------|
| A1 | Atomic purpose — one skill, one job | Description doesn't use "and" to join two different capabilities |
| A2 | No overlap with existing skills | Check `.claude/skills/*/SKILL.md` — no duplicate coverage |
| A3 | Correct archetype chosen | Reference skills don't fork; task skills disable auto-invocation |
| A4 | Supporting files are justified | Every file in the skill directory is referenced from SKILL.md |
| A5 | Directory structure is minimal | No empty subdirectories, no unused templates |

## Integration Validation

| # | Check | How to Verify |
|---|-------|---------------|
| I1 | File is at correct path | `.claude/skills/<name>/SKILL.md` |
| I2 | Directory name matches skill name | Unless `name` frontmatter overrides it intentionally |
| I3 | Skill appears in autocomplete | Type `/<name>` in Claude Code |
| I4 | Skill runs without errors | Invoke once with test arguments |

---

## Scoring

- **All PASS**: Skill is ready to commit.
- **Any FAIL**: Fix before proceeding. The harness should fix automatically
  where possible and report remaining issues to the user.
