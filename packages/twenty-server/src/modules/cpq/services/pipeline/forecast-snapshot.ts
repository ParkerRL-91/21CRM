// Forecast snapshot engine.
// Point-in-time pipeline freeze, snapshot comparison, and accuracy tracking.

import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type SnapshotDeal = {
  id: string;
  ownerId: string;
  ownerName: string;
  stage: string;
  amount: number;
  probability: number; // 0-100
  closeDate: string;
};

export type ForecastSnapshot = {
  id: string;
  takenAt: string;         // ISO datetime
  periodLabel: string;     // e.g. "Q2 2026", "April 2026"
  deals: SnapshotDeal[];
  totalPipeline: number;   // sum of all amounts
  weightedForecast: number; // sum of amount × probability
};

export type DealDiff = {
  dealId: string;
  changeType: 'added' | 'removed' | 'amount_changed' | 'stage_changed' | 'probability_changed';
  before?: Partial<SnapshotDeal>;
  after?: Partial<SnapshotDeal>;
  amountDelta?: number;
};

export type SnapshotComparison = {
  baseline: Pick<ForecastSnapshot, 'id' | 'takenAt' | 'periodLabel'>;
  current: Pick<ForecastSnapshot, 'id' | 'takenAt' | 'periodLabel'>;
  diffs: DealDiff[];
  pipelineDelta: number;       // current.totalPipeline - baseline.totalPipeline
  forecastDelta: number;       // current.weightedForecast - baseline.weightedForecast
  dealsAdded: number;
  dealsRemoved: number;
  dealsChanged: number;
};

export type AccuracyMetrics = {
  snapshotId: string;
  periodLabel: string;
  forecastedAmount: number;   // snapshot's weightedForecast
  actualAmount: number;       // what actually closed won
  errorAmount: number;        // forecastedAmount - actualAmount
  errorPercent: number;       // absolute % error
  mape: number;               // mean absolute percentage error (same as errorPercent for single snapshot)
  accurate: boolean;           // errorPercent <= threshold
};

// Create a new forecast snapshot from a list of deals.
export function createSnapshot(
  id: string,
  periodLabel: string,
  deals: SnapshotDeal[],
  takenAt?: string,
): ForecastSnapshot {
  const totalPipeline = deals.reduce(
    (sum, d) => new Decimal(sum).plus(d.amount).toNumber(),
    0,
  );
  const weightedForecast = deals.reduce(
    (sum, d) =>
      new Decimal(sum)
        .plus(new Decimal(d.amount).times(d.probability).dividedBy(100))
        .toNumber(),
    0,
  );

  return {
    id,
    takenAt: takenAt ?? new Date().toISOString(),
    periodLabel,
    deals,
    totalPipeline: new Decimal(totalPipeline).toDecimalPlaces(2).toNumber(),
    weightedForecast: new Decimal(weightedForecast).toDecimalPlaces(2).toNumber(),
  };
}

// Compare a baseline snapshot to a current snapshot and return a diff.
export function compareSnapshots(
  baseline: ForecastSnapshot,
  current: ForecastSnapshot,
): SnapshotComparison {
  const baselineMap = new Map(baseline.deals.map((d) => [d.id, d]));
  const currentMap = new Map(current.deals.map((d) => [d.id, d]));
  const diffs: DealDiff[] = [];

  // Deals added
  for (const deal of current.deals) {
    if (!baselineMap.has(deal.id)) {
      diffs.push({ dealId: deal.id, changeType: 'added', after: deal });
    }
  }

  // Deals removed
  for (const deal of baseline.deals) {
    if (!currentMap.has(deal.id)) {
      diffs.push({ dealId: deal.id, changeType: 'removed', before: deal });
    }
  }

  // Deals changed
  for (const deal of current.deals) {
    const base = baselineMap.get(deal.id);
    if (!base) continue;

    if (base.amount !== deal.amount) {
      diffs.push({
        dealId: deal.id,
        changeType: 'amount_changed',
        before: { amount: base.amount },
        after: { amount: deal.amount },
        amountDelta: new Decimal(deal.amount).minus(base.amount).toNumber(),
      });
    } else if (base.stage !== deal.stage) {
      diffs.push({
        dealId: deal.id,
        changeType: 'stage_changed',
        before: { stage: base.stage },
        after: { stage: deal.stage },
      });
    } else if (base.probability !== deal.probability) {
      diffs.push({
        dealId: deal.id,
        changeType: 'probability_changed',
        before: { probability: base.probability },
        after: { probability: deal.probability },
      });
    }
  }

  const dealsAdded = diffs.filter((d) => d.changeType === 'added').length;
  const dealsRemoved = diffs.filter((d) => d.changeType === 'removed').length;
  const dealsChanged = diffs.filter(
    (d) => d.changeType !== 'added' && d.changeType !== 'removed',
  ).length;

  return {
    baseline: { id: baseline.id, takenAt: baseline.takenAt, periodLabel: baseline.periodLabel },
    current: { id: current.id, takenAt: current.takenAt, periodLabel: current.periodLabel },
    diffs,
    pipelineDelta: new Decimal(current.totalPipeline)
      .minus(baseline.totalPipeline)
      .toDecimalPlaces(2)
      .toNumber(),
    forecastDelta: new Decimal(current.weightedForecast)
      .minus(baseline.weightedForecast)
      .toDecimalPlaces(2)
      .toNumber(),
    dealsAdded,
    dealsRemoved,
    dealsChanged,
  };
}

// Compute forecast accuracy against actual closed-won revenue.
export function computeAccuracy(
  snapshot: ForecastSnapshot,
  actualAmount: number,
  accuracyThresholdPercent: number = 10,
): AccuracyMetrics {
  const forecasted = snapshot.weightedForecast;
  const errorAmount = new Decimal(forecasted).minus(actualAmount).toDecimalPlaces(2).toNumber();
  const errorPercent =
    actualAmount !== 0
      ? new Decimal(Math.abs(errorAmount))
          .dividedBy(actualAmount)
          .times(100)
          .toDecimalPlaces(2)
          .toNumber()
      : forecasted > 0
        ? 100
        : 0;

  return {
    snapshotId: snapshot.id,
    periodLabel: snapshot.periodLabel,
    forecastedAmount: forecasted,
    actualAmount,
    errorAmount,
    errorPercent,
    mape: errorPercent,
    accurate: errorPercent <= accuracyThresholdPercent,
  };
}
