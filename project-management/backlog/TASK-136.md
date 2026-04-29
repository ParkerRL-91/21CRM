---
title: Renewal dashboard actions (outreach, mark contacted)
id: TASK-136
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 2 days
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-128]
tags: [cpq, renewal, actions, outreach, workflow, differentiator]
---

# TASK-136 — Renewal Dashboard Actions (Outreach, Mark Contacted)

## Context

The renewal dashboard shows risk scores and renewal dates, but Dana Chen said: "I can see risk but I can't act on it." There are no action buttons on renewal rows — no way to trigger outreach, mark an account as contacted, schedule a follow-up, or create a new quote from a renewal.

Clicking a renewal row either does nothing or calls `onViewContract` which may not be wired up. The dashboard is read-only when it should be a command center for renewal management.

Depends on TASK-128 (CSV Export) because both tasks modify the renewal dashboard, and the export bar layout needs to accommodate action buttons.

## User Stories

**As Dana (VP RevOps)**, I want to trigger renewal outreach directly from the dashboard for at-risk accounts, so that my team acts on risk signals without switching to another tool.

**As Raj (Deal Desk Specialist)**, I want to mark a renewal as "contacted" after I reach out, so that the team can see which accounts have been addressed.

**As Alex (Sales Rep)**, I want to create a new renewal quote from the dashboard with one click, so that I can start the conversation with current pricing pre-filled.

**As Jordan (CRM Admin)**, I want a log of all renewal actions (who contacted which account, when), so that I can track team responsiveness to renewal risk signals.

## Outcomes

- Each renewal row has action buttons: "Send Outreach", "Mark Contacted", "Create Renewal Quote"
- "Mark Contacted" changes the row's status indicator and records who contacted and when
- "Send Outreach" triggers an email draft or opens the email compose workflow
- "Create Renewal Quote" opens the quote builder pre-filled with the contract's products and renewal pricing
- Bulk actions available: select multiple renewals and mark all as contacted
- Action history is visible on each renewal row (last contacted date, last action)

## Success Metrics

- [ ] Action buttons visible on each renewal row
- [ ] "Mark Contacted" button updates the row status to "Contacted" with timestamp
- [ ] "Contacted" status shows who contacted and when on hover/expand
- [ ] "Send Outreach" button opens email compose or creates a task
- [ ] "Create Renewal Quote" navigates to quote builder with contract data pre-filled
- [ ] Bulk select checkbox on each row
- [ ] Bulk "Mark Contacted" action for selected rows
- [ ] Actions persist across page refresh
- [ ] Action history visible on row expand/detail view
- [ ] Unit tests pass for action buttons and status updates

## Implementation Plan

### Step 1: Define renewal action types

Create `packages/twenty-front/src/modules/cpq/types/cpq-renewal-action-types.ts`:

```typescript
type RenewalActionType = 'contacted' | 'outreach_sent' | 'quote_created' | 'follow_up_scheduled';

type RenewalAction = {
  id: string;
  renewalId: string;
  actionType: RenewalActionType;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  notes?: string;
};

type RenewalRowStatus = 'new' | 'contacted' | 'outreach_sent' | 'quote_sent' | 'renewed' | 'churned';
```

### Step 2: Create the RenewalActionBar component

Create `packages/twenty-front/src/modules/cpq/components/CpqRenewalActionBar.tsx`:

For each renewal row, render a small action bar:
```typescript
type CpqRenewalActionBarProps = {
  renewalId: string;
  currentStatus: RenewalRowStatus;
  onMarkContacted: () => void;
  onSendOutreach: () => void;
  onCreateQuote: () => void;
  lastAction?: RenewalAction;
};
```

Renders:
- "Mark Contacted" button (green check icon) — disabled if already contacted
- "Send Outreach" button (email icon) — opens email compose
- "Create Quote" button (document icon) — navigates to quote builder
- Status badge showing current state
- Last action tooltip: "Contacted by Raj on Apr 15"

### Step 3: Create the renewal actions hook

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-renewal-actions.ts`:

- `markContacted(renewalId, notes?)` — records contact event
- `sendOutreach(renewalId)` — triggers outreach workflow
- `createRenewalQuote(renewalId)` — creates pre-filled quote
- `getActionHistory(renewalId)` — lists all actions for a renewal
- `bulkMarkContacted(renewalIds)` — bulk action
- Returns `{ markContacted, sendOutreach, createRenewalQuote, actionHistory, isActing }`

### Step 4: Add backend action endpoints

Add to `packages/twenty-server/src/modules/cpq/cpq.controller.ts`:

```typescript
@Post('renewals/:id/actions')
async logRenewalAction(@AuthWorkspace() workspace, @Param('id') renewalId, @Body() action) { ... }

@Get('renewals/:id/actions')
async getRenewalActions(@AuthWorkspace() workspace, @Param('id') renewalId) { ... }

@Post('renewals/bulk-actions')
async bulkRenewalAction(@AuthWorkspace() workspace, @Body() body) { ... }
```

### Step 5: Integrate into the renewal dashboard

Identify the renewal dashboard component (check for a table rendering renewal rows). Add:

- `<CpqRenewalActionBar>` in each row
- Bulk selection checkboxes
- Bulk action toolbar at the top when rows are selected
- Status column showing the renewal's action status

### Step 6: "Create Renewal Quote" pre-fill

When "Create Quote" is clicked:
- Fetch the contract's current products and pricing
- Navigate to `/cpq/quotes/new` with state:
  ```typescript
  {
    fromRenewal: renewalId,
    quoteName: `${accountName} — Renewal ${new Date().getFullYear()}`,
    lineItems: contractLineItems.map(item => ({
      ...item,
      // Apply renewal pricing method (same/list/uplift from cpq-renewal.service.ts)
    })),
  }
  ```

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/types/cpq-renewal-action-types.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqRenewalActionBar.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-renewal-actions.ts`
- **Modify**: Renewal dashboard component — add action bars and bulk selection
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports
- **Modify**: `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add action endpoints

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqRenewalActionBar.test.tsx`

- `should render action buttons for each renewal`
- `should call onMarkContacted when clicked`
- `should disable "Mark Contacted" if already contacted`
- `should show last action tooltip`
- `should show status badge`

### Hook tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-renewal-actions.test.ts`

- `should mark a renewal as contacted`
- `should handle bulk mark contacted`
- `should fetch action history`
- `should create renewal quote with pre-filled data`

### Integration tests:

- `should navigate to quote builder with contract data when "Create Quote" is clicked`
- `should update row status after marking contacted`
- `should support bulk selection and bulk actions`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
