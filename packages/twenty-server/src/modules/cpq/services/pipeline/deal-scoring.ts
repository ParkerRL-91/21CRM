// Deal scoring engine.
// Scores deals 0-100 across 6 factors and produces a composite health score.
//
// Factors (weights sum to 1.0):
//   1. engagement           (0.20) — email/call activity recency
//   2. stage_fit            (0.20) — alignment between stage and days-to-close
//   3. close_date_health    (0.20) — how far the close date is from today
//   4. deal_size            (0.15) — deal size relative to company average
//   5. activity_recency     (0.15) — days since last logged activity
//   6. relationship_strength (0.10) — number of contacts engaged

export type DealScoreFactor = {
  name: string;
  weight: number;      // 0.0 – 1.0
  rawScore: number;    // 0 – 100
  weightedScore: number;
  label: string;       // human-readable assessment
};

export type DealScore = {
  dealId: string;
  compositeScore: number; // 0 – 100, weighted sum
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: DealScoreFactor[];
  scoredAt: string;
};

// ============================================================================
// Factor 1 — Engagement
// ============================================================================

// Engagement score based on recent email/call touches.
export function scoreEngagement(
  touchesLast14Days: number,
  benchmark: number = 5,
): DealScoreFactor {
  const raw = Math.min(100, Math.round((touchesLast14Days / Math.max(1, benchmark)) * 100));
  return {
    name: 'engagement',
    weight: 0.2,
    rawScore: raw,
    weightedScore: parseFloat((raw * 0.2).toFixed(2)),
    label:
      raw >= 80 ? 'Strong engagement'
      : raw >= 50 ? 'Moderate engagement'
      : raw > 0 ? 'Low engagement'
      : 'No recent activity',
  };
}

// ============================================================================
// Factor 2 — Stage Fit
// ============================================================================

// Stage fit: deals in late stages should have a close date soon.
// Penalizes deals where the stage implies urgency but close date is far away.
export function scoreStageFit(
  stageProbability: number,
  daysToClose: number,
): DealScoreFactor {
  let raw: number;

  if (stageProbability >= 80) {
    // Late stage: should close within 30 days for full score
    if (daysToClose <= 30) raw = 100;
    else if (daysToClose <= 60) raw = 70;
    else if (daysToClose <= 90) raw = 40;
    else raw = 10;
  } else if (stageProbability >= 50) {
    // Mid stage: reasonable to be 30-90 days out
    if (daysToClose <= 90) raw = 100;
    else if (daysToClose <= 180) raw = 60;
    else raw = 30;
  } else {
    // Early stage: anything > 0 days is fine
    raw = daysToClose >= 0 ? 80 : 0;
  }

  return {
    name: 'stage_fit',
    weight: 0.2,
    rawScore: raw,
    weightedScore: parseFloat((raw * 0.2).toFixed(2)),
    label:
      raw >= 80 ? 'Stage aligns with timeline'
      : raw >= 50 ? 'Slight mismatch — review close date'
      : 'Stage/timeline misaligned',
  };
}

// ============================================================================
// Factor 3 — Close Date Health
// ============================================================================

// Close date health: how far in the future the close date is.
// Very near-term = likely to resolve (good or bad). Very far = risky.
export function scoreCloseDateHealth(daysToClose: number): DealScoreFactor {
  let raw: number;
  if (daysToClose < 0) {
    // Overdue
    raw = Math.max(0, 30 + daysToClose); // 30 at 0 overdue, dropping to 0 at 30 days overdue
  } else if (daysToClose <= 14) raw = 100;
  else if (daysToClose <= 30) raw = 90;
  else if (daysToClose <= 60) raw = 75;
  else if (daysToClose <= 90) raw = 60;
  else if (daysToClose <= 180) raw = 40;
  else raw = 20;

  return {
    name: 'close_date_health',
    weight: 0.2,
    rawScore: raw,
    weightedScore: parseFloat((raw * 0.2).toFixed(2)),
    label:
      daysToClose < 0 ? `Close date overdue by ${Math.abs(daysToClose)} days`
      : daysToClose <= 30 ? 'Closing soon'
      : daysToClose <= 90 ? 'On track'
      : 'Long runway — monitor closely',
  };
}

