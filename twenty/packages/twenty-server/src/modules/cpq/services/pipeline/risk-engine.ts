import { Injectable, Logger } from '@nestjs/common';

// Deal risk flags engine — evaluates open deals against configurable rules
// to surface stale, slipping, shrinking, and missing-data risks.
// All computation uses local data only (no HubSpot API calls).
@Injectable()
export class PipelineRiskEngine {
  private readonly logger = new Logger(PipelineRiskEngine.name);

  computeDealRisks(
    deals: DealRecord[],
    stageHistory: StageHistoryRecord[],
    changeLog: PropertyChangeRecord[],
    config: RiskConfig = DEFAULT_RISK_CONFIG,
  ): DealRiskResult[] {
    const now = new Date();
    const historyByDeal = this.groupBy(stageHistory, 'dealId');
    const changesByDeal = this.groupBy(changeLog, 'dealId');

    return deals.map((deal) => {
      const history = historyByDeal[deal.hubspotId] || [];
      const changes = changesByDeal[deal.hubspotId] || [];
      const flags: RiskFlag[] = [];

      const staleFlag = this.evaluateStale(deal, history, now, config.staleDaysThreshold);
      if (staleFlag) flags.push(staleFlag);

      const slippedFlag = this.evaluateSlipped(deal, changes, now);
      if (slippedFlag) flags.push(slippedFlag);

      const shrinkingFlag = this.evaluateShrinking(deal, changes);
      if (shrinkingFlag) flags.push(shrinkingFlag);

      const noCloseDateFlag = this.evaluateNoCloseDate(deal);
      if (noCloseDateFlag) flags.push(noCloseDateFlag);

      const noOwnerFlag = this.evaluateNoOwner(deal);
      if (noOwnerFlag) flags.push(noOwnerFlag);

      return {
        dealId: deal.hubspotId,
        dealName: deal.dealname,
        amount: deal.amount,
        owner: deal.hubspotOwnerId,
        flags,
        riskLevel: this.computeRiskLevel(flags),
        isAtRisk: flags.length > 0,
      };
    });
  }

  computeRiskSummary(results: DealRiskResult[]): RiskSummary {
    const atRisk = results.filter((r) => r.isAtRisk);
    const totalAtRiskValue = atRisk.reduce((sum, r) => sum + (r.amount || 0), 0);

    const byType: Record<string, { count: number; value: number }> = {};
    for (const result of atRisk) {
      for (const flag of result.flags) {
        if (!byType[flag.type]) byType[flag.type] = { count: 0, value: 0 };
        byType[flag.type].count++;
        byType[flag.type].value += result.amount || 0;
      }
    }

    return {
      totalDeals: results.length,
      dealsAtRisk: atRisk.length,
      totalAtRiskValue,
      byType,
      byLevel: {
        critical: results.filter((r) => r.riskLevel === 'critical').length,
        high: results.filter((r) => r.riskLevel === 'high').length,
        medium: results.filter((r) => r.riskLevel === 'medium').length,
        low: results.filter((r) => r.riskLevel === 'low').length,
        none: results.filter((r) => r.riskLevel === 'none').length,
      },
    };
  }

  private evaluateStale(
    deal: DealRecord,
    history: StageHistoryRecord[],
    now: Date,
    threshold: number,
  ): RiskFlag | null {
    if (!history.length) {
      const syncAge = deal.firstSyncedAt
        ? this.daysBetween(new Date(deal.firstSyncedAt), now)
        : 0;
      if (syncAge > threshold) {
        return {
          type: 'stale',
          severity: 'high',
          message: `No stage changes recorded. In pipeline for ${syncAge} days.`,
          details: { daysSinceLastChange: syncAge, threshold },
        };
      }
      return null;
    }

    const lastChange = history.reduce((latest, h) =>
      new Date(h.timestamp) > new Date(latest.timestamp) ? h : latest,
    );
    const daysSince = this.daysBetween(new Date(lastChange.timestamp), now);

    if (daysSince >= threshold) {
      return {
        type: 'stale',
        severity: daysSince >= threshold * 2 ? 'critical' : 'high',
        message: `No stage change in ${daysSince} days (threshold: ${threshold}).`,
        details: { daysSinceLastChange: daysSince, threshold, lastStage: lastChange.newStage },
      };
    }
    return null;
  }

