# TASK-148 — CPQ Home Dashboard
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Primary landing page for sales reps; reduces time-to-first-action from any session

---

## User Story

**As a** sales rep at PhenoTips,
**I want** a CPQ home screen that shows me my active quotes, renewal alerts, pending approvals, and recent activity at a glance when I first open the CPQ,
**so that** I don't have to navigate through multiple screens to know what needs my attention today.

**As a** Revenue Operations admin,
**I want** an admin home view that shows system-level alerts (stale price books, orphaned contracts, integration sync failures) and pipeline health,
**so that** I can monitor the CPQ system's operational health without running manual reports.

---

## Background & Context

Without a meaningful landing page, the CPQ is an empty slate every time a rep opens it. Key daily workflows — checking approval status, picking up where a quote left off, acting on a renewal alert — all require navigating from scratch. The CPQ Home Dashboard eliminates that friction by surfacing the most important information per user role automatically.

---

## Features Required

### 1. Rep Home Dashboard (`/cpq`)

The default view for all reps. Role-aware: shows only quotes the rep owns.

**Layout: 4 panels across the top, activity feed below**

#### Panel 1 — My Open Quotes

```
My Open Quotes                              [New Quote +]
─────────────────────────────────────────
QTE-2026-0049  Genome Diagnostics     Draft      $63,996  Due May 20 ←3 days
QTE-2026-0047  Toronto General Hosp  In Review   $41,200  Submitted 2 days ago
QTE-2026-0044  NHS Highland           Presented  £55,000  Sent Apr 12
QTE-2026-0038  Academic Medical Ctr   Approved   $28,000  Expires May 5
                                        [View all quotes →]
```

Each row is a click-target that opens the quote. Color-coded status pills. Expiry in < 7 days shown in orange; < 3 days in red.

#### Panel 2 — Pending Approvals

```
Pending Approvals
─────────────────────────────────────────
⏳ QTE-2026-0051 — 22% discount       Waiting on: Sarah Kim (Deal Desk)
   Submitted 1 day ago                 SLA: 2 days remaining
⏳ QTE-2026-0048 — ARR $112K          Waiting on: John Lee (Director)
   Submitted 3 days ago                SLA: ⚠ Overdue by 1 day
                                        [View all pending →]
```

Rep can see status but not act (cannot approve own quotes). Overdue SLA shown in orange. Rep can "Recall" from this panel.

#### Panel 3 — Renewals Needing Attention

```
Renewals Needing Attention
─────────────────────────────────────────
🔴 Riverside Clinic        Expires Jun 1    $24,000 ARR   Not started
🟡 Lakehead University     Expires Jun 15   $18,000 ARR   Renewal quoted
🟡 Pacific Health Group    Expires Jul 3    $36,000 ARR   Not started
                                        [View Renewal Queue →]
```

Color-coded by health: red = < 30 days / not started, yellow = 30–60 days. Click opens the contract.

#### Panel 4 — Quick Actions

```
Quick Actions
─────────────────────────────────────────
[+ New Quote]                   starts New Quote modal (TASK-126)
[⚡ Quick Quote]                 opens Quick Quote express lane (TASK-145)
[📋 Clone Recent Quote]         shows last 5 quotes for cloning
[🔄 Start Renewal]              shortcut to Renewal Queue (TASK-134)
```

#### Activity Feed (below panels)

```
Recent Activity — My Quotes
─────────────────────────────────────────────────────────────────────
Today
  ✓ QTE-2026-0047 approved by Sarah Kim (Deal Desk)     10:42 AM
  💬 Comment added to QTE-2026-0044 by Alex O.         9:15 AM

Yesterday
  📄 QTE-2026-0049 viewed by contact (Genome Diag.)    Apr 16, 4:33 PM
  🔄 QTE-2026-0046 converted to contract (CTR-089)     Apr 16, 2:10 PM
  ⚠ QTE-2026-0050 approval rejected — see comments    Apr 15, 11:00 AM
```

Shows events for quotes this rep owns. Clicking an event navigates to the relevant quote/contract.

---

### 2. Deal Desk / Manager Home Dashboard

