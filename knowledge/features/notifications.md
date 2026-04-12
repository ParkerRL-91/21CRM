---
title: In-App Notification System
tags: [#feature, #notifications, #architecture]
created: 2026-04-12
updated: 2026-04-12
---

# In-App Notification System

## Overview

21CRM includes a generic in-app notification system introduced in PRJ-002 (Contract Management). While initially built for renewal alerts, it is designed as a reusable platform service for any feature that needs to alert users.

## Architecture

### Storage

Notifications stored in the `notifications` table with:
- `type` — categorizes the notification (extensible enum)
- `entity_type` + `entity_id` — polymorphic link to the source record
- `action_url` — direct link to the relevant page
- `expires_at` — auto-cleanup after 90 days

### API

- `GET /api/notifications` — user's notifications with pagination, ordered by created_at DESC
- `PUT /api/notifications/[id]/read` — mark single notification as read
- `PUT /api/notifications/read-all` — mark all as read

### UI

- Bell icon in app header with unread count badge
- Dropdown showing recent notifications
- Click navigates to `action_url` and marks as read

## Notification Types

| Type | Source | Template |
|------|--------|----------|
| `renewal_created` | Renewal job (TASK-034) | "Renewal opportunity created for {contract}" |
| `contract_expiring` | Renewal job | "Contract {name} expires in {N} days with no renewal" |
| `renewal_at_risk` | Risk engine (TASK-042) | "Renewal for {contract} flagged as at-risk: {reason}" |
| `contract_expired` | Daily job | "Contract {name} has expired" |

## Extending for Other Features

To add a new notification type:
1. Add the type string to the notification type enum
2. Call `db.insert(notifications)` with the new type, message, and entity link
3. The existing bell UI and API handle delivery automatically

No changes needed to the notification infrastructure itself — just insert a row.

## Design Decisions

- **In-app only** (no email) to keep the system self-hosted without SMTP dependencies
- **Polling-based** (not WebSocket) for simplicity — notifications hook polls every 30 seconds
- **Auto-expire** at 90 days to prevent unbounded table growth
- **Per-user delivery** — each recipient gets their own notification row (no shared notifications)

## Related

- [[contract-management]] — Primary consumer of notifications
- [[schema-map]] — Notifications table schema
