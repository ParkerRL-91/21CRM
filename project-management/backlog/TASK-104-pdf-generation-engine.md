---
title: "Build PDF quote generation with @react-pdf/renderer"
id: TASK-104
project: PRJ-004
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #twenty, #pdf, #templates]
---

# TASK-104: Build PDF quote generation with @react-pdf/renderer

## User Stories

- As a Sales Rep, I want to generate a branded PDF quote so that I can present a professional proposal to the customer.
- As a Sales Manager, I want configurable PDF templates (logo, colors, columns, terms) so that documents match our brand without developer involvement.

## Outcomes

CpqPdfService (NestJS injectable) renders quote data as PDF using @react-pdf/renderer. QuoteTemplate object stores template configuration (logo URL, colors, columns, T&C text). Generated PDFs stored as Twenty file attachments on the quote record.

## Success Metrics

- [ ] QuoteTemplate object created by setup service
- [ ] CpqPdfService.generate(quoteId, templateId) renders PDF buffer
- [ ] PDF includes: header (logo, company info, quote number), line items table (grouped by sections), totals, terms
- [ ] PDF generation endpoint: POST /cpq/generate-pdf
- [ ] Generated PDF stored as file attachment via Twenty's file system
- [ ] Template config stored as RAW_JSON: { logoUrl, primaryColor, companyName, footerText, lineColumns, termsText }
- [ ] Generation <5 seconds for 50 line items

## Dependencies

- @react-pdf/renderer package (already installed in twenty subtree)
- TASK-103 (QuoteLineGroup for section headers in PDF)

## Files to Change

- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-setup.service.ts` — add QuoteTemplate object
- `twenty/packages/twenty-server/src/modules/cpq/services/cpq-pdf.service.ts` — NEW
- `twenty/packages/twenty-server/src/modules/cpq/templates/quote-pdf-template.tsx` — NEW: React PDF component
- `twenty/packages/twenty-server/src/modules/cpq/cpq.controller.ts` — add PDF endpoint
- `twenty/packages/twenty-server/src/modules/cpq/cpq.module.ts` — register service
