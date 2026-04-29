export { CpqSetupPage } from './components/CpqSetupPage';
export { CpqTemplateGallery } from './components/CpqTemplateGallery';
export { CpqPricingCalculator } from './components/CpqPricingCalculator';
export { useCpqSetup } from './hooks/use-cpq-setup';
export { useCpqPricing } from './hooks/use-cpq-pricing';
export { CPQ_PRICING_TEMPLATES } from './constants/cpq-pricing-templates';
export type { PricingTemplate, PricingModelType } from './constants/cpq-pricing-templates';

// TASK-101: Drill-down context + interactive stat cards
export { DrillDownProvider, useDrillDown } from './components/DrillDownProvider';
export type { DrillDownFilter } from './components/DrillDownProvider';
export { InteractiveStatCard } from './components/InteractiveStatCard';

// TASK-102-UI: Risk badges for pipeline deals
export { RiskBadge, RiskSummary } from './components/RiskBadge';
export type { DealRiskType } from './components/RiskBadge';

// TASK-103-UI: Change feed / activity newsfeed
export { ChangeFeed } from './components/ChangeFeed';
export type { ChangeFeedItem, ChangeEventType } from './components/ChangeFeed';

// TASK-104-UI: CPQ health dashboard with metrics + pie chart
export { CpqHealthDashboard } from './components/CpqHealthDashboard';
export type { HealthMetric, PipelineStageBreakdown } from './components/CpqHealthDashboard';

// TASK-105-UI: Deferred revenue waterfall chart
export { RevRecWaterfallChart } from './components/RevRecWaterfallChart';
export type { WaterfallEntry } from './components/RevRecWaterfallChart';

// TASK-108-UI: Rev-rec mode toggle (actuals-only vs projected)
export { RevRecToggle, RevRecModeSelector } from './components/RevRecToggle';
export type { RevRecMode } from './components/RevRecToggle';

// TASK-115-UI: Deal score badge + bar
export { DealScoreBadge, DealScoreBar } from './components/DealScoreBadge';
export type { DealScoreLevel } from './components/DealScoreBadge';

// TASK-116: Product catalog picker for quote builder
export { CpqProductPicker } from './components/CpqProductPicker';
export { useCpqCatalog } from './hooks/use-cpq-catalog';

// TASK-118: Approval rules admin UI
export { CpqApprovalRulesEditor } from './components/CpqApprovalRulesEditor';

// TASK-125: Quote-level audit trail
export { CpqAuditTrail } from './components/CpqAuditTrail';
export { useQuoteAuditTrail } from './hooks/use-quote-audit-trail';
export type { AuditEntry, AuditEventType } from './hooks/use-quote-audit-trail';

// TASK-128: Renewal dashboard with CSV export
export { CpqRenewalDashboard } from './components/CpqRenewalDashboard';
export type { RenewalRow, RiskLevel, CpqRenewalDashboardProps } from './components/CpqRenewalDashboard';

// TASK-119: PDF generation from quote data
export { CpqQuotePdf } from './components/CpqQuotePdf';

// TASK-127: Quote versioning with side-by-side comparison
export { CpqQuoteVersioning } from './components/CpqQuoteVersioning';
export { useQuoteVersions } from './hooks/use-quote-versions';
export type { QuoteVersion, VersionedLineItem } from './hooks/use-quote-versions';

// TASK-120: Approval status visibility on quotes
export { CpqApprovalStatus } from './components/CpqApprovalStatus';
export type { ApprovalStep, ApprovalStatusType, CpqApprovalStatusProps } from './components/CpqApprovalStatus';

// TASK-126: Discount guardrails with visual feedback
export { CpqDiscountGuardrail } from './components/CpqDiscountGuardrail';
export type { GuardrailLevel, DiscountThresholds, CpqDiscountGuardrailProps } from './components/CpqDiscountGuardrail';

// TASK-137: Unsaved changes warning for editors
export { UnsavedChangesDialog } from './components/UnsavedChangesDialog';
export { useUnsavedChangesWarning } from './hooks/use-unsaved-changes-warning';

// TASK-130: Mobile responsive table wrapper
export { CpqResponsiveTable } from './components/CpqResponsiveTable';

// TASK-134: Line item grouping/sections for quote builder
export { CpqLineItemGroup } from './components/CpqLineItemGroup';
export { useLineItemGroups } from './hooks/use-line-item-groups';
