---
title: "Cache object list in setup service"
id: TASK-098
project: PRJ-004
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #performance, #setup]
---

# TASK-098: Cache object list in setup service

## User Stories

- As an Admin, I want CPQ setup to be fast so that enabling CPQ doesn't take forever.

## Outcomes

Fetch workspace objects once at start of setupCpq, cache the list, use it for all existence checks instead of N+1 findManyWithinWorkspace calls.

## Files to Change

_To be determined during implementation._

## Status Log

- 2026-04-12: Created
