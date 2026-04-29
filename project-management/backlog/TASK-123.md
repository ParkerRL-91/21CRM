---
title: Replace emoji icons with Twenty icon library
id: TASK-123
project: PRJ-006
status: ready
priority: P1
tier: 2
effort: 1 day
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, icons, visual-polish, design-system, confidence-builder]
---

# TASK-123 — Replace Emoji Icons with Twenty Icon Library

## Context

The CPQ uses emoji characters throughout instead of the proper Twenty icon library. Dana Chen said: "Emoji icons? This looks like a hackathon project, not enterprise software." Specific instances:

1. **CpqSetupPage.tsx** — CPQ_OBJECTS_LIST uses emojis: `'📄'` (Quotes), `'📋'` (Quote Line Items), `'📝'` (Contracts), `'🔄'` (Subscriptions), `'📊'` (Amendments), `'💰'` (Price Configurations)
2. **CpqSetupPage.tsx** — Status badge uses `'✓ Enabled'` and `'○ Not enabled'` text characters
3. **CpqSetupPage.tsx** — Refresh button uses `'↻ Refresh'` text character
4. **CpqSetupPage.tsx** — Success message uses `'✓ Import complete'`
5. **CpqSetupPage.tsx** — Warning uses `'⚠️'` emoji
6. **CpqSetupPage.tsx** — Region tabs use flag emojis `'🇺🇸'` and `'🇬🇧'`
7. **CpqTemplateGallery.tsx** — Template cards render `template.icon` which contains emoji strings in the template data
8. **cpq-pricing-templates.ts** — Template icons use Twenty icon names as strings (`'IconUsers'`, `'IconChartBar'`, etc.) but `CpqTemplateGallery.tsx` renders them as raw text instead of actual icon components

Twenty has a comprehensive icon library in `packages/twenty-ui/src/display/icon/` that uses Tabler Icons. Icons are imported from `twenty-ui/display` and rendered as React components.

## User Stories

**As Dana (VP RevOps)**, I want the CPQ to look as polished as the rest of Twenty CRM, so that I trust it's enterprise-grade software, not a prototype.

**As Jordan (CRM Admin)**, I want consistent visual design across all CRM pages, so that users don't notice a quality gap when they navigate to CPQ features.

**As Alex (Sales Rep)**, I want professional-looking icons in the UI, so that I'm not embarrassed when sharing my screen during a customer call.

## Outcomes

- All emoji characters in CPQ components are replaced with Twenty icon components
- Icons are consistent with the rest of the Twenty CRM design system
- Template gallery renders actual icon components instead of text strings
- Status indicators use icon components instead of text characters
- All icons are properly sized and aligned within their containers

## Success Metrics

- [ ] Zero emoji characters remain in any CPQ component file
- [ ] CPQ_OBJECTS_LIST uses icon components from twenty-ui instead of emoji strings
- [ ] Template gallery cards render Tabler icon components
- [ ] Status badges use IconCheck/IconCircle instead of text characters
- [ ] Refresh button uses IconRefresh component
- [ ] Success/warning messages use IconCheck/IconAlertTriangle
- [ ] All icons render at correct size (16-20px depending on context)
- [ ] Icons inherit proper color from parent text color CSS variables
- [ ] Visual regression: no layout shifts from icon replacement
- [ ] Unit tests verify icon components render (not emoji text)

## Implementation Plan

### Step 1: Identify all Twenty icons needed

Map each emoji to a Twenty icon (from `twenty-ui/display` or Tabler icons):

| Current Emoji | Context | Replacement Icon |
|---------------|---------|-----------------|
| 📄 | Quotes object | `IconFileText` |
| 📋 | Quote Line Items | `IconListDetails` |
| 📝 | Contracts | `IconFileSignature` |
| 🔄 | Subscriptions | `IconRefresh` |
| 📊 | Amendments | `IconChartBar` |
| 💰 | Price Configurations | `IconCurrencyDollar` |
| ✓ | Enabled status | `IconCheck` |
| ○ | Not enabled | `IconCircle` |
| ↻ | Refresh button | `IconRefresh` |
| ⚠️ | Warning | `IconAlertTriangle` |
| 🇺🇸 | US region tab | `IconFlag` or keep text "US" |
| 🇬🇧 | UK region tab | `IconFlag` or keep text "UK" |

