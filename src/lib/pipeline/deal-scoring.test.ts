import { describe, it, expect } from 'vitest';
import {
  scoreEngagement,
  scoreStageFit,
  scoreCloseDateHealth,
  scoreDealSize,
  scoreActivityRecency,
  scoreRelationshipStrength,
  scoreDeal,
} from './deal-scoring';

// ============================================================================
// Factor 1 — Engagement
// ============================================================================

describe('scoreEngagement', () => {
  it('returns 100 when touches meet benchmark', () => {
    expect(scoreEngagement(5, 5).rawScore).toBe(100);
  });

  it('returns 0 for no touches', () => {
    expect(scoreEngagement(0).rawScore).toBe(0);
    expect(scoreEngagement(0).label).toBe('No recent activity');
  });

  it('caps at 100 for more than benchmark touches', () => {
    expect(scoreEngagement(10, 5).rawScore).toBe(100);
  });

  it('returns proportional score below benchmark', () => {
    expect(scoreEngagement(2, 4).rawScore).toBe(50);
  });

  it('returns correct weightedScore', () => {
    const f = scoreEngagement(5, 5);
    expect(f.weightedScore).toBe(20); // 100 × 0.2
  });

  it('labels low engagement correctly', () => {
    expect(scoreEngagement(1, 5).label).toBe('Low engagement');
  });
});

// ============================================================================
// Factor 2 — Stage Fit
// ============================================================================

describe('scoreStageFit', () => {
  it('late stage + near close = 100', () => {
    expect(scoreStageFit(90, 15).rawScore).toBe(100);
  });

  it('late stage + far close = low score', () => {
    expect(scoreStageFit(90, 120).rawScore).toBe(10);
  });

  it('mid stage + reasonable close = 100', () => {
    expect(scoreStageFit(60, 60).rawScore).toBe(100);
  });

  it('early stage always returns 80', () => {
    expect(scoreStageFit(20, 200).rawScore).toBe(80);
  });

  it('sets correct weight', () => {
    const f = scoreStageFit(80, 20);
    expect(f.weight).toBe(0.2);
    expect(f.weightedScore).toBe(parseFloat((f.rawScore * 0.2).toFixed(2)));
  });
});

// ============================================================================
// Factor 3 — Close Date Health
// ============================================================================

describe('scoreCloseDateHealth', () => {
  it('overdue deal scores below 30', () => {
    expect(scoreCloseDateHealth(-5).rawScore).toBe(25);
  });

  it('closing within 14 days = 100', () => {
    expect(scoreCloseDateHealth(10).rawScore).toBe(100);
  });

  it('closing in 15-30 days = 90', () => {
    expect(scoreCloseDateHealth(20).rawScore).toBe(90);
  });

  it('closing in 31-60 days = 75', () => {
    expect(scoreCloseDateHealth(45).rawScore).toBe(75);
  });

  it('closing in 61-90 days = 60', () => {
    expect(scoreCloseDateHealth(75).rawScore).toBe(60);
  });

  it('more than 180 days = 20', () => {
    expect(scoreCloseDateHealth(200).rawScore).toBe(20);
  });

  it('overdue label mentions days overdue', () => {
    const f = scoreCloseDateHealth(-10);
    expect(f.label).toContain('overdue');
  });
});

// ============================================================================
// Factor 4 — Deal Size
// ============================================================================

describe('scoreDealSize', () => {
  it('returns 50 with no baseline', () => {
    expect(scoreDealSize(100_000, 0).rawScore).toBe(50);
  });

  it('average-sized deal scores 90', () => {
    expect(scoreDealSize(50_000, 50_000).rawScore).toBe(90);
  });

  it('very small deal scores 30', () => {
    expect(scoreDealSize(5_000, 100_000).rawScore).toBe(30);
  });

  it('large deal (3x avg) scores 70', () => {
    expect(scoreDealSize(300_000, 100_000).rawScore).toBe(70);
  });

  it('very large deal (>5x avg) scores 50', () => {
    expect(scoreDealSize(600_000, 100_000).rawScore).toBe(50);
  });

  it('weight is 0.15', () => {
    expect(scoreDealSize(50_000, 50_000).weight).toBe(0.15);
  });
});

