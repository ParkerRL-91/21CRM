export { CpqModule } from './cpq.module';
export { CpqController } from './cpq.controller';
export { CpqSetupService } from './services/cpq-setup.service';
export { CpqPricingService } from './services/cpq-pricing.service';
export { CpqApprovalService } from './services/cpq-approval.service';
export { CpqRenewalService } from './services/cpq-renewal.service';
export { CpqContractService } from './services/cpq-contract.service';
export { CpqRiskService } from './services/cpq-risk.service';
export { CpqPdfService } from './services/cpq-pdf.service';

// Pricing types
export type {
  PricingInput,
  PricingResult,
  PricingAuditStep,
  DiscountTier,
  RenewalPricingInput,
  RenewalPricingResult,
} from './services/cpq-pricing.service';

// Approval types
export type {
  ApprovalRuleDefinition,
  ApprovalCondition,
  QuoteApprovalValues,
  ApprovalPathResult,
  TriggeredRule,
  PreviousApproval,
  SmartReapprovalResult,
} from './services/cpq-approval.service';

// Contract types
export type {
  CreateContractInput,
  CreateContractResult,
  ContractLineItemInput,
  ContractSubscriptionData,
  InvoiceLineItemData,
  CoTerminationResult,
  SubscriptionChange,
  MultiAmendmentResult,
} from './services/cpq-contract.service';

// Renewal types
export type {
  RenewalConfig,
  RenewalJobResult,
  RenewalCheckInput,
  RenewalContractRecord,
  RenewalResult,
  RenewalQuoteResult,
  RenewalQuoteLine,
  SubscriptionRecord,
} from './services/cpq-renewal.service';

// Risk types
export type {
  RiskAssessmentInput,
  RiskAssessment,
  RiskSignal,
  RiskLevel,
} from './services/cpq-risk.service';

// PDF types
export type {
  QuotePdfData,
  QuoteRecord,
  QuoteLineItemRecord,
  QuoteLineGroupRecord,
  QuoteTemplateConfig,
  PdfSection,
  PdfLineItem,
} from './services/cpq-pdf.service';

// Validation utilities
export {
  safeDecimal,
  safePositiveNumber,
  safePositiveInteger,
  safeDate,
  safeDiscountPercent,
  clamp,
  CpqValidationError,
} from './utils/cpq-validation.utils';

// Decimal utilities
export { Decimal, convertCurrency, roundForCurrency, CURRENCY_RATES } from './utils/cpq-decimal.utils';
