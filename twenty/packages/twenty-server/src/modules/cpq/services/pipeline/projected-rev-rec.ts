import { Injectable, Logger } from '@nestjs/common';

import { Decimal } from 'src/modules/cpq/utils/cpq-decimal.utils';

// Projected rev-rec engine — extends standard rev-rec with probability-
// weighted projections from open pipeline deals. This is 21CRM's unique
// differentiator: no competitor shows Quote → Signed → Revenue Recognition.
//
// Three modes:
// 1. Closed Only: standard rev-rec from closed-won deals
// 2. Closed + Pipeline: adds weighted projections from open deals
// 3. Closed + Pipeline + Quotes: adds signed quote projections
@Injectable()
export class ProjectedRevRecEngine {
  private readonly logger = new Logger(ProjectedRevRecEngine.name);

  computeProjectedSchedules(
    openDeals: OpenDealRecord[],
    config: ProjectionConfig = DEFAULT_PROJECTION_CONFIG,
  ): ProjectedSchedule[] {
    const schedules: ProjectedSchedule[] = [];

    for (const deal of openDeals) {
      if (!deal.amount || deal.amount <= 0) continue;

      const probability = this.resolveProbability(deal, config);
      if (probability <= 0) continue;

      const weightedAmount = new Decimal(deal.amount).times(probability).dividedBy(100);
      const startDate = deal.expectedCloseDate || deal.closedate;
      if (!startDate) continue;

      const durationMonths = deal.termMonths || config.defaultTermMonths;
      const monthly = weightedAmount.dividedBy(durationMonths);

      const monthlySchedule: Record<string, string> = {};
      const start = new Date(startDate);

      for (let i = 0; i < durationMonths; i++) {
        const year = start.getFullYear() + Math.floor((start.getMonth() + i) / 12);
        const month = ((start.getMonth() + i) % 12) + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        monthlySchedule[key] = monthly.toDecimalPlaces(2).toString();
      }

      schedules.push({
        dealId: deal.hubspotId,
        dealName: deal.dealname,
        sourceType: 'projected_deal',
        probability,
        originalAmount: deal.amount.toString(),
        weightedAmount: weightedAmount.toDecimalPlaces(2).toString(),
        startDate,
        durationMonths,
        monthlySchedule,
      });
    }

    return schedules;
  }

  computeQuoteProjections(
    signedQuotes: SignedQuoteRecord[],
  ): ProjectedSchedule[] {
    const schedules: ProjectedSchedule[] = [];

    for (const quote of signedQuotes) {
      if (!quote.amount || quote.amount <= 0) continue;

      const amount = new Decimal(quote.amount);
      const durationMonths = quote.termMonths || 12;
      const monthly = amount.dividedBy(durationMonths);
      const startDate = quote.startDate || quote.signedDate;
      if (!startDate) continue;

      const monthlySchedule: Record<string, string> = {};
      const start = new Date(startDate);

      for (let i = 0; i < durationMonths; i++) {
        const year = start.getFullYear() + Math.floor((start.getMonth() + i) / 12);
        const month = ((start.getMonth() + i) % 12) + 1;
        const key = `${year}-${String(month).padStart(2, '0')}`;
        monthlySchedule[key] = monthly.toDecimalPlaces(2).toString();
      }

      schedules.push({
        dealId: quote.dealId || quote.quoteId,
        dealName: quote.title,
        sourceType: 'quote',
        probability: 100,
        originalAmount: quote.amount.toString(),
        weightedAmount: amount.toDecimalPlaces(2).toString(),
        startDate,
        durationMonths,
        monthlySchedule,
      });
    }

    return schedules;
  }

