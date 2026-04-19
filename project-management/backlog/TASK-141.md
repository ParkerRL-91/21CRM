# TASK-141 — Integration: E-Signature Flow (DocuSign / PandaDoc)
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Required for digital deal closure

---

## User Story

**As a** sales rep at PhenoTips,
**I want** to send a quote for electronic signature directly from the CRM with one click, track when the customer views and signs, and have the signed document automatically attach to the quote record,
**so that** deal closure is frictionless for the customer and the signed contract is always in the system without manual upload.

---

## Background & Context

E-signature is the final mile of the quote-to-close journey. PhenoTips customers are healthcare and research institutions — they expect professional, legally-binding digital signature workflows, not email PDF attachments.

This task implements the full e-signature integration flow, building on the configuration established in TASK-125 (Integration Settings).

Supported providers: DocuSign (primary), PandaDoc (secondary), Adobe Sign (future).

---

## Features Required

### 1. E-Signature Adapter Interface

Abstract interface to support multiple providers:

```typescript
interface ESignatureAdapter {
  // Send a document for signature
  sendForSignature(envelope: SignatureEnvelope): Promise<SignatureResult>

  // Get current status of an envelope
  getStatus(envelopeId: string): Promise<EnvelopeStatus>

  // Download the signed document
  downloadSignedDocument(envelopeId: string): Promise<Buffer>

  // Verify an incoming webhook payload
  verifyWebhook(payload: unknown, signature: string): Promise<boolean>

  // Process a webhook event
  processWebhookEvent(event: WebhookEvent): Promise<void>
}

type SignatureEnvelope = {
  documentName: string;
  documentBytes: Buffer;
  recipients: Array<{
    email: string;
    name: string;
    role: 'Signer' | 'CC';
    order: number; // signing sequence order
  }>;
  emailSubject: string;
  emailMessage: string;
  expirationDays: number;
};
```

### 2. DocuSign Adapter

```typescript
class DocuSignAdapter implements ESignatureAdapter {
  async sendForSignature(envelope: SignatureEnvelope): Promise<SignatureResult> {
    const accessToken = await this.getAccessToken(); // OAuth 2.0 JWT Grant

    const body = {
      emailSubject: envelope.emailSubject,
      emailBlurb: envelope.emailMessage,
      documents: [{
        documentId: '1',
        name: envelope.documentName,
        documentBase64: envelope.documentBytes.toString('base64'),
        fileExtension: 'pdf',
      }],
      recipients: {
        signers: envelope.recipients
          .filter(r => r.role === 'Signer')
          .map(r => ({
            email: r.email,
            name: r.name,
            recipientId: String(r.order),
            routingOrder: String(r.order),
            tabs: {
              signHereTabs: [
                // Pre-positioned based on DocuSign anchor text in the template
                { anchorString: `/s${r.order}/`, anchorYOffset: '-5', anchorUnits: 'pixels' }
              ],
              dateSignedTabs: [
                { anchorString: `/d${r.order}/`, anchorUnits: 'pixels' }
              ],
            },
          })),
      },
      status: 'sent', // 'created' = draft, 'sent' = live
    };

    const response = await this.docuSignClient.post(
      `/accounts/${this.accountId}/envelopes`,
      body,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return { envelopeId: response.data.envelopeId, status: 'Sent' };
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    if (event.event === 'envelope-completed') {
      // Download signed PDF
      const signedPdf = await this.downloadSignedDocument(event.data.envelopeId);
      // Store and update quote
      await this.eSignatureService.handleSigningComplete(event.data.envelopeId, signedPdf);
    }
    if (event.event === 'envelope-declined') {
      await this.eSignatureService.handleSigningDeclined(event.data.envelopeId);
    }
  }
}
```

### 3. E-Signature Service (Provider-Agnostic)

