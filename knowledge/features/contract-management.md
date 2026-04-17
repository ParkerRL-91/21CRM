---
title: Contract Management & Renewal System
tags: [#feature, #cpq, #contracts, #renewals]
created: 2026-04-12
updated: 2026-04-12
---

# Contract Management & Renewal System

## Overview

The contract management system (PRJ-002) adds contract lifecycle tracking, automated renewal generation, and renewal pipeline analytics to 21CRM. It is modeled on Salesforce CPQ's contract/renewal architecture, adapted for 21CRM's PostgreSQL + Drizzle + Next.js stack.

## Core Concepts

### Contract

A formal agreement record tracking a customer's active subscriptions with defined start/end dates. Contracts are either created manually or generated from closed-won deals. Each contract has a lifecycle: `draft → active → [amended] → pending_renewal → renewed | expired | cancelled`.

### Contract Subscription

Individual recurring product/service entitlements within a contract. Each subscription tracks: product, quantity, unit price, annual value, billing frequency, and renewal pricing preferences. One-time charges are also tracked but excluded from renewal quotes.

### Amendment

An immutable log entry recording any change to a contract: adding a subscription, changing quantity/price, extending the term, or cancelling a subscription. Amendments are append-only — the history is never mutated.

### Renewal

The process of extending a contract for a new term. When a contract approaches expiration, the system automatically creates a renewal opportunity (deal), generates a draft renewal quote with proposed pricing, and notifies the CS manager.

## Data Model

See [[schema-map]] for the full schema. Key tables:

| Table | Purpose |
|-------|---------|
| `contracts` | Core contract record with lifecycle status |
| `contract_subscriptions` | Per-product subscription line items |
| `contract_amendments` | Immutable change log |
| `contract_renewals` | Renewal tracking with proposed pricing |
| `renewal_config` | Per-org renewal automation settings |
| `notifications` | In-app notification delivery |

## Renewal Automation

### Daily Job Flow

1. Cron job runs daily (2:00 AM)
2. Queries: active contracts with `end_date` within `default_lead_days` AND no pending renewal
3. For each eligible contract:
   a. Creates `contract_renewals` record
   b. Generates renewal opportunity (deal with `deal_type = 'Renewal'`)
   c. Auto-generates renewal quote (proposed subscriptions + pricing)
   d. Sends notification to contract owner
4. Logs results to `renewal_config.job_last_result`

### Renewal Pricing Methods

| Method | Behavior |
|--------|----------|
| `same_price` | Use the current contract unit price unchanged |
| `current_list` | Look up current price book / product price; fall back to same_price |
| `uplift_percentage` | Apply percentage increase: `current_price × (1 + uplift%)` |

Resolution hierarchy: subscription override → contract override → org default.

### Renewal Date Calculation

```
Renewal quote start_date = contract end_date + 1 day
Renewal quote end_date = start_date + original term length
```

## Risk Assessment

Renewals are scored for risk using weighted signals:

| Signal | Weight | Trigger |
|--------|--------|---------|
| Stage stagnation | 25% | Deal hasn't changed stage in 14+ days |
| Close date slippage | 20% | Deal close date pushed past contract end |
| Time pressure | 20% | <30 days to expiry, not in final stage |
| Value decrease | 15% | Renewal value < current contract value |
| No activity | 10% | No deal changes in 21+ days |
| Previous churn | 10% | Account has previous cancelled renewal |

Risk levels: low (0-25), medium (26-50), high (51-75), critical (76-100).

## Key Metrics

| Metric | Formula |
|--------|---------|
| Gross Renewal Rate | Renewed ARR / Total Renewable ARR × 100 |
| Net Revenue Retention | (Renewed + Expansion - Contraction - Churn) / Starting ARR × 100 |
| Gross Revenue Retention | Renewed ARR / Starting ARR × 100 |

## Integration Points

- **Rev-Rec**: Renewal subscriptions generate projected recognition schedules (source = 'renewal')
- **Pipeline**: Renewal deals appear in pipeline with `deal_type = 'Renewal'` filter
- **HubSpot**: Optional bidirectional sync of contract status and renewal deals
- **Dashboard**: Contract expiration widget for at-a-glance visibility
- **Notifications**: In-app alerts for renewal creation and at-risk transitions

## Design Decisions

See [[adr-003-contract-management-architecture]] for the architectural decision record.

## Related

- [[schema-map]] — Database schema
- [[rev-rec]] — Revenue recognition integration
- [[hubspot-sync-engine]] — Sync engine for deal data
- [[pipeline-analytics]] — Pipeline views with renewal filtering
