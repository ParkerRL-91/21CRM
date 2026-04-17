---
title: "Build GraphQL resolvers for CPQ business logic"
id: TASK-086
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #graphql, #resolver]
---

# TASK-086: Build GraphQL resolvers for CPQ business logic

## User Stories

- As a **frontend developer**, I want CPQ operations (pricing, risk, conversion) available as GraphQL mutations so that I can call them consistently alongside Twenty's auto-generated CRUD.
- As a **API consumer**, I want a unified GraphQL API for all CPQ operations so that I don't need to mix GraphQL and REST calls.

## Outcomes

Custom GraphQL resolver class exposing CPQ business logic as mutations. Twenty is a GraphQL-first platform — while the REST controller remains for backward compatibility, the primary API should be GraphQL.

## Success Metrics

- [ ] `CpqResolver` class registered in `CpqModule`
- [ ] Mutations: `setupCpq`, `teardownCpq`, `calculatePrice`, `assessRisk`, `convertQuoteToContract`, `runRenewalCheck`
- [ ] Queries: `cpqStatus`
- [ ] Input types defined with `@InputType()` decorators
- [ ] Output types defined with `@ObjectType()` decorators
- [ ] All mutations use `@AuthWorkspace()` for workspace scoping
- [ ] Frontend can call all CPQ operations via Apollo Client

## Implementation Plan

1. Study Twenty's resolver pattern:
   - Read `twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.resolver.ts`
   - Understand `@Resolver()`, `@Mutation()`, `@Query()`, `@Args()` decorators
   - Understand how Twenty registers resolvers in modules

2. Create input/output types:
   ```typescript
   @InputType()
   export class CalculatePriceInput {
     @Field(() => String) listPrice: string;
     @Field(() => Int) quantity: number;
     // ... etc
   }

   @ObjectType()
   export class PricingResultOutput {
     @Field(() => String) netUnitPrice: string;
     @Field(() => String) netTotal: string;
     // ... etc
   }
   ```

3. Create CpqResolver:
   ```typescript
   @Resolver()
   export class CpqResolver {
     @Mutation(() => SetupResultOutput)
     async setupCpq(@AuthWorkspace() workspace: WorkspaceEntity) { ... }

     @Mutation(() => PricingResultOutput)
     calculatePrice(@Args('input') input: CalculatePriceInput) { ... }

     @Query(() => CpqStatusOutput)
     async cpqStatus(@AuthWorkspace() workspace: WorkspaceEntity) { ... }
   }
   ```

4. Register resolver in CpqModule providers

5. Run `npx nx run twenty-front:graphql:generate` to generate frontend types

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/cpq.resolver.ts` — NEW: GraphQL resolver
- `twenty/packages/twenty-server/src/modules/cpq/dtos/` — NEW: Input/Output types
- `twenty/packages/twenty-server/src/modules/cpq/cpq.module.ts` — MODIFY: register resolver
- `twenty/packages/twenty-server/src/modules/cpq/cpq.resolver.spec.ts` — NEW: tests
