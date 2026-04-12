/**
 * At-risk renewal identification engine.
 * Evaluates pending renewals against weighted signals and assigns risk levels.
 */

export interface RiskSignal {
  name: string;
  weight: number; // 0.0 - 1.0
  score: number; // 0 - 100
  description: string;
  detectedAt: Date;
}

export interface RiskAssessment {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: RiskSignal[];
  assessedAt: Date;
}

export function calculateRiskScore(signals: RiskSignal[]): RiskAssessment {
  const overallScore = Math.round(
    signals.reduce((total, signal) => total + signal.score * signal.weight, 0)
  );

  let riskLevel: RiskAssessment['riskLevel'];
  if (overallScore >= 76) riskLevel = 'critical';
  else if (overallScore >= 51) riskLevel = 'high';
  else if (overallScore >= 26) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    overallScore,
    riskLevel,
    signals: signals.filter((s) => s.score > 0),
    assessedAt: new Date(),
  };
}

/**
 * Detect stage stagnation — deal hasn't changed stage in N days.
 */
export function detectStageStagnation(
  daysSinceLastStageChange: number,
  thresholdDays: number = 14
): RiskSignal {
  const score =
    daysSinceLastStageChange > thresholdDays
      ? Math.min(
          100,
          Math.round(
            ((daysSinceLastStageChange - thresholdDays) / thresholdDays) * 100
          )
        )
      : 0;

  return {
    name: 'stage_stagnation',
    weight: 0.25,
    score,
    description:
      score > 0
        ? `Deal hasn't progressed in ${daysSinceLastStageChange} days (threshold: ${thresholdDays})`
        : 'Deal is progressing normally',
    detectedAt: new Date(),
  };
}

/**
 * Detect close date slippage — deal close date pushed past contract end date.
 */
export function detectCloseDateSlippage(
  dealCloseDate: Date,
  contractEndDate: Date
): RiskSignal {
  const slipped = dealCloseDate > contractEndDate;
  return {
    name: 'close_date_slippage',
    weight: 0.2,
    score: slipped ? 100 : 0,
    description: slipped
      ? `Deal close date (${dealCloseDate.toISOString().split('T')[0]}) is past contract end date (${contractEndDate.toISOString().split('T')[0]})`
      : 'Deal close date is within contract period',
    detectedAt: new Date(),
  };
}

/**
 * Detect time pressure — contract expiring soon but renewal not in final stages.
 */
export function detectTimePressure(
  daysUntilExpiry: number,
  inFinalStage: boolean
): RiskSignal {
  let score = 0;
  if (daysUntilExpiry <= 30 && !inFinalStage) score = 100;
  else if (daysUntilExpiry <= 45 && !inFinalStage) score = 75;
  else if (daysUntilExpiry <= 60 && !inFinalStage) score = 50;

  return {
    name: 'time_pressure',
    weight: 0.2,
    score,
    description:
      score > 0
        ? `Contract expires in ${daysUntilExpiry} days but renewal not in final stage`
        : 'Renewal timeline is healthy',
    detectedAt: new Date(),
  };
}

/**
 * Detect value decrease — renewal proposed value less than current contract.
 */
export function detectValueDecrease(
  currentContractValue: number,
  proposedRenewalValue: number
): RiskSignal {
  if (currentContractValue <= 0) {
    return {
      name: 'value_decrease',
      weight: 0.15,
      score: 0,
      description: 'No baseline value to compare',
      detectedAt: new Date(),
    };
  }

  const ratio = proposedRenewalValue / currentContractValue;
  let score = 0;
  if (ratio < 0.5) score = 100;
  else if (ratio < 0.75) score = 75;
  else if (ratio < 0.9) score = 50;
  else if (ratio < 1.0) score = 25;

  return {
    name: 'value_decrease',
    weight: 0.15,
    score,
    description:
      score > 0
        ? `Renewal value ($${proposedRenewalValue}) is ${Math.round((1 - ratio) * 100)}% less than current contract ($${currentContractValue})`
        : 'Renewal value is at or above current contract value',
    detectedAt: new Date(),
  };
}

/**
 * Detect no recent activity — no deal property changes in N days.
 */
export function detectNoActivity(
  daysSinceLastActivity: number,
  thresholdDays: number = 21
): RiskSignal {
  const score =
    daysSinceLastActivity > thresholdDays
      ? Math.min(100, Math.round(((daysSinceLastActivity - thresholdDays) / thresholdDays) * 100))
      : 0;

  return {
    name: 'no_activity',
    weight: 0.1,
    score,
    description:
      score > 0
        ? `No deal activity in ${daysSinceLastActivity} days`
        : 'Recent activity detected',
    detectedAt: new Date(),
  };
}

/**
 * Detect previous churn attempt — account had a cancelled/lost renewal before.
 */
export function detectPreviousChurn(hasPreviousChurn: boolean): RiskSignal {
  return {
    name: 'previous_churn',
    weight: 0.1,
    score: hasPreviousChurn ? 80 : 0,
    description: hasPreviousChurn
      ? 'Account has a previous cancelled or lost renewal'
      : 'No previous churn history',
    detectedAt: new Date(),
  };
}

/**
 * Run all risk signals and compute overall assessment.
 */
export function assessRenewalRisk(params: {
  daysSinceLastStageChange: number;
  dealCloseDate: Date;
  contractEndDate: Date;
  daysUntilExpiry: number;
  inFinalStage: boolean;
  currentContractValue: number;
  proposedRenewalValue: number;
  daysSinceLastActivity: number;
  hasPreviousChurn: boolean;
}): RiskAssessment {
  const signals: RiskSignal[] = [
    detectStageStagnation(params.daysSinceLastStageChange),
    detectCloseDateSlippage(params.dealCloseDate, params.contractEndDate),
    detectTimePressure(params.daysUntilExpiry, params.inFinalStage),
    detectValueDecrease(params.currentContractValue, params.proposedRenewalValue),
    detectNoActivity(params.daysSinceLastActivity),
    detectPreviousChurn(params.hasPreviousChurn),
  ];

  return calculateRiskScore(signals);
}
