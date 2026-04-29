---
title: Quote duplication ("Clone this quote")
id: TASK-135
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-127]
tags: [cpq, quote, duplication, clone, productivity, differentiator]
---

# TASK-135 — Quote Duplication ("Clone This Quote")

## Context

Sales reps often need to create similar quotes for different customers or variations of the same quote. Currently they must re-enter all line items from scratch. Dana Chen's review implied the need: "Don't make me re-enter 15 line items."

Depends on TASK-127 (Quote Versioning) because duplication shares infrastructure with versioning — both create a copy of line items. However, duplication creates a new, independent quote rather than a new version of the same quote.

## User Stories

**As Alex (Sales Rep)**, I want to click "Clone this quote" and get a new quote pre-filled with the same line items, so that I can create a similar proposal for another customer without re-entering 15 items.

**As Raj (Deal Desk Specialist)**, I want cloned quotes to be independent (not linked to the original), so that changes to the clone don't affect the original.

**As Dana (VP RevOps)**, I want the clone to reset status to "draft" and clear any approval history, so that cloned quotes go through proper approval channels.

## Outcomes

- "Clone Quote" button visible on the quote builder
- Clicking it creates a new quote with all line items, pricing, and sections copied
- The cloned quote has: new ID, "draft" status, current date, empty approval history, "(Copy)" suffix on name
- The original quote is unchanged
- The clone opens in the quote builder ready for editing

## Success Metrics

- [ ] "Clone Quote" button visible on quote builder
- [ ] Clicking creates a new quote with copied line items
- [ ] Cloned quote has new unique ID
- [ ] Cloned quote status is "draft"
- [ ] Cloned quote name has "(Copy)" suffix
- [ ] Cloned quote has current date, not original date
- [ ] Cloned quote has empty approval history
- [ ] All line items are copied with same product, quantity, discount, price
- [ ] Sections (TASK-134) are preserved in clone if present
- [ ] Original quote is not modified
- [ ] Clone opens in the quote builder ready for editing
- [ ] Audit trail (TASK-125) logs the duplication event on both quotes
- [ ] Unit tests pass for clone logic

## Implementation Plan

### Step 1: Add clone function to quote builder

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

```typescript
const cloneQuote = useCallback(() => {
  const clonedLineItems = lineItems.map(item => ({
    ...item,
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    netTotal: item.netTotal, // preserve calculated prices
  }));

  // Navigate to new quote builder with cloned data
  // Pass via URL state or Jotai atom
  navigate('/cpq/quotes/new', {
    state: {
      clonedFrom: currentQuoteId,
      quoteName: `${quoteName} (Copy)`,
      lineItems: clonedLineItems,
      sections: sections, // from TASK-134
    },
  });
}, [lineItems, quoteName, sections, navigate]);
```

### Step 2: Accept cloned data on mount

In `QuoteBuilderPage.tsx`, check for `location.state` on mount:

```typescript
const location = useLocation();

useEffect(() => {
  if (location.state?.clonedFrom) {
    setQuoteName(location.state.quoteName);
    setLineItems(location.state.lineItems);
    // Log clone event to audit trail
  }
}, []);
```

### Step 3: Add the "Clone Quote" button

Add a "Clone Quote" button in the quote header, near the "Generate PDF" button:

```tsx
<StyledButton variant="ghost" onClick={cloneQuote}>
  <IconCopy size={14} /> Clone Quote
</StyledButton>
```

Use `IconCopy` from `twenty-ui/display`.

### Step 4: Add backend support (if quotes are persisted)

If quotes are saved to the backend, add:

Add to `packages/twenty-server/src/modules/cpq/cpq.controller.ts`:
```typescript
@Post('quotes/:id/clone')
async cloneQuote(@AuthWorkspace() workspace, @Param('id') quoteId) { ... }
```

The backend clone operation should:
- Copy the quote record with a new ID
- Copy all line items with new IDs
- Reset status to "draft"
- Clear approval history
- Set creation date to now
- Log audit event on both original and clone

### Step 5: Handle edge cases

- Cloning a quote that hasn't been saved yet: clone from current UI state only
- Cloning a quote with approval history: clear all approval events
- Cloning a quote with versioning: clone only the current/latest version

## Files to Change

- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — add clone button and logic
- **Possibly modify**: `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add clone endpoint

## Tests to Write

### Unit tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.clone.test.tsx`

- `should render "Clone Quote" button`
- `should create new quote with copied line items on clone`
- `should add "(Copy)" suffix to cloned quote name`
- `should set cloned quote status to "draft"`
- `should generate new IDs for cloned line items`
- `should navigate to new quote builder with cloned data`
- `should accept cloned data from navigation state on mount`
- `should not modify original quote when clone is edited`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
