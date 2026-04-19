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
