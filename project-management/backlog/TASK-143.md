# TASK-143 — CPQ Reporting & Analytics Dashboard
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P2 — Revenue intelligence layer

---

## User Story

**As a** Revenue Operations leader and Sales Manager at PhenoTips,
**I want** a CPQ analytics dashboard that shows me pipeline metrics, quote conversion rates, discount trends, ARR movements, and renewal health across the entire business,
**so that** I can identify pricing inefficiencies, coach reps on discount discipline, forecast revenue, and catch renewal risk before it becomes churn.

---

## Background & Context

CPQ data is uniquely rich — every discount decision, approval, and contract is logged. This task turns that operational data into business intelligence:
- RevOps can track average discount depth and identify outliers
- Sales managers can see rep-level quote velocity and win rates
- Finance can see ARR waterfall, churn, and expansion
- Leadership can track NRR (Net Revenue Retention), the health metric of a SaaS business

---

## Features Required

### 1. Revenue Dashboard (ARR Waterfall)

**ARR Waterfall Chart:**
```
Beginning ARR (Jan 1):         $2,400,000
+ New Business:                +$380,000
+ Expansion (Amendments):      +$120,000
- Churn:                       -$45,000
- Contraction (Downsells):     -$18,000
─────────────────────────────────────────
Ending ARR (Today):            $2,837,000
NRR: 118%
```

Filterable by: date range, region, product family, CSM, rep

**MRR Trend Line Chart:** monthly MRR over the past 12 months

**New ARR by Source:** bar chart split by new business / renewal / expansion

### 2. Quote Pipeline Report

**Quote Funnel (Conversion Rates):**
```
Created:        142 quotes     $8.4M potential ARR
Presented:       98 quotes     $6.1M potential ARR    69% from Created
In Approval:     22 quotes     $1.8M potential ARR    
Approved:        78 quotes     $4.9M potential ARR
Accepted:        61 quotes     $3.7M potential ARR    62% from Approved
Ordered:         58 quotes     $3.5M potential ARR
Expired (lost):  23 quotes     $1.4M potential ARR
```

**Average Time in Each Stage:**
- Draft → Submitted: 3.2 days
- Submitted → Approved: 1.8 days (approval velocity)
- Approved → Presented: 0.5 days
- Presented → Accepted: 8.4 days (customer decision time)

**Quote Win Rate by Rep:** table showing each rep's quote volume, win rate, average ARR per quote, average discount

### 3. Pricing & Discount Analytics

**Discount Distribution Chart:** histogram showing how many quotes fall in each discount bracket (0–5%, 5–10%, 10–15%, etc.)

**Discount Heatmap:** by product family + deal size — where are reps discounting most?

**Discount vs. Win Rate:** scatter plot or correlation — does discounting actually help close deals?

**Approval Bottleneck Report:**
- Average approval cycle time by step
- Rejection reasons (ranked by frequency)
- Time from submission to final approval by rep

**Floor Price Violations:** list of quotes where lines were priced below floor price, and what the outcome was

### 4. Renewal Health Report

**Renewal Pipeline Dashboard:**
- Total ARR up for renewal in next 90/60/30 days
- Renewal status distribution (not started / quoted / negotiating / won / churned)
- NRR by CSM
- Average renewal cycle time
- Renewal win rate by CSM

**Churn Analysis:**
- Churn by reason (product gap / price / competitive loss / company closure)
- ARR lost by month (trended)
- Churn by customer segment (Healthcare / Government / Research)

**Expansion Revenue:**
- Upsell ARR from amendments by rep and by product family
- Top expanded accounts

### 5. Product Mix Report

**Product Penetration:**
- What % of accounts have each product?
- Average products per account (multi-product vs. single-product customers)
- Co-purchase rates: "X% of PT Core customers also have PPQ"

**Revenue by Product Family:** pie chart + table of ARR breakdown

**Adoption of Integrations:** which integrations are most commonly sold?

### 6. Approval Analytics

**Approval Volume by Rule:**
- How many quotes triggered each approval rule
- False positive rate (rules that trigger but the deal closes fine)
- Average approval time per approver

**Used to refine approval thresholds:** if 80% of deals approved at 15% discount don't result in margin issues, maybe the threshold can move to 18%.

### 7. Rep Performance Report

Per rep:
- Total quotes created
- Win rate
- Average ARR per won deal
- Average discount depth
- Quotes pending approval
- Renewal win rate
- Revenue attainment vs. quota (if quota is entered)

Exportable to CSV for compensation/HR use.

---

## Metrics Definitions

