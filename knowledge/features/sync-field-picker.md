---
title: Sync Field Picker
tags: [#feature, #hubspot, #integration]
created: 2026-03-22
updated: 2026-03-22
---

# Sync Field Picker

Allows users to select which HubSpot fields to sync per object type, instead of being locked to hardcoded defaults.

## How It Works

1. User clicks "Fields" button on any object row in Settings → Sync Status
2. Modal loads all available HubSpot properties via `GET /api/sync/fields?objectType=deals`
3. User selects/deselects fields with checkboxes (searchable, select all, reset to defaults)
4. Saves via `PUT /api/sync/fields` → stored in `organizations.syncConfig.propertyOverrides`
5. Next sync uses the custom field list instead of defaults

## Storage

```json
// organizations.syncConfig
{
  "propertyOverrides": {
    "deals": ["dealname", "amount", "closedate", "custom_field"],
    "contacts": null  // null = use engine defaults
  }
}
```

## API Routes

- `GET /api/sync/fields?objectType=X` — returns all HubSpot properties + currently selected
- `PUT /api/sync/fields` — saves field selection `{ objectType, fields: string[] | null }`

## Engine Integration

`getSyncProperties(objectType, syncConfig)` in `src/lib/sync/engine.ts` checks overrides before falling back to `DEFAULT_OBJECT_PROPERTIES`.

See [[hubspot-sync-engine]] for how this integrates with the sync flow.
