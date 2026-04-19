/**
 * Pipeline movement view engine.
 * Compares two pipeline snapshots to compute weekly adds, losses,
 * closed-won, and stage changes — broken down by rep.
 */

import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type DealSnapshot = {
  id: string;
  ownerId: string;
  ownerName: string;
  stage: string;
  amount: number;
  closeDate: string; // ISO date string
};

export type DealMovement = {
  dealId: string;
  ownerId: string;
  ownerName: string;
  fromStage: string;
  toStage: string;
  amount: number;
  direction: 'forward' | 'backward';
};

export type RepSummary = {
  ownerId: string;
  ownerName: string;
  dealsAdded: number;
  amountAdded: number;
  dealsLost: number;
  amountLost: number;
  dealsClosedWon: number;
  amountClosedWon: number;
  stageChanges: number;
};

export type PipelineMovementResult = {
  period: { start: string; end: string };
  totals: {
    dealsAdded: number;
    amountAdded: number;
    dealsLost: number;
    amountLost: number;
    dealsClosedWon: number;
    amountClosedWon: number;
    stageChanges: number;
  };
  movements: DealMovement[];
  byRep: RepSummary[];
};

const CLOSED_WON_STAGES = new Set(['closed_won', 'closedwon', 'closed won']);
const CLOSED_LOST_STAGES = new Set(['closed_lost', 'closedlost', 'closed lost']);

function isClosedWon(stage: string): boolean {
  return CLOSED_WON_STAGES.has(stage.toLowerCase().replace(/-/g, ' '));
}

function isClosedLost(stage: string): boolean {
  return CLOSED_LOST_STAGES.has(stage.toLowerCase().replace(/-/g, ' '));
}

/**
 * Compute pipeline movement between two snapshots.
 *
 * - Deals in `endSnapshot` but not `startSnapshot` → added
 * - Deals in `startSnapshot` but not `endSnapshot`:
 *   - if end stage was closed_won → closedWon
 *   - if end stage was closed_lost OR simply missing → lost
 * - Deals present in both but stage changed → stageChange
 */
export function computePipelineMovement(
  startSnapshot: DealSnapshot[],
  endSnapshot: DealSnapshot[],
  periodStart: string,
  periodEnd: string,
): PipelineMovementResult {
  const startMap = new Map<string, DealSnapshot>(startSnapshot.map((d) => [d.id, d]));
  const endMap = new Map<string, DealSnapshot>(endSnapshot.map((d) => [d.id, d]));

  const movements: DealMovement[] = [];

  // Aggregate per-rep state
  const repMap = new Map<string, RepSummary>();

  function getRep(ownerId: string, ownerName: string): RepSummary {
    if (!repMap.has(ownerId)) {
      repMap.set(ownerId, {
        ownerId,
        ownerName,
        dealsAdded: 0,
        amountAdded: 0,
        dealsLost: 0,
        amountLost: 0,
        dealsClosedWon: 0,
        amountClosedWon: 0,
        stageChanges: 0,
      });
    }
    return repMap.get(ownerId)!;
  }

  const totals = {
    dealsAdded: 0,
    amountAdded: 0,
    dealsLost: 0,
    amountLost: 0,
    dealsClosedWon: 0,
    amountClosedWon: 0,
    stageChanges: 0,
  };

  // New deals (in end but not start)
  for (const deal of endSnapshot) {
    if (!startMap.has(deal.id)) {
      totals.dealsAdded++;
      totals.amountAdded = new Decimal(totals.amountAdded).plus(deal.amount).toNumber();
      const rep = getRep(deal.ownerId, deal.ownerName);
      rep.dealsAdded++;
      rep.amountAdded = new Decimal(rep.amountAdded).plus(deal.amount).toNumber();
    }
  }

  // Deals that left pipeline (in start but not end)
  for (const deal of startSnapshot) {
    if (!endMap.has(deal.id)) {
      if (isClosedWon(deal.stage)) {
        // Already closed won at start — treat as existing win, not a new movement
        continue;
      }
      // Check whether this deal closed won in the end (won't be in endMap if removed after close)
      // Without the end record we use the start stage; if it was closed_won by any signal it's a win
      const rep = getRep(deal.ownerId, deal.ownerName);
      totals.dealsLost++;
      totals.amountLost = new Decimal(totals.amountLost).plus(deal.amount).toNumber();
      rep.dealsLost++;
      rep.amountLost = new Decimal(rep.amountLost).plus(deal.amount).toNumber();
    }
  }

  // Stage changes (in both but stage differs)
  const STAGE_ORDER = [
    'prospecting',
    'qualification',
    'needs analysis',
    'value proposition',
    'decision makers',
    'perception analysis',
    'proposal/price quote',
    'negotiation/review',
    'closed won',
    'closed lost',
  ];

  function stageIndex(stage: string): number {
    const idx = STAGE_ORDER.indexOf(stage.toLowerCase());
    return idx === -1 ? 5 : idx; // default to mid-funnel
  }

  for (const endDeal of endSnapshot) {
    const startDeal = startMap.get(endDeal.id);
    if (!startDeal) continue;

    if (startDeal.stage !== endDeal.stage) {
      const fromIdx = stageIndex(startDeal.stage);
      const toIdx = stageIndex(endDeal.stage);
      const direction: DealMovement['direction'] = toIdx >= fromIdx ? 'forward' : 'backward';

      movements.push({
        dealId: endDeal.id,
        ownerId: endDeal.ownerId,
        ownerName: endDeal.ownerName,
        fromStage: startDeal.stage,
        toStage: endDeal.stage,
        amount: endDeal.amount,
        direction,
      });

      if (isClosedWon(endDeal.stage)) {
        totals.dealsClosedWon++;
        totals.amountClosedWon = new Decimal(totals.amountClosedWon).plus(endDeal.amount).toNumber();
        const rep = getRep(endDeal.ownerId, endDeal.ownerName);
        rep.dealsClosedWon++;
        rep.amountClosedWon = new Decimal(rep.amountClosedWon).plus(endDeal.amount).toNumber();
      } else if (isClosedLost(endDeal.stage)) {
        totals.dealsLost++;
        totals.amountLost = new Decimal(totals.amountLost).plus(endDeal.amount).toNumber();
        const rep = getRep(endDeal.ownerId, endDeal.ownerName);
        rep.dealsLost++;
        rep.amountLost = new Decimal(rep.amountLost).plus(endDeal.amount).toNumber();
      } else {
        totals.stageChanges++;
        const rep = getRep(endDeal.ownerId, endDeal.ownerName);
        rep.stageChanges++;
      }
    }
  }

  return {
    period: { start: periodStart, end: periodEnd },
    totals,
    movements,
    byRep: Array.from(repMap.values()),
  };
}
