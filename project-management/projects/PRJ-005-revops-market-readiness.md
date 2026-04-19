---
title: RevOps Market Readiness — Backend Engines
id: PRJ-005
status: active
created: 2026-04-18
updated: 2026-04-18
tags: [#project, #pipeline, #forecast, #rev-rec, #integration]
---

# PRJ-005: RevOps Market Readiness — Backend Engines

## Objective
Complete the backend pipeline analysis, forecasting, and CRM integration engines needed for production RevOps readiness.

## Success Metrics
- [ ] Pipeline movement view engine live with rep breakdown
- [ ] Quarter progression chart engine with pace projection
- [ ] Forecast snapshot capability (point-in-time + comparison)
- [ ] Daily auto-sync job running
- [ ] Multi-method forecast display (pipeline / historical / blended)
- [ ] Salesforce connector via CRM provider abstraction
- [ ] Projected rev-rec engine with 3 modes + tests
- [ ] Deal scoring engine with 6 factors + tests
- [ ] All engines have passing vitest coverage

## Tasks
| Task ID | Title | Status | Priority |
|---------|-------|--------|----------|
| TASK-106 | Pipeline movement view engine | done | P1 |
| TASK-107 | Quarter progression chart engine | done | P1 |
| TASK-108 | Projected rev-rec engine + tests | done | P1 |
| TASK-110 | Forecast snapshot engine | done | P1 |
| TASK-111 | Scheduled auto-sync job | done | P2 |
| TASK-113 | Multi-method forecast display engine | done | P1 |
| TASK-114 | Salesforce CRM connector | done | P2 |
| TASK-115 | Deal scoring engine + tests | done | P1 |

## Decisions Log
- 2026-04-18: Output path `src/lib/pipeline/` (not `twenty/` monorepo — this is Next.js app)
- 2026-04-18: Use `decimal.js` directly (no cpq-decimal-utils wrapper needed)
- 2026-04-18: BullMQ not installed; auto-sync implemented as pure scheduler abstraction
- 2026-04-18: Salesforce connector uses CRM provider interface for future HubSpot parity
