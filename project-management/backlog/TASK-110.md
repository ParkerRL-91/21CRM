# TASK-110 — Deal Scoring Engine (deal-scoring.ts)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Implement the `deal-scoring.ts` engine that computes a composite deal health score (0–100) by aggregating signals: engagement, stage velocity, relationship strength, and competitive risk.

## Acceptance Criteria
- `scoreDeal(deal: DealScoringInput): DealScore` returns score, grade, and per-signal breakdown
- Grade tiers: A (80–100), B (60–79), C (40–59), D (20–39), F (0–19)
- Signals: engagement (30%), stage velocity (25%), value alignment (25%), competitive risk (20%)
- Score degrades over time if no activity recorded
- Unit tested with a range of deal health scenarios

## Implementation Notes
- File: `packages/twenty-front/src/modules/cpq/engines/deal-scoring.ts`
- Score displayed via `DealScoreBadge` and `DealScoreBar` components (TASK-115)
- Reuses risk signal patterns from backend `CpqRiskService`
