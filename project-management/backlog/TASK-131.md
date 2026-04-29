---
title: Migrate fetch() to Apollo Client
id: TASK-131
project: PRJ-006
status: ready
priority: P2
tier: 3
effort: 2 days
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, apollo, graphql, fetch, migration, architecture, differentiator]
---

# TASK-131 — Migrate fetch() to Apollo Client

## Context

Both CPQ hooks use raw `fetch()` calls to the backend REST controller:
- `use-cpq-setup.ts` calls `fetch(${SERVER_BASE}/cpq/status)`, `fetch(${SERVER_BASE}/cpq/setup)`, etc.
- `use-cpq-pricing.ts` calls `fetch('/cpq/calculate-price')` with manual Bearer token handling

The rest of Twenty uses Apollo Client for all data operations. Using `fetch()` means:
- No automatic cache management
- No optimistic updates
- No query deduplication
- Manual token management (the pricing hook manually reads `tokenPairState` Jotai atom)
- No integration with Twenty's error handling (Apollo error interceptors)
- No integration with the `useSnackBarOnQueryError` hook

This task migrates all CPQ data calls from raw `fetch()` to Apollo Client, either using GraphQL mutations/queries (if the backend is migrated to a GraphQL resolver) or using Apollo's `RestLink` for the existing REST endpoints.

## User Stories

**As Jordan (CRM Admin)**, I want the CPQ to use the same data layer as the rest of Twenty, so that error handling, authentication, and caching are consistent.

**As Alex (Sales Rep)**, I want pricing calculations to be cached, so that re-opening a quote doesn't re-fetch data I already loaded.

**As Dana (VP RevOps)**, I want the CPQ to benefit from the same auth and session management as the rest of the CRM, so that I don't get logged out of CPQ while still being logged into other pages.

## Outcomes

- All `fetch()` calls in CPQ hooks are replaced with Apollo Client operations
- Token management is handled by Apollo's auth link (no manual token reading)
- Errors flow through Apollo's error handling pipeline
- Responses are cached in the Apollo cache where appropriate
- The `useSnackBarOnQueryError` pattern is available for CPQ queries

## Success Metrics

- [ ] Zero `fetch()` calls remain in CPQ hooks
- [ ] `use-cpq-setup.ts` uses Apollo Client for all operations
- [ ] `use-cpq-pricing.ts` uses Apollo Client for pricing calculations
- [ ] Manual `tokenPairState` reading is removed from CPQ hooks
- [ ] CPQ status query is cached (doesn't re-fetch on every page load)
- [ ] Error handling uses Apollo error interceptors
- [ ] All existing functionality works identically after migration
- [ ] Unit tests pass with Apollo Client mocks

## Implementation Plan

### Option A: GraphQL Resolver Migration (preferred)

If the CPQ backend is migrated to use the GraphQL resolver (`cpq.resolver.ts` already exists at `packages/twenty-server/src/modules/cpq/cpq.resolver.ts`):

#### Step 1: Verify/extend the GraphQL resolver

Read `packages/twenty-server/src/modules/cpq/cpq.resolver.ts` to see what queries/mutations already exist. Add missing ones:

```typescript
@Query(() => CpqStatusOutput)
async cpqStatus(@AuthWorkspace() workspace) { ... }

@Mutation(() => SetupResultOutput)
async cpqSetup(@AuthWorkspace() workspace) { ... }

@Mutation(() => Boolean)
async cpqTeardown(@AuthWorkspace() workspace) { ... }

@Mutation(() => PricingResultOutput)
async calculatePrice(@Args('input') input: CalculatePriceInput) { ... }

@Mutation(() => SeedResultOutput)
async seedCatalog(@Args('input') input: SeedCatalogInput) { ... }
```

#### Step 2: Write GraphQL operations

Create `packages/twenty-front/src/modules/cpq/graphql/`:

- `cpq-status.query.ts`:
  ```typescript
  export const CPQ_STATUS_QUERY = gql`
    query CpqStatus {
      cpqStatus {
        isSetUp
        objectCount
        expectedCount
        foundObjects
        missingObjects
        version
      }
    }
  `;
  ```

- `cpq-setup.mutation.ts`, `cpq-teardown.mutation.ts`, `cpq-calculate-price.mutation.ts`, `cpq-seed-catalog.mutation.ts`

#### Step 3: Rewrite use-cpq-setup.ts

Replace all `fetch()` calls with `useQuery` and `useMutation` from `@apollo/client`:

```typescript
export const useCpqSetup = (_workspaceId: string) => {
  const { data, loading, error, refetch } = useQuery(CPQ_STATUS_QUERY);
  const [runSetupMutation, { loading: isSettingUp }] = useMutation(CPQ_SETUP_MUTATION);
  const [runTeardownMutation, { loading: isTearingDown }] = useMutation(CPQ_TEARDOWN_MUTATION);
  const [seedMutation, { loading: isSeeding }] = useMutation(CPQ_SEED_CATALOG_MUTATION);

  // ... rest of hook logic using Apollo operations
};
```

#### Step 4: Rewrite use-cpq-pricing.ts

Replace `fetch()` with `useMutation`:

```typescript
export const useCpqPricing = () => {
  const [calculatePriceMutation, { data, loading, error }] = useMutation(CPQ_CALCULATE_PRICE_MUTATION);

  const calculatePrice = useCallback(async (input: PricingInput) => {
    const result = await calculatePriceMutation({ variables: { input } });
    return result.data?.calculatePrice ?? null;
  }, [calculatePriceMutation]);

  return {
    result: data?.calculatePrice ?? null,
    isCalculating: loading,
    error: error?.message ?? null,
    calculatePrice,
  };
};
```

### Option B: Apollo RestLink (if keeping REST endpoints)

If the GraphQL resolver approach is too large, use Apollo's `RestLink` to wrap the existing REST endpoints:

#### Step 1: Install @apollo/client rest-link

```bash
cd packages/twenty-front && yarn add apollo-link-rest
```

#### Step 2: Configure RestLink

Add to Apollo Client configuration (find the existing Apollo Client setup file).

#### Step 3: Write REST-backed Apollo operations

Define queries/mutations that map to REST endpoints via RestLink directives.

### Step 5 (both options): Remove manual token handling

Remove the `tokenPairState` import and manual `Authorization` header from `use-cpq-pricing.ts`. Apollo Client's auth link handles this automatically.

### Step 6: Update imports and exports

Update `packages/twenty-front/src/modules/cpq/index.ts` — hooks signatures should remain compatible.

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/graphql/` directory with query/mutation files
- **Modify**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-setup.ts` — replace fetch with Apollo
- **Modify**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-pricing.ts` — replace fetch with Apollo
- **Possibly modify**: `packages/twenty-server/src/modules/cpq/cpq.resolver.ts` — extend GraphQL schema
- **Possibly modify**: `packages/twenty-front/src/modules/cpq/index.ts` — update exports

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-setup.apollo.test.ts`

- `should fetch CPQ status via Apollo query`
- `should run setup via Apollo mutation`
- `should run teardown via Apollo mutation`
- `should seed catalog via Apollo mutation`
- `should handle Apollo errors`
- `should cache status query results`

### Unit tests: `packages/twenty-front/src/modules/cpq/hooks/__tests__/use-cpq-pricing.apollo.test.ts`

- `should calculate price via Apollo mutation`
- `should handle pricing errors via Apollo`
- `should not require manual token management`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
