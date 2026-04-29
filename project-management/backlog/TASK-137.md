---
title: Unsaved changes warning on editors
id: TASK-137
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, unsaved-changes, warning, navigation-guard, ux, differentiator]
---

# TASK-137 — Unsaved Changes Warning on Editors

## Context

When a user makes changes in the quote builder or template editor and navigates away (back button, sidebar link, closing the tab), their work is lost with no warning. Dana Chen's review noted: "I lost all my edits when I clicked Cancel."

This task adds a "You have unsaved changes" warning that intercepts navigation attempts when there are uncommitted edits. This is a standard web application pattern using the `beforeunload` event for tab closure and React Router's navigation blocking for in-app navigation.

## User Stories

**As Alex (Sales Rep)**, I want a warning before I accidentally leave a quote I've been editing, so that I don't lose 10 minutes of work because I clicked the wrong sidebar link.

**As Raj (Deal Desk Specialist)**, I want the "unsaved changes" dialog to give me the choice to save or discard, so that I can recover from accidental navigation.

**As Jordan (CRM Admin)**, I want the template editor to warn me about unsaved settings before I leave, so that I don't have to redo brand color and logo configuration.

## Outcomes

- Navigating away from the quote builder with unsaved changes shows a warning dialog
- Navigating away from the template editor with unsaved changes shows a warning dialog
- Closing the browser tab with unsaved changes shows the browser's native "Leave site?" dialog
- The warning dialog has three options: "Save & Leave", "Discard & Leave", "Stay"
- "Save & Leave" persists the current state before navigating
- The warning only appears when there are actual changes (not on a fresh/clean page)

## Success Metrics

- [ ] Clicking a sidebar link while editing a quote triggers unsaved changes dialog
- [ ] Clicking browser back button while editing triggers the dialog
- [ ] Closing the tab triggers the browser's native beforeunload confirmation
- [ ] "Stay" button returns the user to their work with no data loss
- [ ] "Discard & Leave" navigates away without saving
- [ ] "Save & Leave" saves current state then navigates
- [ ] No warning shown when navigating from a page with no changes
- [ ] No warning shown when navigating after explicitly saving
- [ ] Works on both QuoteBuilderPage and template editor
- [ ] Unit tests pass for all dialog states and navigation outcomes

## Implementation Plan

### Step 1: Create the useUnsavedChangesWarning hook

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-unsaved-changes.ts`:

```typescript
type UseUnsavedChangesWarningOptions = {
  isDirty: boolean;
  onSave?: () => Promise<void>;
  message?: string;
};

export const useUnsavedChangesWarning = ({
  isDirty,
  onSave,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesWarningOptions) => {
  // 1. Browser tab close / refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, message]);

  // 2. React Router navigation blocking
  // Use useBlocker from react-router-dom v6
  const blocker = useBlocker(isDirty);

  // Return blocker state for the dialog
  return {
    isBlocked: blocker.state === 'blocked',
    proceed: blocker.proceed, // navigate away
    reset: blocker.reset,     // stay on page
    onSave,
  };
};
```

### Step 2: Create the UnsavedChangesDialog component

Create `packages/twenty-front/src/modules/cpq/components/CpqUnsavedChangesDialog.tsx`:

```typescript
type CpqUnsavedChangesDialogProps = {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSaveAndLeave?: () => void;
  isSaving?: boolean;
};
```

Use Twenty's `ConfirmationModal` pattern or create a custom modal:
- Title: "Unsaved Changes"
- Message: "You have unsaved changes that will be lost if you leave."
- Three buttons:
  - "Stay" (primary/default) — calls `onStay`
  - "Discard & Leave" (danger) — calls `onDiscard`
  - "Save & Leave" (ghost) — calls `onSaveAndLeave`, shows loading state while saving

### Step 3: Track dirty state in QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Add state tracking: `isDirty: boolean`
- Set `isDirty = true` whenever any change is made (quote name, line items, discounts)
- Set `isDirty = false` after explicit save or when accepting discarded changes
- Initialize `isDirty = false` on mount

```typescript
const [isDirty, setIsDirty] = useState(false);
const [initialState] = useState({ quoteName: '', lineItems: [newLineItem()] });

// Track changes
const markDirty = useCallback(() => setIsDirty(true), []);

// Wrap all change handlers
const updateLineItem = useCallback((id, field, value) => {
  setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  markDirty();
}, [markDirty]);
```

- Integrate the hook:
```typescript
const { isBlocked, proceed, reset, onSave } = useUnsavedChangesWarning({
  isDirty,
  onSave: handleSaveQuote,
});
```

- Add the dialog:
```tsx
<CpqUnsavedChangesDialog
  isOpen={isBlocked}
  onStay={reset}
  onDiscard={proceed}
  onSaveAndLeave={async () => {
    if (onSave) await onSave();
    proceed();
  }}
/>
```

### Step 4: Track dirty state in template editor

Apply the same pattern to the template editor page (if it exists; may be created in TASK-117):

- Track changes to brand color, logo URL, company name, terms text
- Use `useUnsavedChangesWarning` with the dirty state
- Add `CpqUnsavedChangesDialog`

### Step 5: Handle edge cases

- **New quote with no changes**: Fresh page should not trigger warning (isDirty starts false)
- **Cloned quote (TASK-135)**: Pre-filled data from clone should be considered "dirty" since it hasn't been saved
- **Navigation via command palette**: Ensure the blocker intercepts Cmd+K navigation
- **Multiple unsaved dialogs**: Only one dialog at a time

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-unsaved-changes.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqUnsavedChangesDialog.tsx`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — add dirty tracking and warning
- **Possibly modify**: Template editor page (from TASK-117) — add dirty tracking and warning
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-unsaved-changes.test.ts`

- `should not block navigation when isDirty is false`
- `should block navigation when isDirty is true`
- `should add beforeunload listener when isDirty is true`
- `should remove beforeunload listener when isDirty becomes false`
- `should call onSave when save-and-leave is triggered`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqUnsavedChangesDialog.test.tsx`

- `should render dialog when isOpen is true`
- `should not render when isOpen is false`
- `should call onStay when "Stay" is clicked`
- `should call onDiscard when "Discard & Leave" is clicked`
- `should call onSaveAndLeave when "Save & Leave" is clicked`
- `should show loading state while saving`

### Integration tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.unsaved.test.tsx`

- `should not show warning on fresh page navigation`
- `should show warning after editing quote name`
- `should show warning after adding line item`
- `should not show warning after explicit save`
- `should allow navigation after discarding changes`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
