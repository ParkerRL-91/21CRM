import { describe, it, expect } from 'vitest';
import {
  calculateRiskScore,
  detectStageStagnation,
  detectCloseDateSlippage,
  detectTimePressure,
  detectValueDecrease,
  detectNoActivity,
  detectPreviousChurn,
  assessRenewalRisk,
  RiskSignal,
} from './risk-engine';

describe('calculateRiskScore', () => {
  it('returns low for all zero scores', () => {
    const signals: RiskSignal[] = [
      { name: 'a', weight: 0.5, score: 0, description: '', detectedAt: new Date() },
      { name: 'b', weight: 0.5, score: 0, description: '', detectedAt: new Date() },
    ];
    const result = calculateRiskScore(signals);
    expect(result.overallScore).toBe(0);
    expect(result.riskLevel).toBe('low');
    expect(result.signals).toHaveLength(0); // filters out zero scores
  });

  it('returns critical for high scores', () => {
    const signals: RiskSignal[] = [
      { name: 'a', weight: 0.5, score: 100, description: '', detectedAt: new Date() },
      { name: 'b', weight: 0.5, score: 80, description: '', detectedAt: new Date() },
    ];
    const result = calculateRiskScore(signals);
    expect(result.overallScore).toBe(90);
    expect(result.riskLevel).toBe('critical');
  });

  it('returns medium for moderate scores', () => {
    const signals: RiskSignal[] = [
      { name: 'a', weight: 0.5, score: 50, description: '', detectedAt: new Date() },
      { name: 'b', weight: 0.5, score: 30, description: '', detectedAt: new Date() },
    ];
    const result = calculateRiskScore(signals);
    expect(result.overallScore).toBe(40);
    expect(result.riskLevel).toBe('medium');
  });

  it('rounds overall score', () => {
    const signals: RiskSignal[] = [
      { name: 'a', weight: 0.33, score: 50, description: '', detectedAt: new Date() },
    ];
    const result = calculateRiskScore(signals);
    expect(result.overallScore).toBe(17); // 0.33 × 50 = 16.5 → 17
  });
});

describe('detectStageStagnation', () => {
  it('returns 0 within threshold', () => {
    expect(detectStageStagnation(10).score).toBe(0);
  });

  it('returns score above threshold', () => {
    const signal = detectStageStagnation(28, 14);
    expect(signal.score).toBe(100); // (28-14)/14*100 = 100
  });

  it('caps at 100', () => {
    expect(detectStageStagnation(100, 14).score).toBe(100);
  });

  it('returns 0 at exactly threshold', () => {
    expect(detectStageStagnation(14, 14).score).toBe(0);
  });
});

describe('detectCloseDateSlippage', () => {
  it('returns 100 when close date past contract end', () => {
    const signal = detectCloseDateSlippage(
      new Date('2027-02-01'),
      new Date('2027-01-01')
    );
    expect(signal.score).toBe(100);
  });

  it('returns 0 when close date before contract end', () => {
    const signal = detectCloseDateSlippage(
      new Date('2026-12-01'),
      new Date('2027-01-01')
    );
    expect(signal.score).toBe(0);
  });
});

describe('detectTimePressure', () => {
  it('returns 100 for <30 days and not final stage', () => {
    expect(detectTimePressure(20, false).score).toBe(100);
  });

  it('returns 75 for <45 days and not final stage', () => {
    expect(detectTimePressure(40, false).score).toBe(75);
  });

  it('returns 50 for <60 days and not final stage', () => {
    expect(detectTimePressure(55, false).score).toBe(50);
  });

  it('returns 0 when in final stage regardless of time', () => {
    expect(detectTimePressure(10, true).score).toBe(0);
  });

  it('returns 0 for >60 days', () => {
    expect(detectTimePressure(90, false).score).toBe(0);
  });
});

describe('detectValueDecrease', () => {
  it('returns 0 for equal value', () => {
    expect(detectValueDecrease(100000, 100000).score).toBe(0);
  });

  it('returns 0 for increase', () => {
    expect(detectValueDecrease(100000, 120000).score).toBe(0);
  });

  it('returns 25 for <10% decrease', () => {
    expect(detectValueDecrease(100000, 95000).score).toBe(25);
  });

  it('returns 50 for 10-25% decrease', () => {
    expect(detectValueDecrease(100000, 80000).score).toBe(50);
  });

  it('returns 75 for 25-50% decrease', () => {
    expect(detectValueDecrease(100000, 60000).score).toBe(75);
  });

  it('returns 100 for >50% decrease', () => {
    expect(detectValueDecrease(100000, 40000).score).toBe(100);
  });

  it('handles zero baseline', () => {
    expect(detectValueDecrease(0, 50000).score).toBe(0);
  });
});

describe('detectNoActivity', () => {
  it('returns 0 within threshold', () => {
    expect(detectNoActivity(10).score).toBe(0);
  });

  it('returns score above threshold', () => {
    expect(detectNoActivity(42, 21).score).toBe(100);
  });
});

describe('detectPreviousChurn', () => {
  it('returns 80 for previous churn', () => {
    expect(detectPreviousChurn(true).score).toBe(80);
  });

  it('returns 0 for no previous churn', () => {
    expect(detectPreviousChurn(false).score).toBe(0);
  });
});

describe('assessRenewalRisk', () => {
  it('returns low risk for healthy renewal', () => {
    const result = assessRenewalRisk({
      daysSinceLastStageChange: 5,
      dealCloseDate: new Date('2026-11-01'),
      contractEndDate: new Date('2026-12-31'),
      daysUntilExpiry: 90,
      inFinalStage: false,
      currentContractValue: 100000,
      proposedRenewalValue: 105000,
      daysSinceLastActivity: 3,
      hasPreviousChurn: false,
    });
    expect(result.riskLevel).toBe('low');
    expect(result.overallScore).toBeLessThan(26);
  });

  it('returns critical for all bad signals', () => {
    const result = assessRenewalRisk({
      daysSinceLastStageChange: 60,
      dealCloseDate: new Date('2027-03-01'),
      contractEndDate: new Date('2027-01-01'),
      daysUntilExpiry: 15,
      inFinalStage: false,
      currentContractValue: 100000,
      proposedRenewalValue: 30000,
      daysSinceLastActivity: 45,
      hasPreviousChurn: true,
    });
    expect(result.riskLevel).toBe('critical');
    expect(result.overallScore).toBeGreaterThanOrEqual(76);
  });

  it('includes only active signals in output', () => {
    const result = assessRenewalRisk({
      daysSinceLastStageChange: 5,
      dealCloseDate: new Date('2026-11-01'),
      contractEndDate: new Date('2026-12-31'),
      daysUntilExpiry: 90,
      inFinalStage: false,
      currentContractValue: 100000,
      proposedRenewalValue: 105000,
      daysSinceLastActivity: 3,
      hasPreviousChurn: false,
    });
    // All signals should be 0 → filtered out
    expect(result.signals).toHaveLength(0);
  });

  it('returns moderate risk for mixed signals', () => {
    const result = assessRenewalRisk({
      daysSinceLastStageChange: 30,    // stagnating
      dealCloseDate: new Date('2026-11-01'),
      contractEndDate: new Date('2026-12-31'),
      daysUntilExpiry: 45,             // some time pressure
      inFinalStage: false,
      currentContractValue: 100000,
      proposedRenewalValue: 95000,     // slight decrease
      daysSinceLastActivity: 10,
      hasPreviousChurn: false,
    });
    expect(result.riskLevel).toBe('medium');
  });
});
