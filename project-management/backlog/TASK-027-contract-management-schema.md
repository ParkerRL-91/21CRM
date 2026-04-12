---
title: "Design and implement contract management schema"
id: TASK-027
project: PRJ-002
status: done
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #data-model, #schema]
---

# TASK-027: Design and implement contract management schema

## User Stories

- As a **platform architect**, I want a robust database schema for contract lifecycle management so that contracts, subscriptions, amendments, and renewals are stored with full relational integrity and audit trails.
- As a **developer**, I want Drizzle ORM type definitions for all contract tables so that all queries are type-safe and all migrations are auto-generated.

## Outcomes

A complete set of database tables supporting the full contract lifecycle: creation, subscription tracking, amendments, renewals, and expiration. Schema supports the three user stories in Epic 8 (US-8.1, US-8.2, US-8.3) and provides the foundation for all subsequent tasks.

## Success Metrics

- [ ] All 6 new tables created via Drizzle schema definitions
- [ ] `drizzle-kit generate` produces clean migration files
- [ ] `drizzle-kit push` applies schema to database without errors
- [ ] Foreign key relationships enforced between all related tables
- [ ] Indexes defined for all query patterns identified in Epic 8
- [ ] Type definitions exported for use in API routes and engines
- [ ] All monetary columns use `numeric(12, 2)` precision

## Implementation Plan

### Table 1: `contracts`

