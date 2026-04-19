# TASK-124 — Admin: Bundle & Product Configuration Rules
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P2 — Required for PhenoTips bundled platform offerings

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to define bundle products (e.g., "PhenoTips Platform Bundle") that contain required and optional components with configuration rules that enforce what can and cannot be included,
**so that** reps can configure complex platform deals from a guided UI rather than manually selecting each component and risking incompatible or incomplete configurations.

---

## Background & Context

PhenoTips platform deals often involve:
- Core Platform (required)
- PPQ module (optional add-on)
- CRAT module (optional add-on)
- One integration (SSO, HL7v2, FHIR — mutually exclusive)
- Professional Services for implementation (often required with first purchase)

Without bundle configuration, a rep could quote Core + two integrations (incompatible), or forget to include the PS implementation fee, or add CRAT without PPQ (a dependency).

Product configuration rules encode these business constraints into the system, enforced at quote-time.

Analogous to Salesforce CPQ's `ProductOption`, `ProductFeature`, `ProductRule`, `ConfigurationRule`.

---

## Features Required

### 1. Bundle Product Setup
A bundle is a product with `isBundle = true` (already in product catalog). In addition, bundles need:

**Features (grouping of options):**
A Feature is a logical section within the configurator (e.g., "Core Platform", "Add-On Modules", "Integrations", "Professional Services").

Feature fields:
- Feature Name
- Parent Bundle (lookup to product)
- Display Order
- Min Options (min number of options in this feature that must be selected; 0 = none required)
- Max Options (max number; null = unlimited; 1 = mutually exclusive choice)
- Is Required (if min options > 0 and no options are pre-selected, blocks save)
- Description (shown to rep in the configurator as instructional text)

**Product Options:**
An Option links a child product to a bundle via a Feature.

