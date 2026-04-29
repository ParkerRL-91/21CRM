---
title: Mobile responsive (all CPQ pages)
id: TASK-130
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 5 days
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-123]
tags: [cpq, mobile, responsive, layout, differentiator]
---

# TASK-130 — Mobile Responsive (All CPQ Pages)

## Context

Dana Chen said: "I check renewals on my phone every Monday morning before standup." When she viewed the renewal dashboard on her phone, "the 4-column metric grid squishes into an unreadable mess. The table overflows off-screen."

The CPQ has minimal responsive design. `CpqPricingCalculator.tsx` has some basic `@media` queries, and `CpqHealthDashboard.tsx` has responsive grid columns, but the setup page, quote builder, and template gallery have no mobile adaptations. Tables with 5+ columns overflow on small screens.

Depends on TASK-123 (Replace emoji icons) because icon components size better on mobile than emoji characters.

## User Stories

**As Dana (VP RevOps)**, I want to check renewal risk on my phone Monday morning, so that I'm prepared for the 9 AM standup without opening my laptop.

**As Alex (Sales Rep)**, I want to review and share a quote on my tablet during a customer meeting, so that I look professional and responsive.

**As Jordan (CRM Admin)**, I want the CPQ setup page to work on my iPad, so that I can configure CPQ from anywhere.

## Outcomes

- All CPQ pages render correctly on phone (320px-480px) and tablet (768px-1024px)
- Tables convert to card-based layouts on small screens
- Metric grids reflow to 2-column on tablet, 1-column on phone
- Forms stack vertically on phone with full-width inputs
- No horizontal scrolling required on any CPQ page
- Touch targets are at least 44x44px for all interactive elements
- Text remains readable at all breakpoints

## Success Metrics

- [ ] CpqSetupPage: objects grid stacks to 2-column on tablet, 1-column on phone
- [ ] CpqSetupPage: product catalog table converts to card layout on phone
- [ ] CpqSetupPage: buttons stack vertically on phone
- [ ] QuoteBuilderPage: line items table converts to card layout on phone
- [ ] QuoteBuilderPage: form inputs are full-width on phone
- [ ] CpqTemplateGallery: grid goes from 3-column to 2-column to 1-column
- [ ] CpqHealthDashboard: metrics grid already responsive — verify
- [ ] CpqPricingCalculator: inputs stack vertically on phone (already partially done — verify)
- [ ] No horizontal scroll on any page at 320px width
- [ ] All touch targets >= 44x44px
- [ ] Text sizes remain readable (minimum 12px)
- [ ] Visual regression tests pass at 320px, 768px, and 1024px widths

## Implementation Plan

### Step 1: Define responsive breakpoints

Create `packages/twenty-front/src/modules/cpq/constants/cpq-breakpoints.ts`:

```typescript
export const CPQ_BREAKPOINTS = {
  phone: 480,
  tablet: 768,
  desktop: 1024,
} as const;

export const cpqMediaQuery = {
  phone: `@media (max-width: ${CPQ_BREAKPOINTS.phone}px)`,
  tablet: `@media (max-width: ${CPQ_BREAKPOINTS.tablet}px)`,
  desktop: `@media (min-width: ${CPQ_BREAKPOINTS.desktop + 1}px)`,
} as const;
```

Note: Check if Twenty already has breakpoint constants. If so, use those instead for consistency.

### Step 2: Make CpqSetupPage responsive

Modify `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx`:

- Object grid (`StyledObjectGrid`): Change from `grid-template-columns: 1fr 1fr 1fr` to responsive:
  ```css
  @media (max-width: 768px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
  ```

- Product catalog table: Create a card-based alternative for mobile:
  ```css
  @media (max-width: 768px) {
    /* Hide table, show cards */
    table { display: none; }
    .mobile-cards { display: block; }
  }
  ```
  Create a `StyledProductCard` component that shows product info in a vertical card layout.

- Button rows: Stack vertically on phone:
  ```css
  @media (max-width: 480px) {
    flex-direction: column;
    button { width: 100%; }
  }
  ```

- Region tabs: Full-width on phone
- Page padding: Reduce from 32px to 16px on phone

### Step 3: Make QuoteBuilderPage responsive

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

- Line items table: Convert to card layout on mobile. Each line item becomes a vertical card:
  ```
  [Product Name]
  Qty: 5  |  List: $1,200  |  Disc: 15%
  Net Total: $5,100
  [Remove]
  ```

- Create `StyledMobileLineItemCard` component
- Quote header inputs: Stack vertically on phone
- Totals row: Full-width on phone
- Add `@media` queries to all styled components that use horizontal layouts

### Step 4: Make CpqTemplateGallery responsive

Modify `packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx`:

- Grid: `repeat(3, 1fr)` -> `repeat(auto-fill, minmax(240px, 1fr))`
- Cards: Ensure minimum touch target size (44px height minimum)
- Card padding: Increase on touch devices

### Step 5: Make CpqHealthDashboard responsive (verify/enhance)

Review `packages/twenty-front/src/modules/cpq/components/CpqHealthDashboard.tsx`:

- Metrics grid already has responsive columns — verify they work correctly
- Pie chart: Ensure container resizes properly
- Legend: Ensure wrapping works on small screens

### Step 6: Create responsive table utility

Create `packages/twenty-front/src/modules/cpq/components/CpqResponsiveTable.tsx`:

A wrapper component that renders as a `<table>` on desktop and as stacked cards on mobile. This can be reused across all CPQ tables (line items, renewals, product catalog, audit trail).

```typescript
type CpqResponsiveTableProps<TRow> = {
  columns: Array<{ header: string; accessor: (row: TRow) => React.ReactNode; priority?: number }>;
  rows: TRow[];
  keyExtractor: (row: TRow) => string;
  onRowClick?: (row: TRow) => void;
  mobileCardRenderer?: (row: TRow) => React.ReactNode;
};
```

### Step 7: Touch target audit

Review all interactive elements and ensure:
- Buttons have minimum 44px height
- Input fields have minimum 44px height on touch
- Remove buttons (x) have adequate touch target
- Dropdown items have adequate spacing

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/constants/cpq-breakpoints.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqResponsiveTable.tsx`
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx` — add media queries, mobile card layout
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — mobile line item cards
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx` — responsive grid
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqHealthDashboard.tsx` — verify/enhance
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx` — verify/enhance

## Tests to Write

### Visual/responsive tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqResponsive.test.tsx`

- `should render table on desktop width`
- `should render cards on mobile width`
- `should stack form inputs vertically on phone width`
- `should not have horizontal overflow at 320px`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqResponsiveTable.test.tsx`

- `should render as table with all columns on desktop`
- `should render as cards on mobile`
- `should call onRowClick when card is tapped`
- `should show only high-priority columns in card summary`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
