---
title: "AI Deal Scoring Prototype"
id: TASK-115
project: PRJ-005
status: backlog
priority: P2
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #ai, #pipeline, #analytics, #scoring, #prototype]
---

# TASK-115: AI Deal Scoring Prototype

## User Stories

- As **Dana (VP RevOps)**, I want an AI-generated deal score on every open opportunity based on historical patterns (time in stage, deal velocity, engagement signals, amount changes) so I can quickly prioritize where to focus attention beyond simple stage-based probability.
- As **Morgan (Sales Manager)**, I want deal scores to surface hidden risk that stage-based probabilities miss (e.g., a deal in "negotiation" stage that has gone cold based on activity patterns) so I can coach reps on at-risk deals before they slip.
- As **Alex (Sales Rep)**, I want to understand why a deal received its score (feature importance / explanations) so I can take specific actions to improve the deal's likelihood of closing rather than just seeing a number.
- As **Casey (Finance/Controller)**, I want AI-scored pipeline weighting as an alternative to stage-based weighting for revenue projections so I can compare forecast accuracy between the two methods.

## Outcomes

1. **Deal scoring engine**: Assigns a 0-100 score to each open deal based on historical patterns from closed deals
2. **Feature inputs**: Days in current stage, total days in pipeline, number of stage changes, amount change history, close date stability, deal size relative to average, owner win rate, pipeline stage
3. **Model approach**: Start with a rule-based scoring model (weighted feature combination) — not ML. This can be upgraded to ML later when training data is sufficient.
4. **Score explanations**: Each score comes with top 3 factors contributing positively and negatively (e.g., "Above average time in stage (-15 points)", "Strong close date stability (+10 points)")
5. **Integration**: Score visible on pipeline page deal cards, sortable/filterable by score
6. **Comparison**: Optional toggle to use AI scores instead of stage probability for weighted pipeline calculations

## Success Metrics

- [ ] Every open deal receives a 0-100 score computed from historical patterns
- [ ] Score factors include at minimum: days in stage, stage velocity, amount stability, close date stability, owner win rate
- [ ] Each score includes top 3 positive and top 3 negative contributing factors with explanations
- [ ] Scores visible as a column in pipeline deal table, sortable
- [ ] Score badges on kanban cards with color coding (green 70+, yellow 40-69, red 0-39)
- [ ] Score computation runs in under 2 seconds for 500 open deals
- [ ] Rule weights are configurable (can tune without code changes)
- [ ] Backtesting: when applied to historical closed deals, high-score deals have higher close rates
- [ ] Unit tests cover scoring logic and factor extraction

## Implementation Plan

1. Create `src/lib/pipeline/deal-scoring-engine.ts`:
   - `computeDealScore(deal, history, changeLog, benchmarks)` — compute 0-100 score
   - `computeScoreFactors(deal, history, changeLog, benchmarks)` — explain contributing factors
   - `computeBenchmarks(closedDeals, history)` — compute averages and distributions for comparison
   - Scoring rules (configurable weights):
     - **Stage velocity**: days in current stage vs average for this stage (-20 to +20)
     - **Pipeline velocity**: total days in pipeline vs average (-15 to +15)
     - **Amount stability**: number of amount changes, net direction (-15 to +15)
     - **Close date stability**: number of close date changes (-15 to +15)
     - **Deal size**: relative to average deal size for this stage (-10 to +10)
     - **Owner performance**: owner's historical win rate for similar deals (-10 to +10)
     - **Stage progression**: number of forward vs backward moves (-15 to +15)
     - Base score: 50 (neutral), adjusted by factors
2. Create `src/app/api/pipeline/scores/route.ts`:
   - GET: compute and return scores for all open deals
   - Include score, factors, and scoring metadata
   - Cache scores for configurable duration (default: 1 hour)
3. Update pipeline page:
   - Add score column to deal table (sortable)
   - Add score badges to kanban cards
   - Add "Sort by AI Score" option
   - Optional: score distribution chart showing pipeline health
4. Create score configuration in settings:
   - Adjustable weights per factor
   - Enable/disable specific factors
   - Backtesting: show historical accuracy of current weights

## Files to Change

- `src/lib/pipeline/deal-scoring-engine.ts` — NEW: rule-based deal scoring engine
- `src/lib/pipeline/deal-scoring-engine.test.ts` — NEW: comprehensive unit tests
- `src/lib/pipeline/scoring-types.ts` — NEW: TypeScript types for scores, factors, benchmarks
- `src/app/api/pipeline/scores/route.ts` — NEW: API endpoint for deal scores
- `src/app/(dashboard)/pipeline/page.tsx` — add score column, kanban badges, sort option
- `src/components/pipeline/deal-score-badge.tsx` — NEW: score badge with color coding
- `src/components/pipeline/score-explanation-popover.tsx` — NEW: factor explanation popover
- `src/app/(dashboard)/settings/page.tsx` — scoring weight configuration

## Tests to Write

- `src/lib/pipeline/deal-scoring-engine.test.ts`:
  - Score range: always between 0 and 100
  - Stage velocity: deal in stage longer than average scores lower
  - Stage velocity: deal in stage shorter than average scores higher
  - Amount stability: deal with stable amount scores higher than one with multiple changes
  - Close date stability: deal with stable close date scores higher
  - Owner performance: deals from high-win-rate owners score higher
  - Stage progression: forward movement scores higher than backward movement
  - Factor explanations: top factors correctly identified and labeled
  - Factor explanations: positive and negative factors distinguished
  - Benchmarks: correctly computed from historical closed deals
  - Edge cases: deal with no history (gets neutral score), deal with zero amount
  - Backtesting: high-score historical deals have higher actual close rates than low-score deals
  - Weight configuration: custom weights change scores predictably
  - Boundary: extreme values don't push score below 0 or above 100

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #9 (AI/Conversational Analytics). Scoped as rule-based prototype. ML upgrade path when training data is sufficient. Depends on TASK-102 risk flags for some input signals.

## Takeaways

_To be filled during execution_
