# TASK-120 — Admin: Price Rules Engine
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required for dynamic and context-sensitive pricing

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to define price rules that automatically modify quote or quote line fields based on conditions — such as applying a healthcare discount when an account's type is "Academic Hospital" or automatically setting a longer term when a rep adds an enterprise package,
**so that** pricing is context-aware and accurate without requiring reps to manually apply adjustments or remember complex pricing rules.

---

## Background & Context

Price Rules are the programmable layer of the pricing engine. They fire during quote calculation and can:
1. **Read** data from the quote, quote lines, or a lookup table
2. **Evaluate** conditions (field comparisons, aggregations)
3. **Write** new values to quote or quote line fields

This is analogous to Salesforce CPQ's `Price Rule`, `Price Condition`, `Price Action`, `Lookup Query`, and `Summary Variable` objects.

Without price rules, the system only applies static list prices and schedules. With rules, the system can:
- Apply "academic" pricing when Account.Type = "Research Institution"
- Auto-set a 2-year term discount when a PS bundle is included
- Add a platform fee when total ARR exceeds a threshold
- Escalate approval automatically when a custom product is added
- Auto-populate currency-based pricing fields for GBP quotes

---

## Features Required

### 1. Price Rule List
- Table: Name, Scope (Quote/Line), Evaluation Event, Evaluation Order, Active, # Conditions, # Actions
- Create, edit, activate/deactivate, clone, delete (if not used on any quotes)
- Drag-to-reorder evaluation order (order matters — rules fire sequentially)
- Filter: Active/Inactive, Scope

### 2. Price Rule Header Configuration
- **Name** (required, descriptive — e.g., "Apply Academic Discount — Account Type")
- **Active** (toggle — inactive rules are skipped)
- **Scope** (SELECT):
  - `Quote` — rule fires once per quote
  - `Quote Line` — rule fires once per line
  - `Product Configuration` — fires during bundle configurator
- **Evaluation Event** (SELECT):
  - `Always` — fires every time the pricing engine runs
  - `OnCalculate` — fires during full recalculation
  - `OnInitialize` — fires once when product is first added to the quote
  - `Save` — fires only when the quote is saved
- **Evaluation Order** (number) — execution sequence; lower = earlier
- **Product Filter** (optional) — SOQL-style filter to target specific products (e.g., only fire for PT Core)
- **Lookup Object** (optional) — external lookup table object name (for table-driven pricing)
- **Description** (text — internal admin notes on what this rule does and why)

### 3. Price Conditions
Determines WHEN the rule fires. Multiple conditions can be combined with AND/OR.

Each condition:
- **Tested Object** (SELECT): `Quote`, `Quote Line`, `Account`, `Lookup Query`
- **Tested Field** (text): field API name to evaluate
- **Operator** (SELECT): `=`, `!=`, `<`, `<=`, `>`, `>=`, `contains`, `starts with`, `is blank`, `is not blank`
- **Tested Value** (text): the comparison value
- **Type** (SELECT): `Field Value`, `Static Value`, `Summary Variable`
- **Condition Number** (auto-increment)
- **Conditions Met** (AND/OR logic for multi-condition rules)

Examples:
- `Account.type` = `Academic Hospital`
- `Quote.SubscriptionTerm` >= `24`
- `Summary Variable: MaxDiscount` >= `0.20`
- `Quote Line.ProductFamily` = `Professional Services`

### 4. Price Actions
Determines WHAT happens when the rule fires. Each rule can have multiple actions.

Each action:
- **Action Number** (auto-increment)
- **Target Object** (SELECT): `Quote`, `Quote Line`
- **Target Field** (text): field to update (e.g., `CustomerDiscount`, `SpecialPrice`, `BillingFrequency`)
- **Source Type** (SELECT):
  - `Static Value` — hardcoded value
  - `Field Value` — copy from another field
  - `Summary Variable` — use an aggregated variable
  - `Lookup Value` — fetch from a lookup table
  - `Formula` — computed expression (e.g., `ListPrice * 0.85`)
- **Value** (text/number/formula): the value to apply
- **Is Locked** (boolean): prevent the rep from overriding this field after the action fires

### 5. Lookup Queries (Table-Driven Pricing)
For rules that need to look up values from a custom rate table (e.g., regional pricing matrix).

