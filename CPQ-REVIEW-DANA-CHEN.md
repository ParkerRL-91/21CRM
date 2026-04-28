# CPQ Review: Dana Chen, VP Revenue Operations

---

## The Persona

**Dana Chen** — VP of Revenue Operations at a 200-person B2B SaaS company doing $18M ARR. Reports to the CRO. Manages a team of 3 (RevOps Analyst, Sales Ops Manager, Deal Desk Specialist). Has used Salesforce CPQ for 3 years, tried DealHub for 6 months, evaluated Clari and HubiFi. Currently paying $47K/year across 4 tools and hates the fragmentation.

**What Dana cares about:**
- Can my deal desk person build a quote in under 5 minutes?
- Can I see who approved what discount and when?
- Will my reps actually use this, or will they go back to Google Docs?
- Can I trust these numbers enough to put them in a board deck?
- Does this replace tools, or add another one to manage?

**What makes Dana walk away:**
- Clicking a button and nothing happens
- Numbers that don't add up or can't be explained
- "Coming soon" on features she needs today
- Having to ask engineering to change a threshold
- Anything that looks like a developer tool, not a business tool

---

## Dana's Walkthrough

### Attempt 1: "Let me enable CPQ and set up my first product"

**What happens:** Dana navigates to the CPQ setup page. She sees "Enable CPQ" with a list of 6 objects that will be created, using emoji icons (📄, 📋). She clicks the button.

**Dana's reaction:**
> "Emoji icons? This looks like a hackathon project, not enterprise software. Also — I'm about to create 6 new object types in my CRM and there's no confirmation dialog? What if I click this by accident? And what are these objects exactly — 'Price Configurations'? That's not what I call it. I call it a Price Book."

**After clicking:** The button says "Setting up..." for 3 seconds with no progress bar. Then the template gallery appears.

> "Did it work? I think so? There's no success message. No 'CPQ is now enabled' banner. I just... hope it worked."

**She clicks a template card ("Tiered Volume Pricing"):** Nothing happens.

> "I clicked it. Nothing. I clicked it again. Nothing. Is this broken? Am I supposed to do something else? There's no tooltip, no error, no redirect. I'm going to close this tab."

**Confidence level: 2/10.** Dana would not continue past this point.

---

### Attempt 2: "Let me try to build a quote"

