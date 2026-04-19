# TASK-101 — Pipeline Risk Flags UI (RiskBadge component)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Build a `RiskBadge` UI component that displays risk level indicators on pipeline deal cards. The badge renders color-coded risk levels (low/medium/high/critical) derived from the CPQ risk assessment engine.

## Acceptance Criteria
- `RiskBadge` component accepts `riskLevel` and `score` props
- Color coding: low=green, medium=yellow, high=orange, critical=red
- Renders score as numeric label alongside level text
- Accessible — ARIA label includes full risk description
- Unit tested with all four risk levels

## Implementation Notes
- Component: `packages/twenty-front/src/modules/cpq/components/RiskBadge.tsx`
- Uses Linaria CSS-in-JS for styling with Twenty design tokens
- Integrates with pipeline deal card via `CpqPipelineCard` component
