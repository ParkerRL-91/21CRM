# TASK-116 — Admin: Global CPQ Settings Screen
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P0 — Must ship before any other CPQ screen

---

## User Story

**As a** Revenue Operations admin at PhenoTips,
**I want** a single Global CPQ Settings screen where I can configure system-wide defaults for quoting behavior,
**so that** every sales rep works within consistent guardrails without needing custom configuration per quote.

---

## Background & Context

Before a sales rep can create a single quote, an admin must configure the CPQ system. The Global Settings screen is the control center. It sets defaults that cascade down to all quotes, products, and approvals. Getting this wrong causes pricing errors, missed approvals, and non-compliant quotes. This screen is rarely visited but critically important — think of it as the "engine room."

Analogous to Salesforce CPQ's "CPQ Package Settings" page, which configures defaults for quoting, pricing, contracting, and PDF generation.

---

## Features Required

### 1. Quote Defaults Section
- **Default quote validity (days)** — how many days until a quote expires (default: 30)
- **Default billing frequency** — Monthly / Quarterly / Annual (default: Annual)
- **Default payment terms** — Net 30 / Net 45 / Net 60 / Due on Receipt (default: Net 30)
- **Default subscription term (months)** — 12
- **Default start date behavior** — Today / First of Next Month / Custom (default: First of Next Month)
- **Auto-number quotes** — toggle; format: `QTE-{YYYY}-{NNNN}` (default: on)
- **Quote prefix** — configurable prefix (default: `QTE`)
- **Include tax on quotes by default** — toggle (default: off)
- **Default currency** — USD / GBP / CAD (default: USD)

### 2. Pricing Engine Section
- **Proration model** — Daily / Monthly / None (default: Daily)
- **Rounding rule** — Round to nearest cent / Floor / Ceiling (default: Round)
- **Volume discount basis** — Per line / Aggregate across lines (default: Per line)
- **Allow rep price override** — toggle (default: off)
- **Floor price enforcement** — Hard stop / Warning / Off (default: Warning)
- **List price source** — Standard Price Book / Active Price Book by Account (default: Active Price Book)
- **Tax calculation provider** — None / TaxJar / Avalara / Manual (default: None)

### 3. Approval Settings Section
- **Enable approval workflow** — toggle (default: on)
- **Auto-submit for approval** — when quote is "Ready for Approval" status (default: off)
- **Approval reminder cadence (hours)** — how often to ping approvers (default: 24)
- **Approval expiration (hours)** — how long before an approval request expires (default: 72)
- **Allow approver to edit quote** — toggle (default: off)
- **Parallel vs sequential default** — Parallel / Sequential (default: Sequential)

### 4. Contract & Renewal Section
- **Auto-create contract on quote acceptance** — toggle (default: on)
- **Renewal notice lead time (days)** — how many days before expiry to trigger renewal (default: 90)
- **Auto-generate renewal quote** — toggle (default: on)
- **Default renewal uplift %** — annual price increase applied to renewals (default: 5)
- **Renewal quote owner** — Original owner / Account owner / Specific user (default: Original owner)
- **Contract numbering format** — `CNT-{YYYY}-{NNNN}` (default: on)

### 5. Document Generation Section
- **Default quote template** — dropdown of available templates
- **Company logo URL** — for PDF header
- **Company legal name** — for PDF footer
- **Footer disclaimer text** — rich text, appears on every generated document
- **E-signature provider** — None / DocuSign / PandaDoc (default: None)
- **Signature required before contract** — toggle (default: on)
- **Include itemized pricing** — toggle (default: on)
- **Include terms & conditions** — toggle (default: on)
- **T&C URL or text** — URL or inline text

### 6. Notifications Section
- **Notify rep on approval decision** — toggle (default: on)
- **Notify rep on quote expiry** — toggle (default: on, 3 days before)
- **Notify admin on override request** — toggle (default: on)
- **Quote activity email thread** — enable logging all quote emails to Twenty activity (default: on)
- **Notify admin: contracted price expiring** — email digest of contracted prices expiring in < 90 days (default: on, weekly)
- **Notify admin: billing sync failure** — immediate email when a contract fails to sync to billing (default: on)
- **Notify admin: e-signature API error** — immediate email when DocuSign/PandaDoc returns an error (default: on)
- **Notify admin: price book not updated (days)** — email if a price book has not been reviewed in N days (default: 180)
- **Approval SLA breach notification** — notify approver's manager when SLA is exceeded (default: on)
- **Finance notification email** — email address for billing sync failures and payment failed events

