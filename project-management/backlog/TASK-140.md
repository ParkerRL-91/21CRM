# TASK-140 — Backend: Renewal Automation — Scheduled Jobs & Queue
**Status:** Backlog
**Phase:** PRJ-007 (CPQ Build-Out)
**Priority:** P1 — Prevents revenue leakage from missed renewals

---

## User Story

**As a** CPQ system,
**I need** automated renewal jobs that proactively surface expiring contracts, generate renewal opportunities, create renewal quotes, and notify the right people at the right time,
**so that** no contract expires without a renewal motion in place, and Customer Success teams have weeks of advance notice rather than days.

---

## Background & Context

Manual renewal tracking is a common failure mode. Teams rely on spreadsheets or calendar reminders. The automation described here converts renewal into a pull process (system surfaces it) vs. a push process (reps must remember).

The automation should be configurable — admins control lead times, which actions are automatic vs. manual, and what notifications fire.

---

## Features Required

### 1. Renewal Scheduler Job (BullMQ recurring, runs nightly at 2 AM)

```typescript
@Processor('renewal-automation')
class RenewalAutomationJob {
  @Process('daily-renewal-check')
  async run(): Promise<void> {
    const settings = await this.settingsService.getGlobalSettings();
    const today = startOfDay(new Date());

    // Check all active contracts for renewal milestones
    const contracts = await this.contractRepo.findAllActive();

    for (const contract of contracts) {
      const daysToExpiry = differenceInDays(contract.endDate, today);
      await this.processRenewalMilestone(contract, daysToExpiry, settings);
    }
  }

  async processRenewalMilestone(contract, daysToExpiry, settings) {
    // 90-day milestone
    if (daysToExpiry === settings.renewalNoticeDays && !contract.renewalOpportunityId) {
      if (settings.autoCreateRenewalOpportunity) {
        await this.contractService.createRenewalOpportunity(contract.id);
      }
      await this.notifyRenewalMilestone(contract, '90-day', 'info');
    }

    // 60-day milestone (no quote yet)
    if (daysToExpiry === 60 && !contract.renewalQuoteId) {
      await this.notifyRenewalMilestone(contract, '60-day-no-quote', 'warning');
    }

    // 30-day milestone
    if (daysToExpiry === 30) {
      await this.notifyRenewalMilestone(contract, '30-day', 'urgent');
      await this.createUrgentRenewalTask(contract);
    }

    // 14-day milestone: escalate to manager
    if (daysToExpiry === 14 && !contract.renewalQuoteId) {
      await this.notifyRenewalMilestone(contract, '14-day-escalation', 'critical');
      await this.notifyManager(contract);
    }

    // Day 0: expire contract if no renewal contracted
    if (daysToExpiry <= 0 && contract.status === 'Active' && !contract.renewalContractId) {
      await this.contractService.expireContract(contract.id, 'ExpiredNoRenewal');
      await this.notifyRenewalMilestone(contract, 'expired', 'critical');
    }
  }
}
```

### 2. Auto-Renewal Quote Generation

When `settings.autoGenerateRenewalQuote = true` and the contract reaches the 90-day milestone:

```typescript
async autoGenerateRenewalQuote(contract: Contract): Promise<Quote> {
  const quote = await this.contractService.createRenewalQuote(contract.id, {
    renewalTerm: contract.renewalTerm,
    pricingMethod: contract.renewalPricingMethod,
    upliftPercent: contract.renewalUpliftPercent,
    startDate: addDays(contract.endDate, 1),
  });

  // Notify the rep: "Your renewal quote is ready for review"
  await this.notificationService.sendRenewalQuoteReady(contract, quote);

  return quote;
}
```

The rep is notified to review and send the quote; the system does not auto-send to the customer.

### 3. Renewal Notification Service

