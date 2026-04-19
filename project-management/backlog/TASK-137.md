# TASK-137 — Backend: Approval Engine — Rule Evaluation & Routing
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Governance layer for the entire CPQ system

---

## User Story

**As a** CPQ system,
**I need** a reliable approval engine that evaluates all configured approval rules against a quote's current state, creates approval requests routed to the correct approvers (statically or dynamically resolved), sends notifications, and progresses the approval chain as each step is decided,
**so that** every non-standard deal has the appropriate oversight before a quote reaches the customer, with full audit trail and zero manual routing.

---

## Background & Context

The Approval Engine is the enforcement mechanism of CPQ governance. It runs when a rep clicks "Submit for Approval" and orchestrates the entire approval lifecycle from rule evaluation through final decision.

Key design requirements:
- **Correctness**: If a rule says "discount > 10% needs manager approval", that must fire every time — no exceptions
- **Flexibility**: Support sequential and parallel routing, dynamic approvers, escalation, delegation
- **Auditability**: Every decision logged with actor identity, timestamp, IP, and comment
- **Resilience**: Approval state must survive server restarts; it's the legal record of deal authorization

---

## Features Required

### 1. ApprovalEngineService

```typescript
class ApprovalEngineService {
  // Called on quote submission: evaluates all rules, creates requests
  async initiateApproval(quoteId: string, submittedByUserId: string): Promise<ApprovalInitiationResult>

  // Preview without creating requests
  async previewApproval(quoteId: string): Promise<ApprovalPreview>

  // Process an approver decision
  async processDecision(requestId: string, decision: ApprovalDecision, decidedByUserId: string, comment: string): Promise<void>

  // Recall all pending requests (rep action)
  async recallApproval(quoteId: string, recalledByUserId: string): Promise<void>

  // Escalate a specific step (admin/manager action)
  async escalateStep(requestId: string, escalatedByUserId: string): Promise<void>

  // Delegate to another user
  async delegateRequest(requestId: string, toDelegateUserId: string, delegatedByUserId: string): Promise<void>

  // Called by a scheduler: send reminders, handle expirations, escalate overdue
  async processTimedActions(now: Date): Promise<void>
}
```

### 2. Rule Evaluation

```typescript
async evaluateRules(quoteId: string): Promise<TriggeredRule[]> {
  // 1. Compute Approval Variables (same aggregation pattern as Summary Variables)
  const approvalVariables = await this.computeApprovalVariables(quoteId);

  // 2. Load all active Approval Rules ordered by priority
  const rules = await this.loadApprovalRules(workspaceId);

  // 3. For each rule: evaluate conditions
  const triggered = [];
  for (const rule of rules) {
    const conditionsResult = await this.evaluateConditions(rule.conditions, quote, approvalVariables);
    if (conditionsResult.met) {
      triggered.push({ rule, steps: rule.steps });
    }
  }

  return triggered;
}
```

**Condition evaluation:**

```typescript
async evaluateCondition(condition: ApprovalCondition, quote: Quote, variables: Record<string, number>): Promise<boolean> {
  const testedValue = this.resolveTestedValue(condition, quote, variables);
  // testedValue from: quote field, quote line aggregate (via variables), account field
  return this.compare(testedValue, condition.operator, condition.testedValue);
}
```

**Supported operators:**
- `=`, `!=` (equality/inequality)
- `>`, `>=`, `<`, `<=` (numeric comparison)
- `contains`, `startsWith`, `endsWith` (string)
- `isBlank`, `isNotBlank` (null checks)
- `in`, `notIn` (list membership)

**ConditionsMet logic:**
- `All` (AND): every condition must pass
- `Any` (OR): at least one condition must pass

### 3. Approval Request Creation

For each triggered rule:

