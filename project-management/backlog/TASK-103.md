# TASK-103 — Subscription Health Dashboard (CpqHealthDashboard)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Build a `CpqHealthDashboard` component that provides a bird's-eye view of subscription health across the workspace — renewal rates, at-risk counts, ARR at risk, and churn indicators.

## Acceptance Criteria
- Displays summary KPI cards: total active subscriptions, renewals due this quarter, ARR at risk
- Risk breakdown chart shows distribution across low/medium/high/critical
- Drill-down to individual at-risk subscriptions
- Data refreshes on mount and every 5 minutes
- Responsive — works on mobile viewport

## Implementation Notes
- Component: `packages/twenty-front/src/modules/cpq/components/CpqHealthDashboard.tsx`
- Pulls data via `/cpq/status` and `/cpq/assess-risk` REST endpoints
- Chart rendered with Recharts library already present in twenty-front
