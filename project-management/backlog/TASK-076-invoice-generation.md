---
title: "Invoice record generation on contract creation"
id: TASK-076
project: PRJ-003
status: done
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #invoices, #contracts]
---

# TASK-076: Invoice record generation

## User Stories
- As a Finance user, I want an invoice record generated when a quote is contracted so billing can be initiated.

## Outcomes
Invoice record auto-created on contract creation. Contains all line items, amounts, billing dates, payment terms. Recurring items generate first-period invoice. One-time items invoiced immediately. Status: Draft for Finance review.

## Success Metrics
- [ ] `invoices` and `invoice_line_items` tables
- [ ] Invoice auto-created on contract creation
- [ ] Recurring items: invoice for first billing period
- [ ] One-time items: invoiced immediately
- [ ] Invoice status: Draft (for Finance review)
- [ ] Contains all data for external invoice generation

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add invoice tables
- `src/lib/cpq/invoice-generator.ts` — NEW
- `src/lib/cpq/invoice-generator.test.ts` — NEW
