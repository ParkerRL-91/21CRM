import { PipelineRiskEngine } from './risk-engine';
import type {
  DealRecord,
  StageHistoryRecord,
  PropertyChangeRecord,
  RiskConfig,
} from './risk-engine';

describe('PipelineRiskEngine', () => {
  let engine: PipelineRiskEngine;
  const now = new Date('2026-04-17T12:00:00Z');

  beforeEach(() => {
    engine = new PipelineRiskEngine();
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const makeDeal = (overrides: Partial<DealRecord> = {}): DealRecord => ({
    hubspotId: 'deal-1',
    dealname: 'Test Deal',
    amount: 50000,
    closedate: '2026-05-15',
    dealstage: 'negotiation',
    hubspotOwnerId: 'owner-1',
    firstSyncedAt: '2026-03-01T00:00:00Z',
    ...overrides,
  });

  const makeHistory = (overrides: Partial<StageHistoryRecord> = {}): StageHistoryRecord => ({
    dealId: 'deal-1',
    oldStage: 'qualification',
    newStage: 'negotiation',
    timestamp: '2026-04-10T00:00:00Z',
    ...overrides,
  });

  const makeChange = (overrides: Partial<PropertyChangeRecord> = {}): PropertyChangeRecord => ({
    dealId: 'deal-1',
    property: 'amount',
    oldValue: '60000',
    newValue: '50000',
    timestamp: '2026-04-10T00:00:00Z',
    ...overrides,
  });

  // === STALE DEAL DETECTION ===

  describe('stale deal detection', () => {
    it('flags a deal with no stage change in 14+ days', () => {
      const deal = makeDeal();
      const history = [makeHistory({ timestamp: '2026-03-20T00:00:00Z' })]; // 28 days ago
      const results = engine.computeDealRisks([deal], history, []);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'stale', severity: 'critical' }),
      );
    });

    it('does NOT flag a deal with recent stage change', () => {
      const deal = makeDeal();
      const history = [makeHistory({ timestamp: '2026-04-15T00:00:00Z' })]; // 2 days ago
      const results = engine.computeDealRisks([deal], history, []);
      expect(results[0].flags.find((f) => f.type === 'stale')).toBeUndefined();
    });

    it('flags with high severity at threshold, critical at 2x', () => {
      const deal = makeDeal();
      const history14d = [makeHistory({ timestamp: '2026-04-03T00:00:00Z' })]; // exactly 14 days
      const results14 = engine.computeDealRisks([deal], history14d, []);
      expect(results14[0].flags.find((f) => f.type === 'stale')?.severity).toBe('high');

      const history28d = [makeHistory({ timestamp: '2026-03-20T00:00:00Z' })]; // 28 days
      const results28 = engine.computeDealRisks([deal], history28d, []);
      expect(results28[0].flags.find((f) => f.type === 'stale')?.severity).toBe('critical');
    });

    it('respects custom threshold config', () => {
      const deal = makeDeal();
      const history = [makeHistory({ timestamp: '2026-04-10T00:00:00Z' })]; // 7 days ago
      const config: RiskConfig = { staleDaysThreshold: 5 };
      const results = engine.computeDealRisks([deal], history, [], config);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'stale' }),
      );
    });

    it('handles deals with no stage history using firstSyncedAt', () => {
      const deal = makeDeal({ firstSyncedAt: '2026-03-01T00:00:00Z' }); // 47 days ago
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'stale' }),
      );
    });
  });

  // === SLIPPED CLOSE DATE ===

  describe('slipped close date detection', () => {
    it('flags deals with close date in the past as critical', () => {
      const deal = makeDeal({ closedate: '2026-04-01' }); // 16 days ago
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'slipped', severity: 'critical' }),
      );
    });

    it('flags deals where close date was pushed later', () => {
      const deal = makeDeal({ closedate: '2026-06-15' });
      const changes = [makeChange({
        property: 'closedate',
        oldValue: '2026-05-01',
        newValue: '2026-06-15',
      })];
      const results = engine.computeDealRisks([deal], [], changes);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'slipped', severity: 'high' }),
      );
    });

    it('does NOT flag deals with no close date change', () => {
      const deal = makeDeal({ closedate: '2026-06-15' });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags.find((f) => f.type === 'slipped')).toBeUndefined();
    });

    it('does NOT flag deals with null close date for slipped (separate rule)', () => {
      const deal = makeDeal({ closedate: null });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags.find((f) => f.type === 'slipped')).toBeUndefined();
    });
  });

  // === SHRINKING AMOUNT ===

  describe('shrinking amount detection', () => {
    it('flags deals where amount decreased from peak', () => {
      const deal = makeDeal({ amount: 30000 });
      const changes = [makeChange({ property: 'amount', oldValue: '50000', newValue: '30000' })];
      const results = engine.computeDealRisks([deal], [], changes);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'shrinking' }),
      );
    });

    it('flags high severity for >25% decrease', () => {
      const deal = makeDeal({ amount: 30000 });
      const changes = [makeChange({ property: 'amount', oldValue: '50000', newValue: '30000' })];
      const results = engine.computeDealRisks([deal], [], changes);
      expect(results[0].flags.find((f) => f.type === 'shrinking')?.severity).toBe('high');
    });

    it('flags medium severity for <=25% decrease', () => {
      const deal = makeDeal({ amount: 45000 });
      const changes = [makeChange({ property: 'amount', oldValue: '50000', newValue: '45000' })];
      const results = engine.computeDealRisks([deal], [], changes);
      expect(results[0].flags.find((f) => f.type === 'shrinking')?.severity).toBe('medium');
    });

    it('does NOT flag deals where amount increased', () => {
      const deal = makeDeal({ amount: 60000 });
      const changes = [makeChange({ property: 'amount', oldValue: '50000', newValue: '60000' })];
      const results = engine.computeDealRisks([deal], [], changes);
      expect(results[0].flags.find((f) => f.type === 'shrinking')).toBeUndefined();
    });

    it('handles deals with zero amount gracefully', () => {
      const deal = makeDeal({ amount: 0 });
      const changes = [makeChange({ property: 'amount', oldValue: '0', newValue: '0' })];
      const results = engine.computeDealRisks([deal], [], changes);
      expect(results[0].flags.find((f) => f.type === 'shrinking')).toBeUndefined();
    });
  });

  // === NO CLOSE DATE ===

  describe('no close date detection', () => {
    it('flags deals with null close date', () => {
      const deal = makeDeal({ closedate: null });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'no_close_date' }),
      );
    });

    it('flags deals with empty string close date', () => {
      const deal = makeDeal({ closedate: '' });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'no_close_date' }),
      );
    });

    it('does NOT flag deals with a valid close date', () => {
      const deal = makeDeal({ closedate: '2026-06-15' });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags.find((f) => f.type === 'no_close_date')).toBeUndefined();
    });
  });

  // === NO OWNER ===

  describe('no owner detection', () => {
    it('flags deals with null owner', () => {
      const deal = makeDeal({ hubspotOwnerId: null });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'no_owner' }),
      );
    });

    it('flags deals with empty string owner', () => {
      const deal = makeDeal({ hubspotOwnerId: '' });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags).toContainEqual(
        expect.objectContaining({ type: 'no_owner' }),
      );
    });

    it('does NOT flag deals with a valid owner', () => {
      const deal = makeDeal({ hubspotOwnerId: 'owner-123' });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags.find((f) => f.type === 'no_owner')).toBeUndefined();
    });
  });

  // === RISK LEVEL COMPUTATION ===

  describe('risk level computation', () => {
    it('returns none when no flags', () => {
      const deal = makeDeal();
      const history = [makeHistory({ timestamp: '2026-04-16T00:00:00Z' })];
      const results = engine.computeDealRisks([deal], history, []);
      expect(results[0].riskLevel).toBe('none');
      expect(results[0].isAtRisk).toBe(false);
    });

    it('returns critical when any flag is critical', () => {
      const deal = makeDeal({ closedate: '2026-04-01' }); // past = critical
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].riskLevel).toBe('critical');
    });
  });

  // === BATCH PROCESSING & SUMMARY ===

  describe('batch processing and summary', () => {
    it('processes multiple deals correctly', () => {
      const deals = [
        makeDeal({ hubspotId: 'deal-1', amount: 50000 }),
        makeDeal({ hubspotId: 'deal-2', amount: 30000, closedate: '2026-04-01' }),
        makeDeal({ hubspotId: 'deal-3', amount: 20000, hubspotOwnerId: null }),
      ];
      const results = engine.computeDealRisks(deals, [], []);
      expect(results).toHaveLength(3);
    });

    it('computes correct risk summary', () => {
      const deals = [
        makeDeal({ hubspotId: 'deal-1', amount: 50000 }),
        makeDeal({ hubspotId: 'deal-2', amount: 30000, closedate: '2026-04-01' }),
        makeDeal({ hubspotId: 'deal-3', amount: 20000, hubspotOwnerId: null }),
      ];
      const history = [makeHistory({ dealId: 'deal-1', timestamp: '2026-04-16T00:00:00Z' })];
      const results = engine.computeDealRisks(deals, history, []);
      const summary = engine.computeRiskSummary(results);

      expect(summary.totalDeals).toBe(3);
      expect(summary.dealsAtRisk).toBeGreaterThan(0);
      expect(summary.totalAtRiskValue).toBeGreaterThan(0);
    });

    it('returns empty summary for no-risk pipeline', () => {
      const deals = [makeDeal()];
      const history = [makeHistory({ timestamp: '2026-04-16T00:00:00Z' })];
      const results = engine.computeDealRisks(deals, history, []);
      const summary = engine.computeRiskSummary(results);
      expect(summary.dealsAtRisk).toBe(0);
      expect(summary.totalAtRiskValue).toBe(0);
    });
  });

  // === EDGE CASES ===

  describe('edge cases', () => {
    it('handles empty deals array', () => {
      const results = engine.computeDealRisks([], [], []);
      expect(results).toEqual([]);
    });

    it('handles deal with null amount', () => {
      const deal = makeDeal({ amount: null, closedate: '2026-04-01' });
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].amount).toBeNull();
    });

    it('handles deal closed today (not slipped)', () => {
      const deal = makeDeal({ closedate: '2026-04-17' }); // today
      const results = engine.computeDealRisks([deal], [], []);
      expect(results[0].flags.find((f) => f.type === 'slipped')).toBeUndefined();
    });
  });
});
