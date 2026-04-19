---
title: "Build GraphQL resolvers for CPQ business logic"
id: TASK-086
project: PRJ-004
status: done
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

- `twenty/packages/twenty-server/src/modules/cpq/cpq.resolver.ts` — CREATED: GraphQL resolver with 6 mutations + 1 query
- `twenty/packages/twenty-server/src/modules/cpq/dtos/calculate-price.input.ts` — CREATED
- `twenty/packages/twenty-server/src/modules/cpq/dtos/pricing-result.output.ts` — CREATED
- `twenty/packages/twenty-server/src/modules/cpq/dtos/setup-result.output.ts` — CREATED
- `twenty/packages/twenty-server/src/modules/cpq/dtos/cpq-status.output.ts` — CREATED
- `twenty/packages/twenty-server/src/modules/cpq/dtos/assess-risk.input.ts` — CREATED
- `twenty/packages/twenty-server/src/modules/cpq/dtos/risk-assessment.output.ts` — CREATED
- `twenty/packages/twenty-server/src/modules/cpq/dtos/renewal-result.output.ts` — CREATED
- `twenty/packages/twenty-server/src/modules/cpq/cpq.module.ts` — MODIFIED: added CpqResolver to providers
- `twenty/packages/twenty-server/src/modules/cpq/cpq.resolver.spec.ts` — CREATED: 7 tests

## Status Log
- 2026-04-12: Created
- 2026-04-12: Completed — created resolver + DTOs, registered in module, 7 tests

## Takeaways
- Twenty module resolvers use @MetadataResolver() (not bare @Resolver()) to route to the metadata GraphQL schema
- Date fields are passed as strings in GraphQL InputTypes and converted to Date objects in the resolver before calling services
- @AuthWorkspace() works in both HTTP and GraphQL contexts via getRequest() which handles both execution context types
