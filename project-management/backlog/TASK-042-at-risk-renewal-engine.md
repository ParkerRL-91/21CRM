---
title: "At-risk renewal identification engine"
id: TASK-042
project: PRJ-002
status: ready
priority: P1
created: 2026-04-12
updated: 2026-04-12
tags: [#task, #cpq, #renewals, #risk, #engine, #analytics]
---

# TASK-042: At-risk renewal identification engine

## User Stories

- As a **Customer Success manager**, I want the system to automatically flag renewals that are at risk of churning so that I can prioritize my outreach and intervene early.
- As a **Sales Manager**, I want to see at-risk renewal value in my pipeline reports so that I can forecast conservatively and allocate resources.

## Outcomes

An automated risk scoring engine that evaluates renewal opportunities against multiple signals and assigns a risk level (low/medium/high/critical). At-risk renewals are flagged in the UI and trigger notifications.

## Success Metrics

- [ ] Risk engine evaluates all pending renewals and assigns risk level
- [ ] Risk factors detected: deal stage stagnation, close date slippage, value decrease, no engagement, late in expiration window without progress
- [ ] Risk level: low (0-25), medium (26-50), high (51-75), critical (76-100)
- [ ] Risk factors displayed on contract detail page and renewal kanban cards
- [ ] At-risk renewals filterable in pipeline and renewal report views
- [ ] Notification sent when a renewal transitions from low/medium to high/critical
- [ ] Risk score recalculated daily (as part of renewal job)
- [ ] Tests for risk scoring logic with various signal combinations

## Implementation Plan

### Risk Signal Framework

Each signal contributes a weighted score to the overall risk assessment:

| Signal | Weight | Detection Logic | Score Range |
|--------|--------|----------------|-------------|
| **Stage stagnation** | 25% | Renewal deal hasn't changed stage in N days (threshold: 14 days) | 0-100 |
| **Close date slippage** | 20% | Deal close date has been pushed past contract end date | 0 or 100 |
| **Time pressure** | 20% | Contract expires within 30 days but renewal not in final stages | 0-100 |
| **Value decrease** | 15% | Renewal proposed value < current contract value (downgrade signal) | 0-100 |
| **No recent activity** | 10% | No deal property changes in 21+ days | 0-100 |
| **Previous churn attempt** | 10% | Account had a cancelled/lost renewal in the past | 0 or 50 |

### Risk Score Calculation

```typescript
export interface RiskSignal {
  name: string;
  weight: number;       // 0.0 - 1.0
  score: number;        // 0 - 100
  description: string;  // human-readable explanation
  detectedAt: Date;
}

export interface RiskAssessment {
  overallScore: number;         // 0 - 100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: RiskSignal[];
  assessedAt: Date;
}

export function calculateRiskScore(signals: RiskSignal[]): RiskAssessment {
  const overallScore = signals.reduce(
    (total, signal) => total + (signal.score * signal.weight),
    0
  );

  const roundedScore = Math.round(overallScore);
  
  let riskLevel: RiskAssessment['riskLevel'];
  if (roundedScore >= 76) riskLevel = 'critical';
  else if (roundedScore >= 51) riskLevel = 'high';
  else if (roundedScore >= 26) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    overallScore: roundedScore,
    riskLevel,
    signals: signals.filter(s => s.score > 0), // only return active signals
    assessedAt: new Date(),
  };
}
```

### Signal Detection Functions

```typescript
export function detectStageStagnation(
  deal: CrmObject,
  stageHistory: DealStageHistoryEntry[],
  thresholdDays: number = 14
): RiskSignal {
  const lastStageChange = stageHistory
    .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())[0];
  
  const daysSinceChange = lastStageChange
    ? differenceInDays(new Date(), lastStageChange.changedAt)
    : differenceInDays(new Date(), deal.firstSyncedAt);

  const score = daysSinceChange > thresholdDays
    ? Math.min(100, ((daysSinceChange - thresholdDays) / thresholdDays) * 100)
    : 0;

  return {
    name: 'stage_stagnation',
    weight: 0.25,
    score: Math.round(score),
    description: daysSinceChange > thresholdDays
      ? `Deal hasn't progressed in ${daysSinceChange} days (threshold: ${thresholdDays})`
      : 'Deal is progressing normally',
    detectedAt: new Date(),
  };
}

export function detectTimePressure(
  contract: Contract,
  dealStage: string,
  finalStages: string[] // stages considered "near close"
): RiskSignal {
  const daysUntilExpiry = differenceInDays(contract.endDate, new Date());
  const inFinalStage = finalStages.includes(dealStage);

  let score = 0;
  if (daysUntilExpiry <= 30 && !inFinalStage) score = 100;
  else if (daysUntilExpiry <= 45 && !inFinalStage) score = 75;
  else if (daysUntilExpiry <= 60 && !inFinalStage) score = 50;

  return {
    name: 'time_pressure',
    weight: 0.20,
    score,
    description: score > 0
      ? `Contract expires in ${daysUntilExpiry} days but renewal not in final stage`
      : 'Renewal timeline is healthy',
    detectedAt: new Date(),
  };
}
```

### Risk Assessment Storage

Risk assessments stored on the `contract_renewals` record:

```sql
ALTER TABLE contract_renewals ADD COLUMN risk_score INTEGER;
ALTER TABLE contract_renewals ADD COLUMN risk_level VARCHAR(10);
ALTER TABLE contract_renewals ADD COLUMN risk_signals JSONB DEFAULT '[]';
ALTER TABLE contract_renewals ADD COLUMN risk_assessed_at TIMESTAMPTZ;
```

### Daily Risk Reassessment

Part of the daily renewal job (TASK-034):
1. For each active renewal with status 'pending' or 'in_progress'
2. Gather all signals for the renewal deal
3. Calculate risk score
4. Update contract_renewals with new risk data
5. If risk transitioned from low/medium to high/critical, create notification

## Files to Change

- `src/lib/renewals/risk-engine.ts` — **NEW**: Risk scoring functions
- `src/lib/renewals/risk-engine.test.ts` — **NEW**: Comprehensive risk scoring tests
- `src/lib/renewals/risk-signals.ts` — **NEW**: Individual signal detection functions
- `src/lib/renewals/risk-signals.test.ts` — **NEW**: Signal detection tests
- `src/lib/renewals/job.ts` — **MODIFY**: Add risk reassessment to daily job
- `src/components/renewals/risk-badge.tsx` — **NEW**: Risk level badge component
- `src/components/contracts/risk-factors-panel.tsx` — **NEW**: Risk factors display

## Status Log

- 2026-04-12: Created

## Takeaways

_To be filled during implementation._
