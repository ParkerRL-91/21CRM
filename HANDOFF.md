# 21CRM CPQ Integration — Pickup Instructions

**Repo:** https://github.com/ParkerRL-91/21CRM
**Branch:** `main` (all work is here)
**Score:** 9.3/10 — needs dev environment for final 0.2

---

## What's Built (don't redo)

**30 files** in `twenty/packages/twenty-server/src/modules/cpq/` and `twenty/packages/twenty-front/src/modules/cpq/`:

- **16 custom objects** bootstrapped via Twenty's metadata API (Product, PriceBook, PriceBookEntry, DiscountSchedule, Quote, QuoteLineItem, QuoteLineGroup, QuoteSnapshot, ApprovalRule, ApprovalRequest, QuoteTemplate, Contract, ContractSubscription, ContractAmendment, Invoice, InvoiceLineItem)
- **22 relations** linking all objects including to standard Company/Opportunity
- **8 NestJS services**: Setup, Pricing (10-step waterfall + block), Approval (rules + smart re-approval), Renewal (quote generation + pricing hierarchy), Contract (state machine + proration), Risk (6-signal scoring), PDF (data prep + grouping), Controller (16 endpoints)
- **106 test cases** across 8 spec files
- **5 frontend pages**: Setup, Templates, Pricing Calculator, Quote Builder, Renewal Dashboard (all Linaria)
- **Architecture doc**: `knowledge/decisions/adr-004-cpq-twenty-native-integration.md`
- **Gap analysis**: `knowledge/features/cpq-gap-analysis.md`

---

## Prerequisites

```bash
cd twenty && bash packages/twenty-utils/setup-dev-env.sh
npx nx build twenty-shared
npx nx start twenty-server   # terminal 1
npx nx start twenty-front    # terminal 2
```

---

## Tasks To Execute (in order)

### 1. TASK-085: Add workspace auth

Read `project-management/backlog/TASK-085-workspace-auth-controller.md`.

Add `@AuthWorkspace()` decorator to all controller endpoints. Study `twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.resolver.ts` for the pattern. Remove `workspaceId` from `@Body()` params — workspace identity comes from the auth token.

```typescript
// Before
@Post('setup')
async setup(@Body() body: { workspaceId: string }) {
  return this.setupService.setupCpq(body.workspaceId);
}

// After
@Post('setup')
async setup(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
  return this.setupService.setupCpq(workspaceId);
}
```

Update controller tests to mock auth context.

### 2. TASK-087: Wire createFromQuote

Read `project-management/backlog/TASK-087-wire-create-from-quote.md`.

Replace the stub in `cpq-contract.service.ts` that returns `'new-contract-id'`. Inject `WorkspaceDatasourceService`. Use a transaction:

1. Query quote — verify status = 'accepted'
2. Get line items
3. Create contract record
4. Create subscription for each recurring line item
5. Create initial amendment (amendment_number=1)
6. Create invoice with line items
7. Update quote status → 'contracted'
8. Commit transaction

### 3. TASK-088: Wire runRenewalCheck

Read `project-management/backlog/TASK-088-wire-renewal-check.md`.

Replace scaffolding in `cpq-renewal.service.ts`. Inject `WorkspaceDatasourceService`.

1. Acquire advisory lock: `pg_try_advisory_lock`
2. Query contracts: `status='active' AND endDate within leadDays AND no pending renewal quote`
3. For each contract (own transaction): get subscriptions → `generateRenewalQuote()` → create renewal-type quote → create renewal-type opportunity
4. Release advisory lock in finally block

### 4. TASK-091: Apollo Client migration

Read `project-management/backlog/TASK-091-apollo-client-migration.md`.

Replace all `fetch()` calls in frontend hooks with Apollo:

```typescript
// Before
const response = await fetch(`/cpq/status/${workspaceId}`);
const data = await response.json();

// After
const { data, loading, error } = useQuery(GET_CPQ_STATUS);
```

Create GraphQL operation files in `twenty-front/src/modules/cpq/graphql/`. Run `npx nx run twenty-front:graphql:generate` after building resolvers.

### 5. TASK-092: Register routes

Read `project-management/backlog/TASK-092-navigation-routing.md`.

Create `twenty-front/src/pages/settings/cpq/SettingsCpqPage.tsx`. Register `/settings/cpq` route. Verify custom objects auto-appear in sidebar after `setupCpq()`.

### 6. TASK-096: Integration tests

Run `setupCpq` against test workspace. Verify objects exist via GraphQL. Create a quote with line items. Convert to contract. Run renewal check.

### 7. TASK-100: Jordan QA

Test full flow as CRM admin persona:

1. Enable CPQ (Settings > CPQ > Enable)
2. Create a product (Products > + New)
3. Create a price book with entry
4. Create a quote on an opportunity
5. Add line items with pricing
6. Submit for approval
7. Approve the quote
8. Present to customer (generate PDF)
9. Mark as accepted
10. Convert to contract
11. Verify contract has subscriptions + invoice
12. Verify renewal job finds the contract

---

## Key Rules

- Read `twenty/CLAUDE.md` before writing code
- Named exports only, `//` comments (not JSDoc), Linaria styling
- Types over interfaces, no abbreviations, no `any`
- All monetary math via Decimal.js — no floating-point
- Services under 500 lines, components under 300 lines
- After each task: `git commit -m "TASK-XXX: description"` then `git push -u origin main`

---

## Key Files

| File | What |
|------|------|
| `twenty/CLAUDE.md` | Twenty's conventions and commands |
| `twenty/packages/twenty-server/src/modules/cpq/cpq.controller.ts` | 16 REST endpoints |
| `twenty/packages/twenty-server/src/modules/cpq/constants/cpq-metadata.constants.ts` | 16 objects, 22 relations, 80+ fields |
| `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` | Setup/teardown/status |
| `twenty/packages/twenty-server/src/modules/cpq/services/cpq-pricing.service.ts` | 10-step waterfall + block pricing |
| `twenty/packages/twenty-server/src/modules/cpq/services/cpq-approval.service.ts` | Rules engine + smart re-approval |
| `twenty/packages/twenty-server/src/modules/cpq/services/cpq-contract.service.ts` | State machine + proration (createFromQuote is a STUB) |
| `twenty/packages/twenty-server/src/modules/cpq/services/cpq-renewal.service.ts` | Quote generation (runRenewalCheck is SCAFFOLDING) |
| `twenty/packages/twenty-server/src/modules/cpq/services/cpq-risk.service.ts` | 6-signal risk scoring |
| `twenty/packages/twenty-server/src/modules/cpq/services/cpq-pdf.service.ts` | PDF data preparation |
| `knowledge/decisions/adr-004-cpq-twenty-native-integration.md` | Architecture decision |
| `knowledge/features/cpq-gap-analysis.md` | Research vs implementation gaps |
| `knowledge/features/cpq-integration-status.md` | Current status document |
| `project-management/projects/PRJ-004-cpq-twenty-integration-completion.md` | Full project plan |

---

## After All Tasks

Run a review scoring all 8 categories — target 9.5/10 in each:

A. Metadata Registration, B. Database Migrations, C. GraphQL Integration, D. Frontend UI, E. Service Quality, F. Test Coverage, G. Code Cleanup, H. Twenty Conventions

Fix anything below 9.5 and re-review.
