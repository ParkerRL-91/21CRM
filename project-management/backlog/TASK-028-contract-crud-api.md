---
title: "Build contract CRUD API routes"
id: TASK-028
project: PRJ-002
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #api]
---

# TASK-028: Build contract CRUD API routes

## User Stories

- As a **CS manager**, I want to create, read, update, and delete contracts via the API so that contract data can be managed through the UI.
- As a **developer**, I want typed, parameterized API routes for contract operations so that all contract mutations are secure and validated.

## Outcomes

Complete REST API for contract lifecycle operations: create contract (from deal or manually), list contracts (with filtering), get contract detail, update contract fields, and manage contract status transitions. All routes use Drizzle ORM with parameterized queries.

## Success Metrics

- [ ] `POST /api/contracts` — creates a contract with validation
- [ ] `GET /api/contracts` — lists contracts with filtering by status, account, owner, date range
- [ ] `GET /api/contracts/[id]` — returns contract with subscriptions, amendments, and renewal info
- [ ] `PUT /api/contracts/[id]` — updates allowed fields with status transition validation
- [ ] `DELETE /api/contracts/[id]` — soft delete (status → cancelled) with audit log
- [ ] `POST /api/contracts/from-deal` — creates contract from closed-won deal with line items
- [ ] All routes validate org_id from session
- [ ] All routes use parameterized queries (no SQL injection)
- [ ] Input validation with Zod schemas
- [ ] Error handling with appropriate HTTP status codes

## Implementation Plan

### Route: `POST /api/contracts`

Create a contract manually with the following payload:

```typescript
const createContractSchema = z.object({
  contractName: z.string().min(1).max(255),
  accountHubspotId: z.string().optional(),
  accountName: z.string().optional(),
  dealHubspotId: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  totalValue: z.number().positive(),
  currencyCode: z.string().length(3).default('CAD'),
  ownerHubspotId: z.string().optional(),
  ownerName: z.string().optional(),
  renewalPricingMethod: z.enum(['same_price', 'current_list', 'uplift_percentage']).optional(),
  renewalUpliftPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  subscriptions: z.array(subscriptionSchema).optional(),
});
```

**Logic:**
1. Validate input with Zod
2. Auto-generate contract_number: `CON-{orgPrefix}-{nextSequence}`
3. Insert contract record
4. If subscriptions provided, insert contract_subscriptions
5. Return created contract with ID

### Route: `POST /api/contracts/from-deal`

Create a contract from a closed-won deal, pulling line items as subscriptions:

```typescript
const fromDealSchema = z.object({
  dealHubspotId: z.string(),
  startDate: z.string().date().optional(), // default: deal closedate
  termMonths: z.number().int().positive().optional(), // default: max line item term
});
```

**Logic:**
1. Fetch deal from crm_objects by hubspot_id
2. Fetch associated line items (from crm_objects or HubSpot associations API)
3. Map deal fields → contract fields
4. Map line items → contract_subscriptions:
   - Product: from line item `hs_product_id`, `name`
   - Price: from line item `amount`, `price`
   - Term: from `hs_term_in_months` or `hs_recurring_billing_period`
   - Billing frequency: parsed from `hs_recurring_billing_period`
   - Charge type: `recurring` if billing period exists, else `one_time`
5. Compute total_value as sum of subscription annual values
6. Insert contract + subscriptions in a transaction
7. Return created contract

### Route: `GET /api/contracts`

List contracts with comprehensive filtering:

**Query params:**
- `status` — filter by status (comma-separated for multiple)
- `accountHubspotId` — filter by account
- `ownerHubspotId` — filter by CS manager
- `expiringWithinDays` — contracts expiring within N days
- `search` — search contract name or account name
- `sortBy` — field to sort by (default: end_date)
- `sortOrder` — asc/desc (default: asc)
- `page`, `limit` — pagination (default: 1, 50)

**Response includes:**
- Contract list with computed `days_until_expiration`
- Total count for pagination
- Summary stats: total active, total value, expiring soon count

### Route: `GET /api/contracts/[id]`

Return full contract detail including:
- Contract record
- All subscriptions (ordered by product name)
- All amendments (ordered by amendment_number)
- Renewal history (all contract_renewals records)
- Computed fields: days_until_expiration, total ARR, is_expiring_soon
- Owner name resolution (from app_config hubspot_owners)

### Route: `PUT /api/contracts/[id]`

Update contract with status transition validation:

**Valid transitions:**
- `draft` → `active`
- `active` → `amended`, `pending_renewal`, `expired`, `cancelled`
- `amended` → `active` (after amendment applied)
- `pending_renewal` → `renewed`, `expired`, `cancelled`

Invalid transitions return 422 with explanation.

### Route: `DELETE /api/contracts/[id]`

Soft delete — sets status to `cancelled`, records cancellation amendment, and preserves all data.

## Files to Change

- `src/app/api/contracts/route.ts` — **NEW**: GET (list) and POST (create) handlers
- `src/app/api/contracts/[id]/route.ts` — **NEW**: GET (detail), PUT (update), DELETE
- `src/app/api/contracts/from-deal/route.ts` — **NEW**: POST create-from-deal
- `src/lib/contracts/validation.ts` — **NEW**: Zod schemas for all payloads
- `src/lib/contracts/service.ts` — **NEW**: Contract service with business logic
- `src/lib/contracts/number-generator.ts` — **NEW**: Contract number auto-generation

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
