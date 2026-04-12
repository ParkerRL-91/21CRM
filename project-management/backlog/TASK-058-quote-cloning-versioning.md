---
title: "Quote cloning & versioning"
id: TASK-058
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #quotes, #versioning]
---

# TASK-058: Quote cloning & versioning

## User Stories
- As a Sales Rep, I want to clone a quote to create a new version so I can iterate on proposals without losing the original.

## Outcomes
Clone API creates a new quote with all line items copied, incremented version number, draft status. Snapshot of previous version stored as JSONB in quote_snapshots.

## Success Metrics
- [ ] `POST /api/quotes/[id]/clone` — creates cloned quote
- [ ] Clone copies all line items, groups, pricing
- [ ] Version number incremented
- [ ] Original unchanged and accessible
- [ ] Snapshot stored on material changes (line add/remove, price change)
- [ ] Version comparison API (diff v1 vs v2)

## Files to Change
- `src/app/api/quotes/[id]/clone/route.ts` — NEW
- `src/lib/cpq/quote-versioning.ts` — NEW
- `src/lib/cpq/quote-versioning.test.ts` — NEW
