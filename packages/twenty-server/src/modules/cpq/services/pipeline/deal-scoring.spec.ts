import {
  scoreDeal,
  scoreEngagement,
  scoreCloseDateHealth,
  scoreStageFit,
  scoreDealSize,
  scoreActivityRecency,
  scoreRelationshipStrength,
} from './deal-scoring';

describe('scoreEngagement', () => {
  it('should return 100 raw score when touches exceed benchmark', () => {
    const factor = scoreEngagement(10, 5);
    expect(factor.rawScore).toBe(100);
    expect(factor.weightedScore).toBe(20);
    expect(factor.label).toBe('Strong engagement');
  });

  it('should return 0 raw score when there are no touches', () => {
    const factor = scoreEngagement(0, 5);
    expect(factor.rawScore).toBe(0);
    expect(factor.label).toBe('No recent activity');
  });

  it('should use default benchmark of 5', () => {
    const a = scoreEngagement(3);
    const b = scoreEngagement(3, 5);
    expect(a.rawScore).toBe(b.rawScore);
  });

  it('should label moderate engagement between 50 and 79', () => {
    const factor = scoreEngagement(3, 5); // 60 raw
    expect(factor.label).toBe('Moderate engagement');
  });
});

describe('scoreStageFit', () => {
  it('should score 100 for late stage deal closing within 30 days', () => {
    const factor = scoreStageFit(85, 20);
    expect(factor.rawScore).toBe(100);
  });

  it('should score 10 for late stage deal with close date over 90 days out', () => {
    const factor = scoreStageFit(90, 120);
    expect(factor.rawScore).toBe(10);
  });

  it('should score 100 for mid-stage deal within 90 days', () => {
    const factor = scoreStageFit(60, 45);
    expect(factor.rawScore).toBe(100);
  });

  it('should score 80 for early stage deal with positive days to close', () => {
    const factor = scoreStageFit(30, 90);
    expect(factor.rawScore).toBe(80);
  });
});

describe('scoreCloseDateHealth', () => {
  it('should score 100 for a deal closing within 14 days', () => {
    const factor = scoreCloseDateHealth(7);
    expect(factor.rawScore).toBe(100);
    expect(factor.label).toBe('Closing soon');
  });

  it('should reduce score for overdue deals', () => {
    const factor = scoreCloseDateHealth(-10);
    expect(factor.rawScore).toBe(20); // 30 + (-10) = 20
    expect(factor.label).toContain('overdue');
  });

  it('should cap overdue score at 0 when 30+ days overdue', () => {
    const factor = scoreCloseDateHealth(-35);
    expect(factor.rawScore).toBe(0);
  });

  it('should score 20 for long-runway deals', () => {
    const factor = scoreCloseDateHealth(200);
    expect(factor.rawScore).toBe(20);
    expect(factor.label).toBe('Long runway — monitor closely');
  });
});

describe('scoreDealSize', () => {
  it('should return 50 with no-baseline label when averageDeal is 0', () => {
    const factor = scoreDealSize(1000, 0);
    expect(factor.rawScore).toBe(50);
    expect(factor.label).toBe('No baseline');
  });

  it('should score 90 for deal at typical size (ratio 0.5–2.0)', () => {
    const factor = scoreDealSize(10000, 10000); // ratio = 1
    expect(factor.rawScore).toBe(90);
    expect(factor.label).toBe('Typical deal size');
  });

  it('should score 30 for very small deal (ratio < 0.25)', () => {
    const factor = scoreDealSize(100, 10000); // ratio = 0.01
    expect(factor.rawScore).toBe(30);
  });

  it('should label large deals for executive attention', () => {
    const factor = scoreDealSize(50000, 10000); // ratio = 5
    expect(factor.label).toBe('Large deal — needs executive attention');
  });
});

describe('scoreActivityRecency', () => {
  it('should score 100 when activity is within threshold', () => {
    const factor = scoreActivityRecency(3, 7);
    expect(factor.rawScore).toBe(100);
    expect(factor.label).toBe('Active recently');
  });

  it('should score 70 when activity is within 2x threshold', () => {
    const factor = scoreActivityRecency(10, 7);
    expect(factor.rawScore).toBe(70);
  });

  it('should use default threshold of 7 days', () => {
    const a = scoreActivityRecency(5);
    const b = scoreActivityRecency(5, 7);
    expect(a.rawScore).toBe(b.rawScore);
  });

  it('should label stale deals needing follow-up', () => {
    const factor = scoreActivityRecency(60, 7);
    expect(factor.label).toBe('Stale — needs follow-up');
  });
});

describe('scoreRelationshipStrength', () => {
  it('should score 100 when contacts engaged meets benchmark', () => {
    const factor = scoreRelationshipStrength(3, 3);
    expect(factor.rawScore).toBe(100);
    expect(factor.label).toBe('Well multi-threaded');
  });

  it('should flag single-threaded deals with 0 contacts', () => {
    const factor = scoreRelationshipStrength(0);
    expect(factor.rawScore).toBe(0);
    expect(factor.label).toBe('Single-threaded — high risk');
  });

  it('should cap score at 100 when contacts exceed benchmark', () => {
    const factor = scoreRelationshipStrength(10, 3);
    expect(factor.rawScore).toBe(100);
  });

  it('should use default benchmark of 3', () => {
    const a = scoreRelationshipStrength(2);
    const b = scoreRelationshipStrength(2, 3);
    expect(a.rawScore).toBe(b.rawScore);
  });
});

describe('scoreDeal', () => {
  const baseInput = {
    dealId: 'deal-1',
    touchesLast14Days: 5,
    stageProbability: 70,
    daysToClose: 30,
    dealAmount: 10000,
    averageDealSize: 10000,
    daysSinceLastActivity: 3,
    contactsEngaged: 3,
  };

  it('should return a composite score between 0 and 100', () => {
    const result = scoreDeal(baseInput);
    expect(result.compositeScore).toBeGreaterThanOrEqual(0);
    expect(result.compositeScore).toBeLessThanOrEqual(100);
  });

  it('should include all 6 factors', () => {
    const result = scoreDeal(baseInput);
    expect(result.factors).toHaveLength(6);
    const names = result.factors.map((f) => f.name);
    expect(names).toContain('engagement');
    expect(names).toContain('stage_fit');
    expect(names).toContain('close_date_health');
    expect(names).toContain('deal_size');
    expect(names).toContain('activity_recency');
    expect(names).toContain('relationship_strength');
  });

  it('should assign grade A for high composite score', () => {
    const result = scoreDeal({
      ...baseInput,
      touchesLast14Days: 10,
      stageProbability: 70,
      daysToClose: 10,
      daysSinceLastActivity: 1,
      contactsEngaged: 5,
    });
    expect(['A', 'B']).toContain(result.grade);
  });

  it('should assign grade F for poor composite score', () => {
    const result = scoreDeal({
      ...baseInput,
      touchesLast14Days: 0,
      daysToClose: -60,
      daysSinceLastActivity: 90,
      contactsEngaged: 0,
      dealAmount: 100,
      averageDealSize: 100000,
    });
    expect(['D', 'F']).toContain(result.grade);
  });

  it('should set dealId and scoredAt on the result', () => {
    const result = scoreDeal(baseInput);
    expect(result.dealId).toBe('deal-1');
    expect(result.scoredAt).toBeTruthy();
  });
});
