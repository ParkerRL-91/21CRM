---
title: "Mobile Responsive Pass on All Dashboard Pages"
id: TASK-112
project: PRJ-005
status: backlog
priority: P2
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #ux, #mobile, #responsive, #dashboard]
---

# TASK-112: Mobile Responsive Pass on All Dashboard Pages

## User Stories

- As **Dana (VP RevOps)**, I want to check pipeline and forecast numbers on my phone during Monday leadership meetings so I can answer questions in real-time without opening a laptop.
- As **Morgan (Sales Manager)**, I want to review team metrics on my tablet between meetings so I can stay on top of pipeline health throughout the day without being tied to my desk.
- As **Alex (Sales Rep)**, I want to see my deal pipeline on mobile when I'm traveling between customer meetings so I can quickly verify deal status and prep for conversations.
- As **Jordan (CRM Admin)**, I want all dashboard pages to render cleanly on mobile/tablet without horizontal scrolling, overlapping content, or unreadable text so I don't get complaints from the team about a broken mobile experience.

## Outcomes

1. All dashboard pages (pipeline, forecast, rev-rec, team, subscriptions, dashboards, recipes, settings) render cleanly on mobile (320px-480px) and tablet (768px-1024px) viewports
2. Stat card grids stack vertically on mobile (1 column), 2 columns on tablet, 3-4 columns on desktop
3. Data tables become horizontally scrollable or stack into card-based layouts on mobile
4. Charts resize responsively with readable labels (no overlapping text)
5. Navigation works on mobile: responsive sidebar that collapses to hamburger menu
6. Touch-friendly interactions: tap targets at least 44px, no hover-dependent UI
7. Kanban board scrolls horizontally on mobile with visible scroll indicators
8. Settings page forms stack vertically on mobile

## Success Metrics

- [ ] Pipeline page: stat cards, charts, deal table all render without overflow on 375px viewport
- [ ] Forecast page: scenario tabs, assumption tables readable on mobile
- [ ] Rev-rec page: schedule table scrollable, waterfall chart resized
- [ ] Team page: rep cards stack, leaderboard readable on mobile
- [ ] Subscriptions page: metrics and tables responsive
- [ ] Dashboard page: widget grid stacks appropriately
- [ ] Settings page: forms and field picker usable on mobile
- [ ] Navigation: sidebar collapses to hamburger on mobile, overlay menu works
- [ ] All tap targets are at least 44px minimum
- [ ] No horizontal scroll on the page body (individual containers may scroll)
- [ ] Tested on iOS Safari (iPhone 14/15) and Chrome Android viewport sizes

## Implementation Plan

1. Audit every dashboard page for responsive issues:
   - Test each at 375px, 768px, and 1024px viewports
   - Document every breakage (overflow, overlap, truncation, unreadable)
2. Establish responsive breakpoints in Tailwind config (if not already done):
   - sm: 640px, md: 768px, lg: 1024px, xl: 1280px (Tailwind defaults)
3. Fix stat card grids:
   - Use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` pattern
   - Ensure cards maintain minimum readable width
4. Fix data tables:
   - Wrap in horizontal scroll container on mobile
   - Consider card-based layout for key tables (deal list, team metrics)
   - Pin first column (deal name) on horizontal scroll
5. Fix charts:
   - Ensure responsive width (100% of container)
   - Adjust font sizes and label rotation for small viewports
   - Reduce data density on mobile (fewer axis labels)
6. Fix navigation:
   - Sidebar collapses to hamburger icon on mobile
   - Overlay menu slides in from left
   - Close on outside click or navigation
7. Fix kanban board:
   - Horizontal scroll with visible scroll indicator
   - Cards maintain minimum width for readability
8. Test all interactions on touch: tap targets, swipe gestures, no hover dependencies

## Files to Change

- `src/app/(dashboard)/layout.tsx` — responsive sidebar with hamburger menu
- `src/app/(dashboard)/pipeline/page.tsx` — responsive stat cards, table, kanban, charts
- `src/app/(dashboard)/forecast/page.tsx` — responsive tabs, assumption tables
- `src/app/(dashboard)/rev-rec/page.tsx` — responsive schedule table, charts
- `src/app/(dashboard)/team/page.tsx` — responsive rep cards, leaderboard
- `src/app/(dashboard)/subscriptions/page.tsx` — responsive metrics, tables
- `src/app/(dashboard)/dashboards/page.tsx` — responsive widget grid
- `src/app/(dashboard)/settings/page.tsx` — responsive forms, field picker
- `src/app/(dashboard)/recipes/page.tsx` — responsive recipe builder
- `src/components/charts/*.tsx` — responsive chart widths and label sizes
- `src/components/charts/metric-card.tsx` — responsive card sizing
- `src/components/ui/data-table.tsx` — horizontal scroll wrapper for mobile (if exists)

## Tests to Write

No unit tests required for this task (UI/responsive work). Verification is manual:
- Visual testing at 375px, 768px, 1024px, and 1440px viewports
- Touch interaction testing on mobile Safari and Chrome Android
- Navigation collapse/expand testing

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #10 (Mobile & Responsive). Affects every dashboard page — broad but shallow changes.

## Takeaways

_To be filled during execution_
