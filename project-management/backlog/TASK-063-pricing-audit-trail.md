---
title: "Pricing audit trail (per-line JSONB log)"
id: TASK-063
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pricing, #audit]
---

# TASK-063: Pricing audit trail

## User Stories
- As a Finance user, I want all pricing calculations to produce a complete audit log so I can verify how every price was derived.

## Outcomes
Each quote line item stores the full price waterfall as JSONB in pricing_audit. Audit is immutable once quote leaves draft. Viewable from quote line item detail.

## Success Metrics
- [ ] pricing_audit JSONB stores array of {ruleName, inputPrice, outputPrice, parameters, timestamp}
- [ ] Full waterfall visible: list→special→prorated→tiered→term→manual→floor→currency→round→total
- [ ] Audit immutable once quote status != draft
- [ ] UI component to display pricing breakdown per line item
- [ ] Tests verify audit trail completeness

## Files to Change
- `src/lib/cpq/pricing-engine.ts` — MODIFY: Ensure all steps write audit
- `src/components/cpq/pricing-audit-viewer.tsx` — NEW: UI component
