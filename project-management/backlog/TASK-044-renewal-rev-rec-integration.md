---
title: "Renewal-to-rev-rec integration"
id: TASK-044
project: PRJ-002
status: ready
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #rev-rec, #integration]
---

# TASK-044: Renewal-to-rev-rec integration

## User Stories

- As a **Finance user**, I want renewal contract subscriptions to automatically generate revenue recognition schedules so that projected revenue from renewals flows into the rev-rec waterfall.
- As a **Sales Manager**, I want to see the full revenue picture: current contract recognition + projected renewal recognition so that I understand the complete revenue timeline.

## Outcomes

Integration between the contract renewal system and the existing rev-rec engine, enabling renewal subscriptions to generate projected revenue recognition schedules. This extends the rev-rec system's "projected" mode (planned in TASK-001) to include renewals.

## Success Metrics

- [ ] Renewal subscriptions can be passed to `computeStraightLineSchedule()` to generate rev-rec schedules
- [ ] Renewal rev-rec schedules stored with `source = 'renewal'` in `rev_rec_schedules`
- [ ] Rev-rec waterfall view shows current + renewal projection when toggled
- [ ] Renewal schedules use the proposed pricing from the renewal quote
- [ ] Renewal schedules update when renewal quote pricing changes
- [ ] Renewal schedules removed when renewal is cancelled/churned
- [ ] Rev-rec dashboard shows upcoming revenue from renewals in a distinct visual treatment
- [ ] Tests for schedule generation from renewal data

## Implementation Plan

### Mapping Renewal Data to Rev-Rec Input

The existing rev-rec engine expects:
```typescript
interface RevRecInput {
  amount: number;
  startDate: Date;
  durationMonths: number;
  method: 'straight-line' | 'front-loaded' | 'back-loaded';
}
```

Map from renewal subscriptions:
```typescript
function renewalToRevRecInput(renewal: ContractRenewal): RevRecInput[] {
  return renewal.proposedSubscriptions
    .filter(sub => sub.billingFrequency !== 'one_time')
    .map(sub => ({
      amount: sub.newAnnualValue,
      startDate: renewal.proposedStartDate,
      durationMonths: renewal.proposedTermMonths,
      method: 'straight-line',
    }));
}
```

### Rev-Rec Schedule Storage

Store renewal-sourced schedules in the existing `rev_rec_schedules` table with distinct identifiers:

```typescript
await db.insert(revRecSchedules).values({
  orgId: contract.orgId,
  dealHubspotId: renewal.opportunityHubspotId,  // the renewal deal
  lineItemHubspotId: `renewal-${sub.subscriptionId}`,  // synthetic ID
  source: 'renewal',  // NEW: distinguishes from 'closed' and 'projected'
  monthlySchedule: computedSchedule,
  metadata: {
    contractId: contract.id,
    renewalId: renewal.id,
    pricingMethod: sub.pricingMethod,
  },
});
```

### Lifecycle Management

- **On renewal creation**: Generate rev-rec schedules with `source = 'renewal'`
- **On renewal quote edit**: Delete and regenerate schedules
- **On renewal won**: Convert schedules from `source = 'renewal'` to `source = 'closed'` (or let normal rev-rec generate pick them up)
- **On renewal lost/cancelled**: Delete renewal rev-rec schedules

### Rev-Rec Waterfall Extension

The rev-rec waterfall view needs a third category:
- **Recognized** (blue): from closed-won deals — existing
- **Projected** (light blue): from open pipeline — TASK-001
- **Renewal** (green): from renewal quotes — this task

## Files to Change

- `src/lib/rev-rec/renewal-integration.ts` — **NEW**: Renewal→Rev-rec mapping
- `src/lib/rev-rec/renewal-integration.test.ts` — **NEW**: Integration tests
- `src/app/api/rev-rec/generate/route.ts` — **MODIFY**: Support renewal source
- `src/app/(dashboard)/rev-rec/page.tsx` — **MODIFY**: Add renewal visualization

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
