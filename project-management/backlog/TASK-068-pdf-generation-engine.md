---
title: "PDF generation engine (@react-pdf/renderer)"
id: TASK-068
project: PRJ-003
status: ready
priority: P0
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #pdf, #engine]
---

# TASK-068: PDF generation engine

## User Stories
- As a Sales Rep, I want to generate a branded PDF quote from a quote record so I can present a professional proposal.

## Outcomes
PDF generation using @react-pdf/renderer. React components define quote layout: header (logo, company info, quote number), line items table (grouped by sections), totals, terms & conditions. Renders server-side to buffer/stream.

## Success Metrics
- [ ] `POST /api/quotes/[id]/generate-pdf` — generates PDF and stores as attachment
- [ ] PDF includes: logo, quote number, version, date, expiration, customer info
- [ ] Line items table: product, description, qty, unit price, discount, net price
- [ ] Grouped by quote line groups with subtotals
- [ ] Summary: subtotal, discount, tax, grand total
- [ ] Terms and conditions section
- [ ] Generation <5 seconds for 50 line items
- [ ] Generated PDF stored with filename: `{Company}_Quote_{Number}_v{Version}_{Date}.pdf`
- [ ] Previously generated PDFs preserved (not overwritten)

## Files to Change
- `src/lib/cpq/pdf/quote-pdf-template.tsx` — NEW: React PDF components
- `src/lib/cpq/pdf/pdf-generator.ts` — NEW: Generation service
- `src/app/api/quotes/[id]/generate-pdf/route.ts` — NEW
