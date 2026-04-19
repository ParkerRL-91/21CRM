import { computePipelineMovement, DealSnapshot } from './pipeline-movement';

describe('computePipelineMovement', () => {
  const BASE_PERIOD = { start: '2026-01-01', end: '2026-01-07' };

  function makeSnapshot(overrides: Partial<DealSnapshot> & Pick<DealSnapshot, 'id'>): DealSnapshot {
    return {
      ownerId: 'rep1',
      ownerName: 'Alice',
      stage: 'qualification',
      amount: 10000,
      closeDate: '2026-03-31',
      ...overrides,
    };
  }

  describe('new deals (in end but not start)', () => {
    it('counts a deal present only in end snapshot as added', () => {
      const end: DealSnapshot[] = [makeSnapshot({ id: 'd1', amount: 5000 })];
      const result = computePipelineMovement([], end, BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsAdded).toBe(1);
      expect(result.totals.amountAdded).toBe(5000);
    });

    it('sums multiple new deals correctly', () => {
      const end: DealSnapshot[] = [
        makeSnapshot({ id: 'd1', amount: 10000 }),
        makeSnapshot({ id: 'd2', amount: 20000 }),
        makeSnapshot({ id: 'd3', amount: 5000 }),
      ];
      const result = computePipelineMovement([], end, BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsAdded).toBe(3);
      expect(result.totals.amountAdded).toBe(35000);
    });

    it('does not count deals present in both snapshots as added', () => {
      const deal = makeSnapshot({ id: 'd1' });
      const result = computePipelineMovement([deal], [deal], BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsAdded).toBe(0);
    });
  });

  describe('lost deals (in start but not end, not closed won)', () => {
    it('counts a deal missing from end snapshot as lost', () => {
      const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', amount: 15000, stage: 'qualification' })];
      const result = computePipelineMovement(start, [], BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsLost).toBe(1);
      expect(result.totals.amountLost).toBe(15000);
    });

    it('does not count already-closed-won deals as lost when removed from end', () => {
      // A deal that was already closed_won in start snapshot — not a new loss
      const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'closed_won', amount: 20000 })];
      const result = computePipelineMovement(start, [], BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsLost).toBe(0);
      expect(result.totals.amountLost).toBe(0);
    });

    it('counts closed_lost stage deals removed from end as lost', () => {
      const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'closed_lost', amount: 8000 })];
      // closed_lost in start and missing from end — not yet closed_won, so it's a loss
      // However per the code logic: if isClosedWon(deal.stage) it skips, otherwise lost
      // closed_lost is not closed_won, so it counts as lost
      const result = computePipelineMovement(start, [], BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsLost).toBe(1);
    });
  });

  describe('closed won via stage change', () => {
    it('records a deal as closed won when stage changes to closed_won', () => {
      const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'negotiation/review', amount: 50000 })];
      const end: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'closed won', amount: 50000 })];
      const result = computePipelineMovement(start, end, BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsClosedWon).toBe(1);
      expect(result.totals.amountClosedWon).toBe(50000);
    });

    it('handles all closed_won stage variants', () => {
      const variants = ['closed_won', 'closedwon', 'closed won'];
      for (const stage of variants) {
        const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'qualification', amount: 10000 })];
        const end: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage, amount: 10000 })];
        const result = computePipelineMovement(start, end, BASE_PERIOD.start, BASE_PERIOD.end);
        expect(result.totals.dealsClosedWon).toBe(1);
      }
    });
  });

  describe('stage changes (forward + backward)', () => {
    it('records a forward stage change', () => {
      const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'prospecting' })];
      const end: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'qualification' })];
      const result = computePipelineMovement(start, end, BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.movements).toHaveLength(1);
      expect(result.movements[0].direction).toBe('forward');
      expect(result.movements[0].fromStage).toBe('prospecting');
      expect(result.movements[0].toStage).toBe('qualification');
    });

    it('records a backward stage change', () => {
      const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'proposal/price quote' })];
      const end: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'qualification' })];
      const result = computePipelineMovement(start, end, BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.movements).toHaveLength(1);
      expect(result.movements[0].direction).toBe('backward');
    });

    it('increments stageChanges for non-terminal stage transitions', () => {
      const start: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'prospecting' })];
      const end: DealSnapshot[] = [makeSnapshot({ id: 'd1', stage: 'needs analysis' })];
      const result = computePipelineMovement(start, end, BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.stageChanges).toBe(1);
    });

    it('does not count no-op deals (same stage) as stage changes', () => {
      const deal = makeSnapshot({ id: 'd1', stage: 'qualification' });
      const result = computePipelineMovement([deal], [deal], BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.movements).toHaveLength(0);
      expect(result.totals.stageChanges).toBe(0);
    });
  });

  describe('rep breakdown accuracy', () => {
    it('attributes added deal to the correct rep', () => {
      const end: DealSnapshot[] = [
        makeSnapshot({ id: 'd1', ownerId: 'rep1', ownerName: 'Alice', amount: 10000 }),
        makeSnapshot({ id: 'd2', ownerId: 'rep2', ownerName: 'Bob', amount: 20000 }),
      ];
      const result = computePipelineMovement([], end, BASE_PERIOD.start, BASE_PERIOD.end);

      const alice = result.byRep.find((r) => r.ownerId === 'rep1');
      const bob = result.byRep.find((r) => r.ownerId === 'rep2');

      expect(alice?.dealsAdded).toBe(1);
      expect(alice?.amountAdded).toBe(10000);
      expect(bob?.dealsAdded).toBe(1);
      expect(bob?.amountAdded).toBe(20000);
    });

    it('attributes closed won to the correct rep', () => {
      const start: DealSnapshot[] = [
        makeSnapshot({ id: 'd1', ownerId: 'rep1', ownerName: 'Alice', stage: 'qualification', amount: 30000 }),
        makeSnapshot({ id: 'd2', ownerId: 'rep2', ownerName: 'Bob', stage: 'qualification', amount: 15000 }),
      ];
      const end: DealSnapshot[] = [
        makeSnapshot({ id: 'd1', ownerId: 'rep1', ownerName: 'Alice', stage: 'closed won', amount: 30000 }),
        makeSnapshot({ id: 'd2', ownerId: 'rep2', ownerName: 'Bob', stage: 'qualification', amount: 15000 }),
      ];
      const result = computePipelineMovement(start, end, BASE_PERIOD.start, BASE_PERIOD.end);

      const alice = result.byRep.find((r) => r.ownerId === 'rep1');
      expect(alice?.dealsClosedWon).toBe(1);
      expect(alice?.amountClosedWon).toBe(30000);

      const bob = result.byRep.find((r) => r.ownerId === 'rep2');
      expect(bob?.dealsClosedWon).toBe(0);
    });
  });

  describe('empty snapshots', () => {
    it('returns zero totals with empty start snapshot', () => {
      const result = computePipelineMovement([], [], BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsAdded).toBe(0);
      expect(result.totals.dealsLost).toBe(0);
      expect(result.totals.dealsClosedWon).toBe(0);
      expect(result.totals.stageChanges).toBe(0);
      expect(result.movements).toHaveLength(0);
      expect(result.byRep).toHaveLength(0);
    });

    it('returns correct period metadata', () => {
      const result = computePipelineMovement([], [], '2026-04-01', '2026-04-07');

      expect(result.period.start).toBe('2026-04-01');
      expect(result.period.end).toBe('2026-04-07');
    });

    it('counts new deals added when start snapshot is empty', () => {
      const end: DealSnapshot[] = [makeSnapshot({ id: 'd1', amount: 99000 })];
      const result = computePipelineMovement([], end, BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsAdded).toBe(1);
      expect(result.totals.amountAdded).toBe(99000);
      expect(result.totals.dealsLost).toBe(0);
    });

    it('counts all deals lost when end snapshot is empty', () => {
      const start: DealSnapshot[] = [
        makeSnapshot({ id: 'd1', stage: 'prospecting', amount: 5000 }),
        makeSnapshot({ id: 'd2', stage: 'qualification', amount: 8000 }),
      ];
      const result = computePipelineMovement(start, [], BASE_PERIOD.start, BASE_PERIOD.end);

      expect(result.totals.dealsLost).toBe(2);
      expect(result.totals.amountLost).toBe(13000);
    });
  });
});
