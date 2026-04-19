# TASK-130 — User: Approval Submission & Tracking Flow
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Critical for governance and deal velocity

---

## User Story

**As a** sales rep at PhenoTips,
**I want** to submit my quote for approval with one click, track the approval progress in real-time, receive notifications when decisions are made, and understand exactly why a quote was rejected and what I need to change,
**so that** I can close deals quickly without being blocked by an opaque approval process.

---

## Background & Context

Approval workflows are often a rep's biggest frustration in CPQ systems. The system knows the rules; the rep shouldn't have to chase down approvers manually. Key design principles:
- **Transparency**: Rep always knows where the quote is in the approval chain
- **Speed**: One-click submission; one-click approval for approvers
- **Feedback**: Clear rejection reasons tied to specific lines/fields
- **No surprises**: Pre-submission warning shows the rep what approvals will be needed

---

## Features Required

### 1. Pre-Submission Review

Before clicking "Submit for Approval", the rep sees an "Approval Preview" panel that shows:

**What triggers approval:**
```
This quote will require the following approvals:

Step 1 — Sales Manager Review (Sarah Chen)
  Reason: PT Core discount is 22% — exceeds your 15% authorization

Step 2 — Deal Desk Review (queue: deal-desk@phenotips.com)
  Reason: ARR of $111,997 exceeds the $100K deal desk threshold

Timeline: Sequential — Step 2 begins after Step 1 approves
Estimated review time: ~24 hours
```

**If no approvals needed:**
```
✓ This quote is within your authorization.
No approvals required. You can send this quote directly.
```

CTA: `[Submit for Approval]` or `[Cancel]`

### 2. Submit for Approval

**One-click submission:**
- Rep clicks "Submit for Approval" on the Quote detail page
- System evaluates all approval rules (TASK-121)
- Creates `ApprovalRequest` records for each triggered step
- Sends email + Slack notifications to approvers
- Updates Quote status to `In Review`
- Updates approval status to `Pending`

**Post-submit state:**
- "Submit for Approval" button is replaced with "Recall Submission" button
- Quote fields become read-only (rep cannot edit while under review)
- Approval progress tracker appears on the quote page

**Recall:**
- Rep can recall the submission at any time (before any approver has acted)
- Returns quote to `Draft`, cancels all pending approval requests
- Rep is shown: "Recalled. Make your changes and resubmit when ready."

### 3. Approval Progress Tracker (Rep View)

Visual progress tracker on the quote record:

```
Approval Progress

 [Step 1: Sales Manager]  →  [Step 2: Deal Desk]
        ●                           ○
    In Progress                  Waiting
    Sarah Chen                  deal-desk@

 Sent to Sarah Chen 2 hours ago
 [Remind Sarah →]  [Escalate →]
```

**Step states:**
- `Waiting` (gray circle) — not yet activated
- `In Progress` (blue pulsing) — request sent; awaiting decision
- `Approved` (green checkmark) — step cleared
- `Rejected` (red X) — step rejected quote
- `Escalated` (orange) — original approver did not respond; escalated to backup
- `Recalled` (gray strikethrough) — quote was recalled

**Timeline view (below the tracker):**
```
Today, 9:15 AM — Quote submitted by [Rep]
Today, 9:16 AM — Approval request sent to Sarah Chen (Step 1)
Today, 9:45 AM — Reminder sent to Sarah Chen
Today, 11:30 AM — Sarah Chen approved — "Approved; good customer"
Today, 11:31 AM — Approval request sent to Deal Desk (Step 2)
[Waiting for Deal Desk...]
```

**"Remind" action:** sends a manual reminder to the current approver (rate-limited: once per hour)

**"Escalate" action (admin/manager permission only):** bypasses the current approver and advances the step

### 4. Approver Inbox

The approval inbox is accessible from the top navigation (bell icon + "Approvals" link):

**List view:**
```
Quote #      Account        Rep          Deal Value    Max Disc    Days Pending
QTE-2026-42  Genomics Ltd   Mike Torres  $111,997/yr   22%         0 days
QTE-2026-38  Mayo Clinic    Lisa Park    $78,000/yr    8%          1 day
```

**Clicking a row opens the Quote Detail (read-only approver view):**
- Quote summary card (all metrics)
- Full line item table (read-only)
- Price waterfall per line
- Historical approval decisions (from prior steps)
- Approver action panel:

```
[Step 1 — Sales Manager Review]

Deal Summary:
  ARR: $111,997/yr | Max Discount: 22% | MRR: $9,333

Your Action:
  [✓ Approve]  [✗ Reject]  [→ Delegate]

Comments (required on rejection):
  ┌──────────────────────────────────────────┐
  │                                          │
  └──────────────────────────────────────────┘
```

**One-click email approval:**
Approvers who prefer email receive a message with:
- Quote summary in HTML
- [Approve] button (secure token URL, no login required)
- [Reject] button → opens a simple form for rejection reason
- [View Full Quote] link

### 5. Rejection Flow

When an approver rejects:

1. Rep receives:
   - Email notification: "Your quote QTE-2026-42 was rejected"
   - In-app notification (bell icon)

2. Quote status → `Rejected`

3. On the quote record, a rejection banner appears:
   ```
   ✗ Rejected by Sarah Chen — Step 1: Sales Manager Review
   "The PPQ discount at 22% is too aggressive for this stage. Please reduce to under 18%."
   
   [Edit Quote & Resubmit]
   ```