### 7. Pricing & Discount Controls Section
- **Auto-create Contracted Prices on contract activation** — toggle; when on, the net price on each subscription line is locked as a `ContractedPrice` record for the account (default: off, see TASK-147)
- **Allow reps to see margin %** — toggle; controls whether margin is displayed in Quote Line Editor (default: off)
- **Contracted price expiry alert (days)** — alert threshold for contracted prices nearing expiry (default: 90)
- **Multi-currency normalization currency** — the currency used for normalized ARR in analytics (default: USD)
- **Active quote currencies** — multi-select of ISO 4217 codes that may appear in the "Quote Currency" dropdown (default: USD, GBP)

### 8. CPQ Role & Permission Matrix

CPQ uses five built-in roles layered on top of workspace permissions. Roles are assigned per user in the CPQ Users configuration panel (not in this settings form — this section is documentation):

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `CPQ_ADMIN` | Full access to all settings, configuration, and data | Can edit price books, discount schedules, approval rules, templates, contracted prices; can view margin; can override contracted prices |
| `CPQ_DEAL_DESK` | Approval authority and pricing override | Can approve/reject quotes; can apply manual discounts above rep threshold; can view margin; can set contracted prices |
| `CPQ_REP` | Standard sales rep | Can create/edit/submit quotes they own; cannot view margin; cannot override contracted prices |
| `CPQ_CSM` | Customer Success — read/renewal access | Can view contracts and subscriptions; can initiate renewals; cannot create new quotes |
| `CPQ_READ_ONLY` | View-only access | Can view all quotes, contracts, and pricing; cannot create or edit |

**Permission assignment UI:** At `/settings/cpq/users` — a table of workspace users with their CPQ role assignment. Admins can assign one role per user. CPQ_ADMIN role requires `WORKSPACE` admin permission.

---

## Admin UX Requirements

- Single-page form with sticky "Save Changes" / "Reset to Defaults" action bar
- All settings grouped into collapsible sections with section headers
- Each setting has a concise description tooltip
- Changes saved with optimistic UI; toast confirmation "Settings saved"
- "Reset section to defaults" button per section
- Show "Last modified by [user] at [time]" per section header
- Settings changes create an audit log entry
- Admin-only: requires `WORKSPACE` permission flag

---

## Definition of Success

- [ ] Admin can reach `/settings/cpq` and see all 6 sections
- [ ] All 35+ settings persist correctly to a `CpqSettings` record in the database
- [ ] Default values pre-populate correctly on first load
- [ ] A new quote created after changing defaults inherits those defaults
- [ ] Audit log entry created on every save
- [ ] Only workspace admins can access the page (403 for non-admins)
- [ ] Saving without changes does not create a new audit entry
- [ ] All section tooltips render without overflow

---

## Method to Complete

### Backend
1. Create `CpqSettings` entity (one per workspace) with all 35+ fields
2. Create `CpqSettingsService` with `getSettings(workspaceId)` and `updateSettings(workspaceId, dto)` methods
3. Create `CpqSettingsController` with `GET /cpq/settings` and `PATCH /cpq/settings` routes
4. Add `CpqSettingsModule` to `CpqModule`
5. Generate fast migration for `cpq_settings` table
6. Seed default settings row on workspace creation (hook into workspace setup)

### Frontend
1. Create `CpqSettingsPage.tsx` at `packages/twenty-front/src/modules/cpq/components/`
2. Create `useCpqSettings` hook wrapping `GET/PATCH /cpq/settings`
3. Build form using Twenty's `Section`, `TextInput`, `Toggle`, `Select`, `NumberInput` components
4. Implement collapsible sections with `<Accordion>` pattern
5. Add to SettingsNavigationItems under Workspace section (already stubbed in nav)
6. Add route in `SettingsRoutes.tsx` for `SettingsPath.Cpq`

### Data
1. `CpqSettings` entity fields map 1:1 to the settings listed above
2. Singleton per workspace (upsert pattern, not create)

---

## Acceptance Criteria

- AC1: All 35+ settings fields exist in the database schema
- AC2: GET returns 200 with full settings object for admin; 403 for non-admin
- AC3: PATCH updates only provided fields (partial update)
- AC4: Defaults are applied when `cpq_settings` row does not yet exist
- AC5: UI renders in under 500ms for authenticated admins
- AC6: All inputs have proper labels, descriptions, and validation messages
- AC7: Form is accessible (keyboard navigable, ARIA labels)

---

## Dependencies

- Twenty `ObjectMetadataService` (for phase 1 using custom objects)
- Or TypeORM entity pattern (preferred for settings singleton)
- `SettingsPath.Cpq` must exist in `twenty-shared` (already added)

---

## Estimated Effort
**Backend:** 2 days | **Frontend:** 3 days | **Testing:** 1 day
**Total:** 6 days
