---
name: guided-pricing-setup
description: Build guided product/pricing setup wizards. Use when creating product creation wizards, pricing model selectors, tier tables, template galleries, or bundle builders for the CPQ system.
argument-hint: "[component] — product-wizard | tier-table | template-gallery | pricing-selector | bundle-builder | all"
disable-model-invocation: true
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Agent", "TodoWrite"]
effort: high
---

# Guided Pricing Setup Builder

Build guided UI components that make complex CPQ pricing/product setup
approachable for non-technical CRM admins. Every component follows the
principle: **simple by default, complex on demand.**

---

## Prerequisites

Before building any component:

1. Read the UX research: `knowledge/features/guided-pricing-ux.md`
2. Read the CPQ schema: `src/lib/db/cpq-schema.ts`
3. Read the CPQ validation: `src/lib/cpq/validation.ts`
4. Verify dependencies are installed:
   ```
   npm ls react-hook-form @stepperize/react @tanstack/react-table zustand
   ```
   If any are missing, install them:
   ```
   npm install react-hook-form @hookform/resolvers @stepperize/react @tanstack/react-table @dnd-kit/react zustand
   ```

---

## Component Selection

Parse `$ARGUMENTS` to determine which component to build:

| Argument | Component | Description |
|----------|-----------|-------------|
| `product-wizard` | Product Creation Wizard | Multi-step wizard with type-driven progressive disclosure |
| `tier-table` | Tier Table Editor | Inline-editable table with auto-linked ranges and live calculator |
| `template-gallery` | Template Gallery | Starter templates for common pricing models on empty state |
| `pricing-selector` | Pricing Model Selector | Visual card selector for flat/graduated/volume/per-unit |
| `bundle-builder` | Bundle Builder | Two-panel layout with components and live pricing summary |
| `all` | All Components | Build all five components in dependency order |

If `$ARGUMENTS` is empty or `all`, build in this order:
1. `template-gallery` (no deps)
2. `pricing-selector` (no deps)
3. `tier-table` (needs pricing-selector)
4. `product-wizard` (needs template-gallery + pricing-selector + tier-table)
5. `bundle-builder` (needs product-wizard)

---

## Standing Rules

These rules apply to EVERY component, every time:

1. **Read before writing.** Read existing files in `src/components/cpq/` before
   creating new ones. Match existing patterns.
2. **shadcn/ui primitives only.** Use Card, Button, Input, Select, Tabs,
   Accordion, Dialog, Form — no custom UI framework.
3. **react-hook-form + Zod** for all form state. One Zod schema per wizard
   step. Use `zodResolver` from `@hookform/resolvers`.
4. **Progressive disclosure.** Start with the simplest view. Advanced options
   behind an explicit toggle/accordion. Maximum 2 levels of disclosure.
5. **Accessibility.** All interactive elements have aria-labels. Color
   indicators paired with icons/text. Click-to-expand (not hover) for tooltips.
6. **Loading/error/empty states.** Every component defines all three.
7. **No floating-point** in pricing displays. Use `Decimal.js` for all
   calculations. Format with `toLocaleString()` for display.
8. **Tests for business logic.** Wizard step validation, tier auto-linking,
   bundle pricing calculations — all tested. UI rendering is not tested.

---

## Component Specifications

### 1. Template Gallery (`template-gallery`)

**Files:**
- `src/components/cpq/template-gallery.tsx`

**Behavior:**
- Shown when product catalog is empty (detected via API or prop)
- 6 template cards in a 3×2 grid: Per-Seat SaaS, Usage-Based, Flat Rate,
  Tiered Volume, One-Time Fee, Professional Services
- Each card: icon, title, one-line description, "Use Template" button
- Clicking a template opens the product wizard pre-filled with that template's
  defaults
- "Start from scratch" link at bottom opens blank product wizard
- Templates defined as a const array (not hardcoded in JSX)

**Template data shape:**
```typescript
interface PricingTemplate {
  id: string;
  icon: string;
  title: string;
  description: string;
  defaults: {
    productType: 'subscription' | 'one_time' | 'professional_service';
    chargeType: 'recurring' | 'one_time' | 'usage';
    billingFrequency?: string;
    defaultTermMonths?: number;
    pricingModel: 'flat' | 'per_unit' | 'graduated' | 'volume';
    placeholderTiers?: Array<{ from: number; to: number | null; price: number }>;
  };
}
```

### 2. Pricing Model Selector (`pricing-selector`)

**Files:**
- `src/components/cpq/pricing-model-selector.tsx`

**Behavior:**
- Visual card selector, NOT a dropdown
- Default shows 2 simple cards: "Flat Rate" and "Per Unit"
- "Show advanced pricing" toggle reveals 2 more: "Graduated (Tiered)" and
  "Volume (All-Units)"
