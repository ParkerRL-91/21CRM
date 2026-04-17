---
title: "VP RevOps Market Readiness — Gap Analysis Execution"
id: PRJ-005
status: active
created: 2026-04-17
updated: 2026-04-17
tags: [#project, #pipeline, #rev-rec, #forecast, #ux, #subscriptions, #integration]
---

# PRJ-005: VP RevOps Market Readiness — Gap Analysis Execution

## Objective

Close the 10 critical gaps a VP of Revenue Operations would flag when evaluating 21CRM, transforming it from a functional foundation into a daily-use RevOps platform that replaces Clari ($400+/user/mo) + HubiFi ($1,900/mo) + Salesforce CPQ ($75-150/user/mo) for 50-500 person B2B SaaS companies.

## Background

A gap analysis evaluated 21CRM from the perspective of a VP RevOps at a mid-market B2B SaaS company. Ten categories of missing functionality were identified across interactivity, risk management, revenue waterfall, forecast accountability, quote-to-revenue lifecycle, subscription health, automation, multi-CRM support, AI analytics, and mobile responsiveness. This project addresses all ten in a phased 16-week execution plan.

## Success Metrics

- [ ] All dashboard stat cards are clickable with drill-down to underlying deals
- [ ] Deal risk flags (stale, slipped, no close date) visible on pipeline page with risk summary
- [ ] Pipeline change newsfeed shows "what changed this week" on dashboard
- [ ] NRR calculated from line items with subscription health dashboard
- [ ] Deferred revenue waterfall view (Opening → Bookings → Recognition → Adjustments → Closing)
- [ ] Pipeline movement view showing weekly adds, losses, and stage changes
- [ ] Quarter progression chart (running closed-won vs quota)
- [ ] Projected rev-rec toggle shows closed + weighted pipeline recognition
- [ ] Quote-to-revenue bridge visualization (Quote → Signed → Closed-Won → Recognized → Deferred)
- [ ] Forecast snapshot capability with point-in-time comparison
- [ ] Scheduled auto-sync running on configurable background schedule
- [ ] All dashboard pages responsive on mobile/tablet
- [ ] Multi-method forecast display with accuracy tracking
- [ ] Salesforce connector prototype (sync engine abstraction layer)
- [ ] AI deal scoring prototype based on historical patterns

## Tasks

### Phase 1 — Weeks 1-2: Fix & Interact (P0)
| Task ID | Title | Status | Priority | Gap |
|---------|-------|--------|----------|-----|
| TASK-101 | Clickable drill-down on stat cards (pipeline + team pages) | backlog | P0 | #1 Interactivity |
| TASK-102 | Deal risk flags engine + pipeline risk badges | backlog | P0 | #2 Deal Risk |
| TASK-103 | Pipeline change newsfeed ("what changed this week") | backlog | P0 | #2 Deal Risk |
| TASK-104 | NRR calculation engine + subscription health dashboard | backlog | P0 | #6 Subscription Health |

### Phase 2 — Weeks 3-4: Risk & Revenue (P1)
| Task ID | Title | Status | Priority | Gap |
|---------|-------|--------|----------|-----|
| TASK-105 | Deferred revenue waterfall view | backlog | P1 | #3 Revenue Waterfall |
| TASK-106 | Pipeline movement view (weekly adds/losses/stage changes) | backlog | P1 | #2 Deal Risk |
| TASK-107 | Quarter progression chart (running closed-won vs quota) | backlog | P1 | #4 Forecast Accountability |

### Phase 3 — Weeks 5-6: Differentiators (P1)
| Task ID | Title | Status | Priority | Gap |
|---------|-------|--------|----------|-----|
| TASK-108 | Projected rev-rec toggle (closed + weighted pipeline) | backlog | P1 | #5 Quote-to-Revenue |
| TASK-109 | Quote-to-revenue bridge visualization | backlog | P1 | #5 Quote-to-Revenue |
| TASK-110 | Forecast snapshot capability | backlog | P1 | #4 Forecast Accountability |

### Phase 4 — Weeks 7-8: Automation & Polish (P1-P2)
| Task ID | Title | Status | Priority | Gap |
|---------|-------|--------|----------|-----|
| TASK-111 | Scheduled auto-sync (background job) | backlog | P1 | #7 Automation |
| TASK-112 | Mobile responsive pass on all dashboard pages | backlog | P2 | #10 Mobile |
| TASK-113 | Multi-method forecast display | backlog | P2 | #4 Forecast Accountability |

### Phase 5 — Weeks 9+: Scale (P2)
| Task ID | Title | Status | Priority | Gap |
|---------|-------|--------|----------|-----|
| TASK-114 | Salesforce connector (sync engine abstraction) | backlog | P2 | #8 Multi-CRM |
| TASK-115 | AI deal scoring prototype | backlog | P2 | #9 AI Analytics |

## Dependencies

- TASK-101 (drill-down) enhances TASK-104, TASK-105, TASK-106 — implement first for consistent UX
- TASK-102 (risk engine) feeds data to TASK-103 (newsfeed) and TASK-106 (movement view)
- TASK-108 (projected rev-rec) depends on existing rev-rec engine working correctly
- TASK-109 (quote-to-revenue bridge) depends on CPQ pricing engine (already production-grade)
- TASK-110 (forecast snapshots) uses existing `forecast_scenario_snapshots` table
- TASK-114 (Salesforce) requires sync engine refactor to provider interface pattern
- TASK-115 (AI scoring) requires TASK-102 risk flags as training signal

## Relationship to Existing Projects

- **PRJ-001** (Competitive Parity): Some tasks overlap — TASK-101 extends TASK-003, TASK-102 extends TASK-004, TASK-106 extends TASK-005. PRJ-005 tasks are scoped to the VP RevOps lens with broader persona coverage and more comprehensive requirements.
- **PRJ-002** (Contract Management): TASK-109 (bridge view) connects to contract lifecycle data from PRJ-002.
- **PRJ-003** (Full CPQ): TASK-108 and TASK-109 leverage the pricing engine built in PRJ-003.
- **PRJ-004** (CPQ Twenty Integration): TASK-111 (auto-sync) may reuse BullMQ infrastructure from PRJ-004.

## Decisions Log

- 2026-04-17: Project created based on VP RevOps gap analysis. 15 tasks across 5 phases, 16-week timeline.
- 2026-04-17: TASK IDs 101-115 allocated to avoid conflicts with PRJ-001 through PRJ-004 (TASK-001 through TASK-100).
- 2026-04-17: Persona-driven user stories using Alex (Sales Rep), Morgan (Sales Manager), Dana (VP RevOps), Casey (Finance/Controller), Jordan (CRM Admin).
- 2026-04-17: Salesforce connector (TASK-114) and AI scoring (TASK-115) scoped as prototypes — full implementations would be separate projects.
