# TASK-131 — User: Quote Document Generation & Delivery
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required to send a professional proposal to customers

---

## User Story

**As a** sales rep at PhenoTips,
**I want** to generate a professional, branded PDF quote document from my approved quote with one click, preview it before sending, and deliver it to the customer via email or DocuSign — all without leaving the CRM,
**so that** I can send a polished proposal in minutes and track whether the customer has viewed or signed it.

---

## Background & Context

The quote document is the customer-facing output of the entire CPQ process. It must be:
- **Professional:** PhenoTips branded with correct logo, colors, legal footer
- **Accurate:** All prices, discounts, and terms exactly as configured
- **Complete:** Includes the right sections based on the products in the quote
- **Traceable:** The system knows when it was generated, sent, viewed, and signed

The rep should have zero formatting work to do. The template (configured in TASK-122) handles all layout decisions.

---

## Features Required

### 1. Generate Document Action

Available on the Quote record when status = `Approved` (or earlier as a draft preview — clearly watermarked):

**"Generate Document" button** → opens the Document Generation modal:

**Modal: Generate Quote Document**
```
Template:         [Standard Enterprise Quote ▾]  (default pre-selected)
                  [ ] Standard Enterprise Quote ✓ (default)
                  [ ] Renewal Notice
                  [ ] Healthcare Institutional Quote

Output Format:    ⊙ PDF   ○ PDF + Word

Preview:          [Preview Document]

[Generate & Continue →]
```

**Preview:**
- Clicking "Preview Document" renders an iframe with the PDF in the browser
- Preview is clearly watermarked "DRAFT" if status < Approved
- Rep can switch template and re-render preview immediately
- Full-page preview option (opens in new browser tab)

**Generate:**
- Generates final PDF (no watermark if Approved; watermark "DRAFT" if still in Draft/Review)
- Stores the PDF as an attachment on the Quote record
- Version number appended: `QTE-2026-0042-v1.pdf`, `QTE-2026-0042-v2.pdf` (incremented on regeneration)
- Previous versions preserved (not overwritten)

### 2. Document Section Rendering

The generated PDF includes sections as configured in the template (TASK-122):

**Cover Page:**
- PhenoTips logo (from settings)
- "Proposal Prepared for [Account Name]"
- Quote Number, Prepared By (rep name, email, phone), Date, Expiration Date

**Executive Summary (if configured):**
- Customer-facing narrative about the proposed solution
- Rich text from `Quote.customerNotes` field (editable by rep on quote)

**Product & Pricing Table:**
- Groups by Product Family (if template config says so)
- Columns per template configuration: Name | Qty | Term | List Price | Discount | Net Price | Total
- Sub-totals per group
- Bundle components shown indented under bundle parent (or collapsed to bundle total, per template)
- Optional lines marked "(Optional)" — shown or hidden per template setting

**Pricing Summary:**
- Subtotal | Discount | Net Recurring Total | One-Time Total | Tax | Grand Total
- MRR / ARR line
- First-year total commitment

**Terms & Conditions:**
- Static legal text configured in template
- "Governing Law", "Payment Terms", "Cancellation Policy" sections
- Conditional: "Professional Services Addendum" section only if PS products are on the quote

**Signature Block:**
- Customer: Name, Title, Date, Signature Line
- Vendor: Pre-signed by authorized PhenoTips signatory (or e-signature placeholder)
- E-signature field tags (DocuSign/PandaDoc) when e-signature is enabled

### 3. "Send Draft Preview" Quick Action

**Available directly from the Quote Line Editor** (TASK-128) — does NOT require navigating to the Documents tab:

A "Send Draft Preview" button in the Quote Line Editor top action bar:
```
[Send Draft Preview]  (appears when quote status = Draft, In Review, or Approved)
```

Clicking opens a slim modal (not the full document generation modal):
```
Send Draft Preview

Template:   [Standard Enterprise Quote ▾] (default)
To:         lisa.chen@partner.com         (primary contact, editable)
Message:    [optional note to contact]

This document will be clearly watermarked "DRAFT".
The quote status will NOT change to Presented.

[Send Preview →]   [Cancel]
```

**Purpose:** Allows reps to share a draft quote with the customer for early review and alignment before it goes through the approval process. The draft preview:
- Is watermarked "DRAFT — NOT FOR SIGNING"
- Does NOT update the quote status (stays in Draft/In Review)
- IS logged as a Draft Preview activity on the quote timeline
- Does NOT count as "Presented" in analytics (separate tracking)

### 4. Document Delivery

After generating the document (Approved status):

**Option A: Send via Email**
```
To:           lisa.chen@partner.com (Primary Contact — pre-filled)
Cc:           (optional additional recipients)
Subject:      PhenoTips Proposal — QTE-2026-0042 (pre-filled, editable)
Message:      [pre-filled email template from settings, editable]

Attach:       ✓ QTE-2026-0042-v1.pdf

[Send Email →]
```

- Email is logged as an Activity on the Quote and on the Opportunity
- Quote status automatically updates to `Presented` on send
- "Presentation Date" field on Quote is stamped

**Option B: Send for E-Signature (DocuSign/PandaDoc)**
```
Recipient:    lisa.chen@partner.com — Lisa Chen, VP Finance
Sign order:   Customer first, then PhenoTips countersignature

[Send for Signature →]
```

