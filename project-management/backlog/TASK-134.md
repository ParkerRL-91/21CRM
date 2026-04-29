---
title: Line item grouping UI (sections)
id: TASK-134
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 3 days
created: 2026-04-29
updated: 2026-04-29
dependencies: [TASK-116]
tags: [cpq, line-items, grouping, sections, quote-builder, differentiator]
---

# TASK-134 — Line Item Grouping UI (Sections)

## Context

Complex enterprise quotes often have 15+ line items spanning multiple categories: Platform licenses, Professional Services, Add-ons, Support. The current quote builder renders all line items in a flat list with no visual grouping. Dana Chen noted: "Complex quotes need visual structure."

Depends on TASK-116 (Product Catalog Picker) because grouping is naturally tied to product family — when products are selected from the catalog, they already have a `productFamily` field that can drive automatic grouping.

## User Stories

**As Alex (Sales Rep)**, I want to organize my quote line items into sections (Platform, Services, Add-ons), so that the customer can easily understand what they're buying.

**As Raj (Deal Desk Specialist)**, I want line items to auto-group by product family when I add them, with the ability to manually rearrange, so that quotes look professional without extra work.

**As Dana (VP RevOps)**, I want grouped quotes with section subtotals, so that the board deck shows revenue breakdown by category.

## Outcomes

- Line items can be organized into named sections/groups
- Sections auto-populate based on product family when products are selected from the catalog
- Users can manually create, rename, and reorder sections
- Each section has its own subtotal
- Line items can be dragged between sections
- The PDF export (TASK-119) reflects the grouped structure with section headers

## Success Metrics

- [ ] Line items are grouped into sections by product family
- [ ] Section headers are visible with section name and item count
- [ ] Each section shows a section subtotal
- [ ] Users can create new empty sections
- [ ] Users can rename sections
- [ ] Users can collapse/expand sections
- [ ] Users can drag line items between sections
- [ ] "Ungrouped" section exists for items without a family
- [ ] Section order can be rearranged
- [ ] Grand total remains correct across all sections
- [ ] Unit tests pass for grouping, reordering, and subtotals

## Implementation Plan

### Step 1: Update data model for sections

Add section support to `QuoteBuilderPage.tsx`:

```typescript
type LineItemSection = {
  id: string;
  name: string;
  isCollapsed: boolean;
  itemIds: string[]; // ordered list of line item IDs in this section
};

// Update state
const [sections, setSections] = useState<LineItemSection[]>([
  { id: 'default', name: 'Line Items', isCollapsed: false, itemIds: [] },
]);
```

### Step 2: Create the SectionHeader component

Create `packages/twenty-front/src/modules/cpq/components/CpqLineItemSection.tsx`:

```typescript
type CpqLineItemSectionProps = {
  section: LineItemSection;
  lineItems: LineItem[];
  sectionSubtotal: number;
  onRename: (name: string) => void;
  onToggleCollapse: () => void;
  onDeleteSection: () => void;
  onAddLineItem: () => void;
};
```

The section header shows:
- Collapse/expand chevron icon
- Editable section name (click to edit, Enter to save)
- Item count badge: "(3 items)"
- Section subtotal right-aligned
- Drag handle for reordering sections
- "+" button to add a line item within this section
- "x" button to delete section (moves items to "Ungrouped")

### Step 3: Auto-group by product family

When a product is selected from the catalog (TASK-116):
- Check if a section with that product's `productFamily` name exists
- If yes, add the line item to that section
- If no, create a new section named after the product family and add the item there

```typescript
const addLineItemToSection = (product: CatalogEntry) => {
  const existingSection = sections.find(s => s.name === product.productFamily);
  if (existingSection) {
    // Add to existing section
  } else {
    // Create new section with product family name
  }
};
```

### Step 4: Implement drag-and-drop between sections

Use HTML5 drag-and-drop or `@dnd-kit/core` for:
- Reordering line items within a section
- Moving line items between sections
- Reordering sections themselves

Wrap each line item row with drag handles.

### Step 5: Update totals calculation

Modify the totals section to show:
- Per-section subtotals (rendered in the section header)
- Grand total across all sections

### Step 6: Integrate into QuoteBuilderPage

Modify `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx`:

Replace the flat line items table with a list of `CpqLineItemSection` components:

```tsx
{sections.map(section => (
  <CpqLineItemSection
    key={section.id}
    section={section}
    lineItems={lineItems.filter(li => section.itemIds.includes(li.id))}
    sectionSubtotal={calculateSectionSubtotal(section)}
    onRename={(name) => renameSection(section.id, name)}
    onToggleCollapse={() => toggleSectionCollapse(section.id)}
    onDeleteSection={() => deleteSection(section.id)}
    onAddLineItem={() => addLineItemToSection(section.id)}
  />
))}
```

### Step 7: Add "Add Section" button

Below all sections, add an "Add Section" button that creates a new empty section with a default name like "New Section".

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqLineItemSection.tsx`
- **Modify**: `packages/twenty-front/src/pages/cpq/QuoteBuilderPage.tsx` — refactor to use sections
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports
- **Possibly modify**: `packages/twenty-front/src/modules/cpq/components/CpqQuotePdfDocument.tsx` — section headers in PDF

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqLineItemSection.test.tsx`

- `should render section header with name and item count`
- `should show section subtotal`
- `should collapse/expand on chevron click`
- `should allow renaming section`
- `should show line items when expanded`
- `should hide line items when collapsed`
- `should show "+" button to add item`

### Integration tests: `packages/twenty-front/src/pages/cpq/__tests__/QuoteBuilderPage.sections.test.tsx`

- `should auto-create section when product with new family is selected`
- `should add item to existing section matching product family`
- `should allow creating empty sections`
- `should allow deleting sections (items move to default)`
- `should calculate correct subtotals per section`
- `should calculate correct grand total across sections`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
