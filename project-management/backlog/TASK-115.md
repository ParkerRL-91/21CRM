# TASK-115 — Deal Score Badge UI (DealScoreBadge + DealScoreBar)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Build `DealScoreBadge` and `DealScoreBar` UI components that surface deal health scores (from TASK-110) on pipeline cards and deal detail pages.

## Acceptance Criteria
- `DealScoreBadge` shows letter grade (A–F) with color coding matching grade tier
- `DealScoreBar` shows numeric score (0–100) as a filled progress bar
- Both components accept `score` and `grade` props from `DealScore` type
- Score trend indicator (↑/↓/→) shown when previous score available
- Accessible — score announced to screen readers
- Unit tested with all grade tiers and trend directions

## Implementation Notes
- Components: `packages/twenty-front/src/modules/cpq/components/DealScoreBadge.tsx`, `DealScoreBar.tsx`
- Grade colors use Twenty design tokens: A=green, B=teal, C=yellow, D=orange, F=red
- Integrates with pipeline card alongside `RiskBadge` (TASK-101)
