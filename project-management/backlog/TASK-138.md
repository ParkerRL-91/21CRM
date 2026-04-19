# TASK-138 — Backend: Quote Document PDF Generation Service
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required for customer-facing quote delivery

---

## User Story

**As a** CPQ system,
**I need** a PDF generation service that renders a quote template with live quote data into a pixel-perfect branded PDF,
**so that** every generated quote document accurately represents the deal terms and is indistinguishable from a manually designed proposal.

---

## Background & Context

PDF generation is surprisingly complex for CPQ. A quote document may include:
- Custom HTML/CSS branded sections
- Dynamic line item tables (variable number of rows, complex column layouts)
- Conditional sections (only appear when certain products are present)
- Merge fields pulling data from multiple related objects
- Page breaks between sections
- Header/footer on every page
- Watermarks overlaid on every page
- E-signature field tags (DocuSign positioning)

The two most common approaches in production CPQ systems:
1. **Headless browser (Puppeteer/Playwright)**: render HTML→PDF; handles CSS layouts perfectly; slower (1–3s per doc)
2. **React-PDF / PDFKit**: programmatic PDF generation; faster but harder to achieve complex layouts

Recommendation: **Puppeteer** for initial implementation (correctness > performance for document generation).

---

## Features Required

### 1. Template Rendering Engine

```typescript
class QuoteDocumentRenderer {
  async renderHTML(quoteId: string, templateId: string): Promise<string> {
    // 1. Load template + sections (from TASK-122 template structure)
    const template = await this.templateRepo.findById(templateId);
    const sections = await this.templateSectionRepo.findByTemplate(templateId, { ordered: true });

    // 2. Load quote data (quote + lines + account + contact + rep)
    const quoteContext = await this.buildQuoteContext(quoteId);

    // 3. For each section:
    const sectionHTMLs = [];
    for (const section of sections) {
      // a. Evaluate conditional: should this section appear?
      if (section.isConditional) {
        const conditionMet = await this.evaluateCondition(section.condition, quoteContext);
        if (!conditionMet) continue;
      }
      // b. Render section HTML based on type
      const html = await this.renderSection(section, quoteContext, template);
      sectionHTMLs.push(html);
    }

    // 4. Assemble document HTML with header, footer, page-break rules
    return this.assembleDocument(template, sectionHTMLs);
  }
}
```

### 2. Section Renderers

**HTML Section Renderer:**
```typescript
renderHTMLSection(section: TemplateSection, context: QuoteContext): string {
  // Replace merge fields: {{Quote.AccountName}} → actual value
  return this.resolveMergeFields(section.content, context);
}
```

**Line Item Table Renderer:**
```typescript
renderLineItemTable(template: QuoteTemplate, context: QuoteContext): string {
  const { lines, template: tmpl } = context;
  const groupedLines = this.groupLines(lines, tmpl.groupLinesBy);

  return `
    <table class="line-items">
      <thead>
        <tr>
          ${tmpl.showLineNumbers ? '<th>#</th>' : ''}
          <th>Product</th>
          ${tmpl.showSKU ? '<th>SKU</th>' : ''}
          ${tmpl.showQuantity ? '<th>Qty</th>' : ''}
          ${tmpl.showBillingFrequency ? '<th>Billing</th>' : ''}
          ${tmpl.showListPrice ? '<th>List Price</th>' : ''}
          ${tmpl.showDiscount ? '<th>Discount</th>' : ''}
          ${tmpl.showUnitPrice ? '<th>Unit Price</th>' : ''}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${this.renderLineGroups(groupedLines, tmpl)}
      </tbody>
      <tfoot>
        ${this.renderQuoteTotals(context.quote, tmpl)}
      </tfoot>
    </table>
  `;
}
```

**Quote Summary Renderer:**
Renders the totals block:
```html
<div class="quote-summary">
  <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal, currency)}</span></div>
  <div class="summary-row discount"><span>Discount (${discountPct}%)</span><span>-${formatCurrency(discount, currency)}</span></div>
  <div class="summary-row"><span>Net Total</span><span>${formatCurrency(netTotal, currency)}</span></div>
  ${tax > 0 ? `<div class="summary-row"><span>${taxLabel}</span><span>${formatCurrency(tax, currency)}</span></div>` : ''}
  <div class="summary-row grand-total"><span>Grand Total</span><span>${formatCurrency(grandTotal, currency)}</span></div>
  <div class="summary-row"><span>First-Year Commitment</span><span>${formatCurrency(firstYearTotal, currency)}</span></div>
</div>
```

**Signature Block Renderer:**
```html
<div class="signature-block">
  <div class="signature-party">
    <p>Accepted by (Customer):</p>
    <div class="signature-line">_________________________</div>
    <p>Name: ${contact.firstName} ${contact.lastName}</p>
    <p>Title: ${contact.title}</p>
    <p>Date: _________________________</p>
  </div>
  <div class="signature-party">
    <p>PhenoTips Inc.:</p>
    <div class="signature-line">_________________________</div>
    <p>Name: _________________________</p>
    <p>Title: Authorized Signatory</p>
    <p>Date: _________________________</p>
  </div>
</div>
```

For e-signature: add DocuSign anchor tags:
```html
<span class="docusign-anchor" data-field-type="SignHere" data-recipient="1" data-tab-label="CustomerSignature">/s1/</span>
```

### 3. Merge Field Resolution Engine

