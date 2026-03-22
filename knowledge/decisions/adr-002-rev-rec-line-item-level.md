---
title: "ADR-002: Line-Item-Level Rev Rec"
tags: [#decision, #rev-rec]
created: 2026-03-22
updated: 2026-03-22
status: accepted
---

# ADR-002: Revenue Recognition at Line Item Level

## Context

Rev-rec was originally implemented at the deal level (deal amount ÷ 12 months). But not all products are subscriptions, some are services, and each line item has its own start date and term.

## Decision

Rev-rec operates at the **line item level**. Each line item gets its own schedule.

## Rationale

- Deals can contain a mix of subscriptions and one-time services
- Each line item has `hs_term_in_months`, `hs_recurring_billing_start_date`, and `amount`
- One-time items should be recognized immediately, not spread over 12 months
- Aligns with ASC 606 (recognize revenue as performance obligations are satisfied)

## Fallback Behavior

- **No line items on deal**: Use deal amount, 1-month recognition
- **No start date on line item**: Fall back to deal's `closedate`
- **No term/billing period**: Treat as one-time (1 month)

## Consequences

- Requires HubSpot associations (deal→line_item) to be fetched on-demand
- Line items must be synced with `hs_term_in_months` and `hs_recurring_billing_start_date`
- More accurate but more complex than deal-level recognition
