---
title: Product catalog picker with search/autocomplete
id: TASK-116
project: PRJ-006
status: ready
priority: P0
tier: 1
effort: 3 days
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, quote-builder, product-picker, search, autocomplete, blocker]
---

# TASK-116 — Product Catalog Picker with Search/Autocomplete

## Context

The quote builder (`QuoteBuilderPage.tsx`) currently uses a raw text input for product names. Users type free-text into a `<StyledProductInput>` field. There is no product catalog search, no autocomplete, and no way to select from existing products. Dana Chen called this "a data quality nightmare" — reps can spell product names differently, enter invalid products, and there is no link between the line item and actual catalog pricing.

The product catalog already exists — `cpq-phenotips-catalog.ts` contains structured product data with names, SKUs, families, and pricing. The backend `CpqSetupService.seedProductCatalog()` seeds these into the workspace. The missing piece is a picker component that lets users search and select from this catalog when building quotes.

## User Stories

**As Alex (Sales Rep)**, I want to search for products by name or SKU when adding line items to a quote, so that I don't have to remember exact product names and the pricing auto-fills correctly.

**As Raj (Deal Desk Specialist)**, I want product selection to enforce our catalog — preventing reps from typing arbitrary product names — so that every quote maps to a real, priced product in our system.

**As Dana (VP RevOps)**, I want quote data to be clean and standardized, so that I can run reliable reports on which products are selling and at what discounts.

**As Jordan (CRM Admin)**, I want the product picker to pull from the same catalog I seed in CPQ setup, so that I manage products in one place and they flow through to quotes automatically.

## Outcomes

- Typing in the product field opens a dropdown showing matching products from the catalog
- Products can be searched by name, SKU, or product family
- Selecting a product auto-fills the list price, billing type, and product name
- Free-text product names are no longer accepted — the field only accepts catalog selections
- The picker shows product family as a secondary label and list price as a tertiary label
- If no products match, a "No products found" message appears
- The picker is keyboard-accessible (arrow keys, Enter to select, Escape to close)

## Success Metrics

- [ ] Product name field in QuoteBuilderPage shows autocomplete dropdown on focus/type
- [ ] Typing "Pro" filters to products containing "Pro" in name or SKU
- [ ] Selecting a product sets productName, listPrice, and SKU on the line item
- [ ] Arrow keys navigate the dropdown, Enter selects, Escape closes
- [ ] Empty search shows all products (capped at 20 visible, scrollable)
- [ ] Product family badge visible in each dropdown row
- [ ] List price visible in each dropdown row
- [ ] "No products found" message when zero matches
- [ ] Component renders in under 100ms with 50+ products
- [ ] Unit tests pass for search filtering, selection, and keyboard navigation

## Implementation Plan

### Step 1: Create the ProductCatalogPicker component

Create a new file `packages/twenty-front/src/modules/cpq/components/CpqProductPicker.tsx`.

This component should:
- Accept props: `products: CatalogEntry[]`, `value: CatalogEntry | null`, `onChange: (product: CatalogEntry) => void`, `placeholder?: string`
- Maintain internal state for `searchQuery` (string) and `isOpen` (boolean)
- Filter products by matching `searchQuery` against `name`, `sku`, and `productFamily` (case-insensitive)
- Render a styled input field on top, and a dropdown list below when `isOpen` is true
- Each dropdown row shows: product name (bold), product family (badge), list price (right-aligned)
- Use `@linaria/react` styled components following the pattern in `CpqPricingCalculator.tsx`
- Implement keyboard navigation: `ArrowDown`/`ArrowUp` to move highlight, `Enter` to select, `Escape` to close
- Use a `ref` on the container with `onBlur` to close the dropdown when focus leaves

Style references:
- Use `var(--twentyborder-color)` for borders
- Use `var(--twentybackground-color-secondary)` for dropdown background
- Use `var(--twentyfont-color-primary)` and `var(--twentyfont-color-secondary)` for text
- Match the `StyledInput` pattern from `QuoteBuilderPage.tsx` for the input field
- Use `StyledFamilyTag` pattern from `CpqSetupPage.tsx` for family badges

```typescript
// Key type signature
type CpqProductPickerProps = {
  products: CatalogEntry[];
  value: CatalogEntry | null;
  onChange: (product: CatalogEntry) => void;
  placeholder?: string;
};
```

### Step 2: Create a hook to load the product catalog

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-catalog.ts`.

This hook should:
- Fetch product catalog from the workspace (via the same pattern as `use-cpq-setup.ts`, calling `GET /cpq/products` or using the GraphQL API for PriceConfiguration records)
- Return `{ products: CatalogEntry[], isLoading: boolean, error: string | null }`
- Cache results in component state (Apollo Client migration in TASK-131 will add proper caching later)
- Fall back to the static `PHENOTIPS_CATALOG_US` / `PHENOTIPS_CATALOG_UK` from `cpq-phenotips-catalog.ts` if the API call fails

### Step 3: Integrate the picker into QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Import `CpqProductPicker` and `useCpqCatalog`
- Replace the `<StyledProductInput>` in the line items table with `<CpqProductPicker>`
- When a product is selected, update the line item's `productName`, `listPrice`, and add a new `sku` field
- Update the `LineItem` type to include `sku: string` and `billingType: 'recurring' | 'one_time'`
- Auto-trigger `recalcLineItem` when a product is selected (so net total updates immediately)

### Step 4: Update the barrel export

Add to `packages/twenty-front/src/modules/cpq/index.ts`:
```typescript
export { CpqProductPicker } from './components/CpqProductPicker';
export { useCpqCatalog } from './hooks/use-cpq-catalog';
```

### Step 5: Add backend endpoint for product listing (if needed)

If no existing endpoint returns workspace products, add to `packages/twenty-server/src/modules/cpq/cpq.controller.ts`:
```typescript
@Get('products')
async listProducts(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
  return this.setupService.listProducts(workspaceId);
}
```

And add `listProducts()` to `packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts`.

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqProductPicker.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-catalog.ts`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — replace text input with picker
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports
- **Possibly modify**: `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add GET /cpq/products
- **Possibly modify**: `packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` — add listProducts()

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqProductPicker.test.tsx`

- `should render input field with placeholder text`
- `should open dropdown on input focus`
- `should filter products by name when typing`
- `should filter products by SKU when typing`
- `should filter products by product family when typing`
- `should show "No products found" when no matches`
- `should select product on click and close dropdown`
- `should navigate dropdown with arrow keys`
- `should select highlighted product on Enter`
- `should close dropdown on Escape`
- `should close dropdown on outside click`
- `should display product name, family badge, and price in each row`
- `should call onChange with selected CatalogEntry`
- `should show selected product name in input when value is provided`

### Integration tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.test.tsx`

- `should show product picker instead of free-text input for product name`
- `should auto-fill list price when product is selected`
- `should recalculate net total after product selection`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
