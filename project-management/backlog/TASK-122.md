# TASK-122 — Admin: Quote Template Manager
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required for professional document generation

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** to define and manage quote document templates that control the layout, sections, and branding of generated quote PDFs,
**so that** every quote sent to a customer is professionally branded, legally compliant, and includes the right sections based on what products are in the quote.

---

## Background & Context

Quote document quality directly affects deal close rates and customer trust. A generic looking quote loses to a beautifully formatted one. Template management lets admins define:

- Multiple templates (e.g., "Standard Quote", "Enterprise Proposal", "Renewal Notice")
- Which columns to show in the line item table
- Which sections are conditional (only shown when certain products are present)
- Header/footer content with logo and legal text
- Merge fields that pull live data from the quote record

Analogous to Salesforce CPQ's `Quote Template`, `Template Content`, and `Template Section` objects.

---

## Features Required

### 1. Template List
- Table: Name, Is Default, Line Item View, Last Modified By, Last Modified At, Active
- Create, clone, edit, deactivate
- "Preview" button: renders template with sample data
- "Set as Default" action (only one template can be default)

### 2. Template Header Configuration
- **Name** (required, e.g., "Standard Enterprise Quote")
- **Is Default** (toggle — auto-selected for new quotes)
- **Is Active** (toggle)
- **Watermark Text** (e.g., "DRAFT" — auto-removed when status = Approved; "CONFIDENTIAL")
- **Paper Size** (Letter / A4)
- **Font Family** (Sans-Serif / Serif — applies to entire document)
- **Logo URL** (company logo displayed in header)
- **Primary Color** (hex code — used for table headers, section titles)

### 3. Line Item Configuration
Controls what columns appear in the product/pricing table:

- **Line Item View** (SELECT):
  - `Detailed` — all columns visible
  - `Compact` — condensed, fewer columns
  - `Group Total Only` — shows only group subtotals, not individual lines
