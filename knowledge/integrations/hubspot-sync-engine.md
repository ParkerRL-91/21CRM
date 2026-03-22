---
title: HubSpot Sync Engine
tags: [#integration, #hubspot, #architecture]
created: 2026-03-22
updated: 2026-03-22
---

# HubSpot Sync Engine

Location: `src/lib/sync/engine.ts`

## What It Does

Pulls HubSpot CRM data into the local `crm_objects` table. Supports 6 object types: deals, contacts, companies, tickets, line_items, products.

## Sync Flow

1. `syncAll(orgId, accessToken)` is called from `/api/sync` POST
2. Metadata synced first (in parallel):
   - `syncPipelineMetadata()` → stores pipeline/stage labels in `app_config`
   - `syncOwners()` → stores owner names/emails in `app_config`
3. Each object type synced sequentially via `syncObjectType()`
4. Each sync:
   - Gets/creates a `sync_cursors` row for tracking
   - Marks cursor as "syncing"
   - Fetches from HubSpot (incremental if cursor exists, using `hs_lastmodifieddate` filter)
   - Upserts into `crm_objects` with change detection
   - Updates cursor with completion status

## Incremental Sync

After the first full sync, subsequent syncs only fetch records modified since `lastModifiedCursor`. This uses HubSpot's search API with a `hs_lastmodifieddate >= <cursor>` filter.

## Change Detection

During upsert, if a record already exists, the engine compares old vs new properties and writes to:
- `deal_stage_history` — deal stage changes
- `lifecycle_history` — contact lifecycle stage changes
- `property_change_log` — amount and closedate changes on deals

## Property Overrides

Users can customize which fields to sync per object type. Stored in `organizations.syncConfig.propertyOverrides`:

```json
{
  "propertyOverrides": {
    "deals": ["dealname", "amount", "closedate", "custom_field_1"],
    "contacts": null  // null = use defaults
  }
}
```

The `getSyncProperties()` function checks overrides before falling back to `DEFAULT_OBJECT_PROPERTIES`.

## Rate Limiting

HubSpot allows 100 requests per 10 seconds for OAuth apps. The `RateLimiter` class exists but is not yet wired into the sync flow. Currently relies on sequential fetching being slow enough.

## Gotchas

- **Token refresh**: Access tokens expire. The sync route handles refresh before syncing. Always check `/api/sync/route.ts` for the current pattern.
- **Associations not synced**: The `crm_objects.associations` column is never populated. Associations are fetched on-demand where needed.
- **Line item properties**: `hs_term_in_months` and `hs_recurring_billing_start_date` were added to the sync list — earlier synced data won't have these fields until re-synced.

See [[hubspot-auth]] for OAuth flow details.
See [[crm-objects-table]] for the target schema.
