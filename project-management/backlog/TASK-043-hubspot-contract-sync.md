---
title: "HubSpot contract sync (bidirectional)"
id: TASK-043
project: PRJ-002
status: done
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #contracts, #hubspot, #sync]
---

# TASK-043: HubSpot contract sync (bidirectional)

## User Stories

- As an **Admin**, I want contract status and renewal dates written back to HubSpot so that my sales team can see contract context in HubSpot without switching tools.
- As a **CS manager**, I want renewal deals created in 21CRM to appear in HubSpot so that I can use HubSpot's workflow and communication tools.

## Outcomes

Bidirectional sync between 21CRM's contract/renewal system and HubSpot, enabling:
- Renewal deals created in 21CRM pushed to HubSpot as real deals
- Contract metadata (status, end date, renewal status) written to HubSpot company/deal custom properties
- HubSpot deal stage changes reflected back in 21CRM renewal tracking

## Success Metrics

- [ ] Renewal deals pushed to HubSpot via Deals API when created
- [ ] HubSpot deal ID stored back in `crm_objects.hubspot_id`
- [ ] Contract metadata properties created on HubSpot Company object: `contract_status`, `contract_end_date`, `renewal_status`, `contract_arr`
- [ ] These properties updated when contract status changes
- [ ] Stage changes on renewal deals in HubSpot reflected during sync
- [ ] Token refresh handled for all outbound API calls
- [ ] Rate limiting respected (100 req / 10s)
- [ ] Sync errors logged and retryable
- [ ] Feature toggleable: can be disabled per-org in settings

## Implementation Plan

### Outbound Sync: 21CRM → HubSpot

**When a renewal deal is created (TASK-035):**
1. Create deal in HubSpot via `POST /crm/v3/objects/deals`
2. Associate with company via `PUT /crm/v3/objects/deals/{id}/associations/companies/{companyId}`
3. Store returned HubSpot deal ID in `crm_objects.hubspot_id`

**When contract status changes:**
1. Update HubSpot company custom properties via `PATCH /crm/v3/objects/companies/{id}`
2. Properties to update: `contract_status`, `contract_end_date`, `contract_arr`, `renewal_status`

### Inbound Sync: HubSpot → 21CRM

The existing sync engine (TASK-034 in the daily job) already pulls deals. Extend it to:
1. Detect renewal deals (by `deal_type = 'Renewal'` property)
2. When a renewal deal's stage changes, update the corresponding `contract_renewals.status`
3. When a renewal deal is closed-won, update `contracts.status = 'renewed'`
4. When a renewal deal is closed-lost, update `contracts.renewal_status = 'churned'`

### Custom Property Setup

On first sync enable, create HubSpot custom properties if they don't exist:

```typescript
const contractProperties = [
  { name: 'contract_status', label: 'Contract Status', type: 'enumeration', 
    options: ['active', 'expiring', 'renewed', 'expired', 'cancelled'] },
  { name: 'contract_end_date', label: 'Contract End Date', type: 'date' },
  { name: 'contract_arr', label: 'Contract ARR', type: 'number' },
  { name: 'renewal_status', label: 'Renewal Status', type: 'enumeration',
    options: ['pending', 'in_progress', 'renewed', 'churned'] },
  { name: 'days_until_contract_expiry', label: 'Days Until Contract Expiry', type: 'number' },
];
```

### Error Handling

- All outbound calls wrapped in try/catch
- Rate limit hits trigger exponential backoff
- Failed syncs queued for retry (next sync cycle)
- Sync errors visible in settings page

## Files to Change

- `src/lib/sync/contract-sync.ts` — **NEW**: Contract↔HubSpot sync logic
- `src/lib/sync/engine.ts` — **MODIFY**: Hook contract sync into sync flow
- `src/app/api/settings/contract-sync/route.ts` — **NEW**: Enable/disable sync, status
- `src/lib/hubspot/properties.ts` — **NEW**: Custom property creation/verification

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
