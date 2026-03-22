---
title: CRM Objects Table
tags: [#data-model, #architecture]
created: 2026-03-22
updated: 2026-03-22
---

# CRM Objects Table

The `crm_objects` table is the **core data store** for all synced HubSpot data.

## Schema

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| org_id | uuid | FK → organizations |
| object_type | varchar(50) | `deals`, `contacts`, `companies`, `tickets`, `line_items`, `products` |
| hubspot_id | varchar(50) | HubSpot's object ID |
| properties | jsonb | All synced fields as key-value pairs |
| associations | jsonb | Reserved for object relationships (not yet populated by sync) |
| first_synced_at | timestamp | When first pulled from HubSpot |
| last_modified_at | timestamp | HubSpot's `updatedAt` for the record |

## Indexes

- **Unique**: `(org_id, object_type, hubspot_id)` — prevents duplicates
- **Composite**: `(org_id, object_type)` — fast type queries
- **Composite**: `(org_id, object_type, last_modified_at)` — sorted queries

## Querying

All dashboard queries use `properties->>'field_name'` to extract JSONB fields:

```sql
SELECT properties->>'dealname' AS name,
       NULLIF(properties->>'amount', '')::numeric AS amount
FROM crm_objects
WHERE org_id = $1 AND object_type = 'deals'
```

The `/api/crm/query` endpoint abstracts this with `groupBy`, `aggregation`, `fields`, and `filter_*` parameters.

## Important: Associations Column

The `associations` column exists but is **NOT populated during sync**. Some features (forecast resolver, recipe joins) expect it to contain `{ deals: ["123", "456"] }` style data. Currently, deal→line_item associations are fetched on-demand from HubSpot via `batchGetAssociations()` in the rev-rec generate route.

**Future improvement**: Sync associations during `syncAll()` to enable local joins.

See [[hubspot-sync-engine]] for how data gets into this table.
