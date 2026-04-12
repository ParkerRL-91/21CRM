---
title: "Account contracts related list (US-8.1)"
id: TASK-030
project: PRJ-002
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #ui, #ux]
---

# TASK-030: Account contracts related list (US-8.1)

## User Stories

- As a **Customer Success manager**, I want to view all active contracts for an account with key dates and values so that I can manage the customer relationship proactively.

## Outcomes

An account detail page (or account section) showing a contracts related list with: contract name, status, start date, end date, total value, and days until expiration. Contracts nearing expiration (within 90 days) are highlighted visually with warning indicators.

## Success Metrics

- [ ] Account page shows contracts related list table
- [ ] Columns: contract name, status (with color badge), start date, end date, total value, days until expiration
- [ ] Contracts within 90 days of expiration have amber/yellow highlight
- [ ] Contracts within 30 days of expiration have red highlight
- [ ] Expired contracts shown with "Expired" badge (gray)
- [ ] Clicking a contract row navigates to the contract detail page (TASK-031)
- [ ] Empty state shown when account has no contracts
- [ ] "New Contract" button available with create flow
- [ ] Table sortable by any column
- [ ] Responsive layout for different screen sizes

## Implementation Plan

### Account Contracts Component

Create a reusable `AccountContracts` component that:

1. Takes `accountHubspotId` as prop
2. Fetches contracts from `GET /api/contracts?accountHubspotId={id}`
3. Renders a table with the following columns:

| Column | Source | Format |
|--------|--------|--------|
| Contract Name | `contract_name` | Link to detail page |
| Status | `status` | Badge: green=Active, blue=Amended, amber=Pending Renewal, gray=Expired, red=Cancelled |
| Start Date | `start_date` | `MMM DD, YYYY` |
| End Date | `end_date` | `MMM DD, YYYY` |
| Total Value | `total_value` | Currency formatted (`$XX,XXX.XX CAD`) |
| Days Until Expiration | Computed | Integer with color coding |

### Expiration Visual Indicators

Indicators use BOTH color AND icon/text labels for accessibility (not color-only):

```typescript
function getExpirationIndicator(daysUntil: number, status: string) {
  if (status === 'expired' || status === 'cancelled') 
    return { color: 'gray', icon: '⊘', label: 'Expired', ariaLabel: 'Contract expired' };
  if (daysUntil <= 0) 
    return { color: 'red', icon: '!', label: 'Overdue', ariaLabel: 'Contract overdue' };
  if (daysUntil <= 30) 
    return { color: 'red', icon: '!!', label: `${daysUntil}d`, ariaLabel: `Expires in ${daysUntil} days - critical` };
  if (daysUntil <= 60) 
    return { color: 'amber', icon: '!', label: `${daysUntil}d`, ariaLabel: `Expires in ${daysUntil} days - warning` };
  if (daysUntil <= 90) 
    return { color: 'yellow', icon: '△', label: `${daysUntil}d`, ariaLabel: `Expires in ${daysUntil} days - approaching` };
  return { color: 'green', icon: '✓', label: `${daysUntil}d`, ariaLabel: `Expires in ${daysUntil} days - healthy` };
}
```

### Loading, Error, and Empty States

- **Loading**: Skeleton table with 5 shimmering rows matching column layout
- **Error**: "Failed to load contracts. [Retry]" with error details expandable
- **Empty**: "No contracts found for this account. [Create Contract]" with illustration

### Summary Stats

Above the table, show summary cards:
- **Active Contracts**: count of status=active
- **Total Contract Value**: sum of active contract values
- **Expiring Soon**: count of contracts within 90 days
- **Average Contract Length**: mean of (end_date - start_date) in months

### Integration Point

This component will be placed on the account detail page. If no account detail page exists yet, create a minimal one at `/accounts/[hubspotId]` that shows:
- Account name and basic info (from crm_objects where object_type='companies')
- Contracts related list (this component)
- Space for future related lists (deals, contacts, subscriptions)

## Files to Change

- `src/components/contracts/account-contracts-list.tsx` — **NEW**: Contracts related list component
- `src/components/contracts/contract-status-badge.tsx` — **NEW**: Reusable status badge
- `src/components/contracts/expiration-indicator.tsx` — **NEW**: Days-until-expiration display
- `src/app/(dashboard)/accounts/[hubspotId]/page.tsx` — **NEW** or **MODIFY**: Account detail page
- `src/hooks/use-contracts.ts` — **NEW**: Data fetching hook for contracts

## Status Log

- 2026-04-12: Created — implements US-8.1 acceptance criteria

## Takeaways

_To be filled during implementation._
