import { useNavigate } from 'react-router-dom';
import { styled } from '@linaria/react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';

// CPQ Home Dashboard (TASK-148)
// Shows key revenue metrics, renewal urgency banner, and quick-action nav cards.
// Demo data — replace with live CpqAnalyticsService calls once backend is reachable.

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
`;

// Renewal urgency banner
const StyledRenewalBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: linear-gradient(90deg, #fef9c3 0%, #fef3c7 100%);
  border: 1px solid #fbbf24;
  border-radius: 10px;
`;

const StyledBannerIcon = styled.span`
  font-size: 22px;
  flex-shrink: 0;
`;

const StyledBannerText = styled.div`
  flex: 1;
`;

const StyledBannerTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 2px;
`;

const StyledBannerSub = styled.div`
  font-size: 13px;
  color: #b45309;
`;

const StyledBannerBtn = styled.button`
  padding: 7px 16px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover { opacity: 0.88; }
`;

const StyledSectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  color: var(--t-font-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 12px;
`;

// Summary metric cards
const StyledMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
`;

const StyledMetricCard = styled.div<{ accent?: string }>`
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--t-border-color-medium);
  background: var(--t-background-primary);
  border-top: 3px solid ${({ accent }) => accent ?? '#3b82f6'};
`;

const StyledMetricLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--t-font-color-secondary);
  margin-bottom: 6px;
`;

const StyledMetricValue = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: var(--t-font-color-primary);
  line-height: 1;
`;

const StyledMetricSub = styled.div`
  font-size: 11px;
  color: var(--t-font-color-tertiary);
  margin-top: 4px;
`;

// Quick action nav cards
const StyledActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
`;

const StyledActionCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--t-border-color-medium);
  background: var(--t-background-primary);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59,130,246,0.12);
  }
`;

const StyledActionIcon = styled.span`
  font-size: 22px;
`;

const StyledActionLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--t-font-color-primary);
`;

const StyledActionDesc = styled.div`
  font-size: 11px;
  color: var(--t-font-color-secondary);
  line-height: 1.4;
`;

// Pipeline stage breakdown
const StyledStageTable = styled.div`
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledStageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--t-border-color-medium);

  &:last-child { border-bottom: none; }

  &:nth-child(even) {
    background: var(--t-background-secondary);
  }
`;

const StyledStageName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--t-font-color-primary);
  width: 160px;
  flex-shrink: 0;
`;

const StyledStageBar = styled.div`
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--t-border-color-medium);
  overflow: hidden;
`;

const StyledStageProgress = styled.div<{ percent: number; color: string }>`
  height: 100%;
  width: ${({ percent }) => percent}%;
  border-radius: 4px;
  background: ${({ color }) => color};
  transition: width 0.4s ease;
`;

const StyledStageValue = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--t-font-color-primary);
  width: 80px;
  text-align: right;
  flex-shrink: 0;
`;

const StyledStageCount = styled.div`
  font-size: 11px;
  color: var(--t-font-color-tertiary);
  width: 40px;
  text-align: right;
  flex-shrink: 0;
`;

const SUMMARY_METRICS = [
  { label: 'Active ARR', value: '$1.24M', sub: '+12% YoY', accent: '#10b981' },
  { label: 'Open Pipeline', value: '$780K', sub: '27 open quotes', accent: '#3b82f6' },
  { label: 'Win Rate (QTD)', value: '68%', sub: 'Target: 60%', accent: '#6366f1' },
  { label: 'Avg Deal Size', value: '$47.5K', sub: 'vs $43K last Q', accent: '#8b5cf6' },
  { label: 'Pending Renewals', value: '$310K', sub: '4 due in 60 days', accent: '#f59e0b' },
  { label: 'Active Contracts', value: '38', sub: '2 expiring soon', accent: '#06b6d4' },
];

const PIPELINE_STAGES = [
  { stage: 'Prospecting', count: 8, value: 180000, color: '#6366f1' },
  { stage: 'Proposal Sent', count: 6, value: 310000, color: '#3b82f6' },
  { stage: 'Negotiation', count: 4, value: 290000, color: '#06b6d4' },
  { stage: 'Closed Won', count: 9, value: 520000, color: '#10b981' },
  { stage: 'Closed Lost', count: 3, value: 95000, color: '#ef4444' },
];

const MAX_PIPELINE_VALUE = Math.max(...PIPELINE_STAGES.map((s) => s.value));

const fmt = (n: number) =>
  n >= 1000000
    ? `$${(n / 1000000).toFixed(2)}M`
    : `$${(n / 1000).toFixed(0)}K`;

