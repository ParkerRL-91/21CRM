// DTOs for CPQ pricing operations — used by both GraphQL resolver and REST controller.
// Uses class-validator decorators for input validation.

export class CalculatePriceInputDto {
  listPrice: string = '';
  quantity: number = 1;
  productBaseTermMonths?: number;
  quoteTermMonths?: number;
  contractedPrice?: string;
  discountSchedule?: {
    type: 'tiered' | 'volume' | 'term' | 'block';
    tiers: Array<{ lowerBound: number; upperBound: number | null; value: number }>;
  };
  manualDiscountPercent?: number;
  manualDiscountAmount?: number;
  manualPriceOverride?: number;
  floorPrice?: string;
}

export class PricingResultDto {
  netUnitPrice: string = '';
  netTotal: string = '';
  listPrice: string = '';
  auditSteps: Array<{
    ruleName: string;
    inputPrice: string;
    outputPrice: string;
    parameters?: Record<string, string>;
    timestamp: string;
  }> = [];
}

export class AssessRiskInputDto {
  daysSinceLastStageChange: number = 0;
  dealCloseDate: string = '';
  contractEndDate: string = '';
  daysUntilExpiry: number = 0;
  inFinalStage: boolean = false;
  currentValue: number = 0;
  proposedValue: number = 0;
  daysSinceLastActivity: number = 0;
  hasPreviousChurn: boolean = false;
}

export class RiskAssessmentResultDto {
  overallScore: number = 0;
  riskLevel: string = '';
  signals: Array<{
    name: string;
    weight: number;
    score: number;
    description: string;
  }> = [];
}

export class ValidateTransitionInputDto {
  entityType: string = '';
  from: string = '';
  to: string = '';
}

export class ProrateInputDto {
  annualValue: string = '';
  contractStartDate: string = '';
  contractEndDate: string = '';
  effectiveDate: string = '';
}

export class SetupResultDto {
  objectsCreated: string[] = [];
  fieldsCreated: number = 0;
  relationsCreated: number = 0;
  skipped: string[] = [];
  errors: string[] = [];
}

export class SetupStatusDto {
  isSetUp: boolean = false;
  objectCount: number = 0;
  expectedCount: number = 0;
  foundObjects: string[] = [];
  missingObjects: string[] = [];
  version: string = '';
}

export class TeardownResultDto {
  objectsRemoved: string[] = [];
  errors: string[] = [];
}

export class ApprovalPathResultDto {
  requiresApproval: boolean = false;
  steps: Array<{
    ruleId: string;
    ruleName: string;
    stepNumber: number;
    approverRole: string;
    reason: string;
  }> = [];
  totalSteps: number = 0;
}
