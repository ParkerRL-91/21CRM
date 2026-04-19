# TASK-112 — Mobile Responsive CPQ (CpqPricingCalculator responsive)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Make the `CpqPricingCalculator` and all CPQ components fully responsive for mobile viewports (375px+). The calculator is used by field sales reps on mobile during customer meetings.

## Acceptance Criteria
- `CpqPricingCalculator` renders usably at 375px width
- All form inputs touch-friendly (min 44px tap target)
- Audit trail collapses to accordion on mobile
- Line item table reflows to card layout on narrow viewports
- Tested in Chrome DevTools mobile emulation for iPhone SE, iPhone 14, Pixel 7

## Implementation Notes
- Updated: `packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx`
- Uses Linaria CSS breakpoints consistent with Twenty's responsive system
- No JS-based layout switching — pure CSS media queries