| Metric | Definition |
|--------|-----------|
| **ARR** | Annual Recurring Revenue: sum of all active subscription annualized values |
| **MRR** | Monthly Recurring Revenue: ARR ÷ 12 |
| **NRR** | Net Revenue Retention: (Beginning ARR + Expansion - Churn - Contraction) ÷ Beginning ARR |
| **Quote-to-Win Rate** | Accepted quotes ÷ Total quotes created (in period) |
| **Average Sales Cycle** | Average days from quote creation to order |
| **Average Deal ARR** | Net total ARR of won quotes ÷ number of won quotes |
| **Approval Rate** | Approved quotes ÷ Submitted quotes |
| **Average Discount** | Average of all line discounts across all accepted quotes |
| **Renewal Win Rate** | Renewed contracts ÷ (renewed + churned) in period |
| **Expansion ARR** | Amendment ARR added during period |

---

## UX Requirements

- Dashboard loads in < 2 seconds with pre-computed aggregates (not raw queries at render time)
- All charts are interactive: click a bar/segment to drill down
- Date range picker with presets: last 30 days, last quarter, last 12 months, custom
- Export to CSV for all tables
- Dashboard is accessible at `/cpq/analytics` (admin and sales manager access)

---

## Definition of Success

- [ ] ARR waterfall shows correct beginning, ending, new, expansion, churn values for a date range
- [ ] NRR calculation is correct: (Beginning + Expansion - Churn - Contraction) / Beginning
- [ ] Quote funnel shows correct counts at each stage
- [ ] Discount distribution histogram shows correct bucketing
- [ ] Renewal health panel matches the Renewal Queue data (TASK-134)
- [ ] All charts update correctly when date range filter is changed
- [ ] Rep performance table is sortable and exportable

---

## Method to Complete

### Backend
1. `AnalyticsService` — pre-computed metrics with caching (Redis, 1-hour TTL)
2. `ARRWaterfallCalculator` — period-based ARR movement computation
   - **Beginning ARR snapshot mechanism**: A nightly `ARRSnapshotJob` records total active ARR for the workspace at midnight UTC. This snapshot is the "beginning ARR" for any date range that starts on that day. Without snapshots, historical beginning ARR cannot be reliably computed from current contract data (amendments and cancellations would retroactively alter it). Snapshots stored in `ArrSnapshot` records (date, totalARR, contractCount).
3. `QuoteFunnelCalculator` — stage counts and conversion rates
4. `DiscountAnalyticsCalculator` — distribution + heatmap data
5. `RenewalHealthCalculator` — NRR + renewal pipeline
6. Scheduled job: `AnalyticsRefreshJob` — recalculates aggregates **hourly** (BullMQ repeatable job)
   - **Data freshness note**: Analytics data may be up to 1 hour stale. Dashboard shows "Data as of: [timestamp]" in the footer. Acceptable for strategic reporting; not suitable for real-time operational decisions (use the Quote list directly for that).
   - **Manual refresh**: Admin can trigger a manual refresh via a "Refresh Now" button on the analytics page. Rate-limited to once per 5 minutes.
7. Routes: `GET /cpq/analytics/arr-waterfall`, `/cpq/analytics/quote-funnel`, `/cpq/analytics/discount`, `/cpq/analytics/renewal`, `/cpq/analytics/rep-performance`
8. `ArrSnapshot` entity: `date`, `totalARR`, `contractCount`, `normalizedARRUsd` (for multi-currency)

### Frontend
1. `CpqAnalyticsDashboard.tsx` — main analytics page
2. `ARRWaterfallChart.tsx` — waterfall visualization
3. `QuoteFunnelChart.tsx` — conversion funnel
4. `DiscountDistributionChart.tsx` — histogram
5. `RenewalHealthPanel.tsx` — renewal pipeline summary
6. `RepPerformanceTable.tsx` — sortable, exportable
7. Chart library: Recharts (already in the twenty-front stack)

---

## Acceptance Criteria

- AC1: ARR waterfall for Q1 2026 shows beginning ARR, new ARR, expansion, churn, and ending ARR correctly
- AC2: NRR = 118% for the test dataset
- AC3: Quote funnel shows the correct number of quotes at each stage for the selected period
- AC4: Discount distribution histogram correctly places a 22% discount in the 20–25% bucket
- AC5: Dashboard renders in < 2 seconds after initial data load
- AC6: Changing date range filter updates all charts simultaneously

---

## Dependencies

- All preceding CPQ tasks (data quality depends on the completeness of quote/contract/subscription records)
- TASK-126–135 (quote, contract, renewal, amendment data)

---

## Estimated Effort
**Backend:** 5 days | **Frontend:** 5 days | **Testing:** 1 day
**Total:** 11 days
