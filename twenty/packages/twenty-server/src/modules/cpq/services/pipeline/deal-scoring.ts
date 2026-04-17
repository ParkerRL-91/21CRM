import { Injectable, Logger } from '@nestjs/common';

// AI deal scoring engine — rule-based scoring (0-100) with weighted
// factors. Uses historical deal patterns to predict win likelihood.
// Phase 1: deterministic rules. Phase 2: ML model integration.
@Injectable()
export class DealScoringEngine {
  private readonly logger = new Logger(DealScoringEngine.name);

  scoreDeal(deal: DealScoringInput, benchmarks: DealBenchmarks): DealScore {
    const factors: ScoringFactor[] = [];

    factors.push(this.scoreStageProgress(deal, benchmarks));
    factors.push(this.scoreDealSize(deal, benchmarks));
    factors.push(this.scoreVelocity(deal, benchmarks));
    factors.push(this.scoreEngagement(deal));
    factors.push(this.scoreTimeliness(deal, benchmarks));
    factors.push(this.scoreDealCompleteness(deal));

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
    const overallScore = totalWeight > 0
      ? Math.round(Math.min(100, Math.max(0, weightedScore / totalWeight)))
      : 0;

    return {
      dealId: deal.hubspotId,
      overallScore,
      confidence: this.computeConfidence(factors),
      prediction: overallScore >= 70 ? 'likely_win' : overallScore >= 40 ? 'uncertain' : 'likely_loss',
      factors,
      scoredAt: new Date().toISOString(),
    };
  }

  scoreBatch(deals: DealScoringInput[], benchmarks: DealBenchmarks): DealScore[] {
    return deals.map((deal) => this.scoreDeal(deal, benchmarks));
  }

