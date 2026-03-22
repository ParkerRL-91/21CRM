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

PRJ-001 covers: G-01, G-03, G-04, G-05, G-06, G-07, G-08
Remaining gaps to be scheduled in future projects.

See [[learnings-synthesis]] for the strategic thinking behind this prioritization.