```typescript
class RenewalNotificationService {
  async sendRenewalMilestone(contract, milestone, priority): Promise<void> {
    const { rep, csm, account } = await this.loadRenewalContext(contract.id);

    // Email to CSM
    await this.emailService.send({
      to: csm.email,
      subject: `[${priority.toUpperCase()}] Renewal: ${account.name} — ${daysToExpiry} days to expiry`,
      template: 'renewal-milestone',
      data: { contract, account, rep, csm, daysToExpiry, milestone },
    });

    // In-app notification
    await this.inAppNotificationService.create({
      userId: csm.id,
      type: `RENEWAL_${milestone.toUpperCase()}`,
      contractId: contract.id,
      priority,
      message: `${account.name} contract expires in ${daysToExpiry} days`,
    });

    // Slack (if configured)
    if (this.slackAdapter.isConfigured()) {
      await this.slackAdapter.sendRenewalAlert(contract, milestone, priority);
    }
  }
}
```

### 4. Weekly Renewal Digest Email

Sent every Monday morning to each CSM:

```
Subject: Weekly Renewal Digest — Week of April 19, 2026

Your Renewal Pipeline:

URGENT (< 30 days):
  NHS Trust (CNT-031) — expires Mar 10 — $45,000 ARR — No quote sent
  [View Contract]

ACTION NEEDED (30-60 days):
  University of Edinburgh (CNT-029) — expires Apr 15 — $78,000 ARR — Quote sent, awaiting signature
  [View Quote]

UPCOMING (60-90 days):
  Genome Diagnostics (CNT-042) — expires Apr 30 — $112,000 ARR — Not started
  [Start Renewal]

Your Renewal Pipeline Total: $890,000 ARR across 12 contracts
At Risk: $125,000 ARR (3 contracts)

[View Full Renewal Queue →]
```

### 5. Churn Detection Signals

Beyond time-based alerts, the system can flag churn risk based on:
- No login activity in 60+ days (if usage integration is configured)
- Open critical support tickets
- Payment failed in billing system
- CSM manually marks contract as "At Risk"

These signals update the contract's health score (displayed in TASK-133).

When a churn signal is detected:
```typescript
async flagChurnRisk(contractId: string, reason: ChurnRiskReason): Promise<void> {
  await this.contractRepo.update(contractId, { healthScore: 'AtRisk', lastHealthCheckAt: new Date() });
  await this.notifyRenewalMilestone(contract, 'churn-risk', 'urgent');
  await this.createChurnRiskTask(contractId, reason);
}
```

### 6. Auto-Renew (Evergreen) Contracts

For contracts where `autoRenew = true`:
- On the contract end date: if a renewal quote exists and is `Accepted`, automatically contract it
- If no renewal quote: automatically generate one (using same pricing method), require human activation
- For evergreen contracts (`isEvergreen = true`): no end date; continues until explicitly cancelled

---

## Definition of Success

- [ ] Nightly job runs reliably (verifiable via job logs)
- [ ] 90-day milestone: renewal opportunity created and CSM notified
- [ ] 60-day milestone: warning sent if no renewal quote exists
- [ ] 30-day milestone: urgent alert fires, task created for CSM
- [ ] Contracts that expire without a renewal contracted → `Expired` status
- [ ] Auto-generate renewal quote creates the correct quote pre-populated from contract subscriptions
- [ ] Weekly renewal digest email is sent to all CSMs with accurate pipeline data

---

## Method to Complete

1. BullMQ job: `RenewalAutomationJob` — recurring daily at 2 AM UTC
2. BullMQ job: `RenewalDigestJob` — recurring every Monday at 7 AM workspace timezone
3. `RenewalNotificationService` — email + in-app + Slack per milestone
4. `ChurnRiskDetectionService` — evaluates signals, updates health score
5. Job registration in `CpqModule`

---

## Acceptance Criteria

- AC1: Job runs nightly; job execution logged with start/end time and count of contracts processed
- AC2: 90-day notification is sent exactly once per contract (not repeated on day 89, 88, etc.)
- AC3: Weekly digest email contains correct counts and ARR values from current contract data
- AC4: A contract that expires with no renewal: status → `Expired`, CSM notified within 30 minutes
- AC5: Auto-generated renewal quote has the correct start date (day after expiry) and uplift pricing

---

## Dependencies

- TASK-139 (Contract Lifecycle Service) — `createRenewalOpportunity`, `expireContract`
- TASK-134 (Renewal Queue UI) — displays output of this service
- TASK-121 (Approval Workflow) — renewal quote may need approval
- TASK-125 (Integration Settings) — Slack + email config

---

## Estimated Effort
**Backend:** 3 days | **Testing:** 1 day
**Total:** 4 days
