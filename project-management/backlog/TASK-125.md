---
title: Audit trail visible on every quote
id: TASK-125
project: PRJ-006
status: ready
priority: P1
tier: 2
effort: 3 days
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, audit-trail, quote-history, compliance, confidence-builder]
---

# TASK-125 — Audit Trail Visible on Every Quote

## Context

Dana Chen asked: "Can I trust these numbers enough to put them in a board deck?" Trust requires transparency — knowing who changed what, when, and why. The pricing engine already generates audit steps (visible in `CpqPricingCalculator.tsx` in a collapsible `<details>` element), but there is no broader audit trail for quote-level changes: who created the quote, who added/removed line items, who changed a discount, who submitted for approval.

The `ChangeFeed` component (`packages/twenty-front/src/modules/cpq/components/ChangeFeed.tsx`) from TASK-102 already implements a generic change feed UI. This task extends that pattern to the quote level and makes it a prominent, always-visible section on every quote.

## User Stories

**As Dana (VP RevOps)**, I want to see a full history of every change made to a quote — who changed it, what they changed, and when — so that I can audit pricing decisions for the board.

**As Raj (Deal Desk Specialist)**, I want to see when and why a discount was changed on a quote, so that I can explain pricing decisions to the customer.

**As Jordan (CRM Admin)**, I want audit trail data that I can filter by date or user, so that I can investigate when reps report issues with quote pricing.

**As Alex (Sales Rep)**, I want to see who last edited a quote I'm working on, so that I know if someone else on my team has modified the pricing.

## Outcomes

- Every quote displays an "Activity" or "Audit Trail" section showing all changes
- Changes tracked: quote creation, line item add/remove/edit, discount changes, status transitions, approval events, PDF generation
- Each entry shows: who (user name), what (description of change), when (timestamp)
- The audit trail is chronological with the most recent change at the top
- Audit data persists across sessions (stored in backend)
- The pricing-level audit (waterfall steps) is integrated into the broader quote audit trail

## Success Metrics

- [ ] "Activity" section visible on QuoteBuilderPage below line items
- [ ] Quote creation event shows with creator name and timestamp
- [ ] Line item addition events show product name added
- [ ] Line item removal events show product name removed
- [ ] Discount changes show old value -> new value
- [ ] Approval submission events show in the trail
- [ ] Each event shows user name, action description, and formatted timestamp
- [ ] Events are in reverse chronological order (newest first)
- [ ] Trail persists across page refreshes
- [ ] Can expand to see full details of each change
- [ ] Unit tests pass for audit trail rendering

## Implementation Plan

### Step 1: Define audit event types for quotes

Create `packages/twenty-front/src/modules/cpq/types/cpq-audit-types.ts`:

```typescript
type QuoteAuditEventType =
  | 'quote_created'
  | 'line_item_added'
  | 'line_item_removed'
  | 'line_item_updated'
  | 'discount_changed'
  | 'status_changed'
  | 'approval_submitted'
  | 'approval_responded'
  | 'pdf_generated'
  | 'quote_duplicated';

type QuoteAuditEvent = {
  id: string;
  quoteId: string;
  eventType: QuoteAuditEventType;
  userId: string;
  userName: string;
  description: string;
  details?: Record<string, string | number>; // e.g., { oldDiscount: 10, newDiscount: 15 }
  timestamp: string;
};
```

### Step 2: Create the QuoteAuditTrail component

Create `packages/twenty-front/src/modules/cpq/components/CpqQuoteAuditTrail.tsx`:

- Accepts `events: QuoteAuditEvent[]` and optional `maxVisible?: number` (default 5)
- Renders a section with header "Activity" and a list of events
- Each event row shows:
  - Icon based on event type (use Twenty icons: `IconPlus` for add, `IconTrash` for remove, `IconEdit` for update, etc.)
  - User avatar/initial badge + user name
  - Description text
  - Relative timestamp ("2 hours ago", "Yesterday at 3:15 PM")
- "Show all" button when events exceed `maxVisible`
- Expandable detail section for events with additional context
- Reuse patterns from `ChangeFeed.tsx` for the timeline UI

Style reference from ChangeFeed.tsx component.

### Step 3: Create the audit trail hook

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-quote-audit.ts`:

- `getAuditTrail(quoteId)` — fetch all events for a quote
- `logAuditEvent(quoteId, event)` — log a new event (called by other hooks/components when changes happen)
- Returns `{ events, isLoading, logEvent, refreshEvents }`
- Backend calls to new endpoints

### Step 4: Add backend audit endpoints

Add to `packages/twenty-server/src/modules/cpq/cpq.controller.ts`:

```typescript
@Get('quotes/:id/audit-trail')
async getAuditTrail(@AuthWorkspace() workspace, @Param('id') quoteId) { ... }

@Post('quotes/:id/audit-trail')
async logAuditEvent(@AuthWorkspace() workspace, @Param('id') quoteId, @Body() event) { ... }
```

Create `packages/twenty-server/src/modules/cpq/services/cpq-audit.service.ts` with methods to store and retrieve audit events.

### Step 5: Integrate audit logging into existing actions

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Import `useCpqQuoteAudit`
- Call `logEvent` when:
  - Quote is created (on component mount if new)
  - Line item is added (in `addLineItem`)
  - Line item is removed (in `removeLineItem`)
  - Line item field is changed (in `updateLineItem`, debounced)
  - Status changes
- Add `<CpqQuoteAuditTrail events={events} />` section after line items

### Step 6: Integrate pricing audit steps

When a line item's price is calculated, the pricing engine returns `auditSteps`. These should be included as detail data in the audit trail under the relevant line item update event.

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/types/cpq-audit-types.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqQuoteAuditTrail.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-quote-audit.ts`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — integrate audit logging and display
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports
- **Modify**: `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add audit endpoints
- **Create**: `packages/twenty-server/src/modules/cpq/services/cpq-audit.service.ts`
- **Modify**: `packages/twenty-server/src/modules/cpq/cpq.module.ts` — register audit service

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqQuoteAuditTrail.test.tsx`

- `should render events in reverse chronological order`
- `should show correct icon for each event type`
- `should display user name and description`
- `should show relative timestamps`
- `should limit visible events to maxVisible`
- `should show "Show all" button when events exceed limit`
- `should expand to show all events when "Show all" is clicked`
- `should show details section for events with detail data`

### Hook tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-quote-audit.test.ts`

- `should fetch audit trail for a quote`
- `should log new audit events`
- `should handle empty audit trail`

### Backend tests: `packages/twenty-server/src/modules/cpq/services/cpq-audit.service.spec.ts`

- `should store audit events`
- `should retrieve events for a quote in chronological order`
- `should filter events by type`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
