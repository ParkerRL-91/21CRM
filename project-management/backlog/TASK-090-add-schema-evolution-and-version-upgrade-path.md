---
title: "Add schema evolution and version upgrade path"
id: TASK-090
project: PRJ-004
status: ready
priority: P2
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #schema, #migration]
---

# TASK-090: Add schema evolution and version upgrade path

## User Stories

- As an Admin, I want CPQ to handle version upgrades gracefully so that new fields are added to existing workspaces without data loss.

## Outcomes

Add version tracking to setup. On setup, compare installed version vs current. If mismatch, run upgrade: add new fields, add new options to SELECT fields, preserve existing data.

## Files to Change

_To be determined during implementation._

## Status Log

- 2026-04-12: Created