```typescript
class ESignatureService {
  async sendQuoteForSignature(quoteId: string, options: SendForSignatureOptions): Promise<void> {
    const quote = await this.quoteRepo.findWithRelations(quoteId);
    const document = await this.documentService.getLatestDocument(quoteId);
    const pdfBytes = await this.fileStorage.download(document.storageKey);

    // Build envelope
    const envelope = {
      documentName: `${quote.quoteNumber}_Proposal.pdf`,
      documentBytes: pdfBytes,
      recipients: [
        {
          email: options.recipientEmail || quote.primaryContact.email,
          name: `${quote.primaryContact.firstName} ${quote.primaryContact.lastName}`,
          role: 'Signer',
          order: 1,
        },
        // Optionally add vendor countersignature as order 2
        ...(options.addCountersignature ? [{
          email: this.settings.vendorSignatoryEmail,
          name: this.settings.vendorSignatoryName,
          role: 'Signer',
          order: 2,
        }] : []),
      ],
      emailSubject: options.emailSubject || `PhenoTips Proposal — ${quote.quoteNumber}`,
      emailMessage: options.emailMessage || this.settings.defaultSignatureEmailMessage,
      expirationDays: this.settings.signatureExpirationDays,
    };

    const result = await this.adapter.sendForSignature(envelope);

    // Update quote with e-signature tracking fields
    await this.quoteRepo.update(quoteId, {
      eSignatureProvider: this.settings.provider,
      envelopeId: result.envelopeId,
      signingStatus: 'Sent',
      sentForSignatureAt: new Date(),
    });

    await this.quoteService.updateStatus(quoteId, 'Presented');
    await this.activityLog.record(quoteId, 'E-signature envelope sent', { envelopeId: result.envelopeId });
  }

  async handleSigningComplete(envelopeId: string, signedPdfBytes: Buffer): Promise<void> {
    const quote = await this.quoteRepo.findByEnvelopeId(envelopeId);

    // Store signed document
    await this.documentService.storeSignedDocument(quote.id, signedPdfBytes);

    // Update quote
    await this.quoteRepo.update(quote.id, {
      signingStatus: 'Completed',
      signedAt: new Date(),
    });

    await this.quoteService.updateStatus(quote.id, 'Accepted');
    await this.activityLog.record(quote.id, 'Quote signed by customer', { envelopeId });
    await this.notificationService.notifySigningComplete(quote.id);
  }

  async handleSigningDeclined(envelopeId: string): Promise<void> {
    const quote = await this.quoteRepo.findByEnvelopeId(envelopeId);
    await this.quoteRepo.update(quote.id, { signingStatus: 'Declined' });
    await this.quoteService.updateStatus(quote.id, 'Rejected');
    await this.notificationService.notifySigningDeclined(quote.id);
  }
}
```

### 4. Webhook Endpoint

```typescript
@Controller('/webhooks')
class WebhookController {
  @Post('/docusign')
  @HttpCode(200)
  async docuSignWebhook(@Body() body: unknown, @Headers('x-docusign-signature-1') sig: string) {
    const isValid = await this.docuSignAdapter.verifyWebhook(body, sig);
    if (!isValid) throw new UnauthorizedException('Invalid webhook signature');
    await this.docuSignAdapter.processWebhookEvent(body as WebhookEvent);
  }

  @Post('/pandadoc')
  @HttpCode(200)
  async pandaDocWebhook(@Body() body: unknown, @Headers('x-pandadoc-signature') sig: string) {
    const isValid = await this.pandaDocAdapter.verifyWebhook(body, sig);
    if (!isValid) throw new UnauthorizedException('Invalid webhook signature');
    await this.pandaDocAdapter.processWebhookEvent(body as WebhookEvent);
  }
}
```

### 5. Signing Status Tracking

New fields on the Quote entity:
- `eSignatureProvider` — `docusign` | `pandadoc` | `adobesign` | null
- `envelopeId` — provider's envelope/document ID
- `signingStatus` — `Not Sent` | `Sent` | `Viewed` | `Completed` | `Declined` | `Expired`
- `sentForSignatureAt` — timestamp
- `signedAt` — timestamp (when all signers complete)
- `signingUrl` — URL for rep to track in provider's dashboard
- `signedDocumentStorageKey` — storage path for the signed PDF

### 6. Signing Status Polling (Fallback for Webhooks)

If webhooks are not reachable (dev environments, behind firewalls):
- Every 15 minutes, poll the e-signature API for status of all `Sent` envelopes
- Update `signingStatus` on quotes where status has changed
- Queue: `esignature-status-poll` (BullMQ, repeating every 15 minutes)

---

## Definition of Success

- [ ] Rep can click "Send for Signature" and the customer receives a signing email within 60 seconds
- [ ] Customer signs in DocuSign; quote status updates to `Accepted` within 2 minutes
- [ ] Signed PDF is automatically attached to the quote record (downloadable)
- [ ] If customer declines, quote status updates to `Rejected` and rep is notified
- [ ] Webhook signature validation prevents fake webhook events from updating quote status

---

## Method to Complete

1. `ESignatureAdapter` interface
2. `DocuSignAdapter` implementation
3. `PandaDocAdapter` implementation (secondary)
4. `ESignatureService` — provider-agnostic orchestration
5. `WebhookController` — per-provider webhook endpoints
6. `ESignatureStatusPollingJob` — fallback polling job
7. Add e-signature fields to Quote entity + migration
8. Routes: `POST /cpq/quotes/:id/send-for-signature`, `GET /cpq/quotes/:id/signing-status`

---

## Acceptance Criteria

- AC1: DocuSign envelope created with the correct document and recipients within 5 seconds
- AC2: Webhook received from DocuSign on signing completion; quote updated within 60 seconds
- AC3: Signed PDF stored and accessible via quote Documents tab
- AC4: Invalid webhook signature (tampered payload) returns 401 and does not process the event
- AC5: Signing status polling correctly updates status when webhooks are not available

---

## Dependencies

- TASK-125 (Integration Settings) — DocuSign credentials
- TASK-131 (Document Generation) — PDF bytes passed to signing
- TASK-138 (PDF Generation Service) — generates the document sent for signature

---

## Estimated Effort
**Backend:** 4 days | **Testing:** 2 days
**Total:** 6 days
