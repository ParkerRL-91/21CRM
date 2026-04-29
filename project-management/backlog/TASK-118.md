---
title: Approval rules admin UI (no-code rule builder)
id: TASK-118
project: PRJ-006
status: ready
priority: P0
tier: 1
effort: 5 days
created: 2026-04-29
updated: 2026-04-29
dependencies: []
tags: [cpq, approval-rules, admin-ui, no-code, rule-builder, blocker]
---

# TASK-118 — Approval Rules Admin UI (No-Code Rule Builder)

## Context

The CPQ backend has an approval engine, but there is no admin UI to configure approval rules. Currently, approval rules must be passed as JSON in the API request body. Dana Chen said: "You're telling me I need to write JSON to set up discount rules? This is a developer tool, not a RevOps tool. My deal desk person needs to manage these rules."

This is the highest-effort blocker at 5 days because it requires a complete new UI: a settings page where admins can create, edit, and delete approval rules using a visual rule builder — no JSON, no code. The rule builder needs to support conditions (if discount > X%, if total > $Y, if product family = Z) and actions (route to manager, route to VP Sales, auto-approve).

## User Stories

**As Dana (VP RevOps)**, I want to configure discount approval thresholds through a settings UI, so that I don't need to involve engineering every time I change our approval policy.

**As Raj (Deal Desk Specialist)**, I want to see the approval chain before I submit a quote, so that I know exactly who needs to approve and what the thresholds are.

**As Jordan (CRM Admin)**, I want to create rules like "If discount > 15%, route to Sales Manager" in a visual builder, so that I can train the deal desk team to manage rules themselves.

**As Alex (Sales Rep)**, I want to understand what discount levels I can self-approve versus what requires manager approval, so that I can set expectations with the customer during the call.

## Outcomes

- A "Approval Rules" section in Settings > CPQ where admins can view all rules
- A visual rule builder that supports creating rules with conditions and actions
- Rules support conditions on: discount percentage, total deal value, product family, billing type
- Rules support actions: auto-approve, route to specific role, route to specific user, require 2+ approvers
- Rules can be enabled/disabled, reordered by priority, and deleted
- The approval chain preview shows on the quote builder before submission
- No JSON editing required for any standard rule configuration

## Success Metrics

- [ ] "Approval Rules" section visible in Settings > CPQ page
- [ ] "Add Rule" button creates a new blank rule in the builder
- [ ] Condition selector offers: discount %, total value, product family, billing type
- [ ] Operator selector offers: greater than, less than, equals, between
- [ ] Action selector offers: auto-approve, route to role, route to user
- [ ] Rules can be drag-reordered by priority
- [ ] Rules can be toggled enabled/disabled
- [ ] Rules can be deleted with confirmation dialog
- [ ] Rules persist after page refresh (saved to backend)
- [ ] At least 3 common rule presets available (e.g., "Standard Discount Approval")
- [ ] Approval chain preview renders on quote builder
- [ ] Unit tests pass for rule builder CRUD operations
- [ ] Integration test passes for rule persistence

## Implementation Plan

### Step 1: Define the ApprovalRule data model

Create `packages/twenty-front/src/modules/cpq/types/cpq-approval-types.ts`:

```typescript
type ApprovalConditionField = 'discountPercent' | 'totalValue' | 'productFamily' | 'billingType';
type ApprovalConditionOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'in';

type ApprovalCondition = {
  field: ApprovalConditionField;
  operator: ApprovalConditionOperator;
  value: string | number;
  secondaryValue?: string | number; // for 'between' operator
};

type ApprovalAction = {
  type: 'auto_approve' | 'route_to_role' | 'route_to_user' | 'require_multiple';
  target?: string; // role name or user ID
  requiredCount?: number; // for require_multiple
};

type ApprovalRule = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number; // lower = higher priority
  conditions: ApprovalCondition[];
  conditionLogic: 'and' | 'or';
  action: ApprovalAction;
  createdAt: string;
  updatedAt: string;
};
```

### Step 2: Create the approval rules hook

Create `packages/twenty-front/src/modules/cpq/hooks/use-cpq-approval-rules.ts`:

- CRUD operations: `listRules`, `createRule`, `updateRule`, `deleteRule`, `reorderRules`
- Calls backend endpoints (create corresponding endpoints in Step 6)
- Returns `{ rules, isLoading, error, createRule, updateRule, deleteRule, reorderRules }`
- Follow the same `fetch()` pattern as `use-cpq-setup.ts` (Apollo migration in TASK-131)

### Step 3: Create the ApprovalRuleBuilder component

Create `packages/twenty-front/src/modules/cpq/components/CpqApprovalRuleBuilder.tsx`:

This is the main rule builder UI. Structure:
- Header with "Approval Rules" title and "Add Rule" button
- List of existing rules, each as an expandable card
- Each card shows: rule name, enabled toggle, condition summary, action summary
- Expanded card shows the full condition/action editor
- Drag handles for reordering (use HTML5 drag-and-drop or a library like `@dnd-kit/core`)

The condition editor within each rule:
- Dropdown to select field (Discount %, Total Value, Product Family, Billing Type)
- Dropdown to select operator (>, <, =, between, in)
- Input field for value (number input for %, currency input for value, select for family/billing)
- "Add Condition" button to add another condition row
- AND/OR toggle for condition logic