  mergeSchedules(
    closedSchedules: MergeableSchedule[],
    projectedSchedules: ProjectedSchedule[],
    mode: ProjectionMode,
  ): MergedMonthlyView {
    const months: Record<string, MonthlyBreakdown> = {};

    for (const schedule of closedSchedules) {
      for (const [month, value] of Object.entries(schedule.monthlySchedule)) {
        if (!months[month]) months[month] = this.emptyMonth(month);
        months[month].closed = new Decimal(months[month].closed)
          .plus(new Decimal(value))
          .toDecimalPlaces(2)
          .toString();
      }
    }

    if (mode === 'closed_plus_pipeline' || mode === 'closed_plus_pipeline_plus_quotes') {
      const pipelineSchedules = projectedSchedules.filter((s) => s.sourceType === 'projected_deal');
      for (const schedule of pipelineSchedules) {
        for (const [month, value] of Object.entries(schedule.monthlySchedule)) {
          if (!months[month]) months[month] = this.emptyMonth(month);
          months[month].projected = new Decimal(months[month].projected)
            .plus(new Decimal(value))
            .toDecimalPlaces(2)
            .toString();
        }
      }
    }

    if (mode === 'closed_plus_pipeline_plus_quotes') {
      const quoteSchedules = projectedSchedules.filter((s) => s.sourceType === 'quote');
      for (const schedule of quoteSchedules) {
        for (const [month, value] of Object.entries(schedule.monthlySchedule)) {
          if (!months[month]) months[month] = this.emptyMonth(month);
          months[month].quoted = new Decimal(months[month].quoted)
            .plus(new Decimal(value))
            .toDecimalPlaces(2)
            .toString();
        }
      }
    }

    for (const month of Object.values(months)) {
      month.total = new Decimal(month.closed)
        .plus(new Decimal(month.projected))
        .plus(new Decimal(month.quoted))
        .toDecimalPlaces(2)
        .toString();
    }

    const sortedMonths = Object.values(months).sort((a, b) => a.month.localeCompare(b.month));

    return {
      months: sortedMonths,
      mode,
      totals: {
        closed: sortedMonths.reduce((s, m) => s.plus(m.closed), new Decimal(0)).toDecimalPlaces(2).toString(),
        projected: sortedMonths.reduce((s, m) => s.plus(m.projected), new Decimal(0)).toDecimalPlaces(2).toString(),
        quoted: sortedMonths.reduce((s, m) => s.plus(m.quoted), new Decimal(0)).toDecimalPlaces(2).toString(),
        total: sortedMonths.reduce((s, m) => s.plus(m.total), new Decimal(0)).toDecimalPlaces(2).toString(),
      },
    };
  }

  private resolveProbability(deal: OpenDealRecord, config: ProjectionConfig): number {
    if (deal.forecastCategory === 'omit') return 0;
    if (deal.probability !== undefined && deal.probability !== null) return deal.probability;
    return config.stageProbabilities[deal.dealstage] ?? config.defaultProbability;
  }

  private emptyMonth(month: string): MonthlyBreakdown {
    return { month, closed: '0', projected: '0', quoted: '0', total: '0' };
  }
}

// Types
export type ProjectionMode = 'closed_only' | 'closed_plus_pipeline' | 'closed_plus_pipeline_plus_quotes';

export type OpenDealRecord = {
  hubspotId: string;
  dealname: string;
  amount: number;
  closedate: string | null;
  expectedCloseDate?: string;
  dealstage: string;
  probability?: number;
  forecastCategory?: string;
  termMonths?: number;
};

export type SignedQuoteRecord = {
  quoteId: string;
  dealId?: string;
  title: string;
  amount: number;
  termMonths?: number;
  startDate?: string;
  signedDate: string;
};

export type ProjectionConfig = {
  defaultTermMonths: number;
  defaultProbability: number;
  stageProbabilities: Record<string, number>;
};

export type ProjectedSchedule = {
  dealId: string;
  dealName: string;
  sourceType: 'projected_deal' | 'quote';
  probability: number;
  originalAmount: string;
  weightedAmount: string;
  startDate: string;
  durationMonths: number;
  monthlySchedule: Record<string, string>;
};

export type MergeableSchedule = {
  monthlySchedule: Record<string, number | string>;
};

export type MonthlyBreakdown = {
  month: string;
  closed: string;
  projected: string;
  quoted: string;
  total: string;
};

export type MergedMonthlyView = {
  months: MonthlyBreakdown[];
  mode: ProjectionMode;
  totals: {
    closed: string;
    projected: string;
    quoted: string;
    total: string;
  };
};

const DEFAULT_PROJECTION_CONFIG: ProjectionConfig = {
  defaultTermMonths: 12,
  defaultProbability: 50,
  stageProbabilities: {
    qualification: 20,
    discovery: 30,
    proposal: 50,
    negotiation: 70,
    commit: 90,
  },
};
