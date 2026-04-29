---
title: Quote versioning (v1 -> v2 comparison)
id: TASK-127
project: PRJ-006
status: ready
priority: P1
tier: 2
effort: 3 days
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-125]
tags: [cpq, versioning, quote-comparison, diff, confidence-builder]
---

# TASK-127 — Quote Versioning (v1 -> v2 Comparison)

## Context

When a customer asks for changes to a quote, the current system has no way to track versions. There is no "v1", no "v2", no way to see what changed between revisions. Dana Chen implied this gap: "Customer asked for changes, where's the diff?"

This task adds quote versioning: the ability to create a new version of a quote, and to compare any two versions side by side showing what changed (line items added/removed, prices changed, discounts modified).

Depends on TASK-125 (Audit Trail) because the audit trail infrastructure provides the event logging needed to track version boundaries.

## User Stories

**As Alex (Sales Rep)**, I want to create a new version of a quote when the customer requests changes, keeping the original intact, so that I can reference the previous version if the customer changes their mind.

**As Raj (Deal Desk Specialist)**, I want to compare two quote versions side by side, seeing exactly what changed, so that I can verify the rep made only the changes the customer requested.

**As Dana (VP RevOps)**, I want to see the full version history of a quote in board reporting, so that I can explain how a deal's pricing evolved during negotiation.

## Outcomes

- A "Create New Version" button on the quote builder creates v2 (v3, v4...) of the quote
- Version selector dropdown in the quote header shows all versions (v1, v2, v3...)
- Side-by-side comparison view highlights added/removed/changed line items
- Changed values show old value struck through and new value highlighted
- Version number is displayed prominently in the quote header
- Previous versions are read-only — only the latest version can be edited

## Success Metrics

- [ ] "Create New Version" button visible on quote builder
- [ ] Clicking creates a new version with copied line items from current version
- [ ] Version selector dropdown shows all versions
- [ ] Switching versions loads that version's line items (read-only for non-latest)
- [ ] "Compare Versions" button opens side-by-side comparison view
- [ ] Comparison highlights added line items in green
- [ ] Comparison highlights removed line items in red
- [ ] Comparison highlights changed values with old value struck through
- [ ] Version number (e.g., "v2") visible in quote header
- [ ] Previous versions cannot be edited (read-only mode)
- [ ] Audit trail (TASK-125) logs version creation events
- [ ] Unit tests pass for versioning logic and comparison display

## Implementation Plan

### Step 1: Define version data model

Create `packages/twenty-front/src/modules/cpq/types/cpq-version-types.ts`:

```typescript
type QuoteVersion = {
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  lineItems: LineItem[];
  subtotal: string;
  notes?: string;
};

type QuoteVersionDiff = {
  addedItems: LineItem[];
  removedItems: LineItem[];
  changedItems: Array<{
    itemId: string;
    productName: string;
    changes: Array<{
      field: string;
      oldValue: string | number;
      newValue: string | number;
    }>;
  }>;
  subtotalDiff: { old: string; new: string };
};
```

### Step 2: Create the versioning hook

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-quote-versions.ts`:

- `createVersion(quoteId, currentLineItems)` — saves current state as new version
- `getVersions(quoteId)` — lists all versions
- `getVersion(quoteId, versionNumber)` — fetches a specific version
- `compareVersions(quoteId, v1, v2)` — generates a diff between two versions
- Returns `{ versions, currentVersion, createVersion, compareVersions, isLoading }`

### Step 3: Create the QuoteVersionSelector component

Create `packages/twenty-front/src/modules/cpq/components/CpqQuoteVersionSelector.tsx`:

- Dropdown showing all versions: "v1 (original)", "v2 (Apr 20)", "v3 (Apr 25, current)"
- Current/latest version has a badge
- Selecting a version triggers `onVersionChange` callback
- "Compare" button that opens the comparison view

### Step 4: Create the QuoteVersionComparison component

Create `packages/twenty-front/src/modules/cpq/components/CpqQuoteVersionComparison.tsx`:

- Two-column layout: left = older version, right = newer version
- Column headers show version number and date
- Line items table with diff highlighting:
  - Added items: green background, "+" icon
  - Removed items: red background, strikethrough, "-" icon
  - Changed items: yellow background, old value in gray strikethrough, new value in bold
- Summary at bottom: "3 items added, 1 removed, 2 changed. Total increased by $4,500."
- Close button to return to the standard quote view

Use `@linaria/react` styled components matching the existing quote table styles.

### Step 5: Add backend version endpoints

Add to `packages/twenty-server/src/modules/cpq/cpq.controller.ts`:

```typescript
@Post('quotes/:id/versions')
async createVersion(@AuthWorkspace() workspace, @Param('id') quoteId, @Body() body) { ... }

@Get('quotes/:id/versions')
async listVersions(@AuthWorkspace() workspace, @Param('id') quoteId) { ... }

@Get('quotes/:id/versions/:version')
async getVersion(@AuthWorkspace() workspace, @Param('id') quoteId, @Param('version') version) { ... }
```

### Step 6: Integrate into QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Add version selector in the quote header, next to the status badge
- Add "Create New Version" button in the header
- When viewing a non-latest version, set all inputs to read-only and show a banner: "Viewing v2 — this is a previous version (read-only)"
- Add "Compare with Previous" button that opens the comparison modal
- Track `currentVersionNumber` in state
- Log version creation to audit trail (TASK-125)

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/types/cpq-version-types.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-quote-versions.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqQuoteVersionSelector.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqQuoteVersionComparison.tsx`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — integrate versioning
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports
- **Modify**: `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add version endpoints

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqQuoteVersionSelector.test.tsx`

- `should render version dropdown with all versions`
- `should mark current/latest version`
- `should trigger onVersionChange when version is selected`
- `should show "Compare" button`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqQuoteVersionComparison.test.tsx`

- `should show two columns for compared versions`
- `should highlight added line items in green`
- `should highlight removed line items in red`
- `should show old/new values for changed items`
- `should display summary of changes`

### Hook tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-quote-versions.test.ts`

- `should create a new version`
- `should list all versions for a quote`
- `should generate correct diff between two versions`
- `should identify added, removed, and changed items`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
