# TASK-121 — Admin: Approval Workflow Configuration
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required for governance and deal control

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to define approval workflow rules that automatically route quotes for management sign-off when discounts exceed thresholds, deal values are high, or non-standard terms are requested,
**so that** deals always have appropriate oversight and reps cannot offer pricing outside authorized boundaries without accountability.

---

## Background & Context

Without approval workflows, reps can close deals at any discount. With workflows, the system:
- Evaluates the quote against defined conditions at submission
- Creates approval requests and routes them to the correct approvers
- Blocks quote sending until all required approvals are obtained
- Logs every approval decision with actor, timestamp, and reason

PhenoTips's current approval process (if informal) likely involves Slack messages and email threads. This formalizes it.

Standard thresholds at SaaS companies:
- > 10% off list → Sales Manager
- > 20% off list → Sales Director
- > $100K deal or non-standard payment terms → Finance/Deal Desk
- > $250K deal or custom legal terms → Legal + VP Sales

Key design decisions:
- **Sequential** routing (most common): each step fires only after the previous step is approved
- **Parallel** routing: multiple steps fire simultaneously
- **Dynamic approvers**: who approves is determined at runtime (e.g., the quote owner's manager), not hardcoded
- **Approval Variables**: aggregate quote line fields (e.g., max discount across all lines) into a single value for condition testing

---

## Features Required

### 1. Approval Variables
Variables aggregate quote line data into quote-level values usable in approval conditions.

- **Name** (e.g., `MaxLineDiscount`, `TotalARR`, `HasPSProduct`, `HasCustomTerms`)
- **Source Object**: `Quote Line`
- **Source Field**: field to aggregate (e.g., `AdditionalDiscount`)
- **Aggregate Function**: `Sum`, `Max`, `Min`, `Count`, `Average`
- **Filter Field**: optional field to limit which lines count (e.g., only recurring lines)
- **Filter Value**: the filter match value

Example: `MaxLineDiscount` = `Max(QuoteLine.TotalDiscount%)` — used in the condition "MaxLineDiscount > 10%"

Variable management UI:
- List of all variables with name, aggregate, source field
- Create/edit/delete
- "Test Variable" → run against a live quote to verify value

### 2. Approval Rule List
- Table: Rule Name, Conditions, Routing Type (Sequential/Parallel), Steps, Active
- Create, edit, activate/deactivate, reorder rules
- Rules are evaluated in order; if multiple rules match, all are triggered

### 3. Approval Rule Detail

**Header:**
- Name (required)
- Is Active (toggle)
- Description (internal notes)
- Routing Type: `Sequential` or `Parallel`
- Priority (determines which rule fires first if multiple apply)

**Conditions tab (AND/OR):**
Each condition:
- Tested Object: `Quote`, `Quote Line`, `Account`, `Approval Variable`
- Tested Field (select from field list or variable list)
- Operator: `=`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `is true`, `is blank`
- Tested Value

Conditions Met: `All` (AND) / `Any` (OR)

**Approval Steps tab:**
Ordered list of steps (drag-to-reorder for sequential rules):
- Step Name (e.g., "Sales Manager Review")
- Approver Type:
  - `Specific User` — hardcoded lookup to a user record
  - `User's Manager` — resolves to the quote owner's manager at runtime
  - `Role` — anyone in a named role can approve
  - `Group` — any member of a named approval group
  - `Queue` — routes to a named deal desk queue
  - `Field Value` — resolves approver from a quote or account field
- Approver Value (user lookup, role name, group name, or field API name)
- Rejection Behavior: `Terminate all steps` or `Continue to next step`
- **Step Conditions** (optional): conditions that must be true for THIS step to be activated. Allows regional routing within one rule without creating a separate rule per region. Example: "Step 2 — UK Legal Review" fires ONLY when `Quote.region = 'UK'`. Condition operators match the rule-level condition builder (tested object, field, operator, value).
- **SLA Timer (hours)**: time allowed for this step before SLA breach is logged. Default: 24 hours.
- Reminder After (hours): time before sending a reminder notification (default: 8)
- **Auto-Escalation After (hours)**: time after SLA breach before auto-escalating to escalation user (default: SLA + 4 hours)
- Escalation User (optional): who takes over if original approver doesn't respond within SLA + auto-escalation period

**SLA Enforcement:**
- When a step's SLA timer expires: `ApprovalRequest.slaStatus = 'Breached'`; approver's manager notified
- When auto-escalation fires: request reassigned to Escalation User; original approver CC'd
- Rep can self-escalate from the Approval Progress Tracker after the SLA timer expires ("Request Escalation" button appears when SLA is breached)
- All SLA events logged to the approval audit trail
- SLA breach summary visible in admin approval analytics (TASK-121 admin view)

**Notifications tab:**
- Email template for approval request
- Email template for approval granted
- Email template for approval rejected
- Slack channel to notify on each state change
- Approval link in email (one-click approve/reject without login — configurable)

### 4. Approval Request Record (Runtime)

When a quote is submitted for approval, the system creates `ApprovalRequest` records:

Fields:
- Quote (relation)
- Rule (which rule triggered this)
- Step (which step this request is for)
- Approver (who must approve)
- Status: `Pending`, `Approved`, `Rejected`, `Recalled`, `Expired`, `Delegated`
- Submitted At, Decided At
- Comments (required on rejection)
- Delegated To (user)

The ApprovalRequest record is visible on the Quote record's activity timeline and in an "Approvals" related list.

### 5. Approver Inbox (Approver User View)
A lightweight approval view accessible to approvers:
- List of pending approval requests for the current user
- Each request shows: Quote Number, Account, Rep Name, Deal Value, Max Discount, Key quote metrics
- "Approve" button → requires optional comment
- "Reject" button → requires mandatory comment
- "Delegate" button → reassign to another user
- "View Quote" link → opens the full quote record (read-only)

One-click approval from email:
- Email contains a secure token-based approve link
- Clicking "Approve" in email doesn't require login (configurable)
- Submit approval via GET request with signed token

### 6. Approval History on Quote
Timeline on the Quote record showing:
- "Submitted for approval by [rep]"
- "Approval request sent to [approver] for step [name]"
- "[Approver] approved: [comment]"
- "[Approver] rejected: [reason]"
- "All approvals complete — Quote approved"

---

## Admin UX Requirements

- Rule conditions mirror Price Rules UX (consistent pattern)
- "Simulate Approval" button: input a quote, see which rules would fire and which steps would be created
- Step ordering in sequential mode is drag-and-drop
- Visual flow diagram: shows the approval path as a swimlane chart (Rule → Step 1 → Step 2 → Approved)

---

## Definition of Success

- [ ] Admin can define a rule that fires when max discount > 10% and routes to Sales Manager
- [ ] Admin can define a second rule that fires when deal > $100K and routes to Finance (parallel with first)
- [ ] Sequential routing: Step 2 does not fire until Step 1 is approved
- [ ] Parallel routing: both steps fire simultaneously; quote is not approved until both respond
- [ ] Dynamic approver (`User's Manager`) resolves correctly at runtime
- [ ] Approver receives email notification with one-click approve/reject
- [ ] Rep receives notification on approval, rejection, and comment
- [ ] Rejected quote returns to `Draft` status so rep can edit and resubmit
- [ ] All approval decisions logged with actor, timestamp, and comment

---

## Method to Complete

### Backend
1. `ApprovalVariable` entity: aggregation definition
2. `ApprovalRule` entity: header + conditions
3. `ApprovalCondition` entity (child)
4. `ApprovalStep` entity (child of rule)
5. `ApprovalRequest` entity: runtime records created per step per submission
6. `ApprovalService`:
   - `evaluateRules(quoteId)` — determine which rules/steps fire
   - `submitForApproval(quoteId)` — creates ApprovalRequest records, sends notifications
   - `processDecision(requestId, decision, comment, userId)` — approve/reject/delegate
   - `checkAllApproved(quoteId)` — moves quote to Approved status when all steps clear
7. Routes: `POST /cpq/quotes/:id/submit-approval`, `POST /cpq/approvals/:id/decide`
8. Email service integration: send templated emails per approval event

### Frontend
1. `ApprovalRuleListPage.tsx`
2. `ApprovalRuleDetailPage.tsx` — header + conditions + steps + notifications
3. `ApprovalStepEditor.tsx` — step list with approver type selection
4. `ApprovalInbox.tsx` — approver's pending requests view
5. `ApprovalHistoryTimeline.tsx` — displayed on Quote record
6. `ApprovalSimulator.tsx` — test tool
7. `useApprovalRules` hook, `useApprovalInbox` hook

---

## Acceptance Criteria

- AC1: Rule with condition `MaxLineDiscount > 0.10` fires when quote has a 15% discounted line
- AC2: Two parallel steps both fire; quote remains `In Review` until both approve
- AC3: Sequential step 2 does not fire until step 1 returns `Approved`
- AC4: Rejection sets quote to `Rejected` status with rejection comment visible to rep
- AC5: Rep can recall a pending approval (returns to `Draft`)
- AC6: Approver one-click link approves correctly without requiring login
- AC7: Escalation fires after configured hours with no response from approver
- AC8: Audit trail shows every state transition with timestamp and actor

---

## Dependencies

- TASK-116 (Global Settings) — approval reminder cadence, expiration hours, default routing
- TASK-126 (Quote Builder) — submit-for-approval action on the quote
- TASK-136 (Pricing Engine) — approval variables pull from calculated quote fields

---

## Estimated Effort
**Backend:** 5 days | **Frontend:** 4 days | **Testing:** 2 days
**Total:** 11 days
