---
title: "Deal Risk Flags Engine + Pipeline Risk Badges"
id: TASK-102
project: PRJ-005
status: backlog
priority: P0
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #pipeline, #analytics, #risk, #engine]
---

# TASK-102: Deal Risk Flags Engine + Pipeline Risk Badges

## User Stories

- As **Dana (VP RevOps)**, I want every open deal automatically flagged when it shows risk signals (stale in stage, slipped close date, amount decreased) so I can see pipeline health at a glance without manually auditing hundreds of deals.
- As **Morgan (Sales Manager)**, I want a risk summary card at the top of the pipeline page showing total deals at risk and their combined value so I know exactly how much of my forecast is in danger before every pipeline review.
- As **Alex (Sales Rep)**, I want to see risk badges on my own deals so I can proactively address stale or slipping opportunities before my manager asks about them.
- As **Jordan (CRM Admin)**, I want risk thresholds to be configurable (e.g., stale after 14 days vs 21 days) so I can tune the system to our sales cycle without code changes.

## Outcomes

1. A `computeDealRisks()` engine function that evaluates every open deal against configurable risk rules
2. Risk categories: **Stale** (no stage change in N+ days), **Slipped** (close date pushed past original or close date in the past), **Shrinking** (amount decreased), **No Close Date**, **No Owner**
3. Risk badges visible on each deal row in the pipeline table and on kanban cards
4. A risk summary stat card at the top of the pipeline page: "X deals at risk ($Y value)" with breakdown by risk type
5. Risk scores stored/cached so they don't recompute on every page load
6. All risk computation uses local data only (deal_stage_history, property_change_log, crm_objects) — no HubSpot API calls

## Success Metrics

- [ ] Stale flag triggers when deal has been in the same stage for 14+ days (configurable threshold)
- [ ] Slipped flag triggers when closedate has been pushed later than original closedate, or closedate is in the past for open deals
- [ ] Shrinking flag triggers when deal amount has decreased from its maximum value
- [ ] No Close Date flag triggers for open deals without a closedate property
- [ ] No Owner flag triggers for deals without hubspot_owner_id
- [ ] Risk summary card shows total at-risk deal count and value, with per-type breakdown
- [ ] Risk badges render on pipeline table rows and kanban cards
- [ ] Risk thresholds are configurable via org settings (stored in organizations.syncConfig or app_config)
- [ ] Risk computation runs in under 500ms for 1,000 deals
- [ ] Unit tests cover all risk flag conditions including edge cases (deals with no history, deals closed today)

## Implementation Plan

1. Create `src/lib/pipeline/risk-engine.ts` with the core risk computation:
   - `RiskRule` interface: `{ type: string, evaluate: (deal, history, config) => RiskFlag | null }`
   - Built-in rules: StaleDealRule, SlippedCloseDateRule, ShrinkingAmountRule, NoCloseDateRule, NoOwnerRule
   - `computeDealRisks(deals, stageHistory, changeLog, config)` — batch evaluate all deals
   - `computeRiskSummary(risks)` — aggregate counts and values by risk type
2. Create `src/app/api/pipeline/risks/route.ts` API endpoint:
   - GET: compute and return risks for all open deals in the org
   - Accept optional query params for custom thresholds
   - Use parameterized queries via `client.unsafe()` to fetch deal_stage_history and property_change_log
3. Update pipeline page to display risk data:
   - Add risk summary stat card to the top row
   - Add risk badges to deal table rows
   - Add risk indicators to kanban cards
   - Add a "Show at-risk only" filter toggle
4. Store default risk thresholds in org config, with UI to override in settings

## Files to Change

- `src/lib/pipeline/risk-engine.ts` — NEW: core risk computation engine with rule-based architecture
- `src/lib/pipeline/risk-engine.test.ts` — NEW: unit tests for all risk rules and edge cases
- `src/lib/pipeline/risk-types.ts` — NEW: TypeScript interfaces for risk flags, rules, config, summaries
- `src/app/api/pipeline/risks/route.ts` — NEW: API endpoint for risk computation
- `src/app/(dashboard)/pipeline/page.tsx` — add risk summary card, risk badges on deals, at-risk filter
- `src/components/pipeline/risk-badge.tsx` — NEW: reusable risk badge component (Stale, Slipped, etc.)
- `src/components/pipeline/risk-summary-card.tsx` — NEW: risk summary stat card with breakdown

## Tests to Write

- `src/lib/pipeline/risk-engine.test.ts`:
  - Stale rule: triggers at threshold, does not trigger below, handles deals with no stage history
  - Slipped rule: triggers for past close dates, triggers for pushed dates, handles null close dates
  - Shrinking rule: triggers when amount decreased, ignores increases, handles deals with no change history
  - No Close Date rule: triggers for missing/null/empty closedate
  - No Owner rule: triggers for missing hubspot_owner_id
  - Batch computation: processes multiple deals, returns correct summary counts and values
  - Edge cases: deals with zero amount, deals closed today, deals with future close dates
  - Config overrides: custom thresholds change trigger behavior

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #2 (Deal Risk & Pipeline Health). Extends TASK-004 with configurable rules, shrinking/no-owner flags, and rule-based architecture.

## Takeaways

_To be filled during execution_
