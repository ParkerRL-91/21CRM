# Active Work

## Current Sprint — Phase 1 (Fix What's Broken)
| Task | Project | Status | Priority | Description |
|------|---------|--------|----------|-------------|
| TASK-020 | PRJ-001 | ready | P0 | Fix rev-rec generate button |
| TASK-021 | PRJ-001 | ready | P1 | Team page rep names |
| TASK-022 | PRJ-001 | ready | P1 | Industry dropdown display names |
| TASK-023 | PRJ-001 | ready | P1 | Subscriptions ARR from line items |
| TASK-024 | PRJ-001 | ready | P1 | Currency conversion to CAD |
| TASK-027 | PRJ-001 | done | P2 | Add skill-creator-harness skill |

## Blockers
_None_

## Recently Completed
- Codebase foundation: sync engine, rev-rec, forecast, pipeline, team pages (pre-PRJ-001)
- CLAUDE.md + knowledge base + project management framework (2026-03-22)
- Competitive analysis: Clari, HubiFi, Kluster (2026-03-22)
- PRJ-001 project plan: 24 tasks across 6 phases (2026-03-22)

## Up Next (After Phase 1)
**Phase 2 — Unique Differentiators:**
1. TASK-001: Projected rev-rec (closed + weighted pipeline toggle)
2. TASK-008: Pipeline-to-revenue bridge

**Phase 3 — Core Competitive Features:**
3. TASK-002 + TASK-003 + TASK-004 + TASK-005 + TASK-006 + TASK-007 + TASK-014

**Phase 4-6 — Forecast, Infrastructure, Polish:**
4. TASK-009 through TASK-019

## PRJ-002: Contract Management, CPQ & Renewal (Epic 8)
**Status:** Foundation complete — schema + engines implemented, UI/API routes pending

| Task | Phase | Status | Priority | Description |
|------|-------|--------|----------|-------------|
| TASK-027 | 1-Foundation | done | P0 | Contract management schema |
| TASK-028 | 1-Foundation | done | P0 | Contract CRUD API routes |
| TASK-029 | 1-Foundation | done | P0 | Contract subscription management |
| TASK-048 | 1-Foundation | done | P1 | Contract CRUD test coverage |
| TASK-037 | 3-Automation | done | P0 | Renewal pricing engine |
| TASK-042 | 4-Analytics | done | P1 | At-risk renewal identification engine |
| TASK-030 | 2-UI | ready | P0 | Account contracts related list (US-8.1) |
| TASK-031 | 2-UI | ready | P0 | Contract detail page |
| TASK-032 | 2-UI | ready | P1 | Contract amendment tracking UI |
| TASK-033 | 3-Automation | ready | P0 | Renewal configuration system |
| TASK-034 | 3-Automation | ready | P0 | Daily renewal check background job |
| TASK-035 | 3-Automation | ready | P0 | Renewal opportunity auto-creation |
| TASK-036 | 3-Automation | ready | P0 | Renewal quote auto-generation |
| TASK-037 | 3-Automation | ready | P0 | Renewal pricing engine |
| TASK-038 | 3-Automation | ready | P1 | CS notification on renewal creation |
| TASK-039 | 4-Analytics | ready | P1 | Renewal pipeline filtering (US-8.3) |
| TASK-040 | 4-Analytics | ready | P1 | Renewal pipeline report page |
| TASK-041 | 4-Analytics | ready | P1 | Renewal kanban board |
| TASK-042 | 4-Analytics | ready | P1 | At-risk renewal identification engine |
| TASK-043 | 5-Integration | ready | P2 | HubSpot contract sync |
| TASK-044 | 5-Integration | ready | P2 | Renewal-to-rev-rec integration |
| TASK-045 | 5-Integration | ready | P2 | Contract expiration dashboard widget |
| TASK-046 | 5-Integration | ready | P2 | Renewal analytics CSV export |
| TASK-047 | 2-UI | ready | P1 | Global contracts list page |
| TASK-048 | 1-Foundation | ready | P1 | Contract CRUD test coverage |

## PRJ-003: Full CPQ — Quote-to-Cash Platform (Epics 1-7, 9-10)
**Status:** Planning complete — ready for execution

### Epic 1: Product & Price Book Management
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-049 | ready | P0 | Product catalog schema & API |
| TASK-050 | ready | P0 | Price book schema & API |
| TASK-051 | ready | P0 | Discount schedule schema & API |
| TASK-052 | ready | P1 | Product catalog management UI |
| TASK-053 | ready | P1 | Price book management UI |
| TASK-054 | ready | P2 | Product bundle support |

### Epic 2: Quote Creation & Configuration
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-055 | ready | P0 | Quote & line item schema |
| TASK-056 | ready | P0 | Quote CRUD API |
| TASK-057 | ready | P0 | Quote builder UI |
| TASK-058 | ready | P1 | Quote cloning & versioning |
| TASK-059 | ready | P1 | Quote expiration job |

### Epic 3: Pricing Engine
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-060 | ready | P0 | Price waterfall engine (10-step) |
| TASK-061 | ready | P0 | Tiered & volume discount calculation |
| TASK-062 | ready | P0 | Term-based discount & proration |
| TASK-063 | ready | P1 | Pricing audit trail |

### Epic 4: Quote Approval Workflows
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-064 | ready | P0 | Approval rules schema & engine |
| TASK-065 | ready | P0 | Approval submission & routing API |
| TASK-066 | ready | P1 | Approval UI |
| TASK-067 | ready | P2 | Smart approvals |

### Epic 5: PDF Quote Generation
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-068 | ready | P0 | PDF generation engine |
| TASK-069 | ready | P1 | Quote template configuration |
| TASK-070 | ready | P1 | PDF storage & version history |

### Epic 6: Quote Delivery & Acceptance
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-071 | ready | P0 | Quote status machine |
| TASK-072 | ready | P1 | Quote delivery UI |
| TASK-073 | ready | P1 | Rejection tracking |

### Epic 7: Quote-to-Contract Conversion
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-074 | ready | P0 | Contract creation from accepted quote |
| TASK-075 | ready | P0 | Amendment quote flow |
| TASK-076 | ready | P2 | Invoice record generation |

### Epic 9: Subscription Tracking
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-077 | ready | P0 | Subscription lifecycle state machine |
| TASK-078 | ready | P0 | Account subscriptions view |
| TASK-079 | ready | P1 | Subscription state change audit log |
| TASK-080 | ready | P1 | Global subscription dashboard |

### Epic 10: CPQ Reporting & Analytics
| Task | Status | Priority | Description |
|------|--------|----------|-------------|
| TASK-081 | ready | P1 | Quote activity dashboard |
| TASK-082 | ready | P1 | Discount analysis report |
| TASK-083 | ready | P1 | Renewal forecast report |
| TASK-084 | ready | P1 | ARR waterfall report |

## Full Task Count
- **PRJ-001**: 26 tasks (P0:3, P1:11, P2:5, P3:5, Bugs:2)
- **PRJ-002**: 22 tasks (P0:9, P1:8, P2:4, P3:1) — Epic 8
- **PRJ-003**: 36 tasks (P0:16, P1:16, P2:4) — Epics 1-7, 9-10
- **Grand Total**: 84 tasks