4. Rep clicks "Edit Quote & Resubmit":
   - Quote returns to `Draft`
   - Rep can now edit lines/discounts
   - The rejection reason is preserved in the timeline
   - Previous approval history is preserved (shows the rejected step)

5. Rep resubmits → starts a new approval cycle
   - If the triggering condition is no longer met (e.g., discount is now < threshold), that step is skipped

### 6. Auto-Approval

If no approval rules are triggered (deal within all thresholds), the quote auto-approves on save:
- Status → `Approved`
- No approval requests created
- Rep sees green "Auto-approved" banner

### 7. Delegation

When an approver cannot decide (OOO, conflict of interest):
- "Delegate" button → opens user picker (only users in the same role/group)
- Original approver record preserved; new approver record created
- Delegated user receives the approval request
- Timeline shows: "Delegated from Sarah Chen to John Kim by Sarah Chen"

### 8. SLA Enforcement (Rep & Approver Visibility)

**Rep view (after SLA breach):**
The approval progress tracker shows an orange SLA indicator:
```
[Step 1: Sales Manager]
  ⚠ SLA breached — submitted 26 hours ago (SLA: 24 hours)
  [Request Escalation →]  (sends escalation request to approver's manager)
```

The rep can click "Request Escalation" to notify the approver's manager. This does not bypass the approver — it sends an urgent notification. If the SLA + auto-escalation timer fires, the system automatically reassigns to the escalation user.

**Approver view:**
- Pending approvals past their SLA show a red `⚠ Overdue` badge in the approver inbox
- Approvers receive a second notification when the SLA is breached

**Slack integration:**
When Slack is configured (TASK-125):
- Initial approval notification sent as a Slack message with interactive buttons: `[✓ Approve]` `[✗ Reject]` `[→ View]`
- The Slack buttons call the same token-based approve/reject endpoints as email
- SLA breach sends an additional Slack message to the approver and approver's manager
- The quote channel (if configured) receives approval lifecycle events: submitted, approved, rejected, escalated

---

## UX Requirements

- Progress tracker is prominent on the Quote record (not buried in a tab)
- Approver inbox is accessible with ≤ 2 clicks from anywhere in the app
- Mobile-responsive: approve/reject actions must work on a phone (approvers often review on mobile)
- Rejection reason is required — "Reject" button is disabled until a comment is entered
- "Remind" action sends notification immediately; UI shows "Reminder sent" for 3s
- Notification badge on bell icon shows count of pending approvals for current user

---

## Definition of Success

- [ ] Rep sees the correct approval steps in the pre-submission preview
- [ ] Submitting routes approval request to the correct approver
- [ ] Progress tracker reflects real-time status (refreshes without page reload)
- [ ] Approver receives email with one-click approve/reject that works without login
- [ ] Rejection returns quote to Draft with the rejection reason visible
- [ ] Rep can edit and resubmit; if discount is now within threshold, that step is skipped
- [ ] Auto-approval fires when no conditions are triggered
- [ ] Delegation correctly transfers the request to the delegated user

---

## Method to Complete

### Backend
(Most implemented in TASK-121; this task focuses on the user-facing workflow)
1. `ApprovalService.previewApproval(quoteId)` — returns expected steps without creating them
2. `ApprovalService.submitForApproval(quoteId)` — creates requests + sends notifications
3. `ApprovalService.recallSubmission(quoteId)` — cancels pending requests; resets to Draft
4. `ApprovalService.sendReminder(requestId)` — re-sends notification (rate-limited)
5. `GET /cpq/quotes/:id/approval-preview` — pre-submission check
6. `GET /cpq/approvals/inbox` — approver's pending requests
7. Notification service: email (HTML template) + Slack message on every state change

### Frontend
1. `ApprovalPreviewPanel.tsx` — pre-submission preview slide-over
2. `ApprovalProgressTracker.tsx` — visual step tracker on quote page
3. `ApprovalTimeline.tsx` — detailed history timeline
4. `ApprovalInboxPage.tsx` — `/approvals` page
5. `ApprovalActionPanel.tsx` — approve/reject/delegate panel (on quote page and inbox)
6. `RejectionBanner.tsx` — rejection reason + resubmit CTA
7. `useApprovalProgress` hook — real-time polling or WebSocket updates

---

## Acceptance Criteria

- AC1: Pre-submission preview lists all approval steps that will fire and the reason each triggers
- AC2: Submission changes quote status to `In Review` and sends notifications within 30 seconds
- AC3: Approver one-click email link approves without requiring login
- AC4: Progress tracker updates within 5 seconds of an approver's decision (polling or WebSocket)
- AC5: Rejection reason is required — Reject button is disabled until comment is entered (minimum 10 chars)
- AC6: After rejection and resubmit with corrected discount, the previously-rejected step is re-evaluated and skipped if no longer triggered
- AC7: Recall cancels all pending requests and returns quote to Draft

---

## Dependencies

- TASK-121 (Approval Workflow Config) — rules, conditions, steps
- TASK-126 (Quote Builder) — quote status management
- TASK-128 (Pricing Controls) — floor price / max discount warnings link to approval preview

---

## Estimated Effort
**Backend:** 2 days (building on TASK-121) | **Frontend:** 4 days | **Testing:** 1 day
**Total:** 7 days