The central contract record. One contract per accepted deal/quote.

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Identity
  contract_number VARCHAR(50) NOT NULL,  -- auto-generated: "CON-{org_prefix}-{sequence}"
  contract_name VARCHAR(255) NOT NULL,
  
  -- Relationships
  account_hubspot_id VARCHAR(50),         -- HubSpot company ID
  account_name VARCHAR(255),              -- denormalized for display
  deal_hubspot_id VARCHAR(50),            -- originating deal
  quote_id UUID,                          -- link to future quote system (nullable for now)
  
  -- Lifecycle
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- Valid values: draft, active, amended, pending_renewal, renewed, expired, cancelled
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Financial
  total_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'CAD',
  
  -- Renewal tracking
  renewal_status VARCHAR(30),
    -- NULL, pending, opportunity_created, quote_generated, renewed, churned
  renewal_opportunity_hubspot_id VARCHAR(50),  -- link to renewal deal
  renewal_lead_days INTEGER DEFAULT 90,        -- override per contract
  renewal_pricing_method VARCHAR(30),
    -- same_price, current_list, uplift_percentage
  renewal_uplift_percentage NUMERIC(5, 2),     -- e.g., 5.00 for 5%
  
  -- Ownership
  owner_hubspot_id VARCHAR(50),   -- CS manager / account owner
  owner_name VARCHAR(255),        -- denormalized
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',    -- extensible attributes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(org_id, contract_number),
  CHECK (end_date > start_date),
  CHECK (status IN ('draft', 'active', 'amended', 'pending_renewal', 'renewed', 'expired', 'cancelled')),
  CHECK (renewal_pricing_method IS NULL OR renewal_pricing_method IN ('same_price', 'current_list', 'uplift_percentage'))
);
```

**Indexes:**
- `(org_id, status)` — filter by active contracts
- `(org_id, status, end_date)` — renewal cron: equality on status then range on end_date (optimal scan order)
- `(org_id, account_hubspot_id)` — contracts per account
- `(org_id, owner_hubspot_id)` — contracts by CS manager
- Partial index: `WHERE status = 'active'` on `(org_id, end_date)` — fast renewal scan on active-only

### Table 2: `contract_subscriptions`

Individual subscription line items within a contract. Each represents a recurring product/service entitlement.

```sql
CREATE TABLE contract_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Product reference
  product_hubspot_id VARCHAR(50),         -- HubSpot product ID
  product_name VARCHAR(255) NOT NULL,     -- denormalized
  line_item_hubspot_id VARCHAR(50),       -- originating line item
  
  -- Financial
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,    -- NUMERIC for fractional quantities (e.g., 1.5 FTE)
  unit_price NUMERIC(12, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,   -- per-line discount
  annual_value NUMERIC(12, 2) NOT NULL,           -- computed: unit_price * quantity (annualized)
  billing_frequency VARCHAR(20) NOT NULL DEFAULT 'annual',
    -- monthly, quarterly, semi_annual, annual
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Lifecycle
  status VARCHAR(30) NOT NULL DEFAULT 'active',
    -- active, pending, suspended, pending_amendment, pending_renewal,
    -- pending_cancellation, renewed, cancelled, expired
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,  -- end-of-term vs immediate cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  
  -- Renewal pricing
  renewal_pricing_method VARCHAR(30),
    -- NULL = inherit from contract, same_price, current_list, uplift_percentage
  renewal_uplift_percentage NUMERIC(5, 2),
  
  -- Type classification
  charge_type VARCHAR(20) NOT NULL DEFAULT 'recurring',
    -- recurring, one_time, usage
  subscription_type VARCHAR(20) NOT NULL DEFAULT 'renewable',
    -- renewable, evergreen, one_time
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (end_date > start_date),
  CHECK (status IN ('active', 'pending', 'suspended', 'pending_amendment', 'pending_renewal', 'pending_cancellation', 'renewed', 'cancelled', 'expired')),
  CHECK (billing_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
  CHECK (charge_type IN ('recurring', 'one_time', 'usage')),
  CHECK (subscription_type IN ('renewable', 'evergreen', 'one_time')),
  CHECK (renewal_pricing_method IS NULL OR renewal_pricing_method IN ('same_price', 'current_list', 'uplift_percentage'))
);
```

**Indexes:**
- `(contract_id)` — subscriptions per contract
- `(org_id, status)` — active subscriptions
- `(org_id, product_hubspot_id)` — subscriptions by product

### Table 3: `contract_amendments`

Append-only log of all changes to a contract. Never mutated — each amendment is a new row.

```sql
CREATE TABLE contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Amendment details
  amendment_number INTEGER NOT NULL,     -- sequential per contract
  amendment_type VARCHAR(30) NOT NULL,
    -- add_subscription, remove_subscription, quantity_change, price_change, 
    -- term_extension, early_renewal, cancellation
  description TEXT NOT NULL,
  
  -- What changed
  subscription_id UUID REFERENCES contract_subscriptions(id),
  changes JSONB NOT NULL,
    -- e.g., { "field": "quantity", "old_value": 5, "new_value": 10 }
  
  -- Financial impact
  delta_value NUMERIC(12, 2) NOT NULL DEFAULT 0,  -- +/- change to contract value
  effective_date DATE NOT NULL,
  
  -- Source
  deal_hubspot_id VARCHAR(50),           -- amendment deal, if any
  quote_id UUID,                          -- amendment quote, if any
  amended_by UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(contract_id, amendment_number),
  CHECK (amendment_type IN ('add_subscription', 'remove_subscription', 'quantity_change', 'price_change', 'term_extension', 'early_renewal', 'cancellation', 'product_upgrade')),
  CHECK (effective_date >= '2020-01-01' AND effective_date <= '2099-12-31')  -- sanity range
);
```

**Indexes:**
- `(contract_id, amendment_number)` — amendments per contract in order
- `(org_id, effective_date)` — amendments by date

### Table 4: `renewal_config`

System-level configuration for the renewal automation engine. One row per org.

```sql
CREATE TABLE renewal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  
  -- Timing
  default_lead_days INTEGER NOT NULL DEFAULT 90,
    -- How many days before expiration to create renewal opportunity
  lead_days_options JSONB NOT NULL DEFAULT '[30, 60, 90, 120]',
    -- Allowed values for the lead days dropdown
  
  -- Pricing defaults
  default_pricing_method VARCHAR(30) NOT NULL DEFAULT 'same_price',
    -- same_price, current_list, uplift_percentage
  default_uplift_percentage NUMERIC(5, 2) DEFAULT 3.00,
    -- Default uplift when method = uplift_percentage
  
  -- Renewal opportunity settings
  renewal_pipeline_id VARCHAR(50),        -- HubSpot pipeline for renewals (or null = default)
  renewal_stage_id VARCHAR(50),           -- initial stage for renewal deals
  renewal_deal_prefix VARCHAR(50) DEFAULT 'Renewal:',
  
  -- Notifications
  notify_owner_on_creation BOOLEAN NOT NULL DEFAULT TRUE,
  notify_additional_users JSONB DEFAULT '[]',  -- array of user IDs
  
  -- Job settings
  job_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  job_last_run_at TIMESTAMPTZ,
  job_last_result JSONB,  -- { contracts_scanned, renewals_created, errors }
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table 5: `contract_renewals`

Links a contract to its renewal opportunity and tracks renewal lifecycle. Created by the daily renewal job.

```sql
CREATE TABLE contract_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Renewal details
  renewal_number INTEGER NOT NULL DEFAULT 1,  -- which renewal cycle (1st, 2nd, etc.)
  
  -- Opportunity link
  opportunity_hubspot_id VARCHAR(50),     -- the renewal deal in crm_objects
  opportunity_created_at TIMESTAMPTZ,
  
  -- Quote link (future)
  renewal_quote_id UUID,
  quote_generated_at TIMESTAMPTZ,
  
  -- Proposed renewal values
  proposed_start_date DATE NOT NULL,      -- contract end_date + 1
  proposed_end_date DATE NOT NULL,        -- proposed_start_date + term
  proposed_term_months INTEGER NOT NULL,
  proposed_total_value NUMERIC(12, 2),
  pricing_method_used VARCHAR(30) NOT NULL,
  
  -- Line item detail
  proposed_subscriptions JSONB NOT NULL DEFAULT '[]',
    -- Array of: { subscription_id, product_name, quantity, old_price, new_price, method }
  
  -- Outcome
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending, in_progress, won, lost, cancelled
  outcome_date DATE,
  outcome_notes TEXT,
  new_contract_id UUID REFERENCES contracts(id),  -- links to the successor contract when won
  
  -- Risk assessment (populated by TASK-042)
  risk_score INTEGER,
  risk_level VARCHAR(10),
  risk_signals JSONB DEFAULT '[]',
  risk_assessed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(contract_id, renewal_number),
  CHECK (status IN ('pending', 'in_progress', 'won', 'lost', 'cancelled')),
  CHECK (pricing_method_used IN ('same_price', 'current_list', 'uplift_percentage')),
  CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high', 'critical'))
);
```

