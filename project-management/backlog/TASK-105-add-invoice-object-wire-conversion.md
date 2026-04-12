---
title: "Add Invoice object and wire quote-to-contract conversion"
id: TASK-105
project: PRJ-004
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #invoices, #contracts, #conversion]
---

# TASK-105: Add Invoice object and wire quote-to-contract conversion

## User Stories

- As a Finance user, I want an invoice record auto-generated when a quote is contracted so that billing can be initiated without manual data entry.
- As a Sales Rep, I want the quote-to-contract conversion to work end-to-end so that accepting a quote actually creates the contract and subscriptions.

## Outcomes

Invoice and InvoiceLineItem objects added to setup. CpqContractService.createFromQuote() wired to workspace datasource to actually query the quote, create contract + subscriptions + invoice in a transaction, and update quote status to contracted.

## Success Metrics

- [ ] Invoice object: invoiceNumber, status (SELECT: draft/sent/paid/overdue/cancelled), issueDate, dueDate, subtotal (CURRENCY), total (CURRENCY), paymentTerms, relation → Contract + Quote + Company
- [ ] InvoiceLineItem object: productName, quantity (NUMBER), unitPrice (CURRENCY), total (CURRENCY), billingType (SELECT), relation → Invoice
- [ ] createFromQuote fully implemented (no more stub)
- [ ] Invoice auto-created with line items mapped from quote
- [ ] Recurring items: first billing period invoice; one-time items: invoiced immediately
- [ ] Tests with mocked workspace datasource

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` — add Invoice + InvoiceLineItem
- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-contract.service.ts` — wire createFromQuote
- `twenty/packages/twenty-server/src/modules/cpq/cpq.module.ts` — import workspace datasource
