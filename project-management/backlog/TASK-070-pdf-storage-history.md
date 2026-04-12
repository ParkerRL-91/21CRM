---
title: "PDF storage & version history"
id: TASK-070
project: PRJ-003
status: done
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pdf, #storage]
---

# TASK-070: PDF storage & version history

## User Stories
- As a Sales Rep, I want generated PDFs saved as attachments so I can access historical versions.

## Outcomes
PDF files stored locally (filesystem or object storage). Quote detail page shows list of generated PDFs with download/preview. Each generation creates a new file (not overwrite).

## Success Metrics
- [ ] `quote_attachments` table tracking generated files
- [ ] Files stored in configurable location (local FS or S3-compatible)
- [ ] Download and preview from quote detail page
- [ ] Version history: list of all generated PDFs per quote
- [ ] Filename format: `{Company}_Quote_{Number}_v{Version}_{Date}.pdf`

## Files to Change
- `src/lib/db/cpq-schema.ts` — MODIFY: Add quote_attachments table
- `src/lib/cpq/pdf/file-storage.ts` — NEW
- `src/app/api/quotes/[id]/attachments/route.ts` — NEW
