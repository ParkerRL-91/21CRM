import { Injectable, Logger } from '@nestjs/common';

// Pipeline change feed engine — detects and aggregates deal changes
// from stage history and property change logs. Sources all data from
// local tables (no HubSpot API calls).
@Injectable()
export class PipelineChangeFeed {
  private readonly logger = new Logger(PipelineChangeFeed.name);

  detectChanges(
    stageHistory: StageChange[],
    propertyChanges: PropertyChange[],
    dateRange: DateRange,
  ): PipelineChangeEvent[] {
    const events: PipelineChangeEvent[] = [];
    const rangeStart = new Date(dateRange.from).getTime();
    const rangeEnd = new Date(dateRange.to).getTime();

    for (const change of stageHistory) {
      const ts = new Date(change.timestamp).getTime();
      if (ts < rangeStart || ts > rangeEnd) continue;

      if (this.isClosedWon(change.newStage)) {
        events.push({
          type: 'deal_won',
          dealId: change.dealId,
          dealName: change.dealName,
          amount: change.amount,
          owner: change.owner,
          timestamp: change.timestamp,
          details: { oldStage: change.oldStage, newStage: change.newStage },
        });
      } else if (this.isClosedLost(change.newStage)) {
        events.push({
          type: 'deal_lost',
          dealId: change.dealId,
          dealName: change.dealName,
          amount: change.amount,
          owner: change.owner,
          timestamp: change.timestamp,
          details: { oldStage: change.oldStage, newStage: change.newStage },
        });
      } else if (this.isNewDeal(change.oldStage)) {
        events.push({
          type: 'new_deal',
          dealId: change.dealId,
          dealName: change.dealName,
          amount: change.amount,
          owner: change.owner,
          timestamp: change.timestamp,
          details: { stage: change.newStage },
        });
      } else {
        const direction = this.getStageDirection(change.oldStage, change.newStage, change.stageOrder);
        events.push({
          type: 'stage_change',
          dealId: change.dealId,
          dealName: change.dealName,
          amount: change.amount,
          owner: change.owner,
          timestamp: change.timestamp,
          details: {
            oldStage: change.oldStage,
            newStage: change.newStage,
            direction,
          },
        });
      }
    }

    for (const change of propertyChanges) {
      const ts = new Date(change.timestamp).getTime();
      if (ts < rangeStart || ts > rangeEnd) continue;

      if (change.property === 'amount') {
        const oldVal = parseFloat(change.oldValue || '0');
        const newVal = parseFloat(change.newValue || '0');
        if (oldVal !== newVal) {
          events.push({
            type: 'amount_change',
            dealId: change.dealId,
            dealName: change.dealName,
            amount: newVal,
            owner: change.owner,
            timestamp: change.timestamp,
            details: {
              oldAmount: oldVal,
              newAmount: newVal,
              delta: newVal - oldVal,
              direction: newVal > oldVal ? 'increased' : 'decreased',
            },
          });
        }
      }

      if (change.property === 'closedate') {
        const oldDate = change.oldValue;
        const newDate = change.newValue;
        if (oldDate && newDate && oldDate !== newDate) {
          const direction = new Date(newDate) > new Date(oldDate) ? 'pushed' : 'pulled';
          events.push({
            type: 'closedate_change',
            dealId: change.dealId,
            dealName: change.dealName,
            amount: change.amount,
            owner: change.owner,
            timestamp: change.timestamp,
            details: {
              oldCloseDate: oldDate,
              newCloseDate: newDate,
              direction,
            },
          });
        }
      }
    }

    return events.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  aggregateChanges(events: PipelineChangeEvent[]): ChangeSummary {
    const summary: ChangeSummary = {
      newPipelineValue: 0,
      lostValue: 0,
      wonValue: 0,
      movedForwardCount: 0,
      slippedCount: 0,
      amountIncreasedTotal: 0,
      amountDecreasedTotal: 0,
      totalEvents: events.length,
      byType: {},
    };

    for (const event of events) {
      if (!summary.byType[event.type]) {
        summary.byType[event.type] = { count: 0, value: 0 };
      }
      summary.byType[event.type].count++;
      summary.byType[event.type].value += event.amount || 0;

      switch (event.type) {
        case 'new_deal':
          summary.newPipelineValue += event.amount || 0;
          break;
        case 'deal_won':
          summary.wonValue += event.amount || 0;
          break;
        case 'deal_lost':
          summary.lostValue += event.amount || 0;
          break;
        case 'stage_change':
          if (event.details?.direction === 'forward') summary.movedForwardCount++;
          if (event.details?.direction === 'backward') summary.slippedCount++;
          break;
        case 'amount_change':
          if (event.details?.delta > 0) summary.amountIncreasedTotal += event.details.delta;
          if (event.details?.delta < 0) summary.amountDecreasedTotal += Math.abs(event.details.delta);
          break;
      }
    }

    return summary;
  }

  private isClosedWon(stage: string): boolean {
    return stage === 'closedwon' || stage === 'closed_won' || stage === 'closed-won';
  }

  private isClosedLost(stage: string): boolean {
    return stage === 'closedlost' || stage === 'closed_lost' || stage === 'closed-lost';
  }

  private isNewDeal(oldStage: string | null): boolean {
    return !oldStage || oldStage === '' || oldStage === 'null';
  }

  private getStageDirection(
    oldStage: string,
    newStage: string,
    stageOrder?: Record<string, number>,
  ): 'forward' | 'backward' | 'lateral' {
    if (!stageOrder) return 'lateral';
    const oldIndex = stageOrder[oldStage] ?? -1;
    const newIndex = stageOrder[newStage] ?? -1;
    if (newIndex > oldIndex) return 'forward';
    if (newIndex < oldIndex) return 'backward';
    return 'lateral';
  }
}

// Types
export type ChangeEventType =
  | 'new_deal'
  | 'deal_won'
  | 'deal_lost'
  | 'stage_change'
  | 'amount_change'
  | 'closedate_change';

export type PipelineChangeEvent = {
  type: ChangeEventType;
  dealId: string;
  dealName: string;
  amount: number | null;
  owner: string | null;
  timestamp: string;
  details: Record<string, unknown>;
};

export type ChangeSummary = {
  newPipelineValue: number;
  lostValue: number;
  wonValue: number;
  movedForwardCount: number;
  slippedCount: number;
  amountIncreasedTotal: number;
  amountDecreasedTotal: number;
  totalEvents: number;
  byType: Record<string, { count: number; value: number }>;
};

export type DateRange = {
  from: string;
  to: string;
};

export type StageChange = {
  dealId: string;
  dealName: string;
  amount: number | null;
  owner: string | null;
  oldStage: string | null;
  newStage: string;
  timestamp: string;
  stageOrder?: Record<string, number>;
};

export type PropertyChange = {
  dealId: string;
  dealName: string;
  amount: number | null;
  owner: string | null;
  property: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
};
