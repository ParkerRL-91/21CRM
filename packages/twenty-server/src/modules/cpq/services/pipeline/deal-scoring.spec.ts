import {
  scoreDeal,
  scoreEngagement,
  scoreStageFit,
  scoreCloseDateHealth,
  scoreDealSize,
  scoreActivityRecency,
  scoreRelationshipStrength,
} from './deal-scoring';

describe('deal-scoring', () => {
  describe('scoreEngagement', () => {
    it('should return 100 when touches meet benchmark', () => {
      const factor = scoreEngagement(5, 5);
      expect(factor.rawScore).toBe(100);
      expect(factor.weightedScore).toBe(20);
      expect(factor.name).toBe('engagement');
    });

    it('should return 0 when no touches', () => {
      const factor = scoreEngagement(0);
      expect(factor.rawScore).toBe(0);
      expect(factor.label).toBe('No recent activity');
    });

    it('should cap at 100 when touches exceed benchmark', () => {
      const factor = scoreEngagement(20, 5);
      expect(factor.rawScore).toBe(100);
    });

    it('should use default benchmark of 5', () => {
      const factor = scoreEngagement(3);
      expect(factor.rawScore).toBe(60);
    });
  });

  describe('scoreStageFit', () => {
    it('should return 100 for late stage closing within 30 days', () => {
      const factor = scoreStageFit(90, 15);
      expect(factor.rawScore).toBe(100);
    });

    it('should penalize late stage deal with far close date', () => {
      const factor = scoreStageFit(90, 120);
      expect(factor.rawScore).toBe(10);
    });

    it('should return 100 for mid stage deal within 90 days', () => {
      const factor = scoreStageFit(60, 60);
      expect(factor.rawScore).toBe(100);
    });

    it('should return 80 for early stage deal with positive days', () => {
      const factor = scoreStageFit(20, 180);
      expect(factor.rawScore).toBe(80);
    });

    it('should return 0 for early stage with overdue close date', () => {
      const factor = scoreStageFit(20, -1);
      expect(factor.rawScore).toBe(0);
    });
  });

  describe('scoreCloseDateHealth', () => {
    it('should return 100 for deal closing within 14 days', () => {
      const factor = scoreCloseDateHealth(7);
      expect(factor.rawScore).toBe(100);
    });

    it('should return decreasing scores for further close dates', () => {
      expect(scoreCloseDateHealth(20).rawScore).toBe(90);
      expect(scoreCloseDateHealth(45).rawScore).toBe(75);
      expect(scoreCloseDateHealth(75).rawScore).toBe(60);
      expect(scoreCloseDateHealth(120).rawScore).toBe(40);
      expect(scoreCloseDateHealth(200).rawScore).toBe(20);
    });

    it('should reduce score for overdue deals', () => {
      const factor = scoreCloseDateHealth(-10);
      expect(factor.rawScore).toBe(20);
      expect(factor.label).toContain('overdue');
    });

    it('should clamp to 0 for severely overdue deals', () => {
      const factor = scoreCloseDateHealth(-40);
      expect(factor.rawScore).toBe(0);
    });
  });

  describe('scoreDealSize', () => {
    it('should return 50 with no baseline', () => {
      const factor = scoreDealSize(100000, 0);
      expect(factor.rawScore).toBe(50);
      expect(factor.label).toBe('No baseline');
    });

    it('should return 90 for deal near average', () => {
      const factor = scoreDealSize(50000, 50000);
      expect(factor.rawScore).toBe(90);
    });

    it('should return 30 for very small deal', () => {
      const factor = scoreDealSize(1000, 50000);
      expect(factor.rawScore).toBe(30);
    });

    it('should return 70 for large but manageable deal', () => {
      const factor = scoreDealSize(200000, 50000);
      expect(factor.rawScore).toBe(70);
    });

    it('should return 50 for extremely large deal', () => {
      const factor = scoreDealSize(1000000, 50000);
      expect(factor.rawScore).toBe(50);
    });
  });

  describe('scoreActivityRecency', () => {
    it('should return 100 for activity within threshold', () => {
      const factor = scoreActivityRecency(5, 7);
      expect(factor.rawScore).toBe(100);
    });

    it('should return 70 for activity between 1x and 2x threshold', () => {
      const factor = scoreActivityRecency(10, 7);
      expect(factor.rawScore).toBe(70);
    });

    it('should return 40 for activity between 2x and 4x threshold', () => {
      const factor = scoreActivityRecency(21, 7);
      expect(factor.rawScore).toBe(40);
    });

    it('should return low score for very stale activity', () => {
      const factor = scoreActivityRecency(60, 7);
      expect(factor.rawScore).toBe(0);
    });

    it('should use default threshold of 7', () => {
      const factor = scoreActivityRecency(7);
      expect(factor.rawScore).toBe(100);
    });
  });

  describe('scoreRelationshipStrength', () => {
    it('should return 0 for no contacts engaged', () => {
      const factor = scoreRelationshipStrength(0);
      expect(factor.rawScore).toBe(0);
      expect(factor.label).toContain('Single-threaded');
    });

    it('should return 100 when contacts meet benchmark', () => {
      const factor = scoreRelationshipStrength(3, 3);
      expect(factor.rawScore).toBe(100);
      expect(factor.label).toBe('Well multi-threaded');
    });

    it('should return partial score for some contacts', () => {
      const factor = scoreRelationshipStrength(2, 4);
      expect(factor.rawScore).toBe(50);
    });

    it('should cap at 100 when contacts exceed benchmark', () => {
      const factor = scoreRelationshipStrength(10, 3);
      expect(factor.rawScore).toBe(100);
    });
  });

  describe('scoreDeal', () => {
    const baseInput = {
      dealId: 'deal-1',
      touchesLast14Days: 5,
      stageProbability: 75,
      daysToClose: 30,
      dealAmount: 50000,
      averageDealSize: 50000,
      daysSinceLastActivity: 3,
      contactsEngaged: 3,
    };

    it('should produce a composite score and grade', () => {
      const result = scoreDeal(baseInput);
      expect(result.dealId).toBe('deal-1');
      expect(result.compositeScore).toBeGreaterThanOrEqual(0);
      expect(result.compositeScore).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    });

    it('should return grade A for healthy deal', () => {
      const result = scoreDeal({
        ...baseInput,
        touchesLast14Days: 5,
        stageProbability: 60,
        daysToClose: 20,
        dealAmount: 50000,
        averageDealSize: 50000,
        daysSinceLastActivity: 2,
        contactsEngaged: 4,
      });
      expect(result.grade).toBe('A');
    });

    it('should return grade F for unhealthy deal', () => {
      const result = scoreDeal({
        ...baseInput,
        touchesLast14Days: 0,
        stageProbability: 80,
        daysToClose: 200,
        dealAmount: 1000,
        averageDealSize: 50000,
        daysSinceLastActivity: 60,
        contactsEngaged: 0,
      });
      expect(result.grade).toBe('F');
    });

    it('should include 6 factors', () => {
      const result = scoreDeal(baseInput);
      expect(result.factors).toHaveLength(6);
    });

    it('should record scoredAt timestamp', () => {
      const result = scoreDeal(baseInput);
      expect(result.scoredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should use optional benchmark overrides', () => {
      const result = scoreDeal({
        ...baseInput,
        engagementBenchmark: 10,
        activityThresholdDays: 14,
        contactsBenchmark: 5,
      });
      expect(result.compositeScore).toBeGreaterThanOrEqual(0);
    });
  });
});
