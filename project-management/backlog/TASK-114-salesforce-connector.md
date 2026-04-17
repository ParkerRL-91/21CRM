---
title: "Salesforce Connector (Sync Engine Abstraction)"
id: TASK-114
project: PRJ-005
status: backlog
priority: P2
created: 2026-04-17
updated: 2026-04-17
tags: [#task, #integration, #salesforce, #sync, #architecture, #multi-crm]
---

# TASK-114: Salesforce Connector (Sync Engine Abstraction)

## User Stories

- As **Dana (VP RevOps)**, I want 21CRM to connect to Salesforce in addition to HubSpot so I can use this platform regardless of which CRM my company runs — most of my peers use Salesforce and I want to recommend this tool to them.
- As **Jordan (CRM Admin)**, I want a clean CRM provider interface so I can configure which CRM backend to use during setup without the system being hard-coded to HubSpot, and so future CRM integrations are easy to add.
- As **Morgan (Sales Manager)**, I want the same pipeline, forecast, and team dashboards to work identically whether the data comes from HubSpot or Salesforce so the experience is consistent regardless of CRM choice.
- As **Casey (Finance/Controller)**, I want deal, line item, and company data from Salesforce to flow into the same rev-rec and subscription engines so all financial calculations work the same way regardless of data source.

## Outcomes

1. **CRM Provider Interface**: Abstract the sync engine into a provider pattern:
   - `CRMProvider` interface: `getDeals()`, `getContacts()`, `getCompanies()`, `getLineItems()`, `getOwners()`, `getPipelines()`, `getAssociations()`
   - `HubSpotProvider` implements interface (refactor existing sync engine)
   - `SalesforceProvider` implements interface (new)
2. **Salesforce REST API connector**: OAuth 2.0 flow, SOQL queries, bulk API for large datasets
3. **Field mapping**: Salesforce field names → normalized field names used by the rest of 21CRM
4. **Data normalization**: Salesforce data shapes mapped to the same `crm_objects` JSONB format
5. **Setup flow**: Choose CRM provider during onboarding, configure credentials, field mapping
6. **Scope**: This is a prototype — core objects (Deals/Opportunities, Contacts, Companies/Accounts, Line Items/OpportunityLineItems) with basic sync. Full feature parity is a separate project.

## Success Metrics

- [ ] CRM Provider interface defined with typed methods for all core operations
- [ ] Existing HubSpot sync refactored to implement the provider interface (no regression)
- [ ] Salesforce OAuth 2.0 connected app flow works (authorize, token refresh)
- [ ] Salesforce sync pulls Opportunities, Contacts, Accounts, OpportunityLineItems
- [ ] Salesforce data stored in crm_objects with normalized property names
- [ ] Pipeline and team dashboards work with Salesforce data (same queries, different source)
- [ ] Field mapping configurable: Salesforce field → normalized field name
- [ ] Settings page allows choosing CRM provider and configuring credentials
- [ ] Rate limits respected (Salesforce: 15,000 API calls per 24 hours for Enterprise)
- [ ] Existing HubSpot functionality has zero regression after refactor
- [ ] Integration test: Salesforce sync → pipeline page renders correctly

## Implementation Plan

1. Define the CRM Provider interface (`src/lib/sync/crm-provider.ts`):
   ```typescript
   interface CRMProvider {
     name: string;
     getDeals(cursor?): Promise<SyncResult<CRMObject>>;
     getContacts(cursor?): Promise<SyncResult<CRMObject>>;
     getCompanies(cursor?): Promise<SyncResult<CRMObject>>;
     getLineItems(cursor?): Promise<SyncResult<CRMObject>>;
     getOwners(): Promise<Owner[]>;
     getPipelines(): Promise<Pipeline[]>;
     getAssociations(objectType, targetType, ids): Promise<Association[]>;
     refreshToken(): Promise<void>;
   }
   ```
2. Refactor `src/lib/sync/engine.ts`:
   - Extract HubSpot-specific logic into `src/lib/hubspot/provider.ts` implementing CRMProvider
   - Sync engine becomes provider-agnostic: accepts a CRMProvider instance
   - All existing tests must pass after refactor
3. Create `src/lib/salesforce/` module:
   - `provider.ts` — SalesforceProvider implementing CRMProvider
   - `client.ts` — Salesforce REST API client (OAuth, SOQL, bulk)
   - `auth.ts` — OAuth 2.0 connected app flow (authorize URL, callback, token refresh)
   - `field-mapping.ts` — default field mappings (Opportunity.Amount → amount, etc.)
   - `rate-limiter.ts` — respect Salesforce API limits
4. Update settings/onboarding:
   - CRM provider selector (HubSpot or Salesforce)
   - Salesforce OAuth flow (authorize button → callback → store tokens)
   - Salesforce field mapping configuration
5. Update sync trigger to instantiate the correct provider based on org configuration

## Files to Change

- `src/lib/sync/crm-provider.ts` — NEW: CRM Provider interface definition
- `src/lib/sync/engine.ts` — refactor to accept CRMProvider instead of calling HubSpot directly
- `src/lib/hubspot/provider.ts` — NEW: HubSpotProvider implementing CRMProvider (extracted from engine)
- `src/lib/hubspot/client.ts` — minor updates for provider interface compatibility
- `src/lib/salesforce/provider.ts` — NEW: SalesforceProvider implementing CRMProvider
- `src/lib/salesforce/client.ts` — NEW: Salesforce REST API client
- `src/lib/salesforce/auth.ts` — NEW: OAuth 2.0 flow for Salesforce connected apps
- `src/lib/salesforce/field-mapping.ts` — NEW: Salesforce → normalized field mapping
- `src/lib/salesforce/rate-limiter.ts` — NEW: API rate limit management
- `src/app/api/auth/salesforce/route.ts` — NEW: Salesforce OAuth callback
- `src/app/(dashboard)/settings/page.tsx` — CRM provider selection and Salesforce config
- `src/lib/db/schema.ts` — extend organizations table for multi-provider config (provider type, SF tokens)

## Tests to Write

- `src/lib/sync/engine.test.ts` — verify sync engine works with mock CRMProvider (provider-agnostic)
- `src/lib/hubspot/provider.test.ts` — verify HubSpotProvider implements interface correctly
- `src/lib/salesforce/provider.test.ts` — verify SalesforceProvider implements interface with mock API responses
- `src/lib/salesforce/field-mapping.test.ts`:
  - Default mapping: Opportunity fields map to normalized deal fields
  - Custom mapping: user-configured field overrides apply correctly
  - Missing fields: handles Salesforce records with missing optional fields
- `src/lib/salesforce/client.test.ts`:
  - SOQL query construction for Opportunities, Contacts, Accounts
  - Pagination handling for large result sets
  - Rate limit detection and backoff behavior

## Status Log

- 2026-04-17: Created as part of PRJ-005. Gap #8 (Multi-CRM Support). This is a prototype scope — core object sync only. Full feature parity (workflows, custom objects, bulk sync) would be a separate project.

## Takeaways

_To be filled during execution_
