---
title: Discount guardrails with visual feedback
id: TASK-126
project: PRJ-006
status: ready
priority: P1
tier: 2
effort: 2 days
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-118]
tags: [cpq, discount, guardrails, validation, visual-feedback, confidence-builder]
---

# TASK-126 — Discount Guardrails with Visual Feedback

## Context

The quote builder's discount field is a plain number input with `min={0}` and `max={100}` — basic HTML validation only. There is no visual indication of whether a discount is within approved limits. Reps need to see limits before they type: "Is 15% OK or do I need approval? What about 25%?"

This task adds color-coded visual feedback to the discount input: green for auto-approved discounts, yellow for discounts requiring manager approval, and red for discounts exceeding maximum allowed. The thresholds come from the approval rules created in TASK-118.

## User Stories

**As Alex (Sales Rep)**, I want to see instantly whether my discount will be auto-approved (green), need manager approval (yellow), or is too high (red), so that I can set the right expectation with the customer during the call.

**As Dana (VP RevOps)**, I want reps to have guardrails that prevent them from offering excessive discounts, and visual cues that encourage them to stay within approved limits.

**As Raj (Deal Desk Specialist)**, I want the discount input to show the thresholds visually, so that I don't have to memorize approval policies.

## Outcomes

- Discount input border color changes based on the entered value vs. approval thresholds
- Green border + checkmark: discount is within auto-approve range (e.g., 0-15%)
- Yellow border + warning icon: discount requires approval (e.g., 16-30%)
- Red border + X icon: discount exceeds maximum allowed (e.g., > 30%)
- A small tooltip or label below the input shows the current threshold info
- Thresholds are loaded from approval rules (TASK-118), not hardcoded

## Success Metrics

- [ ] Discount input shows green border for values below first approval threshold
- [ ] Discount input shows yellow border for values between first and second thresholds
- [ ] Discount input shows red border for values above maximum threshold
- [ ] Color-coded icon (check/warning/X) appears next to the discount input
- [ ] Tooltip shows threshold info: "Auto-approved up to 15%. Manager approval required 16-30%."
- [ ] Thresholds are read from approval rules, not hardcoded
- [ ] Color transitions smoothly as user types (not jarring)
- [ ] Guardrails work for all line items in the quote
- [ ] Red discount does not prevent entry but shows clear warning
- [ ] Unit tests pass for each discount level color state

## Implementation Plan

### Step 1: Create the discount guardrail hook

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-discount-guardrails.ts`:

```typescript
type DiscountLevel = 'safe' | 'warning' | 'danger';

type DiscountGuardrails = {
  safeThreshold: number;      // e.g., 15 — auto-approve up to this
  warningThreshold: number;   // e.g., 30 — requires escalated approval above this
  maxDiscount: number;        // e.g., 50 — hard maximum
  getLevel: (discountPercent: number) => DiscountLevel;
  getMessage: (discountPercent: number) => string;
};
```

- Load thresholds from approval rules via `use-cpq-approval-rules.ts` (TASK-118)
- Derive thresholds from rule conditions: the lowest `discountPercent > X` rule defines `safeThreshold`, the next defines `warningThreshold`
- If no rules are configured, use sensible defaults (15% / 30% / 50%)

### Step 2: Create the CpqDiscountInput component

Create `packages/twenty-front/src/modules/cpq/components/CpqDiscountInput.tsx`:

```typescript
type CpqDiscountInputProps = {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  guardrails: DiscountGuardrails;
};
```

The component wraps the existing `StyledInput` with additional visual elements:
- Border color changes: green (`#10b981`), yellow (`#f59e0b`), red (`#ef4444`)
- Small icon to the right of the input: `IconCheck` (green), `IconAlertTriangle` (yellow), `IconX` (red)
- Tooltip/label below: "Auto-approved" / "Requires manager approval" / "Exceeds maximum discount"
- A thin colored bar below the input showing the discount on a scale

Use `@linaria/react` styled components:
```typescript
const StyledDiscountWrapper = styled.div<{ level: DiscountLevel }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const StyledDiscountInput = styled.input<{ level: DiscountLevel }>`
  border-color: ${({ level }) =>
    level === 'safe' ? '#10b981' :
    level === 'warning' ? '#f59e0b' : '#ef4444'};
  // ... rest of styling
`;
```

### Step 3: Integrate into QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Import `CpqDiscountInput` and `useDiscountGuardrails`
- Replace the plain `<StyledInput type="number" ... />` for discount with `<CpqDiscountInput>`
- Pass guardrails from the hook

### Step 4: Add a discount scale visualizer (optional enhancement)

Below the line items table, add a small legend showing the discount scale:
```
[====GREEN====|====YELLOW====|==RED==]
0%          15%            30%      50%
Auto-approve  Manager       VP Sales
```

This helps users understand the full approval landscape at a glance.

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-discount-guardrails.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqDiscountInput.tsx`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — replace discount input
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqDiscountInput.test.tsx`

- `should render input with green border for discount below safe threshold`
- `should render input with yellow border for discount between safe and warning thresholds`
- `should render input with red border for discount above warning threshold`
- `should show IconCheck for safe discounts`
- `should show IconAlertTriangle for warning discounts`
- `should show IconX for danger discounts`
- `should display "Auto-approved" label for safe discounts`
- `should display "Requires approval" label for warning discounts`
- `should display "Exceeds maximum" label for danger discounts`
- `should update color on value change`
- `should allow entering red-level discounts (not blocking)`

### Hook tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-discount-guardrails.test.ts`

- `should derive thresholds from approval rules`
- `should use default thresholds when no rules configured`
- `should return correct level for each discount value`
- `should return correct message for each level`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
