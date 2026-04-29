---
title: Approval status visibility on quotes
id: TASK-120
project: PRJ-006
status: ready
priority: P0
tier: 1
effort: 3 days
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-118]
tags: [cpq, approval, status, visibility, tracking, blocker]
---

# TASK-120 — Approval Status Visibility on Quotes

## Context

When a user clicks "Submit for Approval" on the quote builder, the page doesn't change. There is no confirmation, no approval status indicator, no indication of who will review, and no timeline of the approval process. Dana Chen said: "Did I just submit this? To who? What's the approval chain? When will I hear back?"

This task adds visible approval status tracking to the quote builder: a status banner showing where the quote is in the approval process, who has approved/rejected it, and when. Depends on TASK-118 (Approval Rules Admin UI) because the approval chain needs rules to evaluate.

## User Stories

**As Alex (Sales Rep)**, I want to see exactly where my quote is in the approval process after I submit it, so that I can tell the customer when to expect the proposal.

**As Dana (VP RevOps)**, I want to see who approved what discount and when on every quote, so that I can audit the approval chain for board reporting.

**As Raj (Deal Desk Specialist)**, I want to see the full approval path before I submit a quote, so that I know exactly who needs to approve and can set expectations with the rep.

**As Jordan (CRM Admin)**, I want approval events to be logged with timestamps, so that I can troubleshoot when reps complain about stuck approvals.

## Outcomes

- After submitting for approval, a visible approval status banner appears on the quote
- The banner shows the current status: Pending Approval, Approved, Rejected, Changes Requested
- An approval timeline shows each step: who was asked, when they responded, their decision
- Before submission, a preview shows the expected approval chain based on the quote's characteristics
- The "Submit for Approval" button shows a confirmation with the approval chain preview
- Approved quotes show a green "Approved by [Name] on [Date]" banner
- Rejected quotes show a red banner with the rejection reason

## Success Metrics

- [ ] Approval status banner appears on quote after submission
- [ ] Banner shows current status with color coding (yellow=pending, green=approved, red=rejected)
- [ ] Approval timeline lists each approver with their decision and timestamp
- [ ] Pre-submission preview shows expected approval chain (from TASK-118 rules)
- [ ] "Submit for Approval" click shows confirmation dialog with chain preview
- [ ] Approved quotes display approver name and date
- [ ] Rejected quotes display rejection reason
- [ ] Status persists on page refresh
- [ ] Real-time status updates (or refresh button to check for updates)
- [ ] Unit tests pass for all approval status display states

## Implementation Plan

### Step 1: Define approval status types

Add to `packages/twenty-front/src/modules/cpq/types/cpq-approval-types.ts` (created in TASK-118):

```typescript
type ApprovalStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'changes_requested';

type ApprovalEvent = {
  id: string;
  ruleId: string;
  ruleName: string;
  approverRole: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comment?: string;
  timestamp: string;
};

type QuoteApprovalState = {
  quoteId: string;
  overallStatus: ApprovalStatus;
  submittedAt?: string;
  submittedBy?: string;
  events: ApprovalEvent[];
  requiredApprovals: Array<{
    ruleId: string;
    ruleName: string;
    approverRole: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
};
```

### Step 2: Create the ApprovalStatusBanner component

Create `packages/twenty-front/src/modules/cpq/components/CpqApprovalStatusBanner.tsx`:

- Accepts `approvalState: QuoteApprovalState`
- Renders a colored banner at the top of the quote:
  - Not submitted: no banner shown
  - Pending: yellow/amber banner with "Awaiting approval from [role]" and spinner
  - Approved: green banner with "Approved by [name] on [date]"
  - Rejected: red banner with "Rejected by [name]: [reason]" and "Edit & Resubmit" button
  - Changes Requested: orange banner with "[name] requested changes: [comment]"
- Below the banner, show an expandable approval timeline with all events
- Use `StyledBadge` pattern from `CpqSetupPage.tsx` for status indicators

### Step 3: Create the ApprovalTimeline component

Create `packages/twenty-front/src/modules/cpq/components/CpqApprovalTimeline.tsx`:

- Renders a vertical timeline of approval events
- Each event shows: icon (checkmark/X/clock), approver role/name, decision, timestamp, comment
- Connected by a vertical line (standard timeline UI pattern)
- Most recent event at the top
- Use green for approved, red for rejected, gray for pending, orange for changes requested

### Step 4: Create the approval submission hook

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-quote-approval.ts`:

- `submitForApproval(quoteId, quoteData)` — sends quote for approval, returns initial approval state
- `getApprovalStatus(quoteId)` — fetches current approval state
- `respondToApproval(quoteId, eventId, decision, comment)` — for approvers to respond
- Returns `{ approvalState, isSubmitting, submitForApproval, refreshStatus }`
- Calls backend endpoints (add to cpq.controller.ts)

### Step 5: Add backend approval submission endpoints

Add to `packages/twenty-server/src/modules/cpq/cpq.controller.ts`:

```typescript
@Post('quotes/:id/submit-approval')
async submitForApproval(@AuthWorkspace() workspace, @Param('id') quoteId, @Body() quoteData) { ... }

@Get('quotes/:id/approval-status')
async getApprovalStatus(@AuthWorkspace() workspace, @Param('id') quoteId) { ... }

@Post('quotes/:id/approval-respond')
async respondToApproval(@AuthWorkspace() workspace, @Param('id') quoteId, @Body() response) { ... }
```

### Step 6: Integrate into QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Import `CpqApprovalStatusBanner`, `CpqApprovalChainPreview` (from TASK-118), `useCpqQuoteApproval`
- Add `CpqApprovalStatusBanner` between the quote header and line items sections
- Replace the "Submit for Approval" button behavior: on click, show confirmation dialog with `CpqApprovalChainPreview`, then call `submitForApproval()`
- After submission, show the approval banner with current status
- Add a "Refresh Status" button that calls `refreshStatus()`

## Files to Change

- **Modify**: `packages/twenty-front/src/modules/cpq/types/cpq-approval-types.ts` — add status types
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqApprovalStatusBanner.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqApprovalTimeline.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-quote-approval.ts`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — integrate approval UI
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports
- **Modify**: `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add approval endpoints

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqApprovalStatusBanner.test.tsx`

- `should not render when status is not_submitted`
- `should render yellow banner for pending status`
- `should render green banner with approver name for approved status`
- `should render red banner with reason for rejected status`
- `should render orange banner for changes_requested status`
- `should show approval timeline when expanded`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqApprovalTimeline.test.tsx`

- `should render events in reverse chronological order`
- `should show correct icon for each event status`
- `should display approver name and role`
- `should display timestamps`
- `should display comments when present`

### Hook tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-quote-approval.test.ts`

- `should submit quote for approval and return initial state`
- `should fetch approval status`
- `should handle submission errors`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
