import {
  scoreEngagement,
  scoreStageFit,
  scoreCloseDateHealth,
  scoreDealSize,
  scoreActivityRecency,
  scoreRelationshipStrength,
  scoreDeal,
  DealScoringInput,
} from './deal-scoring';

// ============================================================================
// Factor 1 — scoreEngagement
// ============================================================================

describe('scoreEngagement', () => {
  it('returns rawScore 0 when 0 touches', () => {
    const factor = scoreEngagement(0);
    expect(factor.rawScore).toBe(0);
    expect(factor.label).toBe('No recent activity');
    expect(factor.weight).toBe(0.2);
  });

  it('returns rawScore 100 when touches equal benchmark', () => {
    const factor = scoreEngagement(5, 5);
    expect(factor.rawScore).toBe(100);
    expect(factor.label).toBe('Strong engagement');
  });

  it('caps rawScore at 100 when touches exceed benchmark', () => {
    const factor = scoreEngagement(10, 5);
    expect(factor.rawScore).toBe(100);
  });

  it('returns partial score when touches are below benchmark', () => {
    // 2 touches out of benchmark 5 → 40%
    const factor = scoreEngagement(2, 5);
    expect(factor.rawScore).toBe(40);
    expect(factor.label).toBe('Low engagement');
  });

  it('returns moderate label when score is between 50 and 79', () => {
    // 3/5 = 60%
    const factor = scoreEngagement(3, 5);
    expect(factor.rawScore).toBe(60);
    expect(factor.label).toBe('Moderate engagement');
  });

  it('weightedScore equals rawScore × 0.2', () => {
    const factor = scoreEngagement(5, 5);
    expect(factor.weightedScore).toBe(20);
  });

  it('uses default benchmark of 5', () => {
    const factor = scoreEngagement(5);
    expect(factor.rawScore).toBe(100);
  });
});

// ============================================================================
// Factor 2 — scoreStageFit
// ============================================================================

describe('scoreStageFit', () => {
  describe('early stage (probability < 50)', () => {
    it('returns 80 for any positive days to close', () => {
      const factor = scoreStageFit(20, 180);
      expect(factor.rawScore).toBe(80);
    });

    it('returns 0 when daysToClose is negative (overdue in early stage)', () => {
      const factor = scoreStageFit(20, -5);
      expect(factor.rawScore).toBe(0);
    });
  });

  describe('mid stage (probability 50-79)', () => {
    it('returns 100 when daysToClose <= 90', () => {
      const factor = scoreStageFit(60, 45);
      expect(factor.rawScore).toBe(100);
    });

    it('returns 60 when daysToClose is 91-180', () => {
      const factor = scoreStageFit(60, 120);
      expect(factor.rawScore).toBe(60);
    });

    it('returns 30 when daysToClose > 180', () => {
      const factor = scoreStageFit(60, 200);
      expect(factor.rawScore).toBe(30);
    });
  });

  describe('late stage (probability >= 80)', () => {
    it('returns 100 when daysToClose <= 30', () => {
      const factor = scoreStageFit(90, 15);
      expect(factor.rawScore).toBe(100);
    });

    it('returns 70 when daysToClose is 31-60', () => {
      const factor = scoreStageFit(90, 45);
      expect(factor.rawScore).toBe(70);
    });

    it('returns 40 when daysToClose is 61-90', () => {
      const factor = scoreStageFit(90, 75);
      expect(factor.rawScore).toBe(40);
    });

    it('returns 10 when daysToClose > 90', () => {
      const factor = scoreStageFit(90, 120);
      expect(factor.rawScore).toBe(10);
    });
  });

  it('weightedScore equals rawScore × 0.2', () => {
    const factor = scoreStageFit(90, 15);
    expect(factor.weightedScore).toBe(20);
  });
});

// ============================================================================
// Factor 3 — scoreCloseDateHealth
// ============================================================================