- **Group Lines By** (SELECT): `Product Family`, `Quote Line Group`, `None`
- **Show Group Subtotals** (toggle)
- **Show Line Numbers** (toggle)
- **Show SKU/Product Code** (toggle)
- **Show Quantity** (toggle — some customers don't need to see qty)
- **Show Billing Frequency** (toggle)
- **Show List Price** (toggle — can be hidden to show only net price)
- **Show Discount Column** (toggle)
- **Show Unit Net Price** (toggle)
- **Show Line Total** (toggle, always shown by default)
- **Show Margin** (toggle — hidden on customer-facing quotes; useful for internal approvals)
- **Show Optional Lines** (toggle — whether optional products appear in customer document)

### 4. Document Sections Builder
A drag-and-drop section composer. Each section is a "Template Content" block:

**Section types:**
- `HTML` — custom rich text / HTML with merge field support
- `Line Items` — the pricing table (rendered automatically from quote data)
- `Quote Summary` — totals block (subtotal, discounts, tax, net total, MRR/ARR)
- `Signature Block` — e-signature fields (customer name, title, signature line, date)
- `Terms & Conditions` — pre-defined legal text (static or linked T&C URL)
- `Page Break` — forces a new page before the next section

**Per section configuration:**
- Section Name (internal label)
- Type (as above)
- Display Order (drag-to-reorder)
- Is Conditional (toggle):
  - Condition field (e.g., `Quote.HasProfessionalServices`)
  - Condition operator / value
  - Example: "Show PS Terms section only when `ProductFamily contains Professional Services`"
- Is Visible to Customer (toggle — internal-only sections hidden from PDF output but shown in internal preview)
- Custom CSS (for HTML sections)

**HTML section editor:**
- Rich text editor (WYSIWYG) with:
  - Merge field picker — browse available fields and insert `{{Quote.AccountName}}`
  - Supported merge contexts: Quote, Account, Contact (primary), User (rep), QuoteLineGroup
  - Image upload
  - Table editor
  - Font size / color / bold / italic
- "Preview with live data" button — renders section with real data from a selected quote

### 5. Template Preview
- Select a quote → render full PDF preview with all sections
- Toggle: Customer View (what customer sees) / Internal View (includes margin, internal-only sections)
- Download preview as PDF

### 6. Template Variables & Merge Fields Reference
- Reference table of all available merge fields with their display names and example values
- Searchable by object and field name
- Copy button: copies merge field syntax to clipboard

---

## Available Merge Fields (PhenoTips-Specific)

**Quote:**
`{{Quote.QuoteNumber}}`, `{{Quote.CreatedDate}}`, `{{Quote.ExpirationDate}}`, `{{Quote.StartDate}}`, `{{Quote.EndDate}}`, `{{Quote.SubscriptionTerm}}`, `{{Quote.BillingFrequency}}`, `{{Quote.PaymentTerms}}`, `{{Quote.NetTotal}}`, `{{Quote.Subtotal}}`, `{{Quote.TaxTotal}}`, `{{Quote.Discount}}`, `{{Quote.MRR}}`, `{{Quote.ARR}}`, `{{Quote.Notes}}`

**Account:**
`{{Account.Name}}`, `{{Account.BillingAddress}}`, `{{Account.BillingCity}}`, `{{Account.BillingCountry}}`, `{{Account.TaxId}}`

**Contact (Primary):**
`{{Contact.FirstName}}`, `{{Contact.LastName}}`, `{{Contact.Title}}`, `{{Contact.Email}}`

**Rep:**
`{{Rep.FirstName}}`, `{{Rep.LastName}}`, `{{Rep.Email}}`, `{{Rep.Phone}}`

**Line-Level (in line item table columns):**
`{{Line.ProductName}}`, `{{Line.SKU}}`, `{{Line.Description}}`, `{{Line.Quantity}}`, `{{Line.BillingFrequency}}`, `{{Line.ListPrice}}`, `{{Line.Discount}}`, `{{Line.NetPrice}}`, `{{Line.LineTotal}}`

---

## Admin UX Requirements

- Section composer is drag-and-drop with visual section cards
- Clicking a section expands inline editor; no page navigation
- "Live Preview" is available at all times in a side panel (updates on edit)
- Template conditions are tested against a real quote for immediate validation
- "Compare templates" view: render the same quote with two templates side-by-side

---

## Definition of Success

- [ ] Admin can create a Standard template and a Renewal template with different sections
- [ ] Line item table shows correct columns based on template settings
- [ ] Conditional section "PS Terms" only appears when a Professional Services line is present
- [ ] Merge fields render correct data from a real PhenoTips quote
- [ ] PDF preview matches exactly what would be sent to a customer
- [ ] Default template is pre-selected on new quote document generation
- [ ] Watermark "DRAFT" appears on quotes that are not yet in Approved status

---

## Method to Complete

### Backend
1. `QuoteTemplate` entity: header configuration fields
2. `TemplateSection` entity: ordered sections per template with type + condition
3. `TemplateSectionContent` entity: HTML content for custom sections
4. `GET /cpq/templates` — list
5. `POST /cpq/templates` — create
6. `PATCH /cpq/templates/:id` — update header
7. `PUT /cpq/templates/:id/sections` — replace sections (atomic)
8. `POST /cpq/templates/:id/preview` — render preview HTML from a given quoteId
9. Merge field resolution engine: `resolveMergeFields(template, quote)` — replaces all `{{...}}` with live values
10. PDF generation: `generatePDF(template, quote)` → returns PDF bytes

### Frontend
1. `QuoteTemplateListPage.tsx`
2. `QuoteTemplateEditorPage.tsx` — full-page editor
3. `TemplateSectionComposer.tsx` — drag-and-drop section list
4. `HtmlSectionEditor.tsx` — rich text with merge field picker
5. `TemplatePreviewPanel.tsx` — live PDF preview in iframe
6. `MergeFieldPicker.tsx` — searchable field reference
7. `useQuoteTemplates` hook

---

## Acceptance Criteria

- AC1: Template with 6 sections renders in correct order in the preview
- AC2: Conditional section correctly appears/disappears based on quote content
- AC3: All merge fields resolve to actual data from the selected test quote
- AC4: PDF output is identical to the preview
- AC5: Template set as default is pre-selected on document generation
- AC6: Watermark renders as a diagonal overlay on each PDF page
- AC7: Two templates with different column configurations produce different table layouts

---

## Dependencies

- TASK-116 (Global Settings) — default template, logo URL, legal name, T&C text
- TASK-131 (Quote Document Generation UI) — uses templates
- TASK-138 (PDF Generation Service) — backend that renders the template

---

## Estimated Effort
**Backend:** 4 days | **Frontend:** 5 days | **Testing:** 1 day
**Total:** 10 days