**Indexes:**
- `(contract_id)` — renewals per contract
- `(org_id, status)` — active renewals
- `(org_id, proposed_start_date)` — renewals by date
- `(opportunity_hubspot_id)` — lookup when HubSpot deal stage changes
- `(org_id, outcome_date)` — period-based NRR queries

### Table 6: `notifications`

In-app notification system for renewal alerts and other system events.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Content
  type VARCHAR(50) NOT NULL,
    -- renewal_created, contract_expiring, renewal_at_risk, contract_expired
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Links
  entity_type VARCHAR(50),   -- 'contract', 'deal', 'renewal'
  entity_id VARCHAR(100),    -- the ID to link to
  action_url VARCHAR(500),   -- direct link to the relevant page
  
  -- State
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ      -- auto-cleanup old notifications
);
```

**Indexes:**
- `(user_id, is_read, created_at DESC)` — unread notifications for a user
- `(org_id, type, created_at DESC)` — notifications by type
- `(expires_at)` — cleanup expired notifications

### Drizzle Schema Implementation

All tables defined in `src/lib/db/contract-schema.ts` using Drizzle's `pgTable` with proper TypeScript types. Export all table definitions and inferred types (`InferSelectModel`, `InferInsertModel`).

### JSONB Validation Types

All JSONB columns must have documented TypeScript types validated with Zod at write time:

```typescript
// proposed_subscriptions in contract_renewals
const ProposedSubscriptionLineSchema = z.object({
  subscriptionId: z.string().uuid(),
  productHubspotId: z.string().optional(),
  productName: z.string(),
  quantity: z.number(),
  oldUnitPrice: z.string(), // Decimal as string
  newUnitPrice: z.string(),
  oldAnnualValue: z.string(),
  newAnnualValue: z.string(),
  pricingMethod: z.enum(['same_price', 'current_list', 'uplift_percentage']),
  billingFrequency: z.string(),
});

// changes in contract_amendments
const AmendmentChangesSchema = z.object({
  field: z.string(),
  oldValue: z.union([z.string(), z.number(), z.null()]),
  newValue: z.union([z.string(), z.number(), z.null()]),
});
```

### Migration Strategy

1. Define schema in Drizzle
2. Run `drizzle-kit generate` to create migration SQL
3. Review migration for correctness
4. **Wrap migration in a single transaction** (all tables created atomically or none)
5. Run `drizzle-kit push` to apply
6. Verify all indexes created
7. Seed renewal_config with default row per existing org using `INSERT ... ON CONFLICT DO NOTHING` (idempotent)
8. **Document rollback**: `DROP TABLE IF EXISTS` in reverse dependency order (notifications, contract_renewals, renewal_config, contract_amendments, contract_subscriptions, contracts)

## Files to Change

- `src/lib/db/contract-schema.ts` — **NEW**: All 6 table definitions
- `src/lib/db/schema.ts` — **MODIFY**: Export contract schema tables
- `drizzle.config.ts` — **MODIFY**: Include contract schema if not auto-discovered
- `drizzle/` — **NEW**: Generated migration files

## Files Changed

- `src/lib/db/contract-schema.ts` — **NEW**: All 6 table definitions with Drizzle ORM
- `src/lib/contracts/validation.ts` — **NEW**: Zod schemas, JSONB validators, status transitions
- `src/lib/contracts/validation.test.ts` — **NEW**: 43 tests for all validators
- `drizzle/0000_uneven_komodo.sql` — **NEW**: Generated migration (177 lines)
- `drizzle.config.ts` — **NEW**: Drizzle Kit configuration
- `tsconfig.json` — **NEW**: TypeScript configuration
- `vitest.config.ts` — **NEW**: Vitest configuration
- `package.json` — **NEW**: Dependencies (drizzle-orm, postgres, decimal.js, zod, date-fns)

## Status Log

- 2026-04-12: Created — schema designed based on Salesforce CPQ data model analysis
- 2026-04-12: Implemented — 6 tables, 18 indexes, 15 CHECK constraints, 43 passing tests

## Takeaways

- Drizzle ORM's `check()` API works well for enum-like CHECK constraints on VARCHAR columns
- JSONB defaults must use `sql` tagged template for array defaults: `.default(sql\`'[]'::jsonb\`)` — but Drizzle handles `default([])` automatically
- The `numeric()` type in Drizzle maps cleanly to PostgreSQL NUMERIC(precision, scale) — good for financial columns
- Validation schemas (Zod) should be created alongside the Drizzle schema, not deferred — they define the contract for all API consumers
