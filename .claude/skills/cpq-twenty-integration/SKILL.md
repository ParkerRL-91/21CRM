---
name: cpq-twenty-integration
description: Build and iterate CPQ integration into Twenty CRM. Use when implementing CPQ features, fixing integration gaps, or extending the quote-to-cash module within Twenty's architecture.
argument-hint: "[action] — setup-service | pricing-engine | frontend | tests | review | fix [area]"
disable-model-invocation: true
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Agent", "TodoWrite"]
effort: high
---

# CPQ Twenty Integration Builder

Build, test, and iterate the CPQ module integration into Twenty CRM
until it scores 9.5/10 on all quality categories.

## Architecture (ADR-004)

CPQ uses Twenty's **custom object API** (not workspace entities):
- `CpqSetupService` calls `createOneObject()` + `createOneField()` to
  create native custom objects (Quote, Contract, Subscription, etc.)
- Twenty auto-generates: tables, GraphQL, record pages, navigation, search
- Custom business logic (pricing, renewals, risk) lives in NestJS services
- Custom UI only for CPQ-specific screens (quote builder, pricing wizard)

Read: `knowledge/decisions/adr-004-cpq-twenty-native-integration.md`

## Key Files

**Backend (NestJS):**
- Module: `twenty/packages/twenty-server/src/modules/cpq/cpq.module.ts`
- Controller: `twenty/packages/twenty-server/src/modules/cpq/cpq.controller.ts`
- Setup: `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts`
- Pricing: `twenty/packages/twenty-server/src/modules/cpq/services/cpq-pricing.service.ts`
- Renewal: `twenty/packages/twenty-server/src/modules/cpq/services/cpq-renewal.service.ts`
- Contract: `twenty/packages/twenty-server/src/modules/cpq/services/cpq-contract.service.ts`
- Risk: `twenty/packages/twenty-server/src/modules/cpq/services/cpq-risk.service.ts`

**Frontend (React):**
- Setup page: `twenty/packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx`
- Templates: `twenty/packages/twenty-front/src/modules/cpq/components/CpqTemplateGallery.tsx`
- Calculator: `twenty/packages/twenty-front/src/modules/cpq/components/CpqPricingCalculator.tsx`
- Hooks: `twenty/packages/twenty-front/src/modules/cpq/hooks/`

## Quality Rubric (target: 9.5/10 each)

| Category | Current | Target | Key Gaps |
|----------|:-------:|:------:|----------|
| A. Metadata Registration | 7 | 9.5 | Need trigger, error handling |
| B. Database Migrations | 8 | 9.5 | Need teardown method |
| C. GraphQL Integration | 7 | 9.5 | Need custom resolvers for biz logic |
| D. Frontend UI | 5 | 9.5 | Need quote builder, renewal dashboard |
| E. Service Quality | 6 | 9.5 | Wire stubs to Twenty ORM |
| F. Test Coverage | 6 | 9.5 | Integration tests, setup tests |
| G. Code Cleanup | 9 | 9.5 | Old code deleted, verify nothing left |
| H. Conventions | 7 | 9.5 | Comment style, service sizes |

## Standing Rules

1. **Twenty conventions always win.** Read `twenty/CLAUDE.md` before writing.
2. **Named exports only.** No default exports.
3. **Short comments only.** Use `//`, not JSDoc `/** */`.
4. **No abbreviations.** `workspaceId` not `wsId`.
5. **Linaria for styling.** Not Tailwind, not inline styles.
6. **Jotai for state.** Not useState for shared state.
7. **Co-located tests.** `.spec.ts` next to source, not `__tests__/`.
8. **Components under 300 lines.** Services under 500 lines.
9. **Test behavior, not implementation.** Descriptive names: "should [x] when [y]".

## Iteration Loop

When invoked, follow this loop:

1. **Read current review scores** from the rubric above
2. **Pick the lowest-scoring category**
3. **Identify the specific gaps** (from the review)
4. **Fix the gaps** — write code, tests, or delete problems
5. **Run the review again** (launch review agent)
6. **Update the rubric** with new scores
7. **Repeat** until all categories >= 9.5

## Error Handling

- If Twenty imports fail: check that the file exists in the twenty/ subtree
- If tests fail: run `cd twenty/packages/twenty-server && npx jest "cpq" --config jest.config.mjs`
- If conventions wrong: re-read `twenty/CLAUDE.md` and fix
