# TASK-113 — Salesforce Connector (salesforce-connector.ts + crm-provider.ts)

**Status:** Complete  
**Phase:** PRJ-005  
**Completed:** 2026-04-19

## Description
Implement a Salesforce CRM connector that pulls opportunity and account data into the CPQ pipeline, enabling bi-directional sync between Twenty CPQ and Salesforce.

## Acceptance Criteria
- `SalesforceConnector` implements the `CrmProvider` interface
- Authenticates via OAuth2 connected app (client credentials + refresh token)
- Syncs: Opportunities → CPQ Quotes, Accounts → Companies, Contacts → People
- Field mapping is configurable per workspace
- Handles rate limits (Salesforce API: 100k req/day) with exponential backoff
- Unit tested with mocked Salesforce API responses

## Implementation Notes
- Files: `packages/twenty-server/src/modules/cpq/connectors/salesforce-connector.ts`, `crm-provider.ts`
- Uses Twenty's existing connected-account OAuth infrastructure
- Sync job registered as BullMQ worker task with configurable interval
