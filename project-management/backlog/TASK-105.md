# TASK-105 — RevRec Toggle (RevRecToggle + RevRecModeSelector)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Build `RevRecToggle` and `RevRecModeSelector` components that let users switch revenue recognition method (straight-line, milestone, usage-based) per contract or globally for the workspace.

## Acceptance Criteria
- Toggle component switches between recognition modes inline on contract record
- Mode selector dropdown supports: straight-line, milestone, percent-complete, usage-based
- Selection persists to contract metadata via GraphQL mutation
- Changing mode triggers re-computation of the revenue waterfall
- Accessible keyboard navigation

## Implementation Notes
- Components: `packages/twenty-front/src/modules/cpq/components/RevRecToggle.tsx`, `RevRecModeSelector.tsx`
- Uses Twenty's existing Select/Dropdown primitives from twenty-ui
- Mode stored on `cpq_contract.revRecMethod` field