- Each card: small diagram/icon, name, one-sentence description
- Selected card has blue border + checkmark
- Controlled component: `value` + `onChange` props
- Each card includes a click-to-expand info panel with: definition, visual
  diagram (ASCII or SVG), and a calculated example

### 3. Tier Table Editor (`tier-table`)

**Files:**
- `src/components/cpq/tier-table-editor.tsx`
- `src/lib/cpq/tier-utils.ts` (pure functions)
- `src/lib/cpq/tier-utils.test.ts` (tests)

**Behavior:**
- Inline-editable table with columns: From, To, Unit Price, Flat Fee (optional)
- Uses `useFieldArray` from react-hook-form to manage dynamic rows
- **Auto-linking:** changing a tier's "To" auto-fills the next tier's "From"
  as To + 1. Last tier's "To" is always "∞" (rendered, stored as null)
- **Validation:**
  - Red error: overlapping ranges, negative prices
  - Yellow warning: ascending per-unit prices (unusual for volume discounts)
  - Auto-fix: gap detection triggers auto-cascade
- **Live calculator:** "Test with quantity: [___]" input below the table.
  Shows: which tier applies, unit price, total price, effective rate.
  For graduated: shows per-tier breakdown.
- **Add/remove:** "+ Add Tier" button appends row. "×" button removes
  (minimum 1 tier). Drag handle for reorder via dnd-kit.
- `tier-utils.ts` exports pure functions: `autoLinkTiers()`,
  `validateTiers()`, `calculateTieredPrice()`, `calculateVolumePrice()`,
  `calculateEffectiveRate()`

### 4. Product Creation Wizard (`product-wizard`)

**Files:**
- `src/components/cpq/product-wizard.tsx`
- `src/components/cpq/product-wizard-steps/step-type.tsx`
- `src/components/cpq/product-wizard-steps/step-details.tsx`
- `src/components/cpq/product-wizard-steps/step-pricing.tsx`
- `src/components/cpq/product-wizard-steps/step-review.tsx`

**Behavior:**
- 4-step wizard using Stepperize:
  1. **Type** — 3 visual cards: Subscription, One-Time, Professional Service.
     Selecting type determines which fields appear in subsequent steps.
  2. **Details** — Name, SKU (optional), Description (optional), Family
     (optional). Required fields marked with asterisk.
  3. **Pricing** — Type-specific:
     - Subscription: Billing period selector, default term, pricing model
       selector (from `pricing-selector`), price input (or tier table if
       graduated/volume selected)
     - One-Time: Single price input
     - Service: Rate type toggle (hourly/project), rate input, estimated hours
       (if hourly)
  4. **Review** — Summary card showing all entered data. "Create Product"
     button. "Back" to edit any step.
- Stepper progress bar at top showing current step (1/4, 2/4, etc.)
- Zod schema per step, validated on "Next"
- Can be pre-filled from template gallery
- On submit: POST to `/api/products`

### 5. Bundle Builder (`bundle-builder`)

**Files:**
- `src/components/cpq/bundle-builder.tsx`
- `src/components/cpq/bundle-pricing-summary.tsx`

**Behavior:**
- Two-panel layout:
  - **Left:** Component tree grouped by feature category. Each component has:
    checkbox (optional) or lock icon (required), name, unit price, quantity
    input. Radio buttons for mutually exclusive groups. Min/max counter per
    feature group ("2 of 2-4 selected").
  - **Right:** Live pricing summary. Lists selected components with prices.
    Shows: individual total (sum of all at list price), bundle price
    (with discount applied), savings amount and percentage.
- "Add Component" button opens product selector filtered to org products
- Component removal via "×" (only optional components)
- Bundle discount input: percentage or fixed amount
- On save: creates bundle product with product_options via API

---

## Error Handling

- **Missing dependencies:** If npm packages aren't installed, show the exact
  install command and stop. Don't attempt to build without them.
- **Existing files:** If a component file already exists, read it first. Ask
  the user whether to overwrite or extend.
- **Schema mismatch:** If the CPQ schema has changed since planning, read the
  current schema and adapt the component. Don't use stale field names.
- **Test failures:** If tier-utils tests fail, fix the pure functions before
  building the UI component that depends on them.

---

## Verification

After building each component:

1. **Type check:** `npx tsc --noEmit` — zero errors
2. **Tests:** `npx vitest run` — all passing
3. **File audit:** Every file listed in the component spec exists
4. **Import check:** Component can be imported without errors
5. **Commit:** `git add` + `git commit` with descriptive message referencing
   the component name
