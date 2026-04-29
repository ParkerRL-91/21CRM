---
title: Form validation (prevent invalid quotes)
id: TASK-129
project: PRJ-006
status: ready
priority: P1
tier: 2
effort: 2 days
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-116]
tags: [cpq, validation, form, data-quality, confidence-builder]
---

# TASK-129 — Form Validation (Prevent Invalid Quotes)

## Context

The quote builder has no form validation. Users can submit quotes with $0 line items, >100% discounts, empty product names, and negative quantities. The pricing calculator accepts any input. Dana Chen's review implied this gap: "A quote with zero-price items got submitted."

The HTML `min`/`max` attributes on inputs provide basic browser validation, but they are easily bypassed and provide no inline error messages. Enterprise CPQ tools prevent invalid data from being saved, not just from being submitted.

Depends on TASK-116 (Product Catalog Picker) because validation needs to check that products come from the catalog.

## User Stories

**As Alex (Sales Rep)**, I want the system to prevent me from submitting a quote with obvious errors (zero prices, missing products), so that I don't embarrass myself with a broken proposal.

**As Raj (Deal Desk Specialist)**, I want inline validation messages that tell me exactly what's wrong with each field, so that I can fix issues before submission.

**As Dana (VP RevOps)**, I want data quality enforced at the UI level, so that no invalid quotes enter the pipeline and corrupt my reporting.

**As Jordan (CRM Admin)**, I want validation rules to be clear and consistent, so that I can train the sales team on what's required.

## Outcomes

- Inline validation messages appear below invalid fields in real-time (not just on submit)
- Quote name is required (cannot be empty)
- At least one line item is required to submit
- Each line item must have a product selected (from catalog)
- Quantity must be >= 1
- List price must be > 0
- Discount must be between 0 and 100
- Net total cannot be $0 (after discount calculation)
- "Submit" / "Generate PDF" buttons are disabled when validation fails
- A validation summary appears at the top of the form when submit is attempted with errors

## Success Metrics

- [ ] Empty quote name shows "Quote name is required" error inline
- [ ] Submitting with 0 line items shows "At least one line item is required"
- [ ] Line item without product shows "Select a product from the catalog"
- [ ] Quantity of 0 or negative shows "Quantity must be at least 1"
- [ ] List price of $0 shows "List price must be greater than zero"
- [ ] Discount of 101% shows "Discount cannot exceed 100%"
- [ ] Discount of -5% shows "Discount cannot be negative"
- [ ] Net total of $0 shows warning "This line item has a $0 total"
- [ ] Submit button is disabled when any validation error exists
- [ ] Validation messages are red and appear below the relevant field
- [ ] Validation runs on blur (not on every keystroke) to avoid UX annoyance
- [ ] Validation summary counts errors: "3 issues found — fix before submitting"
- [ ] All validation rules have unit tests

## Implementation Plan

### Step 1: Create validation utilities

Create `packages/twenty-front/src/modules/cpq/utils/cpq-validation.ts`:

```typescript
type ValidationError = {
  field: string;
  message: string;
  severity: 'error' | 'warning';
};

export const validateQuoteName = (name: string): ValidationError | null => {
  if (!name.trim()) {
    return { field: 'quoteName', message: 'Quote name is required', severity: 'error' };
  }
  if (name.length > 200) {
    return { field: 'quoteName', message: 'Quote name cannot exceed 200 characters', severity: 'error' };
  }
  return null;
};

export const validateLineItem = (item: LineItem): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!item.productName) {
    errors.push({ field: `${item.id}.productName`, message: 'Select a product from the catalog', severity: 'error' });
  }
  if (item.quantity < 1) {
    errors.push({ field: `${item.id}.quantity`, message: 'Quantity must be at least 1', severity: 'error' });
  }
  if (parseFloat(item.listPrice) <= 0) {
    errors.push({ field: `${item.id}.listPrice`, message: 'List price must be greater than zero', severity: 'error' });
  }
  if (item.discountPercent < 0) {
    errors.push({ field: `${item.id}.discountPercent`, message: 'Discount cannot be negative', severity: 'error' });
  }
  if (item.discountPercent > 100) {
    errors.push({ field: `${item.id}.discountPercent`, message: 'Discount cannot exceed 100%', severity: 'error' });
  }
  if (item.netTotal !== null && parseFloat(item.netTotal) === 0 && parseFloat(item.listPrice) > 0) {
    errors.push({ field: `${item.id}.netTotal`, message: 'This line item has a $0 total', severity: 'warning' });
  }
  return errors;
};

export const validateQuote = (quoteName: string, lineItems: LineItem[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const nameError = validateQuoteName(quoteName);
  if (nameError) errors.push(nameError);
  if (lineItems.length === 0) {
    errors.push({ field: 'lineItems', message: 'At least one line item is required', severity: 'error' });
  }
  lineItems.forEach(item => errors.push(...validateLineItem(item)));
  return errors;
};
```

### Step 2: Create the CpqFieldError component

Create `packages/twenty-front/src/modules/cpq/components/CpqFieldError.tsx`:

A small inline error message component:
```typescript
type CpqFieldErrorProps = {
  message: string;
  severity: 'error' | 'warning';
};
```

Renders red text for errors, orange/yellow text for warnings, with a small icon (IconAlertCircle for error, IconAlertTriangle for warning).

### Step 3: Create the validation summary component

Create `packages/twenty-front/src/modules/cpq/components/CpqValidationSummary.tsx`:

Shows at the top of the form when there are validation errors:
- Red banner: "3 errors found — fix before submitting"
- Collapsible list of all error messages with links to the relevant field

### Step 4: Integrate validation into QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Import validation utilities and components
- Add state: `validationErrors: ValidationError[]`, `showValidation: boolean`
- Run validation on blur for each field (not on every keystroke)
- Run full validation when "Submit" or "Generate PDF" is clicked; if errors exist, set `showValidation = true` and don't proceed
- Show `<CpqFieldError>` below each invalid field
- Show `<CpqValidationSummary>` at the top when `showValidation` is true and errors exist
- Disable submit/PDF buttons when errors with severity 'error' exist (warnings don't block)
- Add red border to invalid input fields:
  ```tsx
  style={{ borderColor: hasError ? '#ef4444' : undefined }}
  ```

### Step 5: Add validation to pricing calculator

Modify `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx`:

- Validate list price > 0, quantity >= 1, discount 0-100 before calling `calculatePrice`
- Show inline errors below invalid fields
- Disable "Calculate" button when inputs are invalid

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/utils/cpq-validation.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqFieldError.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqValidationSummary.tsx`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — integrate validation
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx` — add input validation
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/utils/__tests__/cpq-validation.test.ts`

- `should return error for empty quote name`
- `should return null for valid quote name`
- `should return error for quote name over 200 characters`
- `should return error for missing product name`
- `should return error for quantity less than 1`
- `should return error for zero list price`
- `should return error for discount over 100`
- `should return error for negative discount`
- `should return warning for $0 net total`
- `should return error for zero line items`
- `should return all errors for a fully invalid quote`
- `should return empty array for a valid quote`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqFieldError.test.tsx`

- `should render error message in red`
- `should render warning message in orange`
- `should show appropriate icon for each severity`

### Integration tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.validation.test.tsx`

- `should show validation errors on submit with invalid data`
- `should disable submit button when errors exist`
- `should clear errors when fields are corrected`
- `should show validation summary with error count`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
