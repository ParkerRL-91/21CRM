import { computePipelineMovement, type DealSnapshot } from './pipeline-movement';

const startDeals: DealSnapshot[] = [
  { id: 'd1', ownerId: 'r1', ownerName: 'Alice', stage: 'Qualification', amount: 50000, closeDate: '2026-06-30' },
  { id: 'd2', ownerId: 'r2', ownerName: 'Bob', stage: 'Negotiation', amount: 80000, closeDate: '2026-05-31' },
  { id: 'd3', ownerId: 'r1', ownerName: 'Alice', stage: 'Proposal/Price Quote', amount: 30000, closeDate: '2026-06-15' },
];

describe('computePipelineMovement', () => {
  const period = { start: '2026-04-01', end: '2026-04-07' };

  it('should detect newly added deals', () => {
    const endDeals: DealSnapshot[] = [
      ...startDeals,
      { id: 'd4', ownerId: 'r2', ownerName: 'Bob', stage: 'Prospecting', amount: 40000, closeDate: '2026-07-31' },
    ];
    const result = computePipelineMovement(startDeals, endDeals, period.start, period.end);
    expect(result.totals.dealsAdded).toBe(1);
    expect(result.totals.amountAdded).toBe(40000);
  });

  it('should detect deals removed from pipeline', () => {
    const endDeals: DealSnapshot[] = [startDeals[0], startDeals[1]]; // d3 removed
    const result = computePipelineMovement(startDeals, endDeals, period.start, period.end);
    expect(result.totals.dealsLost).toBe(1);
    expect(result.totals.amountLost).toBe(30000);
  });

  it('should detect forward stage movements', () => {
    const endDeals: DealSnapshot[] = [
      { ...startDeals[0], stage: 'Proposal/Price Quote' }, // Qualification → Proposal
      startDeals[1],
      startDeals[2],
    ];
    const result = computePipelineMovement(startDeals, endDeals, period.start, period.end);
    const movement = result.movements.find((m) => m.dealId === 'd1');
    expect(movement?.direction).toBe('forward');
    expect(result.totals.stageChanges).toBe(1);
  });

  it('should detect closed won deals', () => {
    const endDeals: DealSnapshot[] = [
      startDeals[0],
      { ...startDeals[1], stage: 'Closed Won' },
      startDeals[2],
    ];
    const result = computePipelineMovement(startDeals, endDeals, period.start, period.end);
    expect(result.totals.dealsClosedWon).toBe(1);
    expect(result.totals.amountClosedWon).toBe(80000);
  });

  it('should detect closed lost deals', () => {
    const endDeals: DealSnapshot[] = [
      startDeals[0],
      { ...startDeals[1], stage: 'Closed Lost' },
      startDeals[2],
    ];
    const result = computePipelineMovement(startDeals, endDeals, period.start, period.end);
    expect(result.totals.dealsLost).toBe(1);
  });

  it('should aggregate by rep', () => {
    const endDeals: DealSnapshot[] = [
      ...startDeals,
      { id: 'd4', ownerId: 'r1', ownerName: 'Alice', stage: 'Prospecting', amount: 20000, closeDate: '2026-07-31' },
    ];
    const result = computePipelineMovement(startDeals, endDeals, period.start, period.end);
    const alice = result.byRep.find((r) => r.ownerId === 'r1');
    expect(alice).toBeDefined();
    expect(alice!.dealsAdded).toBe(1);
    expect(alice!.amountAdded).toBe(20000);
  });

  it('should include period in result', () => {
    const result = computePipelineMovement(startDeals, startDeals, '2026-04-01', '2026-04-07');
    expect(result.period.start).toBe('2026-04-01');
    expect(result.period.end).toBe('2026-04-07');
  });

  it('should handle empty snapshots', () => {
    const result = computePipelineMovement([], [], '2026-04-01', '2026-04-07');
    expect(result.totals.dealsAdded).toBe(0);
    expect(result.byRep).toHaveLength(0);
  });
});