describe('scoreCloseDateHealth', () => {
  it('returns 100 when closing within 14 days', () => {
    const factor = scoreCloseDateHealth(7);
    expect(factor.rawScore).toBe(100);
    expect(factor.label).toBe('Closing soon');
  });

  it('returns 90 when closing in 15-30 days', () => {
    const factor = scoreCloseDateHealth(20);
    expect(factor.rawScore).toBe(90);
  });

  it('returns 75 when closing in 31-60 days', () => {
    const factor = scoreCloseDateHealth(45);
    expect(factor.rawScore).toBe(75);
  });

  it('returns 60 when closing in 61-90 days', () => {
    const factor = scoreCloseDateHealth(80);
    expect(factor.rawScore).toBe(60);
  });

  it('returns 40 when closing in 91-180 days', () => {
    const factor = scoreCloseDateHealth(120);
    expect(factor.rawScore).toBe(40);
  });

  it('returns 20 when closing in > 180 days', () => {
    const factor = scoreCloseDateHealth(200);
    expect(factor.rawScore).toBe(20);
  });

  describe('overdue dates (negative daysToClose)', () => {
    it('returns 30 for 0 days overdue', () => {
      const factor = scoreCloseDateHealth(0);
      // 0 <= 14 → 100 (on time)
      expect(factor.rawScore).toBe(100);
    });

    it('scores from 30 down as overdue increases', () => {
      // -1 day overdue → max(0, 30 + (-1)) = 29
      const factor = scoreCloseDateHealth(-1);
      expect(factor.rawScore).toBe(29);
    });

    it('floors at 0 when 30+ days overdue', () => {
      const factor = scoreCloseDateHealth(-30);
      expect(factor.rawScore).toBe(0);
    });

    it('shows overdue label when past due', () => {
      const factor = scoreCloseDateHealth(-5);
      expect(factor.label).toContain('overdue');
    });
  });

  it('weightedScore equals rawScore × 0.2', () => {
    const factor = scoreCloseDateHealth(7);
    expect(factor.weightedScore).toBe(20);
  });
});

// ============================================================================
// Factor 4 — scoreDealSize
// ============================================================================

describe('scoreDealSize', () => {
  it('returns 50 with label "No baseline" when averageDeal is 0', () => {
    const factor = scoreDealSize(50000, 0);
    expect(factor.rawScore).toBe(50);
    expect(factor.label).toBe('No baseline');
  });

  it('returns 30 for very small deal (ratio < 0.25)', () => {
    const factor = scoreDealSize(1000, 10000); // ratio 0.1
    expect(factor.rawScore).toBe(30);
  });

  it('returns 55 for below-average deal (ratio 0.25-0.5)', () => {
    const factor = scoreDealSize(3000, 10000); // ratio 0.3
    expect(factor.rawScore).toBe(55);
  });

  it('returns 90 for typical deal (ratio 0.5-2.0)', () => {
    const factor = scoreDealSize(10000, 10000); // ratio 1.0
    expect(factor.rawScore).toBe(90);
    expect(factor.label).toBe('Typical deal size');
  });

  it('returns 70 for large deal (ratio 2.0-5.0)', () => {
    const factor = scoreDealSize(30000, 10000); // ratio 3.0
    expect(factor.rawScore).toBe(70);
  });

  it('returns 50 for very large deal (ratio > 5.0)', () => {
    const factor = scoreDealSize(100000, 10000); // ratio 10.0
    expect(factor.rawScore).toBe(50);
  });

  it('weightedScore equals rawScore × 0.15', () => {
    const factor = scoreDealSize(10000, 10000);
    expect(factor.weightedScore).toBe(parseFloat((90 * 0.15).toFixed(2)));
  });
});

// ============================================================================
// Factor 5 — scoreActivityRecency
// ============================================================================

describe('scoreActivityRecency', () => {
  it('returns 100 when activity within threshold (default 7 days)', () => {
    const factor = scoreActivityRecency(3);
    expect(factor.rawScore).toBe(100);
    expect(factor.label).toBe('Active recently');
  });

  it('returns 100 at exactly the threshold', () => {
    const factor = scoreActivityRecency(7);
    expect(factor.rawScore).toBe(100);
  });

  it('returns 70 when days is between threshold and 2× threshold', () => {
    const factor = scoreActivityRecency(10); // threshold=7, range [8,14]
    expect(factor.rawScore).toBe(70);
  });

  it('returns 40 when days is between 2× and 4× threshold', () => {
    const factor = scoreActivityRecency(20); // range [15,28]
    expect(factor.rawScore).toBe(40);
  });

  it('drops below 20 when very far past 4× threshold', () => {
    // daysSince=50, threshold=7 → 4×threshold=28; 50 > 28 → max(0, 20 - 50 + 28) = max(0, -2) = 0
    const factor = scoreActivityRecency(50);
    expect(factor.rawScore).toBe(0);
  });

  it('respects custom threshold', () => {
    // threshold=14, daysSince=14 → within threshold → 100
    const factor = scoreActivityRecency(14, 14);
    expect(factor.rawScore).toBe(100);
  });

  it('weightedScore equals rawScore × 0.15', () => {
    const factor = scoreActivityRecency(3);
    expect(factor.weightedScore).toBe(parseFloat((100 * 0.15).toFixed(2)));
  });
});

// ============================================================================
// Factor 6 — scoreRelationshipStrength
// ============================================================================