- Pushes the PDF to the configured e-signature provider
- Creates an envelope/document record in DocuSign/PandaDoc
- Updates Quote with: `eSignatureProvider`, `envelopeId`, `signingUrl` (for tracking)
- Quote status → `Presented`
- When customer signs: callback updates Quote status → `Accepted`, attaches signed PDF

**Option C: Copy Shareable Link**
- Generates a time-limited (expiration-date-aware) shareable link to the PDF
- Customer can view the document in their browser without downloading
- View events are tracked (document opened, time spent, pages viewed if provider supports it)

### 4. Document Versioning & History

On the Quote's "Documents" tab:

```
Documents

v3  QTE-2026-0042-v3.pdf  Generated Apr 19, 2026  Sent to customer Apr 19  [View] [Download] [Send]
v2  QTE-2026-0042-v2.pdf  Generated Apr 18, 2026  (Not sent)              [View] [Download]
v1  QTE-2026-0042-v1.pdf  Generated Apr 16, 2026  (Not sent)              [View] [Download]
```

- Only the latest version is shown prominently; older versions are collapsed/archived
- Each version shows: template used, generated by, generated at, sent at, sent to

### 5. Document Tracking & Engagement

When a tracking link is enabled:
```
Document Activity:
  Apr 19, 2026 — Sent to lisa.chen@partner.com
  Apr 19, 2026, 3:42 PM — Document opened (35 min viewing time)
  Apr 19, 2026, 4:22 PM — Signed by Lisa Chen
```

When using DocuSign:
- Signing status appears on the quote: "Awaiting Signature", "Signed", "Declined"
- Signed document is automatically attached to the quote record when completed

### 6. Document Regeneration Warning

If a rep makes changes to the quote (adds a line, changes a discount) after a document has been generated and sent:

```
⚠ Quote lines have changed since the document was last generated.
The document shown to the customer may be out of date.
[Regenerate Document]
```

The warning is shown on the quote detail page whenever the quote is modified after a document is sent.

---

## UX Requirements

- Document generation completes in < 5 seconds for a standard 5-line quote
- Preview is rendered in a browser-native PDF viewer (no external tool required)
- Email composition uses a real email composer (not just a simple text area)
- "Send for Signature" button is only shown when e-signature is configured (TASK-125)
- Document tracking events appear in the standard Twenty activity timeline
- Accessibility: all buttons and actions are keyboard accessible

---

## Definition of Success

- [ ] Rep can generate a PDF in < 5 seconds with the correct template applied
- [ ] PDF shows all products with correct prices, discounts, and totals
- [ ] Conditional sections (PS Terms) appear only when PS products are on the quote
- [ ] Merge fields (Account Name, Quote Number, Rep Name, etc.) all resolve correctly
- [ ] Email delivery creates an activity record and updates Quote status to Presented
- [ ] E-signature envelope is created in DocuSign and customer receives signing email
- [ ] Signed PDF is automatically attached to the quote on completion
- [ ] Document version history shows all generated versions

---

## Method to Complete

### Backend
1. `DocumentGenerationService.generate(quoteId, templateId)` → returns PDF bytes
2. Template renderer: resolves merge fields, evaluates conditional sections, renders HTML → PDF (using Puppeteer or react-pdf)
3. `DocumentService.storeDocument(quoteId, pdfBytes, version)` — stores in file storage (S3)
4. Email service: `sendQuoteDocument(quoteId, toEmail, subject, message)`
5. E-signature service: `sendForSignature(quoteId, recipientEmail)` (wraps DocuSign adapter from TASK-125)
6. `POST /cpq/quotes/:id/generate-document` — generate and store
7. `POST /cpq/quotes/:id/send-document` — email delivery
8. `POST /cpq/quotes/:id/send-for-signature` — e-signature flow
9. `GET /cpq/quotes/:id/documents` — list all versions

### Frontend
1. `GenerateDocumentModal.tsx` — template selector + format selector + preview
2. `DocumentPreviewIframe.tsx` — PDF preview in modal
3. `SendDocumentModal.tsx` — email composition modal
4. `SendForSignatureModal.tsx` — e-signature recipient configuration
5. `DocumentVersionsTab.tsx` — document history on quote detail
6. `DocumentTrackingTimeline.tsx` — view/sign events
7. `OutdatedDocumentWarning.tsx` — warning banner
8. `useDocumentGeneration` hook

---

## Acceptance Criteria

- AC1: Generated PDF has the correct company logo and colors from settings
- AC2: All merge fields resolve correctly for a real PhenoTips quote
- AC3: A quote with PS lines shows the "Professional Services Addendum" section; without PS lines it is absent
- AC4: Sending via email logs an activity on the quote AND the related opportunity
- AC5: Quote status transitions from `Approved` → `Presented` on document send
- AC6: DocuSign envelope is created with recipient email and a callback URL
- AC7: When the customer signs in DocuSign, the quote status updates to `Accepted` within 60 seconds
- AC8: Regenerating the document increments the version counter and preserves previous versions

---

## Dependencies

- TASK-122 (Quote Template Manager) — templates are defined here
- TASK-125 (Integration Settings) — DocuSign credentials
- TASK-126 (Quote Builder) — quote record
- TASK-138 (PDF Generation Service) — backend rendering service

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 4 days | **Testing:** 2 days
**Total:** 10 days
