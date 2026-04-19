import { describe, it, expect } from 'vitest';
import { computePipelineMovement, DealSnapshot } from './pipeline-movement';

const mkDeal = (
  id: string,
  stage: string,
  amount: number,
  ownerId = 'rep1',
  ownerName = 'Alice',
): DealSnapshot => ({ id, stage, amount, ownerId, ownerName, closeDate: '2026-06-30' });

describe('computePipelineMovement', () => {
  it('returns empty totals for identical snapshots', () => {
    const snap = [mkDeal('d1', 'qualification', 10000)];
    const result = computePipelineMovement(snap, snap, '2026-04-11', '2026-04-18');
    expect(result.totals.dealsAdded).toBe(0);
    expect(result.totals.dealsLost).toBe(0);
    expect(result.totals.dealsClosedWon).toBe(0);
    expect(result.totals.stageChanges).toBe(0);
  });

  it('detects new deals added', () => {
    const start: DealSnapshot[] = [];
    const end = [mkDeal('d1', 'qualification', 20000)];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.totals.dealsAdded).toBe(1);
    expect(result.totals.amountAdded).toBe(20000);
  });

  it('detects deals lost (disappeared from pipeline)', () => {
    const start = [mkDeal('d1', 'negotiation/review', 15000)];
    const end: DealSnapshot[] = [];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.totals.dealsLost).toBe(1);
    expect(result.totals.amountLost).toBe(15000);
  });

  it('detects closed-won via stage change', () => {
    const start = [mkDeal('d1', 'negotiation/review', 50000)];
    const end = [mkDeal('d1', 'closed won', 50000)];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.totals.dealsClosedWon).toBe(1);
    expect(result.totals.amountClosedWon).toBe(50000);
  });

  it('detects closed-lost via stage change', () => {
    const start = [mkDeal('d1', 'qualification', 30000)];
    const end = [mkDeal('d1', 'closed lost', 30000)];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.totals.dealsLost).toBe(1);
  });

  it('detects stage changes (non-close)', () => {
    const start = [mkDeal('d1', 'qualification', 10000)];
    const end = [mkDeal('d1', 'needs analysis', 10000)];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.totals.stageChanges).toBe(1);
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].direction).toBe('forward');
  });

  it('marks backward stage movement correctly', () => {
    const start = [mkDeal('d1', 'needs analysis', 10000)];
    const end = [mkDeal('d1', 'qualification', 10000)];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.movements[0].direction).toBe('backward');
  });

  it('aggregates rep breakdown correctly', () => {
    const start: DealSnapshot[] = [
      mkDeal('d1', 'qualification', 10000, 'rep1', 'Alice'),
      mkDeal('d2', 'qualification', 20000, 'rep2', 'Bob'),
    ];
    const end: DealSnapshot[] = [
      mkDeal('d1', 'closed won', 10000, 'rep1', 'Alice'),
      mkDeal('d2', 'closed lost', 20000, 'rep2', 'Bob'),
      mkDeal('d3', 'qualification', 5000, 'rep1', 'Alice'),
    ];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');

    const alice = result.byRep.find((r) => r.ownerId === 'rep1');
    const bob = result.byRep.find((r) => r.ownerId === 'rep2');

    expect(alice?.dealsClosedWon).toBe(1);
    expect(alice?.amountClosedWon).toBe(10000);
    expect(alice?.dealsAdded).toBe(1);

    expect(bob?.dealsLost).toBe(1);
    expect(bob?.amountLost).toBe(20000);
  });

  it('sets period metadata', () => {
    const result = computePipelineMovement([], [], '2026-04-11', '2026-04-18');
    expect(result.period.start).toBe('2026-04-11');
    expect(result.period.end).toBe('2026-04-18');
  });

  it('handles multiple adds correctly summing amount', () => {
    const start: DealSnapshot[] = [];
    const end = [
      mkDeal('d1', 'qualification', 10000),
      mkDeal('d2', 'qualification', 15000),
    ];
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.totals.dealsAdded).toBe(2);
    expect(result.totals.amountAdded).toBe(25000);
  });

  it('does not count deals that were already closed_won in start as lost', () => {
    const start = [mkDeal('d1', 'closed won', 50000)];
    const end: DealSnapshot[] = []; // removed from pipeline after win
    const result = computePipelineMovement(start, end, '2026-04-11', '2026-04-18');
    expect(result.totals.dealsLost).toBe(0);
    expect(result.totals.dealsClosedWon).toBe(0);
  });
});
