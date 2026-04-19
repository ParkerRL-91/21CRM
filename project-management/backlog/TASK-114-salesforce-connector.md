---
title: Salesforce CRM Connector
id: TASK-114
project: PRJ-005
status: in-progress
priority: P2
created: 2026-04-18
updated: 2026-04-18
tags: [#task, #integration, #salesforce]
---

# TASK-114: Salesforce CRM Connector

## User Stories
- As an admin, I want to connect to Salesforce as a CRM source so teams not on HubSpot can use 21CRM.

## Outcomes
A `CrmProvider` interface + `SalesforceConnector` implementation that maps SFDC opportunities to the 21CRM deal model.

## Success Metrics
- [ ] `CrmProvider` interface defines `fetchDeals`, `fetchContacts`, `fetchAccounts`
- [ ] `SalesforceConnector` implements all 3 methods
- [ ] Field mapping covers standard Opportunity fields
- [ ] Tests pass (using mocked SFDC responses)

## Files to Change
- `src/lib/pipeline/crm-provider.ts` — CrmProvider interface + NormalizedDeal type
- `src/lib/pipeline/salesforce-connector.ts` — Salesforce implementation
- `src/lib/pipeline/salesforce-connector.test.ts` — tests

## Status Log
- 2026-04-18: Created and started

## Takeaways
