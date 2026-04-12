---
title: "Price waterfall engine (10-step pipeline)"
id: TASK-060
project: PRJ-003
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pricing, #engine]
---

# TASK-060: Price waterfall engine (10-step pipeline)

## User Stories
- As a Sales Rep, I want the system to automatically calculate prices through a deterministic waterfall so every price is traceable and auditable.

## Outcomes
Chain-of-responsibility pricing engine with 10 ordered steps. Each step transforms a PricingContext, appending to the audit trail. Pure functions, fully testable.

## Success Metrics
- [ ] PricingEngine class with ordered rules
- [ ] 10-step waterfall: Base Price → Contracted → Proration → Tiered/Volume → Term Discount → Manual Discount → Floor Enforcement → Currency → Rounding → Total
- [ ] Each step appends to audit trail (rule name, input price, output price)
- [ ] All arithmetic via Decimal.js
- [ ] Round to 2 decimal places ROUND_HALF_UP at final step only
- [ ] Comprehensive tests: each step isolated + full pipeline integration
- [ ] Performance: <10ms for 50-line-item quote

## Implementation Plan

### Pipeline pattern
```typescript
interface PricingContext {
  lineItem: QuoteLineItem;
  product: Product;
  priceBookEntry: PriceBookEntry;
  quote: Quote;
  currentPrice: Decimal;
  adjustments: PriceAdjustment[];
  auditSteps: PricingAuditStep[];
}

interface PricingRule {
  name: string;
  priority: number;
  evaluate(ctx: PricingContext): PricingContext;
}

class PricingEngine {
  private rules: PricingRule[];
  calculate(ctx: PricingContext): PricingContext {
    return this.rules
      .sort((a, b) => a.priority - b.priority)
      .reduce((ctx, rule) => {
        const input = ctx.currentPrice;
        const result = rule.evaluate(ctx);
        result.auditSteps.push({ ruleName: rule.name, inputPrice: input, outputPrice: result.currentPrice, timestamp: new Date() });
        return result;
      }, ctx);
  }
}
```

## Files to Change
- `src/lib/cpq/pricing-engine.ts` — NEW: Core engine + all 10 rules
- `src/lib/cpq/pricing-engine.test.ts` — NEW: Comprehensive tests
- `src/lib/cpq/pricing-types.ts` — NEW: Type definitions
