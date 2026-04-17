---
title: "Quote-to-Revenue Bridge Visualization"
id: TASK-109
project: PRJ-005
status: backlog
priority: P1
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #rev-rec, #cpq, #differentiator, #lifecycle, #visualization]
---

# TASK-109: Quote-to-Revenue Bridge Visualization

## User Stories

- As **Dana (VP RevOps)**, I want a single view that shows the full revenue lifecycle — Quote Created → Quote Accepted → Deal Closed-Won → Revenue Recognized → Deferred Revenue — so I can trace any dollar from origination to recognition without jumping between 4 different tools.
- As **Casey (Finance/Controller)**, I want to see dollar amounts at each stage of the lifecycle with conversion rates between stages so I can identify where revenue leaks or delays occur (e.g., high quote-to-close drop-off, slow recognition).
- As **Morgan (Sales Manager)**, I want to see how much of our quoted pipeline has converted to closed revenue and how much is still pending so I can prioritize follow-up on accepted-but-not-yet-closed quotes.
- As **Jordan (CRM Admin)**, I want the bridge view to pull data from across the system (CPQ quotes, CRM deals, rev-rec schedules) and present it in one cohesive view without requiring manual data stitching.

## Outcomes

1. A new "Revenue Lifecycle" page or section showing a horizontal bridge/funnel:
   - **Quoted** → total value of quotes created in period
   - **Accepted/Signed** → total value of accepted quotes
   - **Closed-Won** → total value of closed-won deals
   - **Revenue Recognized** → total recognized revenue in period
   - **Deferred Revenue** → remaining deferred balance
2. Conversion rates between each stage (e.g., 80% quote-to-accept, 70% accept-to-close)
3. Dollar amounts at each stage with period selector (month, quarter, YTD)
4. Drill-down: click any stage to see the underlying quotes/deals/schedules
5. Loss callouts: where revenue falls out of the funnel (rejected quotes, lost deals, adjustments)
6. This is 21CRM's second unique differentiator — no competitor shows the full lifecycle in one view

## Success Metrics

- [ ] Bridge visualization shows all 5 lifecycle stages with dollar amounts
- [ ] Conversion rates calculated between each adjacent stage
- [ ] Period selector works for monthly, quarterly, and YTD views
- [ ] Each stage is clickable and drills to underlying records
- [ ] Loss callouts show where revenue exits the funnel (rejected quotes, lost deals)
- [ ] Data sourced from quotes (cpq_quotes), deals (crm_objects), and rev-rec (rev_rec_schedules)
- [ ] Page loads within 2 seconds for a typical quarter's data
- [ ] Handles organizations that don't use CPQ (gracefully degrades to deal → rev-rec only)

## Implementation Plan

1. Create `src/lib/lifecycle/bridge-engine.ts`:
   - `computeRevenueBridge(quotes, deals, schedules, dateRange)` — compute amounts at each lifecycle stage
   - `computeConversionRates(bridge)` — conversion % between adjacent stages
   - `computeLossPoints(bridge)` — where revenue exits (rejected, lost, adjusted)
   - `computeBridgeTimeline(data, periods)` — multi-period bridge for trend analysis
   - Type: `BridgeStage { stage, amount, count, items[] }`
2. Create `src/app/api/lifecycle/bridge/route.ts`:
   - GET: returns bridge data for a date range
   - Queries across cpq_quotes/contracts (if tables exist), crm_objects (deals), rev_rec_schedules
   - Gracefully handles missing CPQ data (shows deal → rev-rec bridge only)
3. Create bridge visualization:
   - `RevenueBridgeChart` — horizontal bridge/Sankey chart showing flow between stages
   - `BridgeStageCard` — individual stage card with amount, count, and conversion rate
   - `BridgeLossCallout` — callout showing where revenue exited
4. Create new page or integrate as a tab on rev-rec/dashboard page

## Files to Change

- `src/lib/lifecycle/bridge-engine.ts` — NEW: revenue lifecycle bridge computation engine
- `src/lib/lifecycle/bridge-engine.test.ts` — NEW: unit tests for bridge calculations
- `src/lib/lifecycle/bridge-types.ts` — NEW: TypeScript types for bridge stages, conversion rates
- `src/app/api/lifecycle/bridge/route.ts` — NEW: API endpoint for bridge data
- `src/app/(dashboard)/revenue-lifecycle/page.tsx` — NEW: revenue lifecycle page
- `src/components/lifecycle/revenue-bridge-chart.tsx` — NEW: bridge/Sankey visualization
- `src/components/lifecycle/bridge-stage-card.tsx` — NEW: individual stage card
- `src/components/lifecycle/bridge-loss-callout.tsx` — NEW: loss point callout

## Tests to Write

- `src/lib/lifecycle/bridge-engine.test.ts`:
  - Bridge computation: correct amounts at each lifecycle stage
  - Conversion rates: correct % between adjacent stages
  - Conversion rates: handles zero at a stage gracefully (0% or N/A)
  - Loss points: correctly identifies revenue lost at quote rejection stage
  - Loss points: correctly identifies revenue lost at deal-lost stage
  - Graceful degradation: works without CPQ data (deal → rev-rec only)
  - Period filtering: correctly scopes to date range
  - Multi-period: generates bridge data for multiple periods
  - Edge cases: deals with no quotes, quotes with no deals, schedules with no matching deals
  - Drill-down data: each stage includes list of underlying record IDs

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #5 (Quote-to-Revenue Bridge). Related to TASK-008 (pipeline-to-revenue bridge) in PRJ-001. This is 21CRM's unique differentiator — no competitor shows the full Quote → Revenue lifecycle.

## Takeaways

_To be filled during execution_