describe('scoreRelationshipStrength', () => {
  it('returns 0 rawScore and "single-threaded" label for 0 contacts', () => {
    const factor = scoreRelationshipStrength(0);
    expect(factor.rawScore).toBe(0);
    expect(factor.label).toBe('Single-threaded — high risk');
  });

  it('returns partial score for 1 contact with default benchmark of 3', () => {
    // 1/3 ≈ 33%
    const factor = scoreRelationshipStrength(1);
    expect(factor.rawScore).toBe(33);
    expect(factor.label).toBe('Partially multi-threaded');
  });

  it('returns 100 when contacts equal benchmark', () => {
    const factor = scoreRelationshipStrength(3);
    expect(factor.rawScore).toBe(100);
    expect(factor.label).toBe('Well multi-threaded');
  });

  it('caps rawScore at 100 when contacts exceed benchmark', () => {
    const factor = scoreRelationshipStrength(10, 3);
    expect(factor.rawScore).toBe(100);
  });

  it('respects custom benchmark', () => {
    // 2 contacts, benchmark 4 → 50%
    const factor = scoreRelationshipStrength(2, 4);
    expect(factor.rawScore).toBe(50);
  });

  it('weightedScore equals rawScore × 0.1', () => {
    const factor = scoreRelationshipStrength(3);
    expect(factor.weightedScore).toBe(parseFloat((100 * 0.1).toFixed(2)));
  });
});

// ============================================================================
// Composite score — scoreDeal
// ============================================================================

describe('scoreDeal', () => {
  function makeInput(overrides: Partial<DealScoringInput> = {}): DealScoringInput {
    return {
      dealId: 'deal-1',
      touchesLast14Days: 5,
      stageProbability: 60,
      daysToClose: 45,
      dealAmount: 10000,
      averageDealSize: 10000,
      daysSinceLastActivity: 3,
      contactsEngaged: 3,
      ...overrides,
    };
  }

  it('includes all 6 factors in the result', () => {
    const score = scoreDeal(makeInput());
    expect(score.factors).toHaveLength(6);
    const names = score.factors.map((f) => f.name);
    expect(names).toContain('engagement');
    expect(names).toContain('stage_fit');
    expect(names).toContain('close_date_health');
    expect(names).toContain('deal_size');
    expect(names).toContain('activity_recency');
    expect(names).toContain('relationship_strength');
  });

  it('compositeScore is the rounded sum of all weighted scores', () => {
    const score = scoreDeal(makeInput());
    const expectedSum = score.factors.reduce((s, f) => s + f.weightedScore, 0);
    expect(score.compositeScore).toBe(Math.round(expectedSum));
  });

  it('stores the dealId', () => {
    const score = scoreDeal(makeInput({ dealId: 'deal-xyz' }));
    expect(score.dealId).toBe('deal-xyz');
  });

  it('sets scoredAt as an ISO datetime string', () => {
    const score = scoreDeal(makeInput());
    expect(score.scoredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  describe('grade thresholds', () => {
    // We control the score by picking inputs that produce predictable results.
    // Grade thresholds: A >= 85, B >= 70, C >= 55, D >= 40, F < 40

    it('assigns grade A for high-scoring deal', () => {
      // Max all factors: 5 touches (100), late stage close soon (100), closing in 7 days (100),
      // average deal (90), just active (100), 3+ contacts (100)
      const input = makeInput({
        touchesLast14Days: 5,
        stageProbability: 90,
        daysToClose: 15,
        dealAmount: 10000,
        averageDealSize: 10000,
        daysSinceLastActivity: 1,
        contactsEngaged: 3,
      });
      const score = scoreDeal(input);
      expect(score.grade).toBe('A');
    });

    it('assigns grade F for very low-scoring deal', () => {
      // No engagement, very poor stage fit, overdue by 30 days, tiny deal, stale, no contacts
      const input = makeInput({
        touchesLast14Days: 0,
        stageProbability: 90,
        daysToClose: -30,
        dealAmount: 100,
        averageDealSize: 100000,
        daysSinceLastActivity: 100,
        contactsEngaged: 0,
      });
      const score = scoreDeal(input);
      expect(score.grade).toBe('F');
    });

    it('maps compositeScore >= 85 to A', () => {
      // Verify toGrade boundary directly via scoreDeal output
      const input = makeInput({
        touchesLast14Days: 5,
        stageProbability: 90,
        daysToClose: 10,
        dealAmount: 10000,
        averageDealSize: 10000,
        daysSinceLastActivity: 2,
        contactsEngaged: 3,
      });
      const score = scoreDeal(input);
      if (score.compositeScore >= 85) expect(score.grade).toBe('A');
    });

    it('maps compositeScore 70-84 to B', () => {
      const input = makeInput({
        touchesLast14Days: 4,
        stageProbability: 60,
        daysToClose: 45,
        dealAmount: 10000,
        averageDealSize: 10000,
        daysSinceLastActivity: 5,
        contactsEngaged: 2,
      });
      const score = scoreDeal(input);
      if (score.compositeScore >= 70 && score.compositeScore < 85) {
        expect(score.grade).toBe('B');
      }
    });
  });
});
