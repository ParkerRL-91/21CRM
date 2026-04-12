---
title: "Global contracts list page"
id: TASK-047
project: PRJ-002
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #ui]
---

# TASK-047: Global contracts list page

## User Stories

- As a **Customer Success manager**, I want a single page listing all my contracts across all accounts so that I can triage my portfolio without navigating account by account.
- As a **Sales Manager**, I want an overview of all contracts in the system with filtering and sorting so that I can understand the full contract landscape.

## Outcomes

A top-level `/contracts` page accessible from the sidebar navigation that lists all contracts with comprehensive filtering, sorting, and search. This is the primary entry point for CS managers managing multiple accounts.

## Success Metrics

- [ ] Page at `/contracts` accessible from sidebar navigation
- [ ] Table displays: contract name, account, status (badge), start date, end date, total value, days until expiration, owner, renewal status
- [ ] Filters: status, owner, expiration window (30/60/90/180 days), date range, search by name/account
- [ ] Sortable by any column (default: days until expiration ascending — most urgent first)
- [ ] Pagination with configurable page size
- [ ] Summary row: total contracts, total value, expiring soon count
- [ ] Row click navigates to contract detail page (TASK-031)
- [ ] "New Contract" button for manual creation
- [ ] Loading skeleton, error state, empty state defined
- [ ] Sidebar nav includes "Contracts" entry between Pipeline and Subscriptions

## Implementation Plan

Reuses the `AccountContracts` component patterns from TASK-030 but scoped to the full org rather than a single account. Fetches from `GET /api/contracts` with org-level scope.

### Sidebar Navigation

Add "Contracts" to the sidebar between existing items:
```
Dashboard
Pipeline
Forecast
Rev-Rec
Contracts  ← NEW
Renewals   ← From TASK-040
Subscriptions
Team
Recipes
Settings
```

## Files to Change

- `src/app/(dashboard)/contracts/page.tsx` — **NEW**: Global contracts list page
- `src/components/contracts/contracts-table.tsx` — **NEW**: Filterable/sortable contracts table
- `src/app/(dashboard)/layout.tsx` — **MODIFY**: Add "Contracts" and "Renewals" to sidebar nav

## Status Log

- 2026-04-12: Created — identified as gap by UX review (no global contracts view)

## Takeaways

_To be filled during implementation._