Each lookup query (child of Price Rule):
- **Lookup Object** (text): name of the external lookup table object
- **Lookup Field** (text): column in the lookup table to return as the action value
- **Tested Object** (`Quote` / `Quote Line`)
- **Tested Field**: field used to match a row in the lookup table
- **Operator**: comparison for the match

Example: for a "Currency-Based Pricing" rule, the lookup table is `RegionalPriceMatrix` with columns `[Region, Currency, ProductFamily, AdjustedPrice]`. The query matches on `Quote.Region` = `RegionalPriceMatrix.Region` and fetches `AdjustedPrice`.

### 6. Summary Variables
Aggregate values across all quote lines for use in conditions.

- **Name** (e.g., `MaxLineDiscount`, `TotalARR`, `PSLineCount`)
- **Source Object**: `Quote Line`
- **Source Field**: field to aggregate
- **Aggregate Function**: `Sum`, `Max`, `Min`, `Count`, `Average`
- **Filter Field**: optional field to filter which lines are included
- **Filter Value**: filter value
- **Conditions Met**: `All` / `Any`

### 7. Rule Testing / Simulation
- Input: provide a quote ID (or simulate with field values)
- Output: for each active rule, show whether conditions were met and what actions were applied
- "Dry run" mode — does not actually modify the quote

---

## Admin UX Requirements

- Price rule list shows evaluation order as drag-reorderable numbers
- Condition and action rows are inline editors (not separate pages)
- Rule dependency visualization: which summary variables feed into which rules
- Color-coded: green (active), gray (inactive), red (has errors)
- Each rule has a "Test This Rule" button that opens the simulation modal

---

## Definition of Success

- [ ] Admin can create a rule that applies 15% discount when account type is "Academic Hospital"
- [ ] Admin can create a rule that sets a platform fee when total ARR > $50,000
- [ ] Admin can create a lookup-query rule that fetches price from a regional rate matrix
- [ ] Summary variable correctly aggregates `MaxLineDiscount` across all lines on a quote
- [ ] Rules fire in evaluation order (rule #1 before rule #2)
- [ ] Rule simulation shows which conditions passed/failed for a given quote
- [ ] Deactivating a rule stops it from firing without deleting it
- [ ] Actions with `Is Locked = true` make the target field read-only in the quote line editor

---

## Method to Complete

### Backend
1. `PriceRule` entity: header fields
2. `PriceCondition` entity (child of rule): condition fields
3. `PriceAction` entity (child of rule): action fields
4. `LookupQuery` entity (child of rule): lookup fields
5. `SummaryVariable` entity: aggregation definition
6. `GET /cpq/price-rules` — list with conditions/actions count
7. `POST /cpq/price-rules` — create (with nested conditions + actions)
8. `PATCH /cpq/price-rules/:id` — update header
9. `PUT /cpq/price-rules/:id/conditions` — replace conditions
10. `PUT /cpq/price-rules/:id/actions` — replace actions
11. `POST /cpq/price-rules/simulate` — simulate rule evaluation for a given quote context

### Frontend
1. `PriceRuleListPage.tsx` — with drag-to-reorder
2. `PriceRuleDetailPage.tsx` — header + conditions table + actions table + lookup queries
3. `ConditionRowEditor.tsx` — inline condition editor
4. `ActionRowEditor.tsx` — inline action editor
5. `SummaryVariableManager.tsx` — manage summary variables
6. `RuleSimulator.tsx` — test modal
7. `usePriceRules` hook

---

## Acceptance Criteria

- AC1: Rule with scope=`Quote Line` fires once per line during calculation
- AC2: Conditions with `AND` logic: all conditions must pass for rule to fire
- AC3: Conditions with `OR` logic: any condition passing fires the rule
- AC4: Action targeting `Quote.CustomerDiscount` updates the quote-level discount field
- AC5: Lookup query resolves the correct row from an external table based on field match
- AC6: Summary variable `Max(QuoteLine.Discount)` returns the highest discount across all lines
- AC7: Evaluation order 10 fires before evaluation order 20 on the same quote
- AC8: Simulation correctly reports "condition met / not met" for each rule

---

## Dependencies

- TASK-117 (Product Catalog) — product fields referenced in conditions
- TASK-119 (Discount Schedules) — schedules may interact with price rules
- TASK-136 (Pricing Engine) — rules are evaluated by the engine

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 5 days | **Testing:** 2 days
**Total:** 11 days
