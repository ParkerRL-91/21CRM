# TASK-125 — Admin: CPQ Integration Settings
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P2 — Required before billing or e-signature can be wired

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** a centralized Integration Settings page within CPQ administration where I can configure connections to billing systems, e-signature providers, tax engines, and ERPs,
**so that** the CPQ system functions as the hub of the quote-to-cash process with data flowing correctly to downstream systems without manual re-entry.

---

## Background & Context

A CPQ that generates quotes in isolation has limited value. Its full value comes from being wired into:
- **E-Signature** (DocuSign/PandaDoc) — digital signing; closes the loop on quote acceptance
- **Billing** (Stripe/Chargebee) — contract activation creates subscription in billing system
- **Tax Engine** (TaxJar/Avalara) — real-time tax calculation for US multi-state
- **ERP/Finance** (NetSuite/QuickBooks) — order-to-invoice sync

This admin page manages all integration credentials and configuration in one place, with test/verify functionality for each integration.

---

## Features Required

### 1. Integration Hub Overview
- Cards for each integration category with status:
  - ✓ Green: Connected & tested
  - ⚠ Yellow: Configured but untested / partially configured
  - ✗ Red: Not configured
  - Gray: Not applicable / disabled

Categories: E-Signature, Billing, Tax Engine, ERP, CRM (internal), Notification

### 2. E-Signature Integration
**Provider selector:** None / DocuSign / PandaDoc / Adobe Sign

**DocuSign configuration:**
- Integration Key (OAuth Client ID) — masked input
- RSA Private Key — secure file upload or paste (masked)
- Account ID
- Environment: Sandbox / Production toggle
- Default Signer Role Name (e.g., "Customer")
- Signature Request Template ID (DocuSign template to use)
- Callback URL (auto-generated, read-only — shows where DocuSign should send webhooks)
- "Test Connection" button → sends test request, displays success/failure
- "Verify Webhook" button → validates webhook endpoint is reachable

**PandaDoc configuration:**
- API Key (masked)
- Template IDs per quote template
- Workspace ID
- Environment: Sandbox / Production
- Callback URL

**Behavior settings (shared across providers):**
- Auto-send for signature when quote status = `Approved`
- Signature required before Order generation
- Signed document storage: attach to Quote / store in document management / both
- Signing expiration (days): 7 / 14 / 30 / Never

### 3. Billing System Integration
**Provider selector:** None / Stripe / Chargebee / Zuora / Custom API

**Stripe configuration:**
- Secret Key (masked, prefix: `sk_live_` or `sk_test_`)
- Publishable Key (masked)
- Webhook Signing Secret (masked)
- Environment: Test / Live
- Product Mapping Strategy:
  - `By SKU` — Stripe Product IDs are looked up by CPQ product SKU
  - `By Name` — matched by product name (fuzzy)
  - `Manual` — explicit mapping table
- Default Invoice Description template (merge field syntax)
- Metered Billing: toggle — enables usage-based subscription reporting
- "Test Connection" → creates a test customer in Stripe, verifies API key
- "Sync Products" → syncs CPQ product catalog to Stripe Products (creates missing, updates changed)

**Chargebee configuration:**
- Site Name (e.g., `phenotips.chargebee.com`)
- API Key (masked)
- Environment: Test / Live
- Plan ID Mapping (table: CPQ SKU → Chargebee Plan ID)
- Addon ID Mapping (for add-on products)
- Subscription Creation Trigger: `On Order Activation` / `On Contract Activation`

**General billing settings:**
- Create billing subscription automatically on contract activation
- Send billing confirmation email from billing provider
- Sync invoices back to CPQ contract record
- Failed payment webhook handling: create task / notify rep / both

### 4. Tax Engine Integration
**Provider selector:** None / TaxJar / Avalara / Manual (rules-based, TASK-123)

**TaxJar configuration:**
- API Token (masked)
- From Address (nexus address for PhenoTips)
- Product Tax Code (default TaxJar product code for software)
- Exemption handling: auto-check exemption certificate in TaxJar

**Avalara configuration:**
- Account ID, License Key (masked)
- Company Code
- Environment: Sandbox / Production

