// Multi-method forecast display engine.
// Computes pipeline, historical, and blended forecasts side-by-side.

import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type OpenDeal = {
  id: string;
  amount: number;
  probability: number; // 0-100 — stage-based probability
  ownerId: string;
  ownerName: string;
  stage: string;
};

export type HistoricalPeriod = {
  totalPipelineEntered: number;  // total pipeline value that entered in the period
  totalClosedWon: number;        // total closed-won value in the period
};

export type ForecastMethod = 'pipeline' | 'historical' | 'blended';

export type MethodForecast = {
  method: ForecastMethod;
  amount: number;
  description: string;
};

export type RepForecast = {
  ownerId: string;
  ownerName: string;
  pipeline: number;
  historical: number;
  blended: number;
};

export type MultiMethodForecastResult = {
  methods: Record<ForecastMethod, MethodForecast>;
  byRep: RepForecast[];
  quota?: number;
  attainmentPercent?: Record<ForecastMethod, number>;
};

// Pipeline method: sum of (amount × probability) for all open deals.
export function computePipelineForecast(deals: OpenDeal[]): number {
  return deals.reduce(
    (sum, d) =>
      new Decimal(sum)
        .plus(new Decimal(d.amount).times(d.probability).dividedBy(100))
        .toDecimalPlaces(2)
        .toNumber(),
    0,
  );
}

// Historical method: applies the historical win rate to the current open pipeline value.
// historicalWinRate = totalClosedWon / totalPipelineEntered (average across provided periods)
// forecast = sum(open deal amounts) × historicalWinRate
export function computeHistoricalForecast(
  deals: OpenDeal[],
  history: HistoricalPeriod[],
): number {
  if (history.length === 0) return 0;

  const totalEntered = history.reduce((s, p) => new Decimal(s).plus(p.totalPipelineEntered).toNumber(), 0);
  if (totalEntered === 0) return 0;

  const totalWon = history.reduce((s, p) => new Decimal(s).plus(p.totalClosedWon).toNumber(), 0);
  const winRate = new Decimal(totalWon).dividedBy(totalEntered);

  const openPipeline = deals.reduce(
    (s, d) => new Decimal(s).plus(d.amount).toNumber(),
    0,
  );

  return new Decimal(openPipeline).times(winRate).toDecimalPlaces(2).toNumber();
}

// Blended method: weighted average of pipeline and historical.
// Default: 50/50. Pass pipelineWeight (0-1) to adjust.
export function computeBlendedForecast(
  pipelineForecast: number,
  historicalForecast: number,
  pipelineWeight: number = 0.5,
): number {
  const pw = Math.max(0, Math.min(1, pipelineWeight));
  const hw = 1 - pw;
  return new Decimal(pipelineForecast)
    .times(pw)
    .plus(new Decimal(historicalForecast).times(hw))
    .toDecimalPlaces(2)
    .toNumber();
}

// Compute all three methods and return a side-by-side result.
export function computeMultiMethodForecast(
  deals: OpenDeal[],
  history: HistoricalPeriod[],
  options: {
    quota?: number;
    pipelineWeight?: number;
  } = {},
): MultiMethodForecastResult {
  const pipeline = computePipelineForecast(deals);
  const historical = computeHistoricalForecast(deals, history);
  const blended = computeBlendedForecast(pipeline, historical, options.pipelineWeight);

  // Per-rep breakdown (pipeline method only — historical requires cohort data per rep)
  const repMap = new Map<string, RepForecast>();
  for (const deal of deals) {
    if (!repMap.has(deal.ownerId)) {
      repMap.set(deal.ownerId, {
        ownerId: deal.ownerId,
        ownerName: deal.ownerName,
        pipeline: 0,
        historical: 0,
        blended: 0,
      });
    }
    const rep = repMap.get(deal.ownerId)!;
    const weighted = new Decimal(deal.amount).times(deal.probability).dividedBy(100).toDecimalPlaces(2).toNumber();
    rep.pipeline = new Decimal(rep.pipeline).plus(weighted).toDecimalPlaces(2).toNumber();
    // historical and blended per-rep left as 0 (requires per-rep historical cohort)
  }

  const methods: Record<ForecastMethod, MethodForecast> = {
    pipeline: {
      method: 'pipeline',
      amount: pipeline,
      description: 'Probability-weighted sum of open pipeline',
    },
    historical: {
      method: 'historical',
      amount: historical,
      description: 'Historical win rate applied to open pipeline value',
    },
    blended: {
      method: 'blended',
      amount: blended,
      description: `Weighted average of pipeline (${Math.round((options.pipelineWeight ?? 0.5) * 100)}%) and historical (${Math.round((1 - (options.pipelineWeight ?? 0.5)) * 100)}%)`,
    },
  };

  const result: MultiMethodForecastResult = {
    methods,
    byRep: Array.from(repMap.values()),
  };

  if (options.quota !== undefined) {
    result.quota = options.quota;
    const q = options.quota;
    if (q > 0) {
      result.attainmentPercent = {
        pipeline: new Decimal(pipeline).dividedBy(q).times(100).toDecimalPlaces(1).toNumber(),
        historical: new Decimal(historical).dividedBy(q).times(100).toDecimalPlaces(1).toNumber(),
        blended: new Decimal(blended).dividedBy(q).times(100).toDecimalPlaces(1).toNumber(),
      };
    }
  }

  return result;
}
