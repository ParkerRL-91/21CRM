import { CpqRiskService } from '../cpq-risk.service';

describe('CpqRiskService', () => {
  let service: CpqRiskService;

  beforeEach(() => {
    service = new CpqRiskService();
  });

  describe('assessRenewalRisk', () => {
    it('should return low risk for healthy renewal', () => {
      const result = service.assessRenewalRisk({
        daysSinceLastStageChange: 5,
        dealCloseDate: new Date('2026-11-01'),
        contractEndDate: new Date('2026-12-31'),
        daysUntilExpiry: 90,
        inFinalStage: false,
        currentValue: 100000,
        proposedValue: 105000,
        daysSinceLastActivity: 3,
        hasPreviousChurn: false,
      });
      expect(result.riskLevel).toBe('low');
      expect(result.overallScore).toBeLessThan(26);
    });

    it('should return critical for all bad signals', () => {
      const result = service.assessRenewalRisk({
        daysSinceLastStageChange: 60,
        dealCloseDate: new Date('2027-03-01'),
        contractEndDate: new Date('2027-01-01'),
        daysUntilExpiry: 15,
        inFinalStage: false,
        currentValue: 100000,
        proposedValue: 30000,
        daysSinceLastActivity: 45,
        hasPreviousChurn: true,
      });
      expect(result.riskLevel).toBe('critical');
      expect(result.overallScore).toBeGreaterThanOrEqual(76);
    });

    it('should return medium for mixed signals', () => {
      const result = service.assessRenewalRisk({
        daysSinceLastStageChange: 30,
        dealCloseDate: new Date('2026-11-01'),
        contractEndDate: new Date('2026-12-31'),
        daysUntilExpiry: 45,
        inFinalStage: false,
        currentValue: 100000,
        proposedValue: 95000,
        daysSinceLastActivity: 10,
        hasPreviousChurn: false,
      });
      expect(result.riskLevel).toBe('medium');
    });

    it('should exclude zero-score signals from output', () => {
      const result = service.assessRenewalRisk({
        daysSinceLastStageChange: 5,
        dealCloseDate: new Date('2026-11-01'),
        contractEndDate: new Date('2026-12-31'),
        daysUntilExpiry: 90,
        inFinalStage: false,
        currentValue: 100000,
        proposedValue: 105000,
        daysSinceLastActivity: 3,
        hasPreviousChurn: false,
      });
      expect(result.signals).toHaveLength(0);
    });

    it('should return 0 time pressure when in final stage', () => {
      const result = service.assessRenewalRisk({
        daysSinceLastStageChange: 5,
        dealCloseDate: new Date('2026-11-01'),
        contractEndDate: new Date('2026-12-31'),
        daysUntilExpiry: 10,
        inFinalStage: true, // in final stage negates time pressure
        currentValue: 100000,
        proposedValue: 100000,
        daysSinceLastActivity: 3,
        hasPreviousChurn: false,
      });
      expect(result.riskLevel).toBe('low');
    });
  });
});
