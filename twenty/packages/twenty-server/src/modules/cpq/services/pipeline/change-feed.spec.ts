import { PipelineChangeFeed } from './change-feed';
import type { StageChange, PropertyChange, DateRange } from './change-feed';

describe('PipelineChangeFeed', () => {
  let feed: PipelineChangeFeed;
  const range: DateRange = { from: '2026-04-10', to: '2026-04-17' };

  beforeEach(() => {
    feed = new PipelineChangeFeed();
  });

  const makeStageChange = (overrides: Partial<StageChange> = {}): StageChange => ({
    dealId: 'deal-1',
    dealName: 'Test Deal',
    amount: 50000,
    owner: 'owner-1',
    oldStage: 'qualification',
    newStage: 'negotiation',
    timestamp: '2026-04-12T10:00:00Z',
    ...overrides,
  });

  const makePropertyChange = (overrides: Partial<PropertyChange> = {}): PropertyChange => ({
    dealId: 'deal-1',
    dealName: 'Test Deal',
    amount: 50000,
    owner: 'owner-1',
    property: 'amount',
    oldValue: '60000',
    newValue: '50000',
    timestamp: '2026-04-12T10:00:00Z',
    ...overrides,
  });

  describe('new deal detection', () => {
    it('detects deals with null old stage as new', () => {
      const changes = [makeStageChange({ oldStage: null, newStage: 'qualification' })];
      const events = feed.detectChanges(changes, [], range);
      expect(events[0].type).toBe('new_deal');
    });

    it('detects deals with empty old stage as new', () => {
      const changes = [makeStageChange({ oldStage: '', newStage: 'qualification' })];
      const events = feed.detectChanges(changes, [], range);
      expect(events[0].type).toBe('new_deal');
    });
  });

  describe('deal won detection', () => {
    it('detects closedwon stage as deal won', () => {
      const changes = [makeStageChange({ newStage: 'closedwon' })];
      const events = feed.detectChanges(changes, [], range);
      expect(events[0].type).toBe('deal_won');
    });
  });

  describe('deal lost detection', () => {
    it('detects closedlost stage as deal lost', () => {
      const changes = [makeStageChange({ newStage: 'closedlost' })];
      const events = feed.detectChanges(changes, [], range);
      expect(events[0].type).toBe('deal_lost');
    });
  });

  describe('stage change detection', () => {
    it('detects forward stage movement with stage order', () => {
      const order = { qualification: 1, negotiation: 2, proposal: 3 };
      const changes = [makeStageChange({
        oldStage: 'qualification',
        newStage: 'negotiation',
        stageOrder: order,
      })];
      const events = feed.detectChanges(changes, [], range);
      expect(events[0].type).toBe('stage_change');
      expect(events[0].details.direction).toBe('forward');
    });

    it('detects backward stage movement', () => {
      const order = { qualification: 1, negotiation: 2, proposal: 3 };
      const changes = [makeStageChange({
        oldStage: 'negotiation',
        newStage: 'qualification',
        stageOrder: order,
      })];
      const events = feed.detectChanges(changes, [], range);
      expect(events[0].details.direction).toBe('backward');
    });
  });

  describe('amount change detection', () => {
    it('detects amount increase', () => {
      const changes = [makePropertyChange({
        property: 'amount', oldValue: '40000', newValue: '60000',
      })];
      const events = feed.detectChanges([], changes, range);
      expect(events[0].type).toBe('amount_change');
      expect(events[0].details.direction).toBe('increased');
      expect(events[0].details.delta).toBe(20000);
    });

    it('detects amount decrease', () => {
      const changes = [makePropertyChange({
        property: 'amount', oldValue: '60000', newValue: '40000',
      })];
      const events = feed.detectChanges([], changes, range);
      expect(events[0].details.direction).toBe('decreased');
    });

    it('ignores unchanged amounts', () => {
      const changes = [makePropertyChange({
        property: 'amount', oldValue: '50000', newValue: '50000',
      })];
      const events = feed.detectChanges([], changes, range);
      expect(events).toHaveLength(0);
    });
  });

  describe('close date change detection', () => {
    it('detects pushed close date', () => {
      const changes = [makePropertyChange({
        property: 'closedate', oldValue: '2026-05-01', newValue: '2026-06-15',
      })];
      const events = feed.detectChanges([], changes, range);
      expect(events[0].type).toBe('closedate_change');
      expect(events[0].details.direction).toBe('pushed');
    });

    it('detects pulled close date', () => {
      const changes = [makePropertyChange({
        property: 'closedate', oldValue: '2026-06-15', newValue: '2026-05-01',
      })];
      const events = feed.detectChanges([], changes, range);
      expect(events[0].details.direction).toBe('pulled');
    });
  });

  describe('date range filtering', () => {
    it('excludes changes outside date range', () => {
      const changes = [makeStageChange({ timestamp: '2026-03-01T10:00:00Z' })];
      const events = feed.detectChanges(changes, [], range);
      expect(events).toHaveLength(0);
    });

    it('includes changes within date range', () => {
      const changes = [makeStageChange({ timestamp: '2026-04-15T10:00:00Z' })];
      const events = feed.detectChanges(changes, [], range);
      expect(events).toHaveLength(1);
    });
  });

  describe('sorting', () => {
    it('returns events in reverse chronological order', () => {
      const changes = [
        makeStageChange({ dealId: 'a', timestamp: '2026-04-11T10:00:00Z', newStage: 'closedwon' }),
        makeStageChange({ dealId: 'b', timestamp: '2026-04-15T10:00:00Z', newStage: 'closedwon' }),
      ];
      const events = feed.detectChanges(changes, [], range);
      expect(new Date(events[0].timestamp).getTime())
        .toBeGreaterThan(new Date(events[1].timestamp).getTime());
    });
  });

  describe('aggregation', () => {
    it('computes correct summary totals', () => {
      const stageChanges = [
        makeStageChange({ dealId: 'a', amount: 50000, oldStage: null, newStage: 'qualification' }),
        makeStageChange({ dealId: 'b', amount: 30000, newStage: 'closedwon' }),
        makeStageChange({ dealId: 'c', amount: 20000, newStage: 'closedlost' }),
      ];
      const events = feed.detectChanges(stageChanges, [], range);
      const summary = feed.aggregateChanges(events);

      expect(summary.newPipelineValue).toBe(50000);
      expect(summary.wonValue).toBe(30000);
      expect(summary.lostValue).toBe(20000);
      expect(summary.totalEvents).toBe(3);
    });

    it('returns empty summary for no events', () => {
      const summary = feed.aggregateChanges([]);
      expect(summary.totalEvents).toBe(0);
      expect(summary.newPipelineValue).toBe(0);
    });
  });
});
