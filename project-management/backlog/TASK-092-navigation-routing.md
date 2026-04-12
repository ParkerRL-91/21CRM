---
title: "Register CPQ pages in Twenty's navigation system"
id: TASK-092
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #frontend, #navigation, #routing]
---

# TASK-092: Register CPQ pages in Twenty's navigation system

## User Stories

- As a **CRM admin**, I want to access CPQ settings from the Settings menu so that I can enable/configure CPQ without knowing a URL.
- As a **Sales Rep**, I want to see Quotes and Contracts in the sidebar so that I can navigate to them like any other CRM object.

## Outcomes

CPQ pages registered in Twenty's routing and navigation system. After CPQ setup, Quotes and Contracts appear in the sidebar alongside People, Companies, and Opportunities. CPQ Settings appears under Settings > CPQ.

## Success Metrics

- [ ] `/settings/cpq` route renders CpqSetupPage
- [ ] After setup, "Quotes" and "Contracts" appear in sidebar (via custom object metadata navigation items — this happens automatically from `createOneObject`)
- [ ] CPQ Settings link in Settings page navigation
- [ ] Deep-linking works: `/objects/quotes`, `/objects/contracts` render Twenty's generic RecordIndexPage for CPQ objects
- [ ] Command palette includes "Go to Quotes", "Go to Contracts"

## Implementation Plan

1. Study Twenty's routing:
   - Read `twenty-front/src/modules/app/` for route definitions
   - Read `twenty-front/src/pages/settings/` for settings page patterns
   - Custom objects auto-register in navigation via metadata — verify this works

2. Add settings route for CPQ configuration:
   - Create `twenty-front/src/pages/settings/cpq/SettingsCpqPage.tsx`
   - Register in Twenty's settings route config
   - Page renders `CpqSetupPage` component

3. Verify auto-navigation for custom objects:
   - After `setupCpq()`, navigate to `/objects/quotes` — should show RecordIndexPage
   - Sidebar should show Quote + Contract entries automatically
   - If not, manually add navigation items via metadata API

## Files to Change

- `twenty/packages/twenty-front/src/pages/settings/cpq/SettingsCpqPage.tsx` — NEW
- `twenty/packages/twenty-front/src/modules/app/` — MODIFY: add settings route
