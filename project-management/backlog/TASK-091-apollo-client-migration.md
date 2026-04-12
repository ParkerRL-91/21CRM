---
title: "Migrate frontend hooks from fetch to Apollo Client"
id: TASK-091
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #frontend, #apollo, #graphql]
---

# TASK-091: Migrate frontend hooks from fetch to Apollo Client

## User Stories

- As a **frontend developer**, I want CPQ hooks to use Apollo Client so that they integrate consistently with Twenty's data layer, benefit from caching, and handle loading/error states automatically.
- As a **user**, I want CPQ data to refresh instantly when I make changes so that I see accurate information without manual page reloads.

## Outcomes

Replace all `fetch()` calls in CPQ frontend hooks with Apollo `useQuery`/`useMutation` hooks that call the GraphQL resolvers built in TASK-086. CPQ state management uses Apollo cache for server data and Jotai atoms for client-only UI state.

## Success Metrics

- [ ] `useCpqSetup` uses `useQuery(GET_CPQ_STATUS)` and `useMutation(SETUP_CPQ)`
- [ ] `useCpqPricing` uses `useMutation(CALCULATE_PRICE)`
- [ ] GraphQL operations defined in `src/modules/cpq/graphql/` directory
- [ ] Loading states from Apollo (no manual `isLoading` useState)
- [ ] Error handling from Apollo (no manual try/catch)
- [ ] Cache invalidation after setup/teardown mutations
- [ ] Types auto-generated from GraphQL schema
- [ ] Zero `fetch()` calls remaining in CPQ frontend

## Implementation Plan

1. Run `npx nx run twenty-front:graphql:generate` after TASK-086 resolvers are built
2. Create GraphQL operation files:
   ```typescript
   // src/modules/cpq/graphql/cpq-status.query.ts
   export const GET_CPQ_STATUS = gql`
     query CpqStatus {
       cpqStatus { isSetUp objectCount expectedCount version }
     }
   `;
   ```
3. Rewrite hooks:
   ```typescript
   export const useCpqSetup = () => {
     const { data, loading, error } = useQuery(GET_CPQ_STATUS);
     const [setupCpq] = useMutation(SETUP_CPQ, {
       refetchQueries: [{ query: GET_CPQ_STATUS }],
     });
     return { isSetUp: data?.cpqStatus?.isSetUp, isLoading: loading, error, runSetup: setupCpq };
   };
   ```
4. Add Jotai atoms for UI-only state (selected template, wizard step, etc.)

## Dependencies

- TASK-086 (GraphQL resolvers) must be complete first

## Files to Change

- `twenty/packages/twenty-front/src/modules/cpq/graphql/` — NEW: operation files
- `twenty/packages/twenty-front/src/modules/cpq/hooks/use-cpq-setup.ts` — REWRITE
- `twenty/packages/twenty-front/src/modules/cpq/hooks/use-cpq-pricing.ts` — REWRITE
- `twenty/packages/twenty-front/src/modules/cpq/atoms/` — NEW: Jotai atoms for UI state