Same layout as rep, but panels show ALL open quotes in the pipeline (not just the user's own) plus an approvals inbox.

#### Panel — Approvals Inbox

```
Approvals Inbox                                         [Approve All ↗]
─────────────────────────────────────────────────────────────────────
QTE-2026-0051  Marcus Torres  22% discount  $55,000 ARR  Waiting 1d   [Approve] [Reject]
QTE-2026-0048  Rachel Yuen    ARR > $100K   $112,000 ARR Waiting 3d   [Approve] [Reject]
```

Inline approve/reject with required comment on rejection. "Approve All" — batch approve all pending items (confirmation required). Matches the approver inbox from TASK-130 but surfaced on the home screen.

---

### 3. Admin Home Dashboard (`/cpq` when user has CPQ_ADMIN role)

Admins see a different layout: system health + pipeline summary.

#### System Health Panel

```
CPQ System Health
─────────────────────────────────────────────────────────────────────
✓ Pricing Engine              All price books current
✓ Approval Workflow           3 rules active; 0 overdue
⚠ Price Book — Healthcare     12 products missing GBP entries
⚠ Billing Sync                2 contracts failed sync (last 24h)
✗ E-Signature                 DocuSign: API key expired
✗ Exchange Rates              GBP rate last updated 47 days ago
                                        [Go to Health Check →]
```

Icons: ✓ = OK (green), ⚠ = warning (yellow), ✗ = error (red). Each row links to the relevant settings screen.

#### Pipeline Summary Panel

```
Pipeline (Last 30 Days)
─────────────────────────────────────────
New quotes:          23        $1.4M potential ARR
In approval:          7        $480K ARR
Presented:           11        $720K ARR
Won (Accepted):       8        $540K ARR
Expired:              4        $180K ARR
─────────────────────
Win rate:            35%
Avg deal ARR:       $67.5K
```

#### Recent System Events

```
System Events
─────────────────────────────────────────
Apr 18  StripeAdapter: Contract CTR-092 sync failed — Invalid API key
Apr 17  Approval SLA breach: QTE-2026-0048 — auto-escalated to Director
Apr 16  Exchange Rate alert: GBP rate unchanged for 30+ days
Apr 15  Price book imported: Healthcare — 42 products
```

---

### 4. Personalization & State Persistence

- The dashboard remembers the user's last panel expanded/collapsed state (localStorage)
- "My Open Quotes" panel auto-refreshes every 60 seconds (polling or SSE)
- Admin can dismiss system health warnings (dismissed warnings are hidden for 7 days, then re-appear if still unresolved)
- Rep can pin a specific quote to the top of the "My Open Quotes" panel (pin persists until quote closes)

---

### 5. Empty States

When the rep has no open quotes:

```
No open quotes yet.
Start your first quote in under 90 seconds — use Quick Quote for standard deals.
[⚡ Quick Quote] or [+ New Quote]
```

When there are no renewals needing attention:

```
✓ No renewals due in the next 90 days.
```

---

## Definition of Success

- [ ] A rep opening `/cpq` sees their open quotes, pending approvals, and renewal alerts without additional navigation
- [ ] Expiring quotes (< 7 days) are highlighted in orange/red
- [ ] SLA-overdue approvals are flagged in the pending approvals panel
- [ ] Admin home shows system health status and links to the relevant settings page for each issue
- [ ] Activity feed shows events for the rep's own quotes only
- [ ] Dashboard loads in < 1 second (uses pre-computed counts, not raw queries at render)
- [ ] Deal Desk user sees the approvals inbox with inline approve/reject controls

---

## Method to Complete

### Backend
1. `CpqDashboardService` — aggregates panel data per role:
   - `getRepDashboard(userId)` — open quotes, pending approvals, renewals, activity feed
   - `getAdminDashboard()` — system health, pipeline summary, recent system events
2. `CpqSystemHealthService` — evaluates each health check item (price books, billing sync, e-sig, exchange rates)
3. Dashboard API routes:
   - `GET /cpq/dashboard/rep` — rep panel data
   - `GET /cpq/dashboard/admin` — admin panel data
4. SSE endpoint or polling: `GET /cpq/dashboard/activity?since=timestamp` — activity feed updates

### Frontend
1. `CpqHomePage.tsx` — role-aware router: rep vs. deal desk vs. admin layout
2. `OpenQuotesPanel.tsx` — my open quotes with expiry highlighting
3. `PendingApprovalsPanel.tsx` — rep view (status only) + approver view (inline approve/reject)
4. `RenewalsAlertPanel.tsx` — renewals needing attention with health colors
5. `QuickActionsPanel.tsx` — 4 quick action buttons
6. `ActivityFeed.tsx` — grouped by date, with event icons and navigation
7. `AdminHealthPanel.tsx` — system health checklist with status icons
8. `PipelineSummaryPanel.tsx` — pipeline stats for admin/manager view
9. Auto-refresh: 60-second polling on `OpenQuotesPanel` and `PendingApprovalsPanel`
10. `useCpqDashboard` hook — data fetching + role detection

---

## Acceptance Criteria

- AC1: Rep dashboard shows only their own open quotes; admin dashboard shows all quotes
- AC2: Quote expiring in 3 days shows orange highlight
- AC3: Admin health panel shows ✗ for DocuSign when the API key is missing/expired
- AC4: SLA-overdue approval is flagged and shows "Overdue by N days"
- AC5: Clicking any row in "My Open Quotes" navigates to the correct quote detail
- AC6: Activity feed shows approval events for the rep's own quotes
- AC7: Dashboard panel data loads in < 1 second
- AC8: Deal Desk user can approve a quote directly from the approvals inbox panel

---

## Dependencies

- TASK-126 (Quote Builder) — open quote data source
- TASK-130 (Approval Submission) — approval inbox data
- TASK-134 (Renewal Queue) — renewal alert data
- TASK-143 (Analytics) — pipeline summary data
- TASK-144 (Setup Wizard) — system health feeds into admin dashboard
- TASK-145 (Quick Quote) — Quick Quote button wired here
- TASK-116 (Global Settings) — role/permission matrix (CPQ_ADMIN, CPQ_DEAL_DESK, CPQ_REP)

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 3 days | **Testing:** 0.5 day
**Total:** 5.5 days