**Behavior:**
- Calculate tax in real-time on quote save, or batch on document generation
- Show tax on quotes before/after quoting to customer toggle

### 5. ERP Integration (NetSuite / QuickBooks)
**Provider selector:** None / NetSuite / QuickBooks / Custom

**NetSuite configuration (read-only display of connected accounts):**
- Connection method: OAuth 2.0 / Token-Based Authentication
- Consumer Key / Consumer Secret / Token ID / Token Secret (all masked)
- Account ID
- Sync Order Lines: sync every line item to NetSuite SO → Invoice flow
- Revenue Recognition: sync to NetSuite Revenue Recognition module

**Sync settings:**
- Trigger: `On Order Activation` / `On Contract Activation`
- Item lookup: By Product Code / By SKU / Manual mapping table
- Customer lookup: By CRM Account ID / By Name / Manual mapping
- Tax code mapping: CPQ tax code → NetSuite tax code

### 6. Notification / Slack Integration
- Slack OAuth → connect workspace
- Channel selector: approval notifications, quote sent notifications, contract signed notifications
- Notification templates (with merge field support)
- Test Slack message button

### 7. Webhook Log
- Table of all outbound webhook deliveries and inbound callbacks: timestamp, event type, payload (truncated), response status, latency
- "Retry" button for failed deliveries
- Filter by integration, event type, status (success / failed / pending)

---

## Admin UX Requirements

- Credentials are always masked (show/hide toggle with copy button)
- Connection test results show inline — success (green checkmark + response time) or failure (red + error detail)
- "Sandbox mode" toggle clearly visible at top of each integration card (prevents accidental prod writes)
- Sensitive credentials stored via vault/secret management (never stored as plain text in DB)
- Webhook log is paginated; auto-refreshes every 30s when viewing

---

## Definition of Success

- [ ] Admin can configure DocuSign with credentials and verify the connection succeeds
- [ ] Admin can configure Stripe and sync the PhenoTips product catalog in one click
- [ ] E-signature sends quote document to customer contact when "Send for Signature" is clicked
- [ ] Contract activation creates a Stripe/Chargebee subscription automatically
- [ ] Webhook log shows every outbound and inbound event with status
- [ ] Credentials are stored encrypted and never exposed in API responses

---

## Method to Complete

### Backend
1. `IntegrationConfig` entity per integration type per workspace (encrypted credential storage)
2. `WebhookLog` entity: event log table
3. Integration adapter classes:
   - `DocuSignAdapter` — send envelope, receive signed callback
   - `StripeAdapter` — create subscription, handle webhooks
   - `ChargebeeAdapter` — create subscription
   - `TaxJarAdapter` — calculate tax
4. `IntegrationService` — orchestrates adapters, routes events
5. `POST /cpq/integrations/docusign/test` — test connection
6. `POST /cpq/integrations/stripe/sync-products` — catalog sync
7. `GET /cpq/integrations/webhook-log` — paginated log

### Frontend
1. `IntegrationHubPage.tsx` at `/settings/cpq/integrations`
2. `IntegrationCard.tsx` — status card per integration
3. `DocuSignConfigPanel.tsx`
4. `StripeConfigPanel.tsx`
5. `TaxJarConfigPanel.tsx`
6. `WebhookLogTable.tsx`
7. `useIntegrationConfig` hook

---

## Acceptance Criteria

- AC1: DocuSign test connection returns success with sandbox credentials
- AC2: Stripe product sync creates Stripe Products for all 40+ CPQ products
- AC3: E-signature send creates an envelope and the customer receives a signing email
- AC4: Contract activation event triggers Stripe subscription creation via webhook
- AC5: Failed webhook delivery appears in the log with retry option
- AC6: API credentials are never returned in plaintext from any API endpoint

---

## Dependencies

- TASK-141 (E-Signature Integration impl) — this task sets up config; TASK-141 implements the flow
- TASK-142 (Billing Sync impl) — config here; implementation in TASK-142
- TASK-123 (Tax Config) — Manual rules here; external provider wired up here

---

## Estimated Effort
**Backend:** 5 days | **Frontend:** 4 days | **Testing:** 2 days
**Total:** 11 days
