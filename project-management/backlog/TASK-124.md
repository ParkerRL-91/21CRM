---
title: Loading states with contextual messages
id: TASK-124
project: PRJ-006
status: ready
priority: P1
tier: 2
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, loading, spinner, ux, feedback, confidence-builder]
---

# TASK-124 — Loading States with Contextual Messages

## Context

CPQ operations that take time provide no visual feedback. Dana Chen clicked "Run Renewal Check" and said: "Did it run? How long does it take? Should I wait? Should I click again?" The setup page shows "Setting up..." but with no progress indication. The pricing calculator shows "..." as a loading state.

Users need contextual loading states that tell them:
1. Something is happening (spinner/animation)
2. What specifically is happening ("Checking 47 contracts...")
3. How long it might take (or at minimum, progress indication)

## User Stories

**As Dana (VP RevOps)**, I want to see what the system is doing when I trigger an operation, so that I don't click the button again or close the tab thinking it's broken.

**As Raj (Deal Desk Specialist)**, I want to see a contextual message while waiting for pricing calculations, so that I know the system is working, not frozen.

**As Jordan (CRM Admin)**, I want the loading state during CPQ setup to show which objects are being created, so that I can troubleshoot if it stalls.

## Outcomes

- Every async operation in the CPQ shows a contextual loading state
- Loading states include a spinner/animation and a descriptive message
- Messages are specific: "Creating 6 CPQ objects..." not just "Loading..."
- Buttons are disabled during loading to prevent double-clicks
- Loading states are visually consistent across all CPQ pages

## Success Metrics

- [ ] CPQ setup shows "Creating Quotes, Quote Line Items, Contracts..." during setup
- [ ] Product catalog import shows "Importing 12 US products..." with the actual count
- [ ] Pricing calculator shows "Calculating price..." instead of "..."
- [ ] Renewal check shows "Checking contracts for renewal..." with a spinner
- [ ] Status check shows "Checking CPQ status..." on page load
- [ ] All loading states include a spinner animation
- [ ] All buttons are disabled during their loading operation
- [ ] No "raw" loading states (just "..." or "Loading")
- [ ] Unit tests verify contextual messages for each loading state

## Implementation Plan

### Step 1: Create a reusable CpqLoadingIndicator component

Create `packages/twenty-front/src/modules/cpq/components/CpqLoadingIndicator.tsx`:

```typescript
type CpqLoadingIndicatorProps = {
  message: string;
  size?: 'small' | 'medium';
};
```

The component renders:
- A CSS spinner animation (circular or linear)
- The contextual message text next to it
- Small size for inline use (buttons, table cells), medium for section-level loading

Use `@linaria/react` for the styled spinner:
```css
@keyframes cpq-spin {
  to { transform: rotate(360deg); }
}
```

### Step 2: Update CpqSetupPage loading states

Modify `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx`:

- Replace "Checking CPQ status..." text with `<CpqLoadingIndicator message="Checking CPQ status..." />`
- Replace "Setting up..." button text with `<CpqLoadingIndicator message="Creating CPQ objects..." size="small" />`
- Replace "Removing..." button text with `<CpqLoadingIndicator message="Removing CPQ objects..." size="small" />`
- Replace "Importing..." button text with `<CpqLoadingIndicator message={`Importing ${catalog.length} products...`} size="small" />`
- Add a loading overlay to the section body during operations

### Step 3: Update CpqPricingCalculator loading state

Modify `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx`:

- Replace `{isCalculating ? '...' : 'Calculate'}` with:
  ```tsx
  {isCalculating ? <CpqLoadingIndicator message="Calculating..." size="small" /> : 'Calculate'}
  ```

### Step 4: Update QuoteBuilderPage loading states

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Add a loading indicator when line item prices are being recalculated
- Show "Recalculating prices..." in the net total cell while `recalcLineItem` is running
- Track which line items are currently recalculating via state

### Step 5: Add skeleton loading for initial page loads

For pages that fetch data on mount (CpqSetupPage, renewal dashboard), show skeleton loading states instead of empty content:

- Use `StyledSection` with pulsing placeholder rectangles during initial load
- Replace the simple "Checking CPQ status..." text with a skeleton that matches the final layout shape

### Step 6: Disable repeated clicks during loading

Ensure all buttons that trigger async operations:
- Have `disabled={isLoading}` prop
- Change cursor to `not-allowed` when disabled
- Reduce opacity when disabled (already present in CpqSetupPage's StyledButton)

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqLoadingIndicator.tsx`
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx` — contextual loading messages
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx` — better loading state
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — per-line-item loading
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — export CpqLoadingIndicator

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqLoadingIndicator.test.tsx`

- `should render spinner animation`
- `should render contextual message`
- `should apply small size styles`
- `should apply medium size styles`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqSetupPage.loading.test.tsx`

- `should show "Checking CPQ status..." with spinner on mount`
- `should show "Creating CPQ objects..." during setup`
- `should show "Removing CPQ objects..." during teardown`
- `should show "Importing X products..." during seed`
- `should disable setup button during loading`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqPricingCalculator.loading.test.tsx`

- `should show "Calculating..." with spinner during calculation`
- `should disable calculate button during calculation`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