```typescript
resolveMergeFields(template: string, context: QuoteContext): string {
  // Replace all {{Object.Field}} tokens
  return template.replace(/\{\{([^}]+)\}\}/g, (match, fieldPath) => {
    try {
      const value = this.getNestedValue(context, fieldPath.trim());
      return this.formatValue(value, fieldPath);
    } catch {
      return `[${fieldPath}]`; // Show unfilled field rather than crashing
    }
  });
}

// Supports dot notation: Quote.Account.Name, Rep.Email, etc.
getNestedValue(context: QuoteContext, path: string): unknown {
  return path.split('.').reduce((obj, key) => obj?.[key], context);
}
```

**Supported context objects:**
- `Quote.*` — all quote header fields
- `Account.*` — account fields
- `Contact.*` — primary contact fields
- `Rep.*` — quote owner (sales rep) fields
- `Workspace.*` — workspace settings (company name, logo URL)

### 4. Watermark Rendering

```typescript
addWatermark(html: string, watermarkText: string): string {
  if (!watermarkText) return html;
  // Inject a fixed-position div that repeats diagonally across each page
  const watermarkCSS = `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      opacity: 0.08;
      color: #000;
      font-weight: bold;
      white-space: nowrap;
      z-index: 1000;
      pointer-events: none;
    }
  `;
  return html.replace('</body>', `<div class="watermark">${watermarkText}</div></body>`);
}
```

### 5. PDF Generation (Puppeteer)

```typescript
async generatePDF(html: string, options: PDFOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ content: this.getBaseCSS() });
    const pdf = await page.pdf({
      format: options.paperSize || 'Letter',
      printBackground: true,
      margin: { top: '1in', right: '0.75in', bottom: '1in', left: '0.75in' },
      displayHeaderFooter: true,
      headerTemplate: this.renderHeaderTemplate(options),
      footerTemplate: this.renderFooterTemplate(options),
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
```

**Performance optimization:**
- Browser instance pooling (reuse across requests, max pool size = 5)
- Queue-based generation: max 5 concurrent PDF jobs; others queue
- Timeout: 30 seconds max per document

### 6. Document Storage

```typescript
async storeDocument(quoteId: string, pdfBuffer: Buffer, templateId: string): Promise<StoredDocument> {
  const version = await this.getNextVersion(quoteId);
  const key = `quotes/${quoteId}/QTE-${quoteNumber}-v${version}.pdf`;
  const url = await this.fileStorage.upload(key, pdfBuffer, 'application/pdf');

  return this.documentRepo.create({
    quoteId, templateId, version, storageKey: key, storageUrl: url,
    generatedAt: new Date(), generatedByUserId: userId, fileSizeBytes: pdfBuffer.length,
  });
}
```

File storage: S3-compatible (works with AWS S3, Supabase Storage, MinIO).

### 7. CSS Base Stylesheet

A professional base stylesheet applied to all quote documents:
- Clean sans-serif typography (Inter or system-sans)
- Table with alternating row colors (#f9f9f9)
- Bold, colored group headers matching `template.primaryColor`
- Proper page break rules: `page-break-inside: avoid` on table rows, signature block
- Logo image aligned top-right on the first page
- Page numbers in footer
- Quote number + "Confidential" in the header

---

## Definition of Success

- [ ] PDF generation for a 10-line quote completes in < 5 seconds
- [ ] Logo, company name, and primary color render correctly from settings
- [ ] Conditional sections appear/disappear based on quote line products
- [ ] All merge fields resolve correctly (no `[unfilled]` tokens in output)
- [ ] Watermark "DRAFT" renders as a diagonal overlay on every page for unapproved quotes
- [ ] Page numbers appear in the footer
- [ ] Line item table rows do not split across page breaks
- [ ] PDF is accessible as a file download and can be opened in any standard PDF viewer

---

## Method to Complete

1. `QuoteDocumentRenderer` — HTML rendering from template + context
2. `MergeFieldResolver` — dot-notation field resolution
3. `LineItemTableRenderer` — dynamic table with configurable columns
4. `PDFGeneratorService` — Puppeteer-based HTML→PDF
5. `BrowserPool` — Puppeteer instance pool management
6. `DocumentStorageService` — S3 upload + URL generation
7. `DocumentVersionService` — version number management
8. Install: `puppeteer`, `@aws-sdk/client-s3` (or equivalent)
9. `POST /cpq/quotes/:id/generate-document` — full generation + storage endpoint
10. Unit tests: merge field resolution, section conditional logic
11. Integration test: full PDF generation with a real test quote

---

## Acceptance Criteria

- AC1: Rendering a quote template with 6 sections produces an HTML document with all sections in the correct order
- AC2: Merge field `{{Quote.Account.Name}}` resolves to the account name from the test quote
- AC3: Conditional section with `condition: Quote.HasPSProduct = true` only appears when a PS line exists
- AC4: PDF is generated in < 5 seconds for a 10-line quote (p95)
- AC5: Watermark appears on every page when `watermarkText = "DRAFT"`
- AC6: File is uploaded to storage and a URL is returned that resolves to the PDF
- AC7: Version number increments on each generation (v1, v2, v3...)

---

## Dependencies

- TASK-122 (Quote Template Manager) — templates stored in DB
- TASK-131 (Document Generation UI) — frontend that calls this service
- TASK-125 (Integration Settings) — storage provider config

---

## Estimated Effort
**Backend:** 5 days | **Testing:** 2 days
**Total:** 7 days