```typescript
async createApprovalRequests(quoteId: string, triggeredRules: TriggeredRule[]): Promise<ApprovalRequest[]> {
  const requests = [];

  for (const { rule, steps } of triggeredRules) {
    if (rule.routingType === 'Sequential') {
      // Create only the first step; subsequent steps created when previous step approves
      const firstStep = steps[0];
      requests.push(await this.createRequest(quoteId, rule, firstStep));
    } else if (rule.routingType === 'Parallel') {
      // Create all steps simultaneously
      for (const step of steps) {
        requests.push(await this.createRequest(quoteId, rule, step));
      }
    }
  }

  return requests;
}

async createRequest(quoteId, rule, step): Promise<ApprovalRequest> {
  const approver = await this.resolveApprover(step, quoteId);
  const request = await this.approvalRequestRepo.create({
    quoteId, ruleId: rule.id, stepId: step.id,
    approverId: approver.id, status: 'Pending',
    submittedAt: new Date(),
    expiresAt: new Date(Date.now() + rule.expirationHours * 3600 * 1000),
  });
  await this.notificationService.sendApprovalRequest(request);
  return request;
}
```

### 4. Dynamic Approver Resolution

```typescript
async resolveApprover(step: ApprovalStep, quoteId: string): Promise<User> {
  switch (step.approverType) {
    case 'Specific User':
      return this.userRepo.findById(step.approverId);

    case "User's Manager":
      const quoteOwner = await this.getQuoteOwner(quoteId);
      return this.userRepo.findById(quoteOwner.managerId);

    case 'Role':
      // Returns the first available user with this role
      return this.userRepo.findFirstByRole(step.roleName);

    case 'Queue':
      // Routes to a named approval queue; any member can approve
      return this.queueService.getQueue(step.queueName);

    case 'Field Value':
      // Resolves from a field on the quote or account
      const fieldValue = await this.getFieldValue(quoteId, step.approverFieldPath);
      return this.userRepo.findById(fieldValue);
  }
}
```

### 5. Decision Processing

```typescript
async processDecision(requestId: string, decision: 'Approved' | 'Rejected', userId: string, comment: string): Promise<void> {
  const request = await this.approvalRequestRepo.findById(requestId);

  // Validate the decision comes from the assigned approver (or delegated user)
  this.validateDecisionAuthority(request, userId);

  // Record the decision
  await this.approvalRequestRepo.update(requestId, {
    status: decision, decidedAt: new Date(), decidedById: userId, comment
  });

  // Log to audit trail
  await this.auditLog.record({ type: 'APPROVAL_DECISION', requestId, decision, userId, comment, timestamp: new Date() });

  if (decision === 'Rejected') {
    await this.handleRejection(request.quoteId, comment);
  } else {
    await this.handleApproval(request);
  }
}

async handleApproval(request: ApprovalRequest): Promise<void> {
  const rule = await this.loadRule(request.ruleId);

  if (rule.routingType === 'Sequential') {
    // Advance to next step
    const nextStep = await this.getNextStep(rule, request.stepId);
    if (nextStep) {
      await this.createRequest(request.quoteId, rule, nextStep);
    } else {
      // Last step approved — check if all rules are now complete
      await this.checkAllComplete(request.quoteId);
    }
  } else {
    // Parallel: check if all parallel steps for this rule are done
    await this.checkParallelComplete(request.quoteId, request.ruleId);
  }
}

async checkAllComplete(quoteId: string): Promise<void> {
  // All active requests must be in Approved state
  const pending = await this.approvalRequestRepo.countPending(quoteId);
  if (pending === 0) {
    await this.quoteService.updateStatus(quoteId, 'Approved');
    await this.notificationService.sendApprovalComplete(quoteId);
  }
}

async handleRejection(quoteId: string, comment: string): Promise<void> {
  // Cancel all other pending requests for this quote
  await this.approvalRequestRepo.cancelAllPending(quoteId);
  // Set quote status to Rejected
  await this.quoteService.updateStatus(quoteId, 'Rejected');
  // Notify the rep
  await this.notificationService.sendRejectionNotification(quoteId, comment);
}
```

### 6. Timed Actions (Scheduled Job)

Run every hour by `ApprovalTimedActionsJob`:

```typescript
async processTimedActions(now: Date): Promise<void> {
  // 1. Send reminders
  const overdue = await this.approvalRequestRepo.findPendingOlderThan(reminderAfterHours);
  for (const request of overdue) {
    if (!request.reminderSentAt || request.reminderSentAt < now - reminderInterval) {
      await this.notificationService.sendReminder(request);
      await this.approvalRequestRepo.update(request.id, { reminderSentAt: now });
    }
  }

  // 2. Escalate expired requests
  const expired = await this.approvalRequestRepo.findPendingExpiredBefore(now);
  for (const request of expired) {
    await this.escalateStep(request.id, 'SYSTEM');
  }
}
```

### 7. Secure One-Click Approval Token

For email-based one-click approval (no login required):

```typescript
// On request creation: generate signed token
const token = jwt.sign({ requestId: request.id, type: 'APPROVAL_TOKEN' }, SECRET, { expiresIn: '72h' });
const approveUrl = `${BASE_URL}/cpq/approvals/decide?token=${token}&decision=Approved`;
const rejectUrl = `${BASE_URL}/cpq/approvals/decide?token=${token}&decision=Rejected`;

// Endpoint (no auth guard — uses token):
@Get('/cpq/approvals/decide')
async decideByToken(@Query('token') token: string, @Query('decision') decision: string) {
  const { requestId } = jwt.verify(token, SECRET);
  if (decision === 'Rejected') {
    // Show a lightweight form to collect rejection comment
    return this.renderRejectionForm(requestId, token);
  }
  await this.processDecision(requestId, 'Approved', userId, 'Approved via email');
  return this.renderApprovalConfirmation();
}
```

### 8. Audit Log Schema

Every approval action written to `approval_audit_log`:

```sql
CREATE TABLE approval_audit_log (
  id UUID PRIMARY KEY,
  quote_id UUID NOT NULL,
  request_id UUID,
  event_type TEXT NOT NULL, -- SUBMITTED, APPROVED, REJECTED, RECALLED, ESCALATED, DELEGATED, REMINDER_SENT
  actor_user_id UUID,
  actor_ip TEXT,
  comment TEXT,
  metadata JSONB, -- additional context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Definition of Success

- [ ] Single rule with 1 step: approval request created and email sent within 30 seconds of submission
- [ ] Sequential routing: Step 2 is NOT created until Step 1 is approved
- [ ] Parallel routing: both requests created simultaneously; quote not approved until both approve
- [ ] Rejection cancels all pending requests and sets quote to Rejected
- [ ] Recall cancels all pending requests and returns quote to Draft
- [ ] Dynamic approver `User's Manager` resolves to the quote owner's manager at runtime
- [ ] One-click email token approves without requiring login
- [ ] Escalation: expired request is escalated to backup approver within 1 hour of expiry
- [ ] Every decision written to the audit log with actor, timestamp, and comment

---

## Method to Complete

1. `ApprovalEngineService` — main orchestrator
2. `ApprovalConditionEvaluator` — condition resolution
3. `ApproverResolver` — dynamic approver lookup
4. `ApprovalNotificationService` — email + Slack
5. `ApprovalTokenService` — JWT-based one-click tokens
6. `ApprovalTimedActionsJob` — hourly scheduled job
7. `AuditLogService` — audit event persistence
8. Routes: `POST /cpq/quotes/:id/submit-approval`, `POST /cpq/approvals/:id/decide`, `GET /cpq/approvals/decide` (token-based)

---

## Acceptance Criteria

- AC1: Rule fires when MaxLineDiscount > 0.10 and quote has a 12% line discount
- AC2: Sequential — second request is created immediately after first approval, not before
- AC3: Parallel — two requests in "Pending" state simultaneously for the same quote
- AC4: Quote moves to "Approved" status within 5 seconds of the final approval decision
- AC5: Token-based approval link works without auth cookies/session
- AC6: Audit log has one entry per event; querying by quoteId returns full history in order
- AC7: Escalation fires within 1 hour after `expiresAt` with no decision

---

## Dependencies

- TASK-121 (Approval Workflow Config) — rules, conditions, steps in database
- TASK-126 (Quote Builder) — submission entry point
- TASK-130 (Approval Submission UI) — frontend that calls these endpoints
- TASK-136 (Pricing Engine) — approval variables use calculated quote totals

---

## Estimated Effort
**Backend:** 7 days | **Testing:** 3 days
**Total:** 10 days
