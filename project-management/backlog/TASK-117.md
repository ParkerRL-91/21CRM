---
title: Template gallery navigation (fix stub handler)
id: TASK-117
project: PRJ-006
status: ready
priority: P0
tier: 1
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, template-gallery, navigation, bug-fix, blocker]
---

# TASK-117 — Template Gallery Navigation (Fix Stub Handler)

## Context

The `CpqTemplateGallery` component in `CpqTemplateGallery.tsx` has a broken click handler. When a user clicks a template card, `handleSelectTemplate` only calls `console.log('Selected template:', template.id, template.defaults)` — it does nothing visible. Dana Chen clicked "Tiered Volume Pricing" and nothing happened. She said: "I clicked it. Nothing. I clicked it again. Nothing. Is this broken?"

The template data is already well-structured in `cpq-pricing-templates.ts` with `id`, `title`, `description`, `icon`, and `defaults` including `productType`, `chargeType`, `billingFrequency`, `pricingModel`, and tier data. The gallery UI (grid of cards with hover states) is complete. The only missing piece is navigation on click.

## User Stories

**As Raj (Deal Desk Specialist)**, I want to click a pricing template and be taken to a product creation form with the template defaults pre-filled, so that I can set up my first pricing model in under 60 seconds.

**As Jordan (CRM Admin)**, I want the template gallery to clearly lead somewhere when I click a card, so that I don't think the CPQ is broken during initial setup.

**As Dana (VP RevOps)**, I want every clickable element in the CPQ to produce a visible result, so that I trust the software is production-ready.

## Outcomes

- Clicking a template card navigates to the PriceConfiguration creation page with template defaults pre-filled
- If PriceConfiguration creation page doesn't exist yet, navigate to a new template editor page with defaults loaded
- A visual indication (hover state change, brief pressed state) confirms the click registered
- The selected template's defaults are passed via URL params or Jotai state so the target page can read them

## Success Metrics

- [ ] Clicking any template card in the gallery navigates away from the gallery
- [ ] The destination page receives the template defaults (productType, pricingModel, etc.)
- [ ] Template defaults are pre-filled in the destination form
- [ ] Browser URL changes on click (verifiable navigation, not just state change)
- [ ] Back button returns to the gallery
- [ ] All 6 templates navigate correctly (per-seat-saas, usage-based, flat-rate, tiered-volume, one-time-fee, professional-services)
- [ ] No console.log calls remain in the click handler
- [ ] Unit tests pass for navigation on template click

## Implementation Plan

### Step 1: Add navigation to CpqTemplateGallery

Modify `packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx`:

- Import `useNavigate` from `react-router-dom`
- Replace the `console.log` in `handleSelectTemplate` with navigation logic
- Navigate to a route like `/settings/cpq/templates/${template.id}` or `/cpq/product/new?template=${template.id}`
- Pass template defaults via URL search params (encoded as JSON) or via Jotai atom

Replace:
```typescript
const handleSelectTemplate = (template: PricingTemplate) => {
  console.log('Selected template:', template.id, template.defaults);
};
```

With:
```typescript
const navigate = useNavigate();

const handleSelectTemplate = (template: PricingTemplate) => {
  const params = new URLSearchParams({
    templateId: template.id,
    defaults: JSON.stringify(template.defaults),
  });
  navigate(`/settings/cpq/templates/${template.id}?${params.toString()}`);
};
```

### Step 2: Create a template editor destination page

Create `packages/twenty-front/src/pages/settings/cpq/SettingsCpqTemplateEditor.tsx`:

- Read the `templateId` from route params and `defaults` from search params
- Find the matching template from `CPQ_PRICING_TEMPLATES`
- Render a form pre-filled with the template defaults (product type, charge type, billing frequency, pricing model, price/tiers)
- Allow editing and saving (save creates a PriceConfiguration record via the backend)
- Use `SubMenuTopBarContainer` for consistent layout (same pattern as `SettingsCpq.tsx`)
- Include breadcrumbs: Workspace > CPQ > Templates > {Template Name}

### Step 3: Register the new route

In `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx`:

- Add a lazy import for `SettingsCpqTemplateEditor`
- Add a route: `<Route path="cpq/templates/:templateId" element={<SettingsCpqTemplateEditor />} />`
- Place it near the existing CPQ route (line ~850)

### Step 4: Add visual click feedback to cards

In `CpqTemplateGallery.tsx`, add an active/pressed state to `StyledCard`:

```css
&:active {
  transform: scale(0.98);
  border-color: var(--twentycolor-blue, #3b82f6);
}
```

### Step 5: Update barrel exports

Add to `packages/twenty-front/src/modules/cpq/index.ts`:
- No new CPQ module exports needed (the page is in `pages/`, not `modules/`)

## Files to Change

- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx` — replace console.log with navigation, add active state
- **Create**: `packages/twenty-front/src/pages/settings/cpq/SettingsCpqTemplateEditor.tsx` — template editor page
- **Modify**: `packages/twenty-front/src/modules/app/components/SettingsRoutes.tsx` — register new route

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqTemplateGallery.test.tsx`

- `should render all 6 template cards`
- `should navigate to template editor on card click`
- `should pass template ID in the route`
- `should pass template defaults as URL params`
- `should not call console.log on click`

### Unit tests: `packages/twenty-front/src/pages/settings/cpq/__tests__/SettingsCpqTemplateEditor.test.tsx`

- `should read template ID from route params`
- `should pre-fill form with template defaults`
- `should render breadcrumbs with template name`
- `should show pricing model selector based on template defaults`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