Option fields:
- Parent Bundle (lookup)
- Feature (lookup — which feature group this option appears in)
- Option Product (lookup to catalog product)
- Display Order
- Default Quantity (pre-filled in configurator)
- Min Quantity / Max Quantity
- Is Quantity Editable (can rep change quantity)
- Is Pre-Selected (auto-checked by default)
- Is Required (cannot be deselected)
- Is Price Included in Bundle (if true, the option's price is rolled into bundle parent; if false, priced separately)
- Is Optional (appears as optional upsell)
- Dependency Rules (FK to other options — this option requires that option to also be selected)
- Exclusion Rules (FK to other options — selecting this deselects and prevents that option)

### 2. Configuration Rules (Product Rules)
Rules enforce constraints during bundle configuration:

**Rule types:**
- `Validation` — blocks saving if the condition is violated; shows an error message
- `Selection` — auto-selects or deselects options when conditions are met
- `Alert` — shows a warning to the rep but does not block saving
- `Filter` — hides certain options from the configurator based on conditions

**Rule configuration:**
- Rule Name
- Rule Type (Validation / Selection / Alert / Filter)
- Active toggle
- Evaluation Event: `On Add` (when option is added), `Always` (on every change), `Save`
- Scope: `Bundle`, `Quote` (applies to all bundles on the quote)
- Error/Alert Message (for Validation and Alert types — shown in the configurator UI)

**Rule Conditions (when the rule fires):**
- Tested Field: field on the option, feature, or quote (e.g., `SelectedOption.Name`, `Quote.SubscriptionTerm`)
- Operator: `=`, `!=`, `contains`, `is selected`, `is not selected`
- Tested Value

**Rule Actions (what happens when conditions are met — for Selection and Filter rules):**
- Target: option(s) to affect
- Action: `Select`, `Deselect`, `Show`, `Hide`, `Require`, `Make Optional`

**Standard PhenoTips Rules:**
1. `VALIDATION: PPQ requires Core Platform` — if PPQ is selected but Core Platform is not, block save with message "PPQ module requires the Core Platform"
2. `VALIDATION: CRAT requires PPQ` — if CRAT is selected but PPQ is not, block save with "CRAT requires PPQ to be active"
3. `VALIDATION: Only one integration` — if two integration options are selected simultaneously, block save with "Only one integration can be included per quote"
4. `SELECTION: Auto-add PS Implementation on first purchase` — if any product is added and account has no prior contracts, auto-select the PS Implementation option
5. `ALERT: Multi-year deal without PS` — if subscription term ≥ 24 months and no PS line exists, warn "Consider adding Professional Services for a smoother multi-year rollout"

### 3. Bundle Configurator UI (Configurator View, Admin Preview)
Admin preview of the bundle configurator as reps would see it:
- Feature sections as collapsible accordion panels
- Required options shown as locked checkboxes
- Optional options as toggleable checkboxes
- Quantity inputs where editable
- Running bundle price in the sidebar
- Validation messages inline

Admin can test the configurator with sample configurations to validate rules work correctly.

### 4. Configuration Attributes (Quote-Level Attributes)
Attributes that apply across the entire bundle configuration:
- Deployment Region (select: Americas / EMEA / APAC) — may hide region-specific options
- Institution Type (select: Academic / Government / Commercial) — may affect which features are shown
- Attributes can be driven from Account fields (auto-populated) or set by the rep

---

## Admin UX Requirements

- Bundle builder is a dedicated admin page at `/settings/cpq/bundles/:productId`
- Feature sections are created as cards with drag-to-reorder
- Options within a feature are listed with drag-to-reorder within the feature
- Rule builder reuses the same condition/action pattern from Price Rules (TASK-120)
- "Test Configuration" opens a live configurator preview with editable options

---

## Definition of Success

- [ ] Admin can create "PhenoTips Platform" bundle with 4 Features and 15+ Options
- [ ] PPQ-requires-Core validation fires and blocks save with the correct error message
- [ ] CRAT-requires-PPQ validation fires correctly
- [ ] Single-integration exclusion rule works: selecting SSO grays out HL7v2 and FHIR
- [ ] Auto-select PS Implementation fires for new business accounts
- [ ] Bundle price totals correctly: sum of included option prices + base bundle price
- [ ] Options with `isPriceIncludedInBundle = true` do not add separate line items to the quote

---

## Method to Complete

### Backend
1. `BundleFeature` entity: feature definition per bundle
2. `ProductOption` entity: option link with all constraint fields
3. `ProductRule` entity: rule + conditions + actions (reuses pattern from PriceRule)
4. `ProductRuleCondition` entity
5. `ProductRuleAction` entity
6. `ProductConfigurationService`:
   - `getConfiguration(bundleProductId)` — returns full bundle structure
   - `validateConfiguration(selectedOptions, quoteContext)` — evaluates all rules, returns errors/alerts
   - `autoSelectOptions(selectedOptions, quoteContext)` — applies Selection rules
7. Routes: `GET /cpq/products/:id/configuration`, `POST /cpq/products/:id/configuration/validate`

### Frontend
1. `BundleConfiguratorAdminPage.tsx` — feature/option management
2. `FeatureCardEditor.tsx` — feature details + option list
3. `ProductOptionEditor.tsx` — option row with all constraint fields
4. `ProductRuleBuilder.tsx` — rule condition/action editor (reuses components from TASK-120)
5. `BundleConfiguratorPreview.tsx` — rep-facing configurator preview for admin testing
6. `useBundleConfiguration` hook

---

## Acceptance Criteria

- AC1: Bundle with 3 features and 8 options saves correctly; options linked to correct features
- AC2: Validation rule blocks save with the configured error message when condition fires
- AC3: Selection rule auto-checks an option when its trigger condition is met
- AC4: Exclusion rule: checking Option A grays out Option B automatically
- AC5: Bundle price includes all non-optional, price-included options; additional optional items add to total
- AC6: Attribute `DeploymentRegion = EMEA` hides US-only integration options

---

## Dependencies

- TASK-117 (Product Catalog) — bundle and option products must exist
- TASK-127 (Product Configurator UI) — uses bundle configuration in the quote flow

---

## Estimated Effort
**Backend:** 3 days | **Frontend:** 4 days | **Testing:** 2 days
**Total:** 9 days
