---
title: "Competitive Parity & Projected Rev-Rec"
id: PRJ-001
status: active
created: 2026-03-22
updated: 2026-03-22
tags: [#project, #rev-rec, #pipeline, #forecast, #ux]
---

# PRJ-001: Competitive Parity & Projected Rev-Rec

## Objective

Close the top feature gaps identified from Clari, HubiFi, and Kluster competitive analysis. Build the projected rev-rec feature that no competitor offers. Fix existing bugs that block core functionality.

## Success Metrics

- [ ] Rev-rec page fully functional with generate button, closed + projected toggle
- [ ] Pipeline page has risk flags, movement view, and bubble chart
- [ ] Dashboard has quarter progression, newsfeed, and revenue bridge
- [ ] Forecast page has snapshots, multi-method display, and interactive sliders
- [ ] All monetary values normalized to CAD
- [ ] Rep names shown everywhere instead of IDs
- [ ] ARR computed from line items, not company annual revenue
- [ ] Industry dropdown shows display names

## Tasks

### P0 — Blockers & Unique Differentiators
| Task ID | Title | Status | Priority | Source |
|---------|-------|--------|----------|--------|
| TASK-020 | Fix rev-rec generate button (lost in migration) | ready | P0 | Bug |
| TASK-001 | Projected rev-rec (closed + weighted pipeline toggle) | ready | P0 | G-01 |
| TASK-008 | Pipeline-to-revenue bridge view | ready | P0 | G-02 |

### P1 — Must-Have Features & Bug Fixes
| Task ID | Title | Status | Priority | Source |
|---------|-------|--------|----------|--------|
| TASK-021 | Team page: show rep names instead of IDs | ready | P1 | Bug |
| TASK-022 | Fix industry dropdown display names | ready | P1 | Bug |
| TASK-023 | Fix subscriptions ARR from line items | ready | P1 | Bug |
| TASK-024 | Currency conversion to CAD | ready | P1 | Business req |
| TASK-002 | Deferred revenue waterfall view | ready | P1 | G-07 (HubiFi) |
| TASK-003 | Clickable stat cards with drill-down | ready | P1 | G-03 (Clari) |
| TASK-004 | Deal risk flags (stale, slipped) | ready | P1 | G-04 (Clari) |
| TASK-005 | Pipeline movement view | ready | P1 | G-05 (Clari) |
| TASK-006 | Quarter progression chart | ready | P1 | G-06 (Clari+Kluster) |
| TASK-007 | Change newsfeed on dashboard | ready | P1 | G-08 (Kluster) |
| TASK-014 | ARR movement dashboard | ready | P1 | G-14 (HubiFi) |

### P2 — Differentiating Quality
| Task ID | Title | Status | Priority | Source |
|---------|-------|--------|----------|--------|
| TASK-009 | Forecast snapshots | ready | P2 | G-09 (Kluster+HubiFi) |
| TASK-010 | Multi-method forecast display | ready | P2 | G-10 (Kluster) |
| TASK-011 | Interactive forecast sliders | ready | P2 | G-11 (Kluster) |
| TASK-012 | Scheduled auto-sync | ready | P2 | G-12 (Clari) |
| TASK-013 | Deal prioritization bubble chart | ready | P2 | G-13 (Clari) |

### P3 — Future Polish
| Task ID | Title | Status | Priority | Source |
|---------|-------|--------|----------|--------|
| TASK-015 | Meeting-centric view presets | ready | P3 | G-15 (Kluster) |
| TASK-016 | Board-ready report templates | ready | P3 | G-16 (Kluster) |
| TASK-017 | Inline deal cards | ready | P3 | G-17 (Kluster+Clari) |
| TASK-018 | Revenue leakage detection | ready | P3 | G-18 (HubiFi) |
| TASK-019 | Rev-rec pivot table | ready | P3 | G-19 (HubiFi) |

## Recommended Execution Order

**Phase 1 — Fix what's broken:**
1. TASK-020: Fix rev-rec generate button
2. TASK-021: Fix team page rep names
3. TASK-022: Fix industry display names
4. TASK-023: Fix subscriptions ARR source
5. TASK-024: Currency conversion to CAD

**Phase 2 — Unique differentiators:**
6. TASK-001: Projected rev-rec toggle
7. TASK-008: Pipeline-to-revenue bridge

**Phase 3 — Core competitive features (parallelizable):**
8. TASK-002: Deferred revenue waterfall
9. TASK-003: Clickable drill-down
10. TASK-004: Deal risk flags
11. TASK-005: Pipeline movement
12. TASK-006: Quarter progression chart
13. TASK-007: Change newsfeed
14. TASK-014: ARR movement dashboard

**Phase 4 — Forecast enhancements:**
15. TASK-009: Forecast snapshots
16. TASK-010: Multi-method forecast
17. TASK-011: Interactive sliders

**Phase 5 — Infrastructure + visualization:**
18. TASK-012: Scheduled auto-sync
19. TASK-013: Deal bubble chart

**Phase 6 — Polish:**
20. TASK-015-019: Meeting presets, board templates, deal cards, leakage, pivot table

## Decisions Log

- 2026-03-22: All monetary values normalized to CAD using deal-level exchange rate field
- 2026-03-22: ARR comes from line items (billing period × amount), NOT company `annualrevenue`
- 2026-03-22: Projected rev-rec weights pipeline deals by `hs_deal_stage_probability`
- 2026-03-22: Feature gap list built from Clari + HubiFi + Kluster analysis (19 gaps, G-01 through G-19)
- 2026-03-22: Bug fixes (TASK-020 through TASK-024) prioritized before new features