### Step 2: Update CpqSetupPage.tsx

Modify `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx`:

- Import icons: `import { IconFileText, IconListDetails, IconFileSignature, IconRefresh, IconChartBar, IconCurrencyDollar, IconCheck, IconCircle, IconAlertTriangle } from 'twenty-ui/display';`

- Update CPQ_OBJECTS_LIST to use icon components:
  ```typescript
  const CPQ_OBJECTS_LIST = [
    { icon: IconFileText, label: 'Quotes', description: '...' },
    { icon: IconListDetails, label: 'Quote Line Items', description: '...' },
    // ...
  ];
  ```

- Change `StyledObjectIcon` from rendering text content to rendering an icon component:
  ```tsx
  // Before: <StyledObjectIcon>{item.icon}</StyledObjectIcon>
  // After:  <item.icon size={18} color="var(--twenty-font-color-secondary)" />
  ```

- Replace status badge text:
  ```tsx
  // Before: {isSetUp ? '✓ Enabled' : '○ Not enabled'}
  // After: <>{isSetUp ? <><IconCheck size={12} /> Enabled</> : <><IconCircle size={12} /> Not enabled</>}</>
  ```

- Replace refresh button text:
  ```tsx
  // Before: ↻ Refresh
  // After: <IconRefresh size={14} /> Refresh
  ```

- Replace warning emoji with icon component
- Replace success checkmark with icon component
- For region tabs, use text labels "US / Canada (USD)" and "United Kingdom (GBP)" without flag emojis — or use small flag SVGs if available

### Step 3: Update CpqTemplateGallery.tsx

Modify `packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx`:

The template data in `cpq-pricing-templates.ts` already contains icon names as strings (e.g., `'IconUsers'`). Create a mapping from string names to actual icon components:

```typescript
import { IconUsers, IconChartBar, IconBox, IconTrendingUp, IconTool, IconUser } from 'twenty-ui/display';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  IconUsers,
  IconChartBar,
  IconBox,
  IconTrendingUp,
  IconTool,
  IconUser,
};
```

Then in the card rendering:
```tsx
// Before: <span style={{ fontSize: 24 }}>{template.icon}</span>
// After:
const IconComponent = ICON_MAP[template.icon];
// render: {IconComponent && <IconComponent size={24} />}
```

### Step 4: Update cpq-pricing-templates.ts icon type

Modify `packages/twenty-front/src/modules/cpq/constants/cpq-pricing-templates.ts`:

- Keep `icon` as a string field (the icon name) for serialization compatibility
- No structural changes needed — the rendering layer handles the mapping

### Step 5: Audit for remaining emojis

Search all CPQ files for remaining emoji patterns:
```bash
grep -rn '[\x{1F300}-\x{1F9FF}]' packages/twenty-front/src/modules/cpq/
grep -rn '[\x{2600}-\x{26FF}]' packages/twenty-front/src/modules/cpq/
grep -rn '[\x{2700}-\x{27BF}]' packages/twenty-front/src/modules/cpq/
```

Replace any remaining emojis found.

## Files to Change

- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx` — replace all emojis with icon components
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx` — render icon components from string names
- **Possibly modify**: `packages/twenty-front/src/modules/cpq/constants/cpq-pricing-templates.ts` — verify icon names match available components

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqSetupPage.icons.test.tsx`

- `should render IconFileText for Quotes object`
- `should render IconCheck in enabled status badge`
- `should render IconCircle in disabled status badge`
- `should render IconRefresh in refresh button`
- `should render IconAlertTriangle in warning messages`
- `should not contain any emoji characters in rendered output`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqTemplateGallery.icons.test.tsx`

- `should render icon component for each template card`
- `should handle unknown icon names gracefully`
- `should not render raw text icon names`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
