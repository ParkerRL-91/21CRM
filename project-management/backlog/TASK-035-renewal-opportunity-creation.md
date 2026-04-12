---
title: "Renewal opportunity auto-creation"
id: TASK-035
project: PRJ-002
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #automation, #pipeline]
---

# TASK-035: Renewal opportunity auto-creation

## User Stories

- As a **Customer Success manager**, I want the system to automatically create a renewal opportunity when a contract is approaching expiration so that I can begin the renewal conversation proactively.
- As a **Sales Manager**, I want renewal opportunities to appear in the pipeline so that my team can track and forecast renewals.

## Outcomes

When the daily renewal job (TASK-034) identifies an eligible contract, a renewal deal is created in `crm_objects` with type "Renewal", populated with contract metadata, and linked to the account. The deal appears in the configured pipeline at the configured initial stage.

## Success Metrics

- [ ] Renewal deal created in `crm_objects` with `object_type = 'deals'`
- [ ] Deal properties include: `deal_type = 'Renewal'`, account linkage, contract reference
- [ ] Deal name follows pattern: `{prefix} {account_name} - {term_description}` (e.g., "Renewal: Acme Corp - Annual 2027")
- [ ] Deal amount = proposed renewal total value (from renewal pricing calculation)
- [ ] Deal close date = contract end date (when the renewal needs to be decided by)
- [ ] Deal pipeline and stage set from renewal config
- [ ] Deal owner = contract owner (CS manager)
- [ ] Deal linked to `contract_renewals` record via `opportunity_hubspot_id` or local ID
- [ ] If HubSpot sync is configured, optionally push the renewal deal to HubSpot
- [ ] Duplicate prevention: no renewal deal created if one already exists for this contract cycle
- [ ] Tests for deal property mapping, duplicate detection, and edge cases

## Implementation Plan

### Renewal Deal Creation

```typescript
export async function createRenewalOpportunity(
  contract: Contract,
  renewal: ContractRenewal,
  config: RenewalConfig
): Promise<string> {
  const dealProperties = {
    dealname: `${config.renewalDealPrefix} ${contract.accountName} - ${formatTerm(renewal)}`,
    amount: String(renewal.proposedTotalValue),
    closedate: contract.endDate.toISOString(),
    pipeline: config.renewalPipelineId || 'default',
    dealstage: config.renewalStageId || 'qualificationlead',
    deal_type: 'Renewal',
    hubspot_owner_id: contract.ownerHubspotId,
    
    // Custom properties for renewal tracking
    renewal_contract_id: contract.id,
    renewal_contract_number: contract.contractNumber,
    renewal_proposed_value: String(renewal.proposedTotalValue),
    renewal_pricing_method: renewal.pricingMethodUsed,
    renewal_start_date: renewal.proposedStartDate.toISOString(),
    renewal_end_date: renewal.proposedEndDate.toISOString(),
  };

  // Create deal in local crm_objects
  const deal = await db.insert(crmObjects).values({
    orgId: contract.orgId,
    objectType: 'deals',
    hubspotId: generateLocalDealId(), // local-only ID until synced to HubSpot
    properties: dealProperties,
    firstSyncedAt: new Date(),
    lastModifiedAt: new Date(),
  }).returning();

  // Update the contract_renewals record with the opportunity link
  await db.update(contractRenewals)
    .set({
      opportunityHubspotId: deal[0].hubspotId,
      opportunityCreatedAt: new Date(),
      status: 'in_progress',
    })
    .where(eq(contractRenewals.id, renewal.id));

  // Update contract status
  await db.update(contracts)
    .set({
      renewalStatus: 'opportunity_created',
      renewalOpportunityHubspotId: deal[0].hubspotId,
    })
    .where(eq(contracts.id, contract.id));

  return deal[0].id;
}
```

### HubSpot Sync (Optional)

If bidirectional sync is configured (TASK-043), the renewal deal can also be pushed to HubSpot:
1. Create deal via HubSpot Deals API
2. Associate with company
3. Store the HubSpot-assigned deal ID back in `crm_objects.hubspot_id`

For now (TASK-035), deals are created locally. HubSpot sync is a Phase 5 enhancement.

### Deal Property Mapping

| Contract Field | Deal Property | Notes |
|---------------|---------------|-------|
| contract.accountName | dealname (partial) | Combined with prefix and term |
| renewal.proposedTotalValue | amount | Numeric string |
| contract.endDate | closedate | When renewal decision due |
| config.renewalPipelineId | pipeline | From renewal config |
| config.renewalStageId | dealstage | From renewal config |
| "Renewal" | deal_type | Hard-coded for filtering |
| contract.ownerHubspotId | hubspot_owner_id | CS manager |
| contract.id | renewal_contract_id | Custom property |

### Edge Cases

- Contract with no owner: assign to org default owner
- Contract with $0 value: still create renewal (value to be determined during renewal)
- Multiple contracts for same account expiring simultaneously: create separate renewal deals for each
- Contract already has a cancelled/lost renewal: create a new renewal (new cycle)

## Files to Change

- `src/lib/renewals/opportunity.ts` — **NEW**: Renewal opportunity creation logic
- `src/lib/renewals/opportunity.test.ts` — **NEW**: Tests
- `src/lib/renewals/job.ts` — **MODIFY**: Wire in opportunity creation after renewal record creation

## Status Log

- 2026-04-12: Created — implements US-8.2 acceptance criteria (opportunity creation part)

## Takeaways

_To be filled during implementation._
