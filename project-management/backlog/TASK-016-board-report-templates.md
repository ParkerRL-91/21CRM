---
title: "Board-Ready Report Templates"
id: TASK-016
project: PRJ-001
status: done
priority: P3
created: 2026-03-22
updated: 2026-03-22
tags: [#task, #reports, #ux]
---

# TASK-016: Board-Ready Report Templates

## User Stories

- As a CRO, I want to generate a polished board report with one click that includes quarterly revenue, pipeline health, forecast accuracy, and team performance.
- As a revenue leader, I want to export a board-ready PDF or slide-compatible view that I don't have to manually format.

## Outcomes

1. Reports page has "Board Templates" section with pre-built templates:
   - Quarterly Business Review (QBR)
   - Monthly Revenue Report
   - Pipeline Health Summary
2. Each template auto-populates with current data
3. Export to PDF or print-friendly format
4. Templates are visually polished — clean typography, proper spacing, branded headers

## Success Metrics

- [ ] At least 2 templates available
- [ ] Templates auto-fill with real data (no manual entry)
- [ ] Export to PDF works cleanly
- [ ] Templates look professional without customization

## Implementation Plan

1. Define report template schemas (which sections, which data sources, which charts)
2. Build a report renderer component that takes a template + data → formatted output
3. Add to reports page as "Templates" tab
4. Use browser print CSS or a PDF library for export

## Files to Change

- `src/lib/reports/board-templates.ts` — NEW: template definitions
- `src/app/(dashboard)/reports/page.tsx` — add templates section
- `src/components/reports/report-renderer.tsx` — NEW: template renderer
- `src/components/reports/print-styles.css` — NEW: print/PDF styles

## Status Log

- 2026-03-22: Created as part of PRJ-001. Gap G-16 (Kluster board reporting).

## Takeaways

_To be filled during execution_
