import { computePipelineMovement, DealSnapshot } from './pipeline-movement';

const makeDeal = (overrides: Partial<DealSnapshot> & { id: string }): DealSnapshot => ({
  ownerId: 'rep-1',
  ownerName: 'Alice',
  stage: 'qualification',
  amount: 10000,
  closeDate: '2026-06-30',
  ...overrides,
});

describe('computePipelineMovement', () => {
  it('should return empty result for identical snapshots', () => {
    const snapshot = [makeDeal({ id: 'deal-1' })];
    const result = computePipelineMovement(snapshot, snapshot, '2026-04-01', '2026-04-07');
    expect(result.totals.dealsAdded).toBe(0);
    expect(result.totals.dealsLost).toBe(0);
    expect(result.totals.dealsClosedWon).toBe(0);
    expect(result.movements).toHaveLength(0);
  });

  it('should detect newly added deals', () => {
    const start: DealSnapshot[] = [];
    const end = [makeDeal({ id: 'deal-new', amount: 15000 })];
    const result = computePipelineMovement(start, end, '2026-04-01', '2026-04-07');
    expect(result.totals.dealsAdded).toBe(1);
    expect(result.totals.amountAdded).toBe(15000);
  });

  it('should detect lost deals (in start but not end)', () => {
    const start = [makeDeal({ id: 'deal-1', amount: 8000 })];
    const end: DealSnapshot[] = [];
    const result = computePipelineMovement(start, end, '2026-04-01', '2026-04-07');
    expect(result.totals.dealsLost).toBe(1);
    expect(result.totals.amountLost).toBe(8000);
  });

  it('should detect closed-won stage changes', () => {
    const start = [makeDeal({ id: 'deal-1', stage: 'qualification', amount: 20000 })];
    const end = [makeDeal({ id: 'deal-1', stage: 'closed won', amount: 20000 })];
    const result = computePipelineMovement(start, end, '2026-04-01', '2026-04-07');
    expect(result.totals.dealsClosedWon).toBe(1);
    expect(result.totals.amountClosedWon).toBe(20000);
  });

  it('should detect closed-lost stage changes as lost', () => {
    const start = [makeDeal({ id: 'deal-1', stage: 'qualification', amount: 5000 })];
    const end = [makeDeal({ id: 'deal-1', stage: 'closed lost', amount: 5000 })];
    const result = computePipelineMovement(start, end, '2026-04-01', '2026-04-07');
    expect(result.totals.dealsLost).toBe(1);
  });

  it('should detect forward stage changes', () => {
    const start = [makeDeal({ id: 'deal-1', stage: 'prospecting' })];
    const end = [makeDeal({ id: 'deal-1', stage: 'qualification' })];
    const result = computePipelineMovement(start, end, '2026-04-01', '2026-04-07');
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].direction).toBe('forward');
  });

  it('should detect backward stage changes', () => {
    const start = [makeDeal({ id: 'deal-1', stage: 'qualification' })];
    const end = [makeDeal({ id: 'deal-1', stage: 'prospecting' })];
    const result = computePipelineMovement(start, end, '2026-04-01', '2026-04-07');
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].direction).toBe('backward');
  });

  it('should break down totals by rep', () => {
    const start: DealSnapshot[] = [];
    const end = [
      makeDeal({ id: 'a', ownerId: 'rep-1', ownerName: 'Alice', amount: 5000 }),
      makeDeal({ id: 'b', ownerId: 'rep-2', ownerName: 'Bob', amount: 8000 }),
    ];
    const result = computePipelineMovement(start, end, '2026-04-01', '2026-04-07');
    expect(result.byRep).toHaveLength(2);
    const alice = result.byRep.find((r) => r.ownerId === 'rep-1');
    expect(alice!.amountAdded).toBe(5000);
  });

  it('should set the period on the result', () => {
    const result = computePipelineMovement([], [], '2026-04-01', '2026-04-07');
    expect(result.period.start).toBe('2026-04-01');
    expect(result.period.end).toBe('2026-04-07');
  });
});
