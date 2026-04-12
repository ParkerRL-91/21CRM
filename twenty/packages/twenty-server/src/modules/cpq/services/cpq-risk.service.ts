import { Injectable, Logger } from '@nestjs/common';

//
// CPQ Risk Service — at-risk renewal identification engine.
//
// Evaluates pending renewals against 6 weighted signals:
// 1. Stage stagnation (25%) — deal hasn't progressed in 14+ days
// 2. Close date slippage (20%) — past contract end date
// 3. Time pressure (20%) — <30 days to expiry, not in final stage
// 4. Value decrease (15%) — renewal value < current contract
// 5. No activity (10%) — no deal changes in 21+ days
// 6. Previous churn (10%) — account had prior cancelled renewal
//
// Risk levels: low (0-25), medium (26-50), high (51-75), critical (76+)
///
@Injectable()
export class CpqRiskService {
  private readonly logger = new Logger(CpqRiskService.name);

  assessRenewalRisk(params: RiskAssessmentInput): RiskAssessment {
    const signals: RiskSignal[] = [
      this.stageStagnation(params.daysSinceLastStageChange),
      this.closeDateSlippage(params.dealCloseDate, params.contractEndDate),
      this.timePressure(params.daysUntilExpiry, params.inFinalStage),
      this.valueDecrease(params.currentValue, params.proposedValue),
      this.noActivity(params.daysSinceLastActivity),
      this.previousChurn(params.hasPreviousChurn),
    ];

    const score = Math.round(
      signals.reduce((sum, s) => sum + s.score * s.weight, 0),
    );

    let level: RiskLevel;
    if (score >= 76) level = 'critical';
    else if (score >= 51) level = 'high';
    else if (score >= 26) level = 'medium';
    else level = 'low';

    return {
      overallScore: score,
      riskLevel: level,
      signals: signals.filter((s) => s.score > 0),
      assessedAt: new Date(),
    };
  }

  private stageStagnation(days: number, threshold = 14): RiskSignal {
    const score = days > threshold
      ? Math.min(100, Math.round(((days - threshold) / threshold) * 100))
      : 0;
    return { name: 'stage_stagnation', weight: 0.25, score,
      description: score > 0 ? `Deal stagnant for ${days} days` : 'Progressing normally' };
  }

  private closeDateSlippage(closeDate: Date, endDate: Date): RiskSignal {
    return { name: 'close_date_slippage', weight: 0.20,
      score: closeDate > endDate ? 100 : 0,
      description: closeDate > endDate ? 'Close date past contract end' : 'On schedule' };
  }

  private timePressure(daysUntil: number, inFinal: boolean): RiskSignal {
    let score = 0;
    if (!inFinal) {
      if (daysUntil <= 30) score = 100;
      else if (daysUntil <= 45) score = 75;
      else if (daysUntil <= 60) score = 50;
    }
    return { name: 'time_pressure', weight: 0.20, score,
      description: score > 0 ? `${daysUntil} days left, not in final stage` : 'Timeline healthy' };
  }

  private valueDecrease(current: number, proposed: number): RiskSignal {
    if (current <= 0) return { name: 'value_decrease', weight: 0.15, score: 0, description: 'No baseline' };
    const ratio = proposed / current;
    let score = 0;
    if (ratio < 0.5) score = 100;
    else if (ratio < 0.75) score = 75;
    else if (ratio < 0.9) score = 50;
    else if (ratio < 1.0) score = 25;
    return { name: 'value_decrease', weight: 0.15, score,
      description: score > 0 ? `${Math.round((1 - ratio) * 100)}% value decrease` : 'Value stable or growing' };
  }

  private noActivity(days: number, threshold = 21): RiskSignal {
    const score = days > threshold
      ? Math.min(100, Math.round(((days - threshold) / threshold) * 100))
      : 0;
    return { name: 'no_activity', weight: 0.10, score,
      description: score > 0 ? `No activity in ${days} days` : 'Recent activity detected' };
  }

  private previousChurn(has: boolean): RiskSignal {
    return { name: 'previous_churn', weight: 0.10,
      score: has ? 80 : 0,
      description: has ? 'Previous churn history' : 'No prior churn' };
  }
}

// Types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskSignal {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface RiskAssessment {
  overallScore: number;
  riskLevel: RiskLevel;
  signals: RiskSignal[];
  assessedAt: Date;
}

export interface RiskAssessmentInput {
  daysSinceLastStageChange: number;
  dealCloseDate: Date;
  contractEndDate: Date;
  daysUntilExpiry: number;
  inFinalStage: boolean;
  currentValue: number;
  proposedValue: number;
  daysSinceLastActivity: number;
  hasPreviousChurn: boolean;
}
