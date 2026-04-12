---
title: "Approval rules schema & engine"
id: TASK-064
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #approvals, #schema, #engine]
---

# TASK-064: Approval rules schema & engine

## User Stories
- As a Sales Manager, I want approval rules based on discount thresholds so large discounts require management review.

## Outcomes
Approval rules and approval requests tables. Rules define: condition (field, operator, threshold), approver (user/role), step number for sequential chains. Engine evaluates all active rules against a quote and determines the approval path.

## Success Metrics
- [ ] `approval_rules` table: conditions (JSONB), approver, step, chain support
- [ ] `approval_requests` table: per-quote approval tracking with status
- [ ] Approval engine evaluates rules against quote values
- [ ] Multi-level: discount >15% → Manager; >25% → VP; >40% → CFO
- [ ] Sequential chain support (step 1 before step 2)
- [ ] Rules configurable via API without code changes
- [ ] Tests for rule evaluation with various quote scenarios

## Implementation Plan

### Schema
```typescript
export const approvalRules = pgTable('approval_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 30 }).notNull().default('quote'),
  priority: integer('priority').notNull(),
  conditions: jsonb('conditions').notNull(),
    // e.g., { field: "max_discount_percent", operator: "gt", value: 15 }
  approverUserId: uuid('approver_user_id'),
  approverRole: varchar('approver_role', { length: 100 }),
  stepNumber: integer('step_number').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  ruleId: uuid('rule_id').references(() => approvalRules.id),
  entityType: varchar('entity_type', { length: 30 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
    // pending, approved, rejected, skipped
  stepNumber: integer('step_number').notNull(),
  requestedBy: uuid('requested_by'),
  decidedBy: uuid('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  comments: text('comments'),
  previousApprovalData: jsonb('previous_approval_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add approval tables
- `src/lib/cpq/approval-engine.ts` — NEW: Rule evaluation
- `src/lib/cpq/approval-engine.test.ts` — NEW
- `src/app/api/approval-rules/route.ts` — NEW: CRUD
