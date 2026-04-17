---
title: "Add workspace auth to CPQ controller"
id: TASK-085
project: PRJ-004
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #auth, #controller]
---

# TASK-085: Add workspace auth to CPQ controller

## User Stories

- As a **CRM admin**, I want CPQ endpoints to be workspace-scoped so that my CPQ data is isolated from other workspaces.
- As a **security reviewer**, I want all CPQ endpoints protected by Twenty's auth system so that unauthenticated requests are rejected.

## Outcomes

All CPQ controller endpoints use Twenty's `@AuthWorkspace()` decorator to extract the workspace context from the authenticated session. No endpoint accepts a raw `workspaceId` body parameter — workspace identity comes from the auth token.

## Success Metrics

- [ ] All controller endpoints use `@AuthWorkspace()` decorator
- [ ] `workspaceId` extracted from auth context, not request body
- [ ] Unauthenticated requests return 401
- [ ] Requests to wrong workspace return 403
- [ ] Tests updated to mock auth context

## Implementation Plan

1. Study Twenty's auth pattern:
   - Read `twenty-server/src/engine/guards/` for auth guards
   - Read existing controllers that use `@AuthWorkspace()` (e.g., ObjectMetadata resolver)
   - Understand `WorkspaceEntity` type returned by the decorator

2. Update CpqController:
   ```typescript
   @Post('setup')
   async setup(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
     return this.setupService.setupCpq(workspaceId);
   }
   ```

3. Remove `workspaceId` from all `@Body()` parameters — it comes from auth now

4. Add `@UseGuards(WorkspaceAuthGuard)` at the controller level if not applied globally

5. Update controller tests to provide mock auth context

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/cpq.controller.ts` — MODIFY: add auth decorators
- `twenty/packages/twenty-server/src/modules/cpq/cpq.controller.spec.ts` — MODIFY: mock auth