The action editor:
- Radio buttons or dropdown: Auto-approve, Route to Role, Route to User, Require Multiple Approvers
- Secondary input: role name dropdown or user search (when "Route to..." is selected)

Use styled components following the pattern in `CpqSetupPage.tsx`:
- `StyledSection`, `StyledSectionHeader`, `StyledSectionBody` for layout
- `StyledButton` with variant prop for primary/danger/ghost
- `StyledBadge` for enabled/disabled status

### Step 4: Create rule preset templates

Create `packages/twenty-front/src/modules/cpq/constants/cpq-approval-presets.ts`:

```typescript
export const APPROVAL_RULE_PRESETS = [
  {
    name: 'Standard Discount Approval',
    description: 'Discounts over 15% require Sales Manager approval',
    conditions: [{ field: 'discountPercent', operator: 'gt', value: 15 }],
    conditionLogic: 'and',
    action: { type: 'route_to_role', target: 'Sales Manager' },
  },
  {
    name: 'Large Deal Review',
    description: 'Deals over $50,000 require VP Sales approval',
    conditions: [{ field: 'totalValue', operator: 'gt', value: 50000 }],
    conditionLogic: 'and',
    action: { type: 'route_to_role', target: 'VP Sales' },
  },
  {
    name: 'Deep Discount Escalation',
    description: 'Discounts over 30% require CRO + VP Sales',
    conditions: [{ field: 'discountPercent', operator: 'gt', value: 30 }],
    conditionLogic: 'and',
    action: { type: 'require_multiple', requiredCount: 2 },
  },
];
```

### Step 5: Add approval rules section to CpqSetupPage

Modify `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx`:

- Import `CpqApprovalRuleBuilder`
- Add a new `<StyledSection>` after the Product Catalog section (only shown when CPQ is set up)
- Section header: "Approval Rules"
- Section body: `<CpqApprovalRuleBuilder />`

### Step 6: Create backend approval rule endpoints

Add to `packages/twenty-server/src/modules/cpq/cpq.controller.ts`:

```typescript
@Get('approval-rules')
async listApprovalRules(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) { ... }

@Post('approval-rules')
async createApprovalRule(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity, @Body() rule: CreateApprovalRuleDto) { ... }

@Put('approval-rules/:id')
async updateApprovalRule(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity, @Body() rule: UpdateApprovalRuleDto) { ... }

@Delete('approval-rules/:id')
async deleteApprovalRule(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) { ... }
```

Create `packages/twenty-server/src/modules/cpq/services/cpq-approval.service.ts` for the business logic.

Create DTOs in `packages/twenty-server/src/modules/cpq/dtos/approval-rule.dto.ts`.

### Step 7: Create the ApprovalChainPreview component

Create `packages/twenty-front/src/modules/cpq/components/CpqApprovalChainPreview.tsx`:

- Accepts `quoteTotal: number, maxDiscountPercent: number, productFamilies: string[]`
- Evaluates all enabled rules against the quote parameters
- Displays the matching rules as a vertical chain: Rule Name -> Action -> Status
- Shows "Auto-approved" in green if no rules match or all matching rules are auto-approve
- Shows "Requires approval from: [role/user]" in yellow/orange for routing rules

## Files to Change

- **Create**: `packages/twenty-front/src/modules/cpq/types/cpq-approval-types.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/hooks/use-cpq-approval-rules.ts`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqApprovalRuleBuilder.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/components/CpqApprovalChainPreview.tsx`
- **Create**: `packages/twenty-front/src/modules/cpq/constants/cpq-approval-presets.ts`
- **Modify**: `packages/twenty-front/src/modules/cpq/components/CpqSetupPage.tsx` — add rules section
- **Modify**: `packages/twenty-front/src/modules/cpq/index.ts` — add exports
- **Modify**: `packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add CRUD endpoints
- **Create**: `packages/twenty-server/src/modules/cpq/services/cpq-approval.service.ts`
- **Create**: `packages/twenty-server/src/modules/cpq/dtos/approval-rule.dto.ts`
- **Modify**: `packages/twenty-server/src/modules/cpq/cpq.module.ts` — register new service

## Tests to Write

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqApprovalRuleBuilder.test.tsx`

- `should render empty state with "Add Rule" button`
- `should create a new rule when "Add Rule" is clicked`
- `should display existing rules as expandable cards`
- `should toggle rule enabled/disabled`
- `should delete rule with confirmation`
- `should add condition to a rule`
- `should remove condition from a rule`
- `should change condition field, operator, and value`
- `should change action type and target`
- `should reorder rules via drag`
- `should save changes to backend on edit`
- `should load rule presets`

### Unit tests: `packages/twenty-front/src/modules/cpq/components/__tests__/CpqApprovalChainPreview.test.tsx`

- `should show "Auto-approved" when no rules match`
- `should show matching rules for high-discount quotes`
- `should show matching rules for large-value quotes`
- `should evaluate AND conditions correctly`
- `should evaluate OR conditions correctly`

### Backend tests: `packages/twenty-server/src/modules/cpq/services/cpq-approval.service.spec.ts`

- `should create an approval rule`
- `should list rules for a workspace`
- `should update rule conditions`
- `should delete a rule`
- `should evaluate rules against a quote`

## Status Log

_(empty — to be filled during execution)_

## Takeaways

_(empty — to be filled after completion)_
