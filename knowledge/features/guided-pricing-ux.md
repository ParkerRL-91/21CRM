---
title: Guided Pricing & Product Setup UX
tags: [#feature, #cpq, #ux, #onboarding, #pricing]
created: 2026-04-12
updated: 2026-04-12
---

# Guided Pricing & Product Setup UX

## Problem

Our CPQ system has 23 tables covering products, price books, discount schedules (tiered/volume/term), quotes, approvals, and contracts. A new user sees a blank catalog with dozens of fields across multiple concepts. This is overwhelming. We need a guided experience that makes the simple path effortless and the complex path discoverable.

## Core Principle

**Simple by default, complex on demand.** 60%+ of products use flat-rate pricing. The first screen should serve that majority. Advanced pricing (tiered, volume, graduated, term-based) is revealed only when the user explicitly opts in.

---

## Recommended UX Patterns

### 1. Product Creation Wizard (Highest Impact)

Instead of a single form with 20 fields, ask the product type first, then show only relevant fields.

```
Step 1: What type of product?
  [Subscription]  [One-Time]  [Professional Service]
  (visual cards with icon + one-line description)

Step 2: Basic Details
  Name: [____________]
  SKU:  [____________]  (optional)
  Family: [dropdown___]

Step 3: Pricing (type-specific)
  Subscription → billing period, default term, recurring price
  One-Time → fixed price
  Service → hourly rate OR project fee

Step 4: Review & Create
  Summary card showing what will be created
  [Create Product]
```

**Why it works:** Selecting the type eliminates 40-60% of irrelevant fields. The wizard ensures nothing is missed.

### 2. Pricing Model Visual Selector

Don't use a dropdown for pricing model selection. Use visual cards:

```
How should this product be priced?

┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  ═══════    │  │  ┐          │  │  ┐          │  │  ══════     │
│  Flat Rate  │  │  │ ┐        │  │  │          │  │  Per Unit   │
│             │  │  │ │ ┐      │  │  └──────    │  │             │
│ One price   │  │  Graduated  │  │  Volume     │  │ Price × Qty │
│ for all     │  │  Tiers      │  │  All-units  │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
   (default)        (advanced)       (advanced)       (simple)
```

Each card shows: icon/diagram, name, one-sentence description. Default selection is "Flat Rate." Advanced models shown only after clicking "Show advanced pricing models."

### 3. Tier Table with Auto-Linked Ranges

For tiered/volume pricing, use an inline-editable table where ranges auto-cascade:

```
Tier Pricing Setup
──────────────────────────────────────────────
  From    To        Unit Price    Flat Fee
  1       100       $50.00        —
  101     500       $40.00        —        
  501     ∞         $30.00        —
                                  [+ Add Tier]

Test: If a customer buys [  250  ] units...
┌──────────────────────────────────────────┐
│ Graduated: (100 × $50) + (150 × $40)    │
│ = $5,000 + $6,000 = $11,000             │
│ Effective rate: $44.00/unit              │
└──────────────────────────────────────────┘
```

**Key behaviors:**
- Changing a tier's "To" auto-fills the next tier's "From" (prevents gaps)
- Last tier always shows ∞ as upper bound
- Overlap/gap detection with inline red error indicators
- "Descending price" anomaly highlighted as yellow warning (not error)
- Live calculation preview updates as tiers are edited

### 4. Template Gallery for First-Time Setup

When the product catalog is empty, show templates instead of a blank form:

```
Welcome to your Product Catalog

Start with a template or build from scratch:

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 💳 Per-Seat SaaS │  │ 📊 Usage-Based   │  │ 📦 Flat Rate     │
│                  │  │                  │  │                  │
│ $X/user/month    │  │ $X per API call  │  │ $99/month        │
│ Monthly + Annual │  │ Metered billing  │  │ Simple recurring │
│                  │  │                  │  │                  │
│ [Use Template]   │  │ [Use Template]   │  │ [Use Template]   │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 📈 Tiered Volume │  │ 🔧 One-Time Fee  │  │ 👥 Pro Services  │
│                  │  │                  │  │                  │
│ Qty-based tiers  │  │ Implementation   │  │ Hourly consulting│
│ Graduated pricing│  │ Setup charge     │  │ Fixed project fee│
│                  │  │                  │  │                  │
│ [Use Template]   │  │ [Use Template]   │  │ [Use Template]   │
└─────────────────┘  └─────────────────┘  └─────────────────┘

                    [Start from scratch →]
```

Each template pre-fills: product type, billing frequency, pricing model, placeholder tiers, and smart defaults. User just needs to enter name and actual prices.

### 5. Bundle Builder (Two-Panel Layout)

```
┌─────────────────────────────┬──────────────────────┐
│ Bundle Components           │ Pricing Summary       │
│                             │                       │
│ Platform (required)         │ Platform    $60,000   │
│   🔒 Core Platform  [$60K] │ Analytics   $30,000   │
│                             │ API Access  $30,000   │
│ Add-On Modules              │ ─────────────────     │
│   ☑ Analytics [$6K × 5]    │ Individual: $120,000  │
│   ☑ API Access [$30K]      │ Bundle:     $102,000  │
│   ☐ Data Export [$12K]     │ ─────────────────     │
│                             │ You save: $18,000     │
│ Services (pick 1-2)        │           (15% off)   │
│   ○ Standard Setup [$5K]   │                       │
│   ● Premium Setup [$12K]   │                       │
│   ○ Self-Service [Free]    │                       │
│                             │                       │
│ Selected: 1 of 1-2         │ [Save Bundle]         │
└─────────────────────────────┴──────────────────────┘
```

**Key behaviors:**
- Required components: lock icon, pre-selected, non-removable
- Optional components: checkboxes
- Mutually exclusive: radio buttons
- Min/max counters: "1 of 1-2 selected" with color feedback
- Right panel: live pricing with savings callout

### 6. Quote Preview Panel

On product and discount schedule pages, a collapsible panel shows how this pricing appears on a real quote:

```
[Preview on Quote ▼]
┌──────────────────────────────────────────────┐
│ Quote Preview                                 │
│                                               │
│ Product         Qty    Unit     Discount  Net │
│ Platform Pro    1      $60,000  —         $60K│
│                                               │
│ Test quantity: [___] units                    │
│                                               │
│ At 250 units:                                │
│   Tier 1: 100 × $50 = $5,000                │
│   Tier 2: 150 × $40 = $6,000                │
│   Total: $11,000 ($44.00/unit effective)     │
└──────────────────────────────────────────────┘
```

### 7. Contextual Help (Click-to-Expand)

Next to every pricing concept, an info icon expands to show:

```
Graduated Pricing ⓘ
┌──────────────────────────────────────────────┐
│ Each quantity tier has its own unit price.    │
│ Units are charged at the rate of the tier    │
│ they fall in.                                │
│                                              │
│   ┐                                          │
│   │ $10  ┐                                   │
│   │      │ $8   ┐                            │
│   │      │      │ $6                         │
│   └──────┴──────┴──────                      │
│   0-100  101-200  201+                       │
│                                              │
│ Example: 150 units                           │
│ = (100 × $10) + (50 × $8) = $1,400          │
└──────────────────────────────────────────────┘
```

### 8. Validation Strategy

| Type | Behavior | Example |
|------|----------|---------|
| **Error** (blocks save) | Red indicator, inline message | "Tiers overlap: 50-100 and 75-200" |
| **Warning** (allows save) | Yellow indicator, acknowledgment | "Unit price increases at higher tiers — is this intentional?" |
| **Auto-fix** (prevents issue) | Silent cascade | Changing tier 1 "To" from 100→150 auto-updates tier 2 "From" to 151 |

Validate on blur (not keystroke). Show validation on "Next" in wizards.

---

## Tech Stack for Implementation

| Library | Package | Purpose |
|---------|---------|---------|
| react-hook-form | `react-hook-form` | Form state + validation |
| @hookform/resolvers | `@hookform/resolvers` | Zod integration |
| Stepperize | `@stepperize/react` | Type-safe wizard step orchestration |
| TanStack Table | `@tanstack/react-table` | Inline-editable tier tables |
| dnd-kit | `@dnd-kit/react` | Drag-to-reorder tiers |
| Zustand | `zustand` | Cross-step state in wizard |
| shadcn/ui | (local components) | All UI primitives |

**Architecture pattern:** One Zod schema per wizard step. Zustand store for cross-step persistence. Stepperize for navigation. Server Action on final step.

---

## Implementation Priority

| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 1 | Product creation wizard with type-driven disclosure | Very High | Medium |
| 2 | Template gallery for empty catalog state | Very High | Low |
| 3 | Tier table with auto-linked ranges + live calculator | High | Medium |
| 4 | Pricing model visual card selector | High | Low |
| 5 | Bundle builder two-panel layout | Medium | High |
| 6 | Quote preview panel | Medium | Medium |
| 7 | Contextual help tooltips | Medium | Low |
| 8 | Pricing version history | Low | Medium |

## Anti-Patterns to Avoid

1. **All fields on one page** — Progressive disclosure is not optional
2. **Dropdown for pricing model** — Use visual cards with diagrams
3. **Manual tier range entry** — Auto-link ranges to prevent gaps/overlaps
4. **No live calculation preview** — Users will misconfigure tiers
5. **Hover-only tooltips** — Use click-to-expand for accessibility
6. **No templates** — Blank forms are the enemy of onboarding
7. **Errors on keystroke** — Validate on blur or step transition
8. **Immediate publish** — Show impact analysis before pricing changes go live

## Related

- [[contract-management]] — Contract and renewal system
- [[adr-003-contract-management-architecture]] — Architecture decisions
- [[pipeline-analytics]] — Pipeline views that consume quote data