// ============================================================================
// Factor 5 — Activity Recency
// ============================================================================

describe('scoreActivityRecency', () => {
  it('returns 100 within threshold', () => {
    expect(scoreActivityRecency(3, 7).rawScore).toBe(100);
  });

  it('returns 70 within 2x threshold', () => {
    expect(scoreActivityRecency(10, 7).rawScore).toBe(70);
  });

  it('returns 40 within 4x threshold', () => {
    expect(scoreActivityRecency(20, 7).rawScore).toBe(40);
  });

  it('stale label for very old activity', () => {
    expect(scoreActivityRecency(60, 7).label).toBe('Stale — needs follow-up');
  });

  it('active label for recent activity', () => {
    expect(scoreActivityRecency(1).label).toBe('Active recently');
  });
});

// ============================================================================
// Factor 6 — Relationship Strength
// ============================================================================

describe('scoreRelationshipStrength', () => {
  it('returns 0 for no contacts', () => {
    expect(scoreRelationshipStrength(0).rawScore).toBe(0);
    expect(scoreRelationshipStrength(0).label).toBe('Single-threaded — high risk');
  });

  it('returns 100 when contacts meet benchmark', () => {
    expect(scoreRelationshipStrength(3, 3).rawScore).toBe(100);
    expect(scoreRelationshipStrength(3, 3).label).toBe('Well multi-threaded');
  });

  it('caps at 100 for more than benchmark', () => {
    expect(scoreRelationshipStrength(10, 3).rawScore).toBe(100);
  });

  it('partial score below benchmark', () => {
    expect(scoreRelationshipStrength(1, 4).rawScore).toBe(25);
  });

  it('weight is 0.10', () => {
    expect(scoreRelationshipStrength(3, 3).weight).toBe(0.1);
  });
});

// ============================================================================
// Composite — scoreDeal
// ============================================================================

describe('scoreDeal', () => {
  const healthyInput = {
    dealId: 'deal-1',
    touchesLast14Days: 5,
    stageProbability: 70,
    daysToClose: 20,
    dealAmount: 50_000,
    averageDealSize: 50_000,
    daysSinceLastActivity: 3,
    contactsEngaged: 3,
  };

  it('returns all 6 factors', () => {
    const result = scoreDeal(healthyInput);
    expect(result.factors).toHaveLength(6);
    const names = result.factors.map((f) => f.name);
    expect(names).toContain('engagement');
    expect(names).toContain('stage_fit');
    expect(names).toContain('close_date_health');
    expect(names).toContain('deal_size');
    expect(names).toContain('activity_recency');
    expect(names).toContain('relationship_strength');
  });

  it('sets dealId', () => {
    expect(scoreDeal(healthyInput).dealId).toBe('deal-1');
  });

  it('grade A for high composite score', () => {
    const result = scoreDeal(healthyInput);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('grade F for very poor deal', () => {
    const result = scoreDeal({
      dealId: 'bad',
      touchesLast14Days: 0,
      stageProbability: 90,
      daysToClose: 200,
      dealAmount: 1_000,
      averageDealSize: 100_000,
      daysSinceLastActivity: 90,
      contactsEngaged: 0,
    });
    expect(['D', 'F']).toContain(result.grade);
    expect(result.compositeScore).toBeLessThan(55);
  });

  it('weighted scores sum to composite', () => {
    const result = scoreDeal(healthyInput);
    const sum = Math.round(result.factors.reduce((s, f) => s + f.weightedScore, 0));
    expect(result.compositeScore).toBe(sum);
  });

  it('sets scoredAt', () => {
    expect(scoreDeal(healthyInput).scoredAt).toBeDefined();
  });

  it('respects custom benchmarks', () => {
    const r1 = scoreDeal({ ...healthyInput, touchesLast14Days: 2, engagementBenchmark: 2 });
    const r2 = scoreDeal({ ...healthyInput, touchesLast14Days: 2, engagementBenchmark: 10 });
    const eng1 = r1.factors.find((f) => f.name === 'engagement')!;
    const eng2 = r2.factors.find((f) => f.name === 'engagement')!;
    expect(eng1.rawScore).toBeGreaterThan(eng2.rawScore);
  });
});
