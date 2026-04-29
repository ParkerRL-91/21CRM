---
title: Success/error feedback on every action (toast system)
id: TASK-121
project: PRJ-006
status: ready
priority: P0
tier: 1
effort: 2 days
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, feedback, toast, snackbar, ux, blocker]
---

# TASK-121 — Success/Error Feedback on Every Action (Toast System)

## Context

Multiple CPQ actions complete silently with no user feedback. Dana Chen's consistent reaction across the walkthrough was "Did it work? I think so?" Examples:
- Clicking "Enable CPQ" — shows "Setting up..." then template gallery, but no success message
- Clicking "Submit for Approval" — page doesn't change, no confirmation
- Clicking "Run Renewal Check" — nothing visible happens
- Product catalog import — only shows result after completion, no "importing..." toast

Twenty already has a SnackBar system (`useSnackBar` hook in `packages/twenty-front/src/modules/ui/feedback/snack-bar-manager/hooks/useSnackBar.ts`) with `enqueueSuccessSnackBar`, `enqueueErrorSnackBar`, `enqueueWarningSnackBar`, and `enqueueInfoSnackBar`. The CPQ code just never uses it.

## User Stories

**As Dana (VP RevOps)**, I want to see confirmation messages after every action I take in the CPQ, so that I trust the system is working correctly.

**As Alex (Sales Rep)**, I want to see clear error messages when something goes wrong, so that I know what to fix instead of wondering if the system is broken.

**As Raj (Deal Desk Specialist)**, I want to see progress indicators for long-running operations (like catalog import), so that I know the system is working and how long to wait.

**As Jordan (CRM Admin)**, I want error messages to be specific and actionable, so that I can troubleshoot issues without calling engineering.

## Outcomes

- Every CPQ action that mutates data shows a success or error toast
- Success toasts are green with a descriptive message (e.g., "CPQ enabled successfully — 6 objects created")
- Error toasts are red with the specific error message from the backend
- Long-running operations show an info toast on start and success/error on completion
- Toast messages auto-dismiss after 5 seconds but can be manually dismissed
- All toasts use Twenty's existing SnackBar system (no new toast library)

## Success Metrics

- [ ] "Enable CPQ" shows success toast: "CPQ enabled — 6 objects created"
- [ ] "Enable CPQ" failure shows error toast with specific error message
- [ ] "Remove CPQ" shows success toast: "CPQ objects removed"
- [ ] Product catalog import shows info toast: "Importing X products..." then success: "Import complete — X created, Y skipped"
- [ ] "Calculate" button in pricing calculator shows error toast on failure
- [ ] "Run Renewal Check" shows info toast: "Running renewal check..." then success: "Renewal check complete"
- [ ] All fetch() error catches surface the error message in a toast
- [ ] Toast messages are specific (include counts, names, details)
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Unit tests verify toast calls for each CPQ action

## Implementation Plan

### Step 1: Add useSnackBar to CpqSetupPage

Modify `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx`:

- Import `useSnackBar` from `@/ui/feedback/snack-bar-manager/hooks/useSnackBar`
- Add toasts to `handleSetup`:
  ```typescript
  const handleSetup = async () => {
    try {
      const result = await runSetup();
      enqueueSuccessSnackBar({
        message: `CPQ enabled — ${result.status?.objectCount ?? 6} objects created`,
      });
    } catch {
      // Error is already set in the hook, but also show toast
      enqueueErrorSnackBar({
        message: error ?? 'Failed to enable CPQ',
      });
    }
  };
  ```
- Add toasts to `handleTeardown`: success "CPQ objects removed" / error message
- Add toasts to `handleSeedCatalog`: info "Importing products..." on start, success "Import complete — X created, Y skipped" on finish

### Step 2: Add useSnackBar to QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Import `useSnackBar`
- Add toast to `recalcLineItem` on error: "Pricing calculation failed: [error message]"
- Add toast to future "Submit for Approval" action: success "Quote submitted for approval"
- Add toast to future "Generate PDF" action: success "PDF downloaded"

### Step 3: Add feedback to CpqPricingCalculator

Modify `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx`:

- Import `useSnackBar`
- On calculation error, show error toast instead of (or in addition to) the inline error message
- On successful calculation with warnings (e.g., floor price hit), show warning toast

### Step 4: Add feedback to hooks for future use

Modify `packages/twenty-front/src/modules/cpq/hooks/use-cpq-setup.ts`:

- While keeping the hook's own error state, add optional callback props for success/error that components can use to trigger toasts
- Alternative: return a `lastAction` state that components can react to

Modify `packages/twenty-front/src/modules/cpq/hooks/use-cpq-pricing.ts`:

- Same pattern: ensure errors are surfaceable via toasts in consuming components

### Step 5: Add contextual loading messages

Where currently just "Setting up..." or "..." is shown, add more context:
- "Setting up..." → "Creating 6 CPQ objects..."
- "..." on calculate button → "Calculating..."
- "Importing..." → "Importing 12 US products..."

### Step 6: Verify SnackBarProvider wraps CPQ pages

Check that the CPQ pages are rendered within a `SnackBarProvider`. The provider is likely in the app layout, but verify by checking `packages/twenty-front/src/modules/app/components/AppRouter.tsx` or the layout wrapper. If not present, add it.

## Files to Change

- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx` — add toasts to all actions
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — add toasts
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx` — add error toasts
- **Possibly modify**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-setup.ts` — improve error surfacing
- **Possibly modify**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-pricing.ts` — improve error surfacing

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqSetupPage.feedback.test.tsx`

- `should show success toast after CPQ setup`
- `should show error toast when setup fails`
- `should show success toast after teardown`
- `should show info toast at start of catalog import`
- `should show success toast after catalog import with counts`
- `should show error toast when catalog import fails`

### Unit tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.feedback.test.tsx`

- `should show error toast when pricing calculation fails`
- `should show success toast when quote is submitted`
- `should show success toast when PDF is generated`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqPricingCalculator.feedback.test.tsx`

- `should show error toast on calculation failure`
- `should show warning toast when floor price is hit`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
