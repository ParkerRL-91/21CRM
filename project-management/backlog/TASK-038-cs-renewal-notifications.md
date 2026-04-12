---
title: "CS notification on renewal creation"
id: TASK-038
project: PRJ-002
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #notifications]
---

# TASK-038: CS notification on renewal creation

## User Stories

- As a **Customer Success manager**, I want to be notified when a renewal opportunity is created for one of my contracts so that I can begin the renewal conversation proactively.
- As a **Sales Manager**, I want configurable notifications so that the right people are alerted about upcoming renewals.

## Outcomes

An in-app notification system that alerts CS managers (and optionally additional users) when the renewal job creates a new renewal opportunity. Notifications appear in a bell icon dropdown in the app header, with unread count badge.

## Success Metrics

- [ ] Notification created for contract owner when renewal opportunity is generated
- [ ] Additional notifications for users in `renewal_config.notify_additional_users`
- [ ] Notification includes: contract name, account name, expiration date, proposed renewal value
- [ ] Notification links directly to the contract detail page
- [ ] Bell icon in app header shows unread notification count
- [ ] Notification dropdown lists recent notifications (most recent first)
- [ ] Clicking a notification marks it as read and navigates to the linked entity
- [ ] "Mark all as read" action available
- [ ] Notifications auto-expire after 90 days (cleanup job)
- [ ] `GET /api/notifications` — returns user's notifications with pagination
- [ ] `PUT /api/notifications/[id]/read` — marks notification as read
- [ ] `PUT /api/notifications/read-all` — marks all as read

## Implementation Plan

### Notification Creation (in renewal job)

```typescript
export async function createRenewalNotification(
  contract: Contract,
  renewal: ContractRenewal,
  config: RenewalConfig
): Promise<void> {
  const recipients: string[] = [];
  
  // Always notify the contract owner
  if (config.notifyOwnerOnCreation && contract.createdBy) {
    recipients.push(contract.createdBy);
  }
  
  // Add configured additional users
  if (config.notifyAdditionalUsers?.length) {
    recipients.push(...config.notifyAdditionalUsers);
  }

  // Deduplicate
  const uniqueRecipients = [...new Set(recipients)];

  const notifications = uniqueRecipients.map(userId => ({
    orgId: contract.orgId,
    userId,
    type: 'renewal_created',
    title: `Renewal opportunity created`,
    message: `Contract "${contract.contractName}" for ${contract.accountName} expires on ${formatDate(contract.endDate)}. Proposed renewal value: ${formatCurrency(renewal.proposedTotalValue, contract.currencyCode)}.`,
    entityType: 'contract',
    entityId: contract.id,
    actionUrl: `/contracts/${contract.id}`,
    metadata: {
      contractNumber: contract.contractNumber,
      accountName: contract.accountName,
      expirationDate: contract.endDate,
      proposedValue: renewal.proposedTotalValue,
    },
  }));

  await db.insert(notificationsTable).values(notifications);
}
```

### Notification Types

| Type | When | Template |
|------|------|----------|
| `renewal_created` | Renewal job creates opportunity | "Renewal opportunity created for {contract}" |
| `contract_expiring` | Contract within 30 days of expiration without renewal | "Contract {name} expires in {N} days with no renewal" |
| `renewal_at_risk` | At-risk signals detected (TASK-042) | "Renewal for {contract} flagged as at-risk: {reason}" |
| `contract_expired` | Contract end date passed without renewal | "Contract {name} has expired" |

### UI: Notification Bell

Add to the app header (layout component):

```
[Dashboard] [Pipeline] [Forecast] ...     🔔 (3)  [User Avatar]
                                            │
                                            ▼
                                    ┌──────────────────┐
                                    │ Notifications     │
                                    │ [Mark all read]   │
                                    │                    │
                                    │ 🔵 Renewal created │
                                    │    Acme Corp       │
                                    │    2 hours ago     │
                                    │                    │
                                    │ 🔵 Contract expiring│
                                    │    Beta Inc        │
                                    │    5 hours ago     │
                                    │                    │
                                    │ ○ Renewal created  │
                                    │    Gamma Ltd       │
                                    │    Yesterday       │
                                    └──────────────────┘
```

### Notification Cleanup

Add a simple cleanup to the daily cron:
```typescript
await db.delete(notificationsTable)
  .where(lt(notificationsTable.expiresAt, new Date()));
```

## Files to Change

- `src/app/api/notifications/route.ts` — **NEW**: GET list, POST create
- `src/app/api/notifications/[id]/read/route.ts` — **NEW**: PUT mark read
- `src/app/api/notifications/read-all/route.ts` — **NEW**: PUT mark all read
- `src/components/notifications/notification-bell.tsx` — **NEW**: Header bell icon
- `src/components/notifications/notification-dropdown.tsx` — **NEW**: Dropdown list
- `src/components/notifications/notification-item.tsx` — **NEW**: Individual notification
- `src/hooks/use-notifications.ts` — **NEW**: Notification data fetching with polling
- `src/lib/renewals/notifications.ts` — **NEW**: Notification creation logic
- `src/lib/renewals/job.ts` — **MODIFY**: Wire notification creation into renewal flow

## Status Log

- 2026-04-12: Created — implements US-8.2 notification requirement

## Takeaways

_To be filled during implementation._
