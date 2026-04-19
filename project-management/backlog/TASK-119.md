# TASK-119 — Admin: Discount Schedule Builder
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required for volume pricing accuracy

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to define volume-based and term-based discount schedules with precise tier structures,
**so that** the pricing engine automatically applies the correct discount when a rep adds 50 users vs. 10 users, or when a customer commits to 3 years vs. 1 year, without requiring manual adjustments.

---

## Background & Context

PhenoTips has user-tier pricing built into its product lineup (0–10 included, 11–50, 51–99, 100+). Rather than managing this as separate SKUs, discount schedules allow a single product SKU to automatically apply different discounts based on quoted quantity. Similarly, term discounts incentivize multi-year commitments (e.g., 24-month deal gets 10% off list).

Industry standard: Salesforce CPQ uses `Discount Schedule` + `Discount Tier` objects. Schedules can be `Range` (entire quantity gets one tier rate) or `Slab` (each quantity band is priced at its own rate — graduated model).

For PhenoTips: most volume discounts use the **Slab** model (each user band priced separately), while term discounts use the **Range** model (commit to 24 months = everything at 10% off).

---

## Features Required

### 1. Discount Schedule List
- Table: Name, Type (Range/Slab), Discount Unit (% / Amount / Price), # Products Linked, # Tiers, Active
- Create, edit, deactivate, clone, delete (if no quotes reference it)
- Filter by type, discount unit, active status

### 2. Schedule Header Configuration
- **Name** (required)
- **Schedule Type** (SELECT):
  - `Range` — entire quantity gets the single tier rate it falls into
  - `Slab` (Graduated) — each unit priced at the tier rate for its band (like tax brackets)
- **Discount Unit** (SELECT):
  - `Percent` — applied as % off list price
  - `Amount` — dollar/pound amount off list price per unit
  - `Price` — override unit price (replaces list price entirely)
- **Aggregation Scope** (SELECT):
  - `Quote Line` — volume calculated per individual line
  - `Quote Group` — volume aggregated across all lines in a group
  - `Quote` — aggregate across all matching lines on the entire quote
- **Override Behavior** (SELECT):
  - `None` — rep cannot modify the tier-applied discount
  - `All` — rep can manually override the discount (subject to floor price and max discount)
  - `Current Tier Only` — rep can only adjust within the matched tier's range
- **Cross-Products** (BOOLEAN) — aggregate quantities when the same schedule is applied to multiple products on one quote
- **Cross-Orders** (BOOLEAN) — count prior purchase history (assets) when determining volume tier

### 3. Tier Table Editor
An interactive table to define the discount bands.

| Tier # | From (Lower Bound) | To (Upper Bound) | Discount Value | Notes |
|--------|-------------------|-----------------|----------------|-------|
| 1 | 1 | 10 | 0% | Included |
| 2 | 11 | 50 | 10% | Volume A |
| 3 | 51 | 99 | 20% | Volume B |
| 4 | 100 | ∞ | 30% | Enterprise |

- Add tier row (auto-increments From from previous tier's To + 1)
- Delete tier row (auto-closes gap or last row = unlimited upper bound)
- Drag-to-reorder tiers
- Validate: no gaps, no overlaps, From < To, upper bound ∞ on last tier
- "Quick Fill" button: generates standard PhenoTips user tiers (1–10, 11–50, 51–99, 100+) from a template
- Preview calculator: enter a test quantity → shows which tier fires and what the net price would be

### 4. Term Discount Schedules (special case)
For term-based discounts, bounds are **months**, not quantities.

| Tier # | From (months) | To (months) | Discount % |
|--------|--------------|-------------|------------|
| 1 | 1 | 12 | 0% |
| 2 | 13 | 24 | 10% |
| 3 | 25 | 36 | 15% |

- Term discount schedules are attached to products via the "Term Discount" field (separate from volume discount)
- Preview: enter term in months → shows discount

### 5. Product Linkage
Each discount schedule shows which products are linked to it:
- List of products using this schedule
- "Link to Product" button → opens product selector
- Unlink from product

### 6. Preview & Test
- Input: quantity or term, product SKU, price book → output: full price waterfall
- Useful for validating that the schedule fires correctly before going live

---

## Admin UX Requirements

- Tier table must support adding up to 20 tiers
- Validation is inline (not on submit) — shows red border on first error, fixes as you type
- "Preview calculator" panel on the right side of the tier editor
- Export schedule + tiers to CSV for documentation/audit
- Clone schedule → useful for creating regional variants (same tiers, different discount values)

---

## Definition of Success

- [ ] Admin can create a volume discount schedule with 4 tiers matching PhenoTips user bands
- [ ] Admin can create a term discount schedule for 12/24/36-month terms
- [ ] Schedule linked to PT Core product applies correct tier discount when quantity = 25 (second tier)
- [ ] Slab type: order of 25 users = first 10 at 0%, next 15 at 10% (each band computed separately)
- [ ] Range type: order of 25 users = all 25 at 10% (single tier matches entire quantity)
- [ ] Cross-Products: two lines with 20 users each aggregate to 40 for the purpose of tier lookup
- [ ] Preview calculator shows correct result for test inputs before schedule is published
- [ ] Deleting a schedule fails gracefully if any active quote line references it

---

## Method to Complete

### Backend
1. `DiscountSchedule` entity: `name`, `type` (Range/Slab), `discountUnit`, `aggregationScope`, `overrideBehavior`, `crossProducts`, `crossOrders`, `isActive`
2. `DiscountTier` entity: `scheduleId`, `lowerBound`, `upperBound`, `discount`, `tierNumber`
3. `GET /cpq/discount-schedules` — list
4. `POST /cpq/discount-schedules` — create schedule + tiers
5. `PATCH /cpq/discount-schedules/:id` — update header
6. `PUT /cpq/discount-schedules/:id/tiers` — replace tier array (atomic)
7. `GET /cpq/discount-schedules/:id/products` — linked products
8. `POST /cpq/discount-schedules/preview` — calculate discount for given quantity + schedule
9. Validation: tier gaps, overlaps, discount value ranges

### Frontend
1. `DiscountScheduleListPage.tsx`
2. `DiscountScheduleDetailPanel.tsx` — header form + tier table
3. `DiscountTierTableEditor.tsx` — interactive tier editor with preview
4. `DiscountPreviewCalculator.tsx` — inline test tool
5. `useDiscountSchedules` hook

---

## Acceptance Criteria

- AC1: Schedule with Range type + 4 tiers saves correctly, tiers have no gaps or overlaps
- AC2: Slab calculation correctly prices each tier band independently (not all-or-nothing)
- AC3: Range calculation prices all units at the tier matching total quantity
- AC4: Preview calculator output matches what the pricing engine produces on a real quote
- AC5: Linking schedule to a product causes the schedule to fire on new quote lines for that product
- AC6: Schedule with `Cross-Products = true` aggregates quantity across two lines for tier lookup
- AC7: Attempting to delete a schedule linked to active products returns a 409 Conflict with list of linked products

---

## Dependencies

- TASK-117 (Product Catalog) — products must exist to link schedules
- TASK-136 (Pricing Engine) — uses schedule data during calculation

---

## Estimated Effort
**Backend:** 3 days | **Frontend:** 3 days | **Testing:** 1 day
**Total:** 7 days
