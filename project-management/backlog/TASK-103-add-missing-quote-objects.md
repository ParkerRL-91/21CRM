---
title: "Add QuoteLineGroup, QuoteSnapshot, QuoteAuditLog objects"
id: TASK-103
project: PRJ-004
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #quotes, #versioning, #audit]
---

# TASK-103: Add QuoteLineGroup, QuoteSnapshot, QuoteAuditLog objects

## User Stories

- As a Sales Rep, I want to group line items into sections (Platform, Services, Add-Ons) so that the quote is organized and easy for the customer to understand.
- As a Finance user, I want immutable snapshots of each quote version so that I can see exactly what was proposed at each iteration.
- As an auditor, I want a complete change log on every quote so that I can verify who changed what and when.

## Outcomes

Three new objects added to setup service. QuoteLineGroup provides section organization for line items. QuoteSnapshot stores full JSONB snapshots on version increment. QuoteAuditLog tracks all field changes with before/after values.

## Success Metrics

- [ ] QuoteLineGroup: name, sortOrder (NUMBER), subtotal (CURRENCY), relation → Quote
- [ ] QuoteLineItem gains groupId relation → QuoteLineGroup
- [ ] QuoteSnapshot: versionNumber (NUMBER), snapshotData (RAW_JSON), relation → Quote
- [ ] QuoteAuditLog: action (TEXT), fieldName (TEXT), oldValue (RAW_JSON), newValue (RAW_JSON), changedAt (DATE_TIME), relation → Quote
- [ ] Tests updated for new object count

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` — add 3 objects + fields + relations
