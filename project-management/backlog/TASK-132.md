---
title: Register CPQ pages in Twenty navigation
id: TASK-132
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, navigation, routing, discoverability, differentiator]
---

# TASK-132 — Register CPQ Pages in Twenty Navigation

## Context

Users cannot find CPQ pages through normal navigation. Dana Chen's review noted that she could only reach the quote builder via a direct URL — it's not in the sidebar, command palette, or any navigation menu. The CPQ setup page is registered in Settings (via `SettingsRoutes.tsx` at line ~850), but the quote builder page (`QuoteBuilderPage.tsx`) lives in `pages/cpq/` and is apparently not discoverable.

This task registers all CPQ pages in Twenty's navigation system: sidebar, command palette, and breadcrumbs.

## User Stories

**As Alex (Sales Rep)**, I want to find "New Quote" in the sidebar or command palette, so that I can start building a quote without memorizing a URL.

**As Dana (VP RevOps)**, I want CPQ pages to appear in the main navigation alongside other CRM features, so that it feels like a native part of the product, not an afterthought.

**As Jordan (CRM Admin)**, I want to see CPQ in the settings navigation, so that I can quickly jump to approval rules, templates, and product catalog management.

## Outcomes

- "CPQ" section appears in the sidebar navigation with links to: Quotes, Renewals, Dashboard
- "New Quote" is accessible via the command palette (Cmd+K)
- CPQ settings are navigable from the main Settings menu
- Breadcrumbs work on all CPQ pages
- Navigation items show appropriate icons (from TASK-123)

## Success Metrics

- [ ] "CPQ" label visible in sidebar navigation
- [ ] Sidebar shows links to: Quotes list, New Quote, Renewals, Dashboard
- [ ] Clicking sidebar links navigates to correct pages
- [ ] "New Quote" appears in command palette search results
- [ ] CPQ settings accessible from Settings menu
- [ ] Breadcrumbs on QuoteBuilderPage show: Home > CPQ > Quotes > New Quote
- [ ] Active page is highlighted in sidebar navigation
- [ ] Navigation items use Twenty icon components
- [ ] Unit tests verify route registration

## Implementation Plan

### Step 1: Register CPQ routes in AppRouter

Modify `packages/twenty-front/src/modules/app/components/AppRouter.tsx`:

Add routes for CPQ pages. Check how other top-level pages are registered and follow the same pattern:

```tsx
<Route path="/cpq" element={<CpqLayout />}>
  <Route index element={<CpqDashboardPage />} />
  <Route path="quotes" element={<CpqQuotesListPage />} />
  <Route path="quotes/new" element={<QuoteBuilderPage />} />
  <Route path="quotes/:id" element={<QuoteBuilderPage />} />
  <Route path="renewals" element={<CpqRenewalsPage />} />
</Route>
```

Import `QuoteBuilderPage` from `~/pages/cpq/QuoteBuilderPage`. Create placeholder pages for missing ones.

### Step 2: Add CPQ to sidebar navigation

Identify how other navigation sections are added. Check:
- `packages/twenty-front/src/modules/navigation/components/NavigationDrawerOtherSection.tsx`
- `packages/twenty-front/src/modules/object-metadata/components/NavigationDrawerSectionForObjectMetadataItems.tsx`

Add a CPQ section to the navigation drawer. This likely involves:
- Creating a `NavigationDrawerCpqSection.tsx` component
- Adding it to the main navigation drawer layout
- Items: Dashboard (IconChartBar), Quotes (IconFileText), Renewals (IconRefresh)

### Step 3: Register CPQ commands in command palette

Find where command palette items are defined. Check:
```bash
find packages/twenty-front/src -name "*commandMenu*" -o -name "*CommandMenu*" | head -20
```

Add CPQ commands:
- "New Quote" — navigates to /cpq/quotes/new
- "CPQ Dashboard" — navigates to /cpq
- "CPQ Settings" — navigates to settings/cpq
- "Renewal Dashboard" — navigates to /cpq/renewals

### Step 4: Update QuoteBuilderPage breadcrumbs

The `QuoteBuilderPage` already uses `SubMenuTopBarContainer` with breadcrumbs:
```tsx
links={[
  { children: 'CPQ', href: '/cpq' },
  { children: 'Quotes', href: '/cpq/quotes' },
  { children: 'New Quote' },
]}
```

Verify these breadcrumb links actually work after route registration. Update if needed.

### Step 5: Create placeholder pages

Create minimal placeholder pages that will be fleshed out later:

- `packages/twenty-front/src/pages/cpq/CpqDashboardPage.tsx` — wraps `CpqHealthDashboard`
- `packages/twenty-front/src/pages/cpq/CpqQuotesListPage.tsx` — placeholder list of quotes
- `packages/twenty-front/src/pages/cpq/CpqRenewalsPage.tsx` — wraps renewal dashboard

Each should use `SubMenuTopBarContainer` for consistent layout with proper breadcrumbs.

### Step 6: Update SettingsRoutes CPQ path

Verify the Settings > CPQ route is working correctly in `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx` (it appears to be at line ~850).

## Files to Change

- **Modify**: `packages/twenty-front/src/modules/app/components/AppRouter.tsx` — add CPQ routes
- **Create**: `packages/twenty-front/src/modules/navigation/components/NavigationDrawerCpqSection.tsx`
- **Modify**: Navigation drawer layout file (determine exact file from codebase)
- **Create**: `packages/twenty-front/src/pages/cpq/CpqDashboardPage.tsx`
- **Create**: `packages/twenty-front/src/pages/cpq/CpqQuotesListPage.tsx`
- **Create**: `packages/twenty-front/src/pages/cpq/CpqRenewalsPage.tsx`
- **Modify**: Command palette registration file (determine exact file)

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/navigation/components/__tests__/NavigationDrawerCpqSection.test.tsx`

- `should render CPQ section in navigation`
- `should show Dashboard, Quotes, and Renewals links`
- `should highlight active page`
- `should use correct icons for each item`

### Route tests: `packages/twenty-front/src/pages/cpq/__tests__/CpqRoutes.test.tsx`

- `should render QuoteBuilderPage at /cpq/quotes/new`
- `should render dashboard at /cpq`
- `should render renewals at /cpq/renewals`
- `should redirect unknown CPQ paths`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
