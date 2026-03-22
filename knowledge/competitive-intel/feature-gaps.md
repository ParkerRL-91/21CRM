---
title: Feature Gap Analysis
tags: [#competitive-intel, #strategy, #roadmap]
created: 2026-03-22
updated: 2026-03-22
---

# Feature Gap Analysis — 21CRM vs Competitors

Prioritized list of features that competitors have and 21CRM needs, plus features that NO competitor has but 21CRM should build.

---

## P0 — Unique Differentiators (No competitor has these)

| # | Feature | Description | Competitor Gap |
|---|---------|-------------|----------------|
| G-01 | **Projected Rev-Rec** | Show rev-rec for closed deals AND projected rev-rec for weighted pipeline deals. Toggle between closed-only and closed+weighted views. | Clari/Kluster don't do rev-rec. HubiFi doesn't do projected. Nobody does both. |
| G-02 | **Pipeline-to-Revenue Bridge** | Single view showing pipeline → bookings → recognized revenue → deferred. How pipeline converts to actual recognized revenue. | HubiFi starts at bookings. Clari stops at pipeline. Nobody bridges the full chain. |

## P1 — Must Have (Competitors have, users expect)

| # | Feature | Description | Source |
|---|---------|-------------|--------|
| G-03 | **Clickable Drill-Down** | Stat cards → filtered deal list. Every metric is interactive. | Clari |
| G-04 | **Deal Risk Flags** | Auto-flag stale deals (no stage change in X days), slipped close dates, downgraded stages. | Clari |
| G-05 | **Pipeline Movement View** | Weekly adds/losses/stage changes. Answers "what changed?" | Clari |
| G-06 | **Quarter Progression Chart** | Running closed-won total vs quota vs forecast as a line chart. | Clari, Kluster |
| G-07 | **Deferred Revenue Waterfall** | Opening balance → bookings → recognition → adjustments → closing balance. | HubiFi |
| G-08 | **Change Newsfeed / Activity Summary** | Surface anomalies and risks first, not charts. "Here's what changed." | Kluster |

## P2 — Should Have (Differentiating quality)

| # | Feature | Description | Source |
|---|---------|-------------|--------|
| G-09 | **Forecast Snapshots** | Freeze forecast data at a point in time for audit trail and period comparison. | Kluster, HubiFi |
| G-10 | **Multi-Method Forecast Display** | Show same forecast from weighted pipeline, scenario model, and historical pacing side-by-side. | Kluster |
| G-11 | **Interactive Forecast Sliders** | Adjust win rate, deal velocity, pipeline coverage with sliders → see impact. | Kluster |
| G-12 | **Scheduled Auto-Sync** | Daily background sync instead of manual "Sync Now" button. | Clari |
| G-13 | **Deal Prioritization Bubble Chart** | Size=revenue, color=stage, x=probability, y=days-in-stage. | Clari |
| G-14 | **ARR Movement Dashboard** | New ARR, churn, expansion, contraction breakdown. | HubiFi |

## P3 — Nice to Have (Future polish)

| # | Feature | Description | Source |
|---|---------|-------------|--------|
| G-15 | **Meeting-Centric View Presets** | Purpose-built dashboards for 1:1, forecast call, board meeting. | Kluster |
| G-16 | **Board-Ready Report Templates** | Pre-formatted executive views that look polished without config. | Kluster |
| G-17 | **Inline Deal Cards** | Quick-view popup on deal hover showing risk signals, next steps, timeline. | Kluster, Clari |
| G-18 | **Revenue Leakage Detection** | Auto-flag missed or under-recognized revenue. | HubiFi |
| G-19 | **Pivot Table UI for Rev-Rec** | Slice rev-rec data by segment, product, customer, period. | HubiFi |

---

## Implementation Mapping

PRJ-001 covers ALL gaps (G-01 through G-19) plus 7 bug-fix tasks:

| Gap | Task | Status |
|-----|------|--------|
| G-01 | TASK-001 | ready |
| G-02 | TASK-008 | ready |
| G-03 | TASK-003 | ready |
| G-04 | TASK-004 | ready |
| G-05 | TASK-005 | ready |
| G-06 | TASK-006 | ready |
| G-07 | TASK-002 | ready |
| G-08 | TASK-007 | ready |
| G-09 | TASK-009 | ready |
| G-10 | TASK-010 | ready |
| G-11 | TASK-011 | ready |
| G-12 | TASK-012 | ready |
| G-13 | TASK-013 | ready |
| G-14 | TASK-014 | ready |
| G-15 | TASK-015 | ready |
| G-16 | TASK-016 | ready |
| G-17 | TASK-017 | ready |
| G-18 | TASK-018 | ready |
| G-19 | TASK-019 | ready |
| Bug | TASK-020 (rev-rec generate button) | ready |
| Bug | TASK-021 (rep names) | ready |
| Bug | TASK-022 (industry display names) | ready |
| Bug | TASK-023 (ARR from line items) | ready |
| Bug | TASK-024 (currency CAD) | ready |
| Bug | TASK-025 (active subscriptions only) | ready |
| Bug | TASK-026 (billing period display names) | ready |

See [[learnings-synthesis]] for the strategic thinking behind this prioritization.
