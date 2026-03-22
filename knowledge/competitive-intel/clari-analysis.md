---
title: Clari Competitive Analysis
tags: [#competitive-intel, #ux]
created: 2026-03-22
updated: 2026-03-22
---

# Clari Analysis

Clari is a $400+/user/month enterprise Revenue Orchestration Platform. Primary competitor for pipeline + forecasting.

## What They Do Well

- **Deal risk scoring**: Auto-flags stalled deals based on activity + progression velocity
- **Pipeline movement waterfall**: Week-over-week view of adds/removals/stage changes
- **Drill-down UX**: Every metric is clickable → team breakdown → individual deals
- **Deal prioritization bubble chart**: Size=revenue, color=stage, x=probability, y=engagement
- **Quarter progression line chart**: Closed-won running total vs quota vs forecast
- **Real-time sync**: Auto-syncs from CRM, users never think about data freshness

## What They Get Wrong

- **Over-modularized**: Separate products (Forecast, Inspect, Capture, Groove, Copilot) feel disjointed
- **Clunky UI**: Users describe it as "not intuitive" despite the price tag
- **Mandatory CRM dependencies**: Fields must exist in Salesforce or it breaks
- **Heavy onboarding**: 8-16 weeks to deploy, features go unused ("shelfware")
- **Complex activity tracking**: Hard to explain to sellers

## Lessons for 21CRM

| Priority | Feature to Build | Source Insight |
|----------|-----------------|---------------|
| P1 | Clickable stat cards → drill to deals | Clari's #1 UX strength |
| P1 | Deal risk flags (stale, slipped close date) | Most praised feature |
| P1 | Pipeline movement view (weekly adds/losses) | Answers "what changed?" |
| P1 | Quarter progression chart | Users check this constantly |
| P2 | Scheduled auto-sync | Removes manual sync friction |
| P2 | Deal prioritization bubble chart | Signature visualization |

**Key insight**: The biggest gap is **interactivity**, not features. Making existing data clickable and drillable closes most of the UX gap.

See [[system-overview]] for current 21CRM architecture.