type QuickAction = {
  icon: string;
  label: string;
  desc: string;
  path: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: '⚡', label: 'Quick Quote', desc: 'Express 2-step quote from templates', path: '/cpq/quick-quote' },
  { icon: '📋', label: 'All Quotes', desc: 'View and manage your quote pipeline', path: '/cpq/quotes' },
  { icon: '➕', label: 'New Quote', desc: 'Build a custom quote from scratch', path: '/cpq/quotes/new' },
  { icon: '📄', label: 'Contracts', desc: 'Active contracts and subscriptions', path: '/cpq/contracts' },
  { icon: '🔄', label: 'Renewals', desc: 'Quotes due for renewal soon', path: '/cpq/renewals' },
  { icon: '📊', label: 'Analytics', desc: 'ARR waterfall and pipeline reports', path: '/cpq/analytics' },
];

const RENEWAL_ACCOUNTS = [
  { name: "BC Children's Hospital", arr: '$142K', daysLeft: 18 },
  { name: 'SickKids (Toronto)', arr: '$215K', daysLeft: 32 },
  { name: 'Mayo Clinic – Genomics', arr: '$88K', daysLeft: 58 },
  { name: 'Great Ormond Street', arr: '$28K', daysLeft: 61 },
];

export const CpqDashboardPage = () => {
  const navigate = useNavigate();

  return (
    <SubMenuTopBarContainer
      title="CPQ Dashboard"
      links={[{ children: 'CPQ', href: '/cpq' }, { children: 'Dashboard' }]}
    >
      <StyledContainer>
        {/* Renewal urgency banner */}
        <StyledRenewalBanner>
          <StyledBannerIcon>⚠️</StyledBannerIcon>
          <StyledBannerText>
            <StyledBannerTitle>4 contracts renewing within 60 days — $473K ARR at risk</StyledBannerTitle>
            <StyledBannerSub>
              {RENEWAL_ACCOUNTS.map((a) => `${a.name} (${a.arr}, ${a.daysLeft}d)`).join(' · ')}
            </StyledBannerSub>
          </StyledBannerText>
          <StyledBannerBtn onClick={() => navigate('/cpq/renewals')}>
            View Renewal Queue →
          </StyledBannerBtn>
        </StyledRenewalBanner>

        {/* Summary metrics */}
        <div>
          <StyledSectionTitle>Revenue Overview — Q2 2026 (Demo)</StyledSectionTitle>
          <StyledMetricsGrid>
            {SUMMARY_METRICS.map((m) => (
              <StyledMetricCard key={m.label} accent={m.accent}>
                <StyledMetricLabel>{m.label}</StyledMetricLabel>
                <StyledMetricValue>{m.value}</StyledMetricValue>
                <StyledMetricSub>{m.sub}</StyledMetricSub>
              </StyledMetricCard>
            ))}
          </StyledMetricsGrid>
        </div>

        {/* Quick actions */}
        <div>
          <StyledSectionTitle>Quick Actions</StyledSectionTitle>
          <StyledActionsGrid>
            {QUICK_ACTIONS.map((action) => (
              <StyledActionCard key={action.label} onClick={() => navigate(action.path)}>
                <StyledActionIcon>{action.icon}</StyledActionIcon>
                <StyledActionLabel>{action.label}</StyledActionLabel>
                <StyledActionDesc>{action.desc}</StyledActionDesc>
              </StyledActionCard>
            ))}
          </StyledActionsGrid>
        </div>

        {/* Pipeline by stage */}
        <div>
          <StyledSectionTitle>Pipeline by Stage</StyledSectionTitle>
          <StyledStageTable>
            <StyledStageRow style={{ background: 'var(--t-background-secondary)', fontWeight: 700 }}>
              <StyledStageName style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-font-color-secondary)', textTransform: 'uppercase' }}>Stage</StyledStageName>
              <div style={{ flex: 1 }} />
              <StyledStageValue style={{ fontSize: 11, color: 'var(--t-font-color-secondary)', textTransform: 'uppercase' }}>Value</StyledStageValue>
              <StyledStageCount style={{ fontSize: 11, color: 'var(--t-font-color-secondary)', textTransform: 'uppercase' }}>Deals</StyledStageCount>
            </StyledStageRow>
            {PIPELINE_STAGES.map((stage) => (
              <StyledStageRow key={stage.stage}>
                <StyledStageName>{stage.stage}</StyledStageName>
                <StyledStageBar>
                  <StyledStageProgress
                    percent={(stage.value / MAX_PIPELINE_VALUE) * 100}
                    color={stage.color}
                  />
                </StyledStageBar>
                <StyledStageValue>{fmt(stage.value)}</StyledStageValue>
                <StyledStageCount>{stage.count}</StyledStageCount>
              </StyledStageRow>
            ))}
          </StyledStageTable>
        </div>
      </StyledContainer>
    </SubMenuTopBarContainer>
  );
};
