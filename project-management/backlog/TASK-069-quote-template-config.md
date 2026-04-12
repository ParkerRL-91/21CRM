---
title: "Quote template configuration & management"
id: TASK-069
project: PRJ-003
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pdf, #templates]
---

# TASK-069: Quote template configuration

## User Stories
- As a Sales Manager, I want to configure quote PDF templates (logo, colors, columns, terms) without developer involvement.

## Outcomes
Template configuration stored in database: logo URL, primary color, company address, footer, selected columns, T&C text. Multiple templates (Standard, Enterprise, Partner). Settings UI at `/settings/quote-templates`.

## Success Metrics
- [ ] `quote_templates` table with JSONB config
- [ ] Multiple templates per org
- [ ] Template selector at PDF generation time
- [ ] Settings UI for template management
- [ ] Template changes don't affect previously generated PDFs
- [ ] Conditional sections (show services section only if service lines exist)

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add quote_templates table
- `src/app/(dashboard)/settings/quote-templates/page.tsx` — NEW
- `src/components/cpq/template-editor.tsx` — NEW
