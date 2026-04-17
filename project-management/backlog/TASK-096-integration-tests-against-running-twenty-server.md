---
title: "Integration tests against running Twenty server"
id: TASK-096
project: PRJ-004
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #testing, #integration]
---

# TASK-096: Integration tests against running Twenty server

## User Stories

- As a Developer, I want integration tests that verify CPQ works end-to-end against a real database so that I can catch bugs that unit tests miss.

## Outcomes

Test suite that: runs setupCpq against test workspace, verifies objects exist via GraphQL, creates a quote with line items, converts to contract, runs renewal check.

## Files to Change

_To be determined during implementation._

## Status Log

- 2026-04-12: Created