  private evaluateSlipped(
    deal: DealRecord,
    changes: PropertyChangeRecord[],
    now: Date,
  ): RiskFlag | null {
    if (!deal.closedate) return null;

    const closeDate = new Date(deal.closedate);

    if (closeDate < now) {
      return {
        type: 'slipped',
        severity: 'critical',
        message: `Close date (${deal.closedate}) is in the past.`,
        details: { closedate: deal.closedate, daysOverdue: this.daysBetween(closeDate, now) },
      };
    }

    const closeDateChanges = changes.filter((c) => c.property === 'closedate');
    if (closeDateChanges.length > 0) {
      const firstCloseDate = closeDateChanges[0].oldValue;
      if (firstCloseDate && new Date(firstCloseDate) < closeDate) {
        return {
          type: 'slipped',
          severity: 'high',
          message: `Close date pushed from ${firstCloseDate} to ${deal.closedate}.`,
          details: { originalCloseDate: firstCloseDate, currentCloseDate: deal.closedate },
        };
      }
    }
    return null;
  }

  private evaluateShrinking(
    deal: DealRecord,
    changes: PropertyChangeRecord[],
  ): RiskFlag | null {
    const amountChanges = changes.filter((c) => c.property === 'amount');
    if (amountChanges.length === 0) return null;

    const maxAmount = Math.max(
      deal.amount || 0,
      ...amountChanges.map((c) => parseFloat(c.oldValue || '0')),
    );
    const currentAmount = deal.amount || 0;

    if (maxAmount > 0 && currentAmount < maxAmount) {
      const decrease = ((maxAmount - currentAmount) / maxAmount) * 100;
      return {
        type: 'shrinking',
        severity: decrease > 25 ? 'high' : 'medium',
        message: `Amount decreased by ${decrease.toFixed(0)}% from peak $${maxAmount.toLocaleString()}.`,
        details: { peakAmount: maxAmount, currentAmount, decreasePercent: decrease },
      };
    }
    return null;
  }

  private evaluateNoCloseDate(deal: DealRecord): RiskFlag | null {
    if (!deal.closedate || deal.closedate.trim() === '') {
      return {
        type: 'no_close_date',
        severity: 'medium',
        message: 'Deal has no close date set.',
        details: {},
      };
    }
    return null;
  }

  private evaluateNoOwner(deal: DealRecord): RiskFlag | null {
    if (!deal.hubspotOwnerId || deal.hubspotOwnerId.trim() === '') {
      return {
        type: 'no_owner',
        severity: 'medium',
        message: 'Deal has no assigned owner.',
        details: {},
      };
    }
    return null;
  }

  private computeRiskLevel(flags: RiskFlag[]): RiskLevel {
    if (flags.length === 0) return 'none';
    if (flags.some((f) => f.severity === 'critical')) return 'critical';
    if (flags.some((f) => f.severity === 'high')) return 'high';
    if (flags.some((f) => f.severity === 'medium')) return 'medium';
    return 'low';
  }

  private daysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  }

  private groupBy<T>(items: T[], key: string): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of items) {
      const value = (item as Record<string, unknown>)[key] as string;
      if (!result[value]) result[value] = [];
      result[value].push(item);
    }
    return result;
  }
}

// Types
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type RiskFlagType = 'stale' | 'slipped' | 'shrinking' | 'no_close_date' | 'no_owner';

export type RiskFlag = {
  type: RiskFlagType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, unknown>;
};

export type DealRecord = {
  hubspotId: string;
  dealname: string;
  amount: number | null;
  closedate: string | null;
  dealstage: string;
  hubspotOwnerId: string | null;
  firstSyncedAt: string | null;
};

export type StageHistoryRecord = {
  dealId: string;
  oldStage: string;
  newStage: string;
  timestamp: string;
};

export type PropertyChangeRecord = {
  dealId: string;
  property: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
};

export type RiskConfig = {
  staleDaysThreshold: number;
};

export type DealRiskResult = {
  dealId: string;
  dealName: string;
  amount: number | null;
  owner: string | null;
  flags: RiskFlag[];
  riskLevel: RiskLevel;
  isAtRisk: boolean;
};

export type RiskSummary = {
  totalDeals: number;
  dealsAtRisk: number;
  totalAtRiskValue: number;
  byType: Record<string, { count: number; value: number }>;
  byLevel: Record<string, number>;
};

const DEFAULT_RISK_CONFIG: RiskConfig = {
  staleDaysThreshold: 14,
};
