---
title: "Renewal configuration system"
id: TASK-033
project: PRJ-002
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #configuration]
---

# TASK-033: Renewal configuration system

## User Stories

- As a **Sales Manager**, I want to configure renewal automation settings (lead time, pricing method, pipeline assignment) at the organization level so that the renewal engine operates according to our business rules.
- As an **Admin**, I want to adjust renewal timing and pricing defaults without code changes so that we can respond to business needs quickly.

## Outcomes

A complete renewal configuration system with UI settings page and API, allowing per-org configuration of: renewal lead time (30/60/90/120 days), default pricing method, default uplift percentage, renewal pipeline assignment, and notification preferences.

## Success Metrics

- [ ] Settings page at `/settings/renewals` with form for all configuration fields
- [ ] `GET /api/settings/renewals` returns current org renewal config
- [ ] `PUT /api/settings/renewals` updates config with validation
- [ ] Default config auto-created when org is first set up (90 days, same_price, notifications on)
- [ ] Lead time dropdown: 30, 60, 90, 120 days
- [ ] Pricing method selector: Same Price, Current List Price, Uplift Percentage
- [ ] Uplift percentage input (shown only when uplift method selected): 0-100% with 0.5% step
- [ ] Pipeline selector: dropdown of available HubSpot pipelines (from app_config)
- [ ] Notification toggles: owner notification, additional users
- [ ] Job enable/disable toggle
- [ ] Last run status display: timestamp, contracts scanned, renewals created, errors
- [ ] Validation prevents saving invalid configs (e.g., uplift without percentage)

## Implementation Plan

### Settings UI

```
Renewal Automation Settings
─────────────────────────────────
Renewal Lead Time: [90 days ▼]
  Create renewal opportunities this many days before contract expiration.

Default Pricing Method: [Same Price ▼]
  ○ Same Price — Use the current contract price
  ○ Current List Price — Use the latest price book entry
  ○ Uplift Percentage — Apply an annual increase

Default Uplift: [3.00 %]
  Applied when pricing method is "Uplift Percentage"

Renewal Pipeline: [Default Sales Pipeline ▼]
  Which pipeline to create renewal opportunities in.

Initial Stage: [Qualification ▼]
  Stage for newly created renewal opportunities.

Deal Name Prefix: [Renewal: ___]
  Prefix for auto-generated renewal deal names.

─────────────────────────────────
Notifications

  ☑ Notify contract owner when renewal opportunity is created
  ☐ Notify additional users: [Select users...]

─────────────────────────────────
Automation

  ☑ Enable daily renewal job
  Last run: Apr 12, 2026 at 02:00 AM
  Result: 45 contracts scanned, 3 renewals created, 0 errors

[Save Changes]
```

### Configuration Validation Schema

```typescript
const renewalConfigSchema = z.object({
  defaultLeadDays: z.number().int().min(7).max(365),
  defaultPricingMethod: z.enum(['same_price', 'current_list', 'uplift_percentage']),
  defaultUpliftPercentage: z.number().min(0).max(100).optional(),
  renewalPipelineId: z.string().optional(),
  renewalStageId: z.string().optional(),
  renewalDealPrefix: z.string().max(50).default('Renewal:'),
  notifyOwnerOnCreation: z.boolean().default(true),
  notifyAdditionalUsers: z.array(z.string().uuid()).default([]),
  jobEnabled: z.boolean().default(true),
}).refine(
  (data) => data.defaultPricingMethod !== 'uplift_percentage' || 
            (data.defaultUpliftPercentage !== undefined && data.defaultUpliftPercentage > 0),
  { message: 'Uplift percentage required when pricing method is uplift_percentage' }
);
```

### Per-Contract Overrides

While this task creates system-level defaults, the contract record itself can override:
- `renewal_lead_days` on `contracts` table (NULL = use system default)
- `renewal_pricing_method` on `contracts` table (NULL = use system default)
- `renewal_uplift_percentage` on `contracts` table (NULL = use system default)

The renewal engine resolves: contract-level override → org-level default.

## Files to Change

- `src/app/(dashboard)/settings/renewals/page.tsx` — **NEW**: Settings page
- `src/app/api/settings/renewals/route.ts` — **NEW**: GET/PUT config API
- `src/lib/renewals/config.ts` — **NEW**: Config resolution logic (contract override → org default)
- `src/lib/renewals/config.test.ts` — **NEW**: Config resolution tests

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