*Assuming Dana finds the quote builder (she can't — it's not in the navigation, but let's pretend she has a direct URL).*

**What happens:** Empty quote builder loads. No quote number assigned. Status shows "draft" in a gray badge.

**Dana tries to add a product:** She sees a text input field for "Product Name." No autocomplete. No product catalog. No search.

> "I have 47 products in my catalog. You want me to *type the name*? What if I spell it wrong? What if two reps spell it differently? This is a data quality nightmare. Every CPQ I've used has a product picker with search. This is a text field."

**She types "Platform Pro", sets quantity to 5, list price to $1,200, discount 15%.** The net price calculates inline. That part works.

> "OK, the math is right. But I can't change the billing type — it's hardcoded to 'recurring' with a 🔄 emoji. What if this is a one-time implementation fee? And why is there an emoji in my quote?"

**She clicks "Submit for Approval":** The button... does something? The page doesn't change. No confirmation. No approval status. No indication of who will review it.

> "Did I just submit this? To who? What's the approval chain? When will I hear back? In Salesforce CPQ I can see the approval path before I submit. Here I have no idea what happened."

**Confidence level: 3/10.** The pricing math builds some trust. Everything else destroys it.

---

### Attempt 3: "Show me the renewal pipeline"

**What happens:** Dana opens the renewal dashboard. She sees 4 metric cards (Renewable, Renewal Rate, At Risk, Churned) and a table of renewals with risk scores.

> "OK, this is better. I can see which accounts are at risk. The risk scores make sense — stagnation, slippage, value decrease. But..."

**She clicks "Run Renewal Check":** Nothing visible happens. No spinner. No "checking 47 contracts..." message. No results update.

> "Did it run? How long does it take? Should I wait? Should I click again?"

**She tries to filter by "Critical" risk:** The dropdown works. Table filters.

> "Good, filtering works. But I can't export this. I need to paste this into my Monday forecast deck. There's no CSV export, no 'copy table' button, nothing."

**She clicks a renewal row:** Nothing happens unless `onViewContract` is wired up (it's a callback prop that may or may not be connected).

> "I want to see the contract details for this at-risk account. Click. Nothing. Click again. Nothing."

**She checks on her phone:** The 4-column metric grid squishes into an unreadable mess. The table overflows off-screen.

> "I check renewals on my phone every Monday morning before standup. This is unusable on mobile."

**Confidence level: 5/10.** The risk scoring concept is solid. The execution doesn't support her workflow.

---

### Attempt 4: "Can I configure discount approval rules?"

**What happens:** There is no admin UI for approval rules. The approval engine exists in the backend, but there's no settings page, no rule builder, no threshold configuration screen.

> "In Salesforce CPQ, I go to Setup → Approval Rules → New Rule → 'If discount > 15%, route to Sales Manager.' Where do I do that here? I don't see any settings for approvals."

**The answer:** She can't. Approval rules must be passed as JSON in the API request body. There is no admin UI.

> "You're telling me I need to write JSON to set up discount rules? This is a developer tool, not a RevOps tool. My deal desk person needs to manage these rules. She doesn't write JSON."

**Confidence level: 1/10.** This is a dealbreaker for Dana's team.

---

### Attempt 5: "Generate a quote PDF for a customer"

**What happens:** The template editor exists with a live preview showing sample data. Dana can set logo URL, brand color, company name, and terms.

> "The live preview is nice — I can see how the quote will look as I change settings. But..."

**She tries to generate an actual PDF:** There is no "Generate PDF" or "Download PDF" button anywhere.

> "So I can design a template but I can't actually create a PDF from a real quote? What's the point? My reps need to email quotes to customers. This is just a template preview tool, not a quote generator."

**She enters an invalid logo URL:** The preview shows a broken image icon. No validation message.

> "It should tell me the URL is broken, not silently show a broken image. My marketing team will blame me if quotes go out with broken logos."

**Confidence level: 3/10.** Good concept, zero utility.

---

## The Verdict: What Dana Would Tell Her CRO

> "The architecture is solid — whoever built the pricing engine knew what they were doing. The 10-step waterfall, the risk scoring model, the renewal pricing methods — that's real CPQ thinking. But the product isn't finished. I can't use it to build a quote, send it to a customer, or track approvals. My deal desk person couldn't configure a single rule without calling engineering. The frontend feels like a prototype — emojis instead of icons, buttons that don't work, no mobile support. I'd need another 3-4 months of focused product work before I could put this in front of my sales team."

---

## The Fix List: What Transforms This From Prototype to Product

### Tier 1 — "I can't use this without these" (Blockers)

| # | Fix | What Dana Said | Effort |
|---|-----|----------------|--------|
| 1 | **Product catalog picker with search/autocomplete** | "You want me to type the name?" | 3 days |
| 2 | **Template gallery actually navigates somewhere** | "I clicked it. Nothing." | 1 day |
| 3 | **Approval rules admin UI** (no-code rule builder) | "My deal desk person doesn't write JSON" | 5 days |
| 4 | **PDF generation from real quotes** (not just template preview) | "I can't actually create a PDF?" | 3 days |
| 5 | **Approval status visibility** (who, when, pending/approved) | "Did I submit? To who?" | 3 days |
| 6 | **Success/error feedback on every action** (toasts, banners) | "Did it work? I think so?" | 2 days |
| 7 | **Confirmation dialogs for destructive actions** | "What if I click this by accident?" | 1 day |

### Tier 2 — "This would make me trust it" (Confidence Builders)

| # | Fix | What Dana Said | Effort |
|---|-----|----------------|--------|
| 8 | **Replace all emoji icons with proper icon library** | "This looks like a hackathon project" | 1 day |
| 9 | **Loading states with context** ("Checking 47 contracts...") | "Should I wait? Should I click again?" | 1 day |
| 10 | **Audit trail visible on every quote** (who changed what, when) | "Can I trust these numbers?" | 3 days |
| 11 | **Discount guardrails with visual feedback** (green/yellow/red) | "Reps need to see limits before they type" | 2 days |
| 12 | **Quote versioning** (v1 → v2 comparison) | "Customer asked for changes, where's the diff?" | 3 days |
| 13 | **CSV export on renewal dashboard** | "I need to paste this into my forecast deck" | 1 day |
| 14 | **Form validation** (prevent $0 quotes, >100% discounts, empty names) | "A quote with zero-price items got submitted" | 2 days |

### Tier 3 — "This would make me switch from Salesforce CPQ" (Differentiators)

| # | Fix | What Dana Said | Effort |
|---|-----|----------------|--------|
| 15 | **Mobile responsive** (all pages work on phone/tablet) | "I check renewals on my phone every Monday" | 5 days |
| 16 | **Migrate fetch() to Apollo Client** | (technical but breaks caching/auth) | 2 days |
| 17 | **Register CPQ pages in Twenty navigation** | (users literally can't find the pages) | 1 day |
| 18 | **Billing type toggle** (recurring vs one-time per line item) | "What if this is a one-time fee?" | 1 day |
| 19 | **Line item grouping UI** (sections: Platform, Services, Add-ons) | "Complex quotes need visual structure" | 3 days |
| 20 | **Quote duplication** ("Clone this quote") | "Don't make me re-enter 15 line items" | 1 day |
| 21 | **Renewal dashboard actions** (trigger outreach, mark contacted) | "I can see risk but I can't act on it" | 2 days |
| 22 | **Unsaved changes warning** on template editor and quote builder | "I lost all my edits when I clicked Cancel" | 1 day |

### Total: ~46 days of focused work

Tier 1 (blockers): 18 days — gets Dana to "I can use this"
Tier 2 (confidence): 13 days — gets Dana to "I trust this"
Tier 3 (differentiators): 15 days — gets Dana to "I'd switch to this"

---

## What's Already Good (Dana Would Acknowledge These)

- **Pricing engine**: 10-step waterfall with full audit trail. Better than HubSpot's pricing, comparable to Salesforce CPQ.
- **Risk scoring**: 6 weighted signals with clear explanations. Better than most tools Dana has used.
- **Renewal pricing**: Same/list/uplift methods with configurable defaults. Standard CPQ capability.
- **Type safety**: Zero `any` types, Decimal.js everywhere. Numbers won't silently round wrong.
- **Test coverage**: 69+ backend test cases. The math is verified.
- **Schema design**: 16 objects, 80+ fields, 22 relations. Comprehensive data model.
- **Self-hosted**: Dana's compliance team would love this. No data leaves the building.

---

## The Bottom Line

The CPQ has a **9/10 engine** wrapped in a **3/10 interface**. The business logic is enterprise-grade. The user experience is pre-alpha. Dana would evaluate the engine and say "someone who understands CPQ built this." Then she'd try to use the UI and say "but they didn't build it for me."

The path from here to Dana saying "let's buy this" is 46 days of product work, not architecture work. The hard part is done. The missing part is polish, feedback loops, and admin self-service.