  computeBenchmarks(historicalDeals: HistoricalDeal[]): DealBenchmarks {
    const wonDeals = historicalDeals.filter((d) => d.isWon);
    const lostDeals = historicalDeals.filter((d) => !d.isWon);

    const avgWonAmount = wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + d.amount, 0) / wonDeals.length
      : 0;
    const avgWonCycleDays = wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + d.cycleDays, 0) / wonDeals.length
      : 90;
    const avgWonActivities = wonDeals.length > 0
      ? wonDeals.reduce((s, d) => s + d.activityCount, 0) / wonDeals.length
      : 10;

    const stageWinRates: Record<string, number> = {};
    const stageDeals: Record<string, { won: number; total: number }> = {};
    for (const deal of historicalDeals) {
      const stage = deal.lastStage;
      if (!stageDeals[stage]) stageDeals[stage] = { won: 0, total: 0 };
      stageDeals[stage].total++;
      if (deal.isWon) stageDeals[stage].won++;
    }
    for (const [stage, counts] of Object.entries(stageDeals)) {
      stageWinRates[stage] = counts.total > 0
        ? Math.round((counts.won / counts.total) * 100)
        : 50;
    }

    return {
      avgWonDealAmount: avgWonAmount,
      avgWonCycleDays: avgWonCycleDays,
      avgWonActivities: avgWonActivities,
      overallWinRate: historicalDeals.length > 0
        ? Math.round((wonDeals.length / historicalDeals.length) * 100)
        : 30,
      stageWinRates,
      sampleSize: historicalDeals.length,
    };
  }

  private scoreStageProgress(deal: DealScoringInput, benchmarks: DealBenchmarks): ScoringFactor {
    const stageRate = benchmarks.stageWinRates[deal.dealstage];
    const score = stageRate !== undefined ? stageRate : benchmarks.overallWinRate;
    return {
      name: 'stage_progress',
      weight: 0.25,
      score,
      explanation: `Stage "${deal.dealstage}" has ${score}% historical win rate`,
    };
  }

  private scoreDealSize(deal: DealScoringInput, benchmarks: DealBenchmarks): ScoringFactor {
    if (!deal.amount || benchmarks.avgWonDealAmount <= 0) {
      return { name: 'deal_size', weight: 0.10, score: 50, explanation: 'No amount data' };
    }
    const ratio = deal.amount / benchmarks.avgWonDealAmount;
    let score: number;
    if (ratio >= 0.5 && ratio <= 2.0) score = 80;
    else if (ratio > 2.0 && ratio <= 5.0) score = 50;
    else if (ratio > 5.0) score = 30;
    else score = 60;

    return {
      name: 'deal_size',
      weight: 0.10,
      score,
      explanation: `Deal is ${ratio.toFixed(1)}x average won deal size ($${benchmarks.avgWonDealAmount.toLocaleString()})`,
    };
  }

  private scoreVelocity(deal: DealScoringInput, benchmarks: DealBenchmarks): ScoringFactor {
    if (!deal.daysInPipeline || benchmarks.avgWonCycleDays <= 0) {
      return { name: 'velocity', weight: 0.20, score: 50, explanation: 'No velocity data' };
    }
    const ratio = deal.daysInPipeline / benchmarks.avgWonCycleDays;
    let score: number;
    if (ratio <= 0.5) score = 90;
    else if (ratio <= 1.0) score = 70;
    else if (ratio <= 1.5) score = 40;
    else if (ratio <= 2.0) score = 20;
    else score = 10;

    return {
      name: 'velocity',
      weight: 0.20,
      score,
      explanation: `${deal.daysInPipeline} days in pipeline vs ${benchmarks.avgWonCycleDays} avg for won deals`,
    };
  }

  private scoreEngagement(deal: DealScoringInput): ScoringFactor {
    const activity = deal.activityCount || 0;
    let score: number;
    if (activity >= 15) score = 90;
    else if (activity >= 10) score = 70;
    else if (activity >= 5) score = 50;
    else if (activity >= 1) score = 30;
    else score = 10;

    return {
      name: 'engagement',
      weight: 0.20,
      score,
      explanation: `${activity} activities logged`,
    };
  }

  private scoreTimeliness(deal: DealScoringInput, benchmarks: DealBenchmarks): ScoringFactor {
    if (!deal.daysSinceLastActivity) {
      return { name: 'timeliness', weight: 0.15, score: 50, explanation: 'No activity data' };
    }
    let score: number;
    if (deal.daysSinceLastActivity <= 3) score = 90;
    else if (deal.daysSinceLastActivity <= 7) score = 70;
    else if (deal.daysSinceLastActivity <= 14) score = 40;
    else if (deal.daysSinceLastActivity <= 30) score = 20;
    else score = 5;

    return {
      name: 'timeliness',
      weight: 0.15,
      score,
      explanation: `Last activity ${deal.daysSinceLastActivity} days ago`,
    };
  }

  private scoreDealCompleteness(deal: DealScoringInput): ScoringFactor {
    let filled = 0;
    let total = 6;
    if (deal.amount) filled++;
    if (deal.closedate) filled++;
    if (deal.hubspotOwnerId) filled++;
    if (deal.dealstage) filled++;
    if (deal.contactAssociated) filled++;
    if (deal.companyAssociated) filled++;

    const score = Math.round((filled / total) * 100);
    return {
      name: 'completeness',
      weight: 0.10,
      score,
      explanation: `${filled}/${total} key fields populated`,
    };
  }

  private computeConfidence(factors: ScoringFactor[]): 'high' | 'medium' | 'low' {
    const dataFactors = factors.filter((f) => !f.explanation.includes('No '));
    const ratio = dataFactors.length / factors.length;
    if (ratio >= 0.8) return 'high';
    if (ratio >= 0.5) return 'medium';
    return 'low';
  }
}

// Types
export type DealScoringInput = {
  hubspotId: string;
  dealname: string;
  amount: number | null;
  closedate: string | null;
  dealstage: string;
  hubspotOwnerId: string | null;
  daysInPipeline: number | null;
  activityCount: number | null;
  daysSinceLastActivity: number | null;
  contactAssociated: boolean;
  companyAssociated: boolean;
};

export type HistoricalDeal = {
  amount: number;
  cycleDays: number;
  activityCount: number;
  lastStage: string;
  isWon: boolean;
};

export type DealBenchmarks = {
  avgWonDealAmount: number;
  avgWonCycleDays: number;
  avgWonActivities: number;
  overallWinRate: number;
  stageWinRates: Record<string, number>;
  sampleSize: number;
};

export type ScoringFactor = {
  name: string;
  weight: number;
  score: number;
  explanation: string;
};

export type DealScore = {
  dealId: string;
  overallScore: number;
  confidence: 'high' | 'medium' | 'low';
  prediction: 'likely_win' | 'uncertain' | 'likely_loss';
  factors: ScoringFactor[];
  scoredAt: string;
};