// ============================================================================
// Factor 4 — Deal Size
// ============================================================================

// Deal size relative to company average. Larger deals need more attention.
// Penalizes deals that are very large (high risk) or very small (low priority).
export function scoreDealSize(dealAmount: number, averageDeal: number): DealScoreFactor {
  if (averageDeal <= 0) {
    return { name: 'deal_size', weight: 0.15, rawScore: 50, weightedScore: 7.5, label: 'No baseline' };
  }

  const ratio = dealAmount / averageDeal;
  let raw: number;

  if (ratio < 0.25) raw = 30;         // Very small — low priority
  else if (ratio < 0.5) raw = 55;
  else if (ratio <= 2.0) raw = 90;    // Around average — sweet spot
  else if (ratio <= 5.0) raw = 70;    // Large — valuable but risky
  else raw = 50;                       // Very large — high risk/reward

  return {
    name: 'deal_size',
    weight: 0.15,
    rawScore: raw,
    weightedScore: parseFloat((raw * 0.15).toFixed(2)),
    label:
      ratio < 0.5 ? 'Below-average deal'
      : ratio <= 2.0 ? 'Typical deal size'
      : 'Large deal — needs executive attention',
  };
}

// ============================================================================
// Factor 5 — Activity Recency
// ============================================================================

// Activity recency: days since last logged activity (call, email, meeting).
export function scoreActivityRecency(
  daysSinceLastActivity: number,
  threshold: number = 7,
): DealScoreFactor {
  let raw: number;
  if (daysSinceLastActivity <= threshold) raw = 100;
  else if (daysSinceLastActivity <= threshold * 2) raw = 70;
  else if (daysSinceLastActivity <= threshold * 4) raw = 40;
  else raw = Math.max(0, 20 - daysSinceLastActivity + threshold * 4);

  return {
    name: 'activity_recency',
    weight: 0.15,
    rawScore: raw,
    weightedScore: parseFloat((raw * 0.15).toFixed(2)),
    label:
      raw >= 80 ? 'Active recently'
      : raw >= 40 ? 'Activity slowing'
      : 'Stale — needs follow-up',
  };
}

// ============================================================================
// Factor 6 — Relationship Strength
// ============================================================================

// Relationship strength: number of distinct contacts engaged at the account.
// Multi-threading = healthier deal.
export function scoreRelationshipStrength(
  contactsEngaged: number,
  benchmark: number = 3,
): DealScoreFactor {
  const raw = Math.min(100, Math.round((contactsEngaged / Math.max(1, benchmark)) * 100));
  return {
    name: 'relationship_strength',
    weight: 0.1,
    rawScore: raw,
    weightedScore: parseFloat((raw * 0.1).toFixed(2)),
    label:
      contactsEngaged === 0 ? 'Single-threaded — high risk'
      : contactsEngaged >= benchmark ? 'Well multi-threaded'
      : 'Partially multi-threaded',
  };
}

// ============================================================================
// Composite score
// ============================================================================

function toGrade(score: number): DealScore['grade'] {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export type DealScoringInput = {
  dealId: string;
  touchesLast14Days: number;
  engagementBenchmark?: number;
  stageProbability: number;
  daysToClose: number;
  dealAmount: number;
  averageDealSize: number;
  daysSinceLastActivity: number;
  activityThresholdDays?: number;
  contactsEngaged: number;
  contactsBenchmark?: number;
};

export function scoreDeal(input: DealScoringInput): DealScore {
  const factors: DealScoreFactor[] = [
    scoreEngagement(input.touchesLast14Days, input.engagementBenchmark),
    scoreStageFit(input.stageProbability, input.daysToClose),
    scoreCloseDateHealth(input.daysToClose),
    scoreDealSize(input.dealAmount, input.averageDealSize),
    scoreActivityRecency(input.daysSinceLastActivity, input.activityThresholdDays),
    scoreRelationshipStrength(input.contactsEngaged, input.contactsBenchmark),
  ];

  const compositeScore = Math.round(
    factors.reduce((sum, f) => sum + f.weightedScore, 0),
  );

  return {
    dealId: input.dealId,
    compositeScore,
    grade: toGrade(compositeScore),
    factors,
    scoredAt: new Date().toISOString(),
  };
}
