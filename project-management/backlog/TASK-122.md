---
title: Confirmation dialogs for destructive actions
id: TASK-122
project: PRJ-006
status: ready
priority: P0
tier: 1
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-121]
tags: [cpq, confirmation, dialog, modal, destructive-actions, blocker]
---

# TASK-122 — Confirmation Dialogs for Destructive Actions

## Context

The CPQ has destructive actions that execute immediately without confirmation. Dana Chen said about the "Enable CPQ" button: "I'm about to create 6 new object types in my CRM and there's no confirmation dialog? What if I click this by accident?"

The CpqSetupPage already has a basic teardown confirmation (a two-step button pattern), but it's not a proper modal dialog. Other destructive actions (deleting line items, removing products) have no confirmation at all.

Twenty already has a `ConfirmationModal` component at `packages/twenty-front/src/modules/ui/layout/modal/components/ConfirmationModal.tsx` that supports title, subtitle, confirmation text input, and styled confirm/cancel buttons. This task wires it up to all CPQ destructive actions.

## User Stories

**As Dana (VP RevOps)**, I want confirmation dialogs before any action that deletes data or changes system configuration, so that accidental clicks don't cause damage.

**As Jordan (CRM Admin)**, I want the confirmation dialog to clearly explain what will be deleted/changed before I confirm, so that I understand the consequences.

**As Alex (Sales Rep)**, I want a quick "Are you sure?" dialog before deleting a line item from a quote, so that I don't lose pricing I've already configured.

## Outcomes

- "Enable CPQ" shows a confirmation modal explaining what will be created
- "Remove CPQ" uses a proper modal (replacing the inline two-step button pattern)
- Deleting a line item from a quote shows a brief confirmation
- Any future destructive action has a confirmation gate
- Confirmation modals use Twenty's existing `ConfirmationModal` component
- Destructive confirm buttons are red/danger-styled

## Success Metrics

- [ ] "Enable CPQ" click shows ConfirmationModal before executing
- [ ] "Remove CPQ" click shows ConfirmationModal (replacing inline confirm)
- [ ] Removing a line item shows a lightweight confirmation
- [ ] Modal clearly describes what will happen (e.g., "This will create 6 new object types...")
- [ ] Cancel button closes modal without executing action
- [ ] Confirm button executes the action and shows appropriate toast (TASK-121)
- [ ] Destructive confirm buttons use danger/red accent
- [ ] Modals are keyboard-accessible (Escape to cancel, Enter to confirm)
- [ ] Unit tests pass for each confirmation flow

## Implementation Plan

### Step 1: Add ConfirmationModal to CpqSetupPage for Enable CPQ

Modify `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx`:

- Import `ConfirmationModal` from `@/ui/layout/modal/components/ConfirmationModal`
- Import `useModal` from `@/ui/layout/modal/hooks/useModal`
- Add a modal instance for setup confirmation:
  ```typescript
  const { openModal: openSetupModal, closeModal: closeSetupModal } = useModal();
  const SETUP_MODAL_ID = 'cpq-setup-confirmation';
  ```
- Replace the direct `handleSetup` call on the "Enable CPQ" button with `openSetupModal(SETUP_MODAL_ID)`
- Add the modal JSX:
  ```tsx
  <ConfirmationModal
    modalInstanceId={SETUP_MODAL_ID}
    title="Enable CPQ"
    subtitle="This will create 6 new object types in your workspace: Quotes, Quote Line Items, Contracts, Subscriptions, Amendments, and Price Configurations. Relations to Companies and Opportunities will be added automatically."
    onConfirmClick={handleSetup}
    confirmButtonText="Enable CPQ"
    confirmButtonAccent="blue"
  />
  ```

### Step 2: Replace inline teardown confirmation with ConfirmationModal

In the same file, replace the `showTeardownConfirm` state and inline button swap with a proper modal:

- Remove `showTeardownConfirm` state
- Add a teardown modal instance: `const TEARDOWN_MODAL_ID = 'cpq-teardown-confirmation'`
- Replace the "Remove CPQ" button to open the modal
- Use `confirmationValue` prop to require typing "REMOVE" to confirm (matches Twenty's pattern for dangerous operations)
- Modal subtitle: "This will permanently delete all CPQ objects and their data. Existing records (quotes, contracts, subscriptions) will be lost. Type REMOVE to confirm."

### Step 3: Add confirmation to line item removal in QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

For line item removal, use a lighter-weight approach since it's a frequent action:
- Add state `lineItemToDelete: string | null`
- When the remove button (x) is clicked, set `lineItemToDelete` to the item ID
- Show a small ConfirmationModal: "Remove this line item? This cannot be undone."
- On confirm, call `removeLineItem(lineItemToDelete)` and clear the state
- Confirm button text: "Remove"

### Step 4: Verify modal provider

Ensure `ModalStatefulWrapper` or equivalent is available in the component tree for CPQ pages. Check that `SettingsCpq.tsx` and `QuoteBuilderPage.tsx` are wrapped in providers that support `useModal`.

## Files to Change

- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx` — add setup/teardown modals, remove inline confirm pattern
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — add line item deletion confirm

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqSetupPage.confirmation.test.tsx`

- `should show confirmation modal when "Enable CPQ" is clicked`
- `should not run setup until modal is confirmed`
- `should close modal on cancel without running setup`
- `should show confirmation modal when "Remove CPQ" is clicked`
- `should require typing "REMOVE" to confirm teardown`
- `should not run teardown until confirmation text matches`
- `should show toast after confirmed setup (integration with TASK-121)`

### Unit tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.confirmation.test.tsx`

- `should show confirmation when removing a line item`
- `should remove line item after confirmation`
- `should keep line item when removal is cancelled`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
