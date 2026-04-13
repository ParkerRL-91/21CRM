import { useState } from 'react';
import { styled } from '@linaria/react';

// Renewal dashboard — shows upcoming renewals, risk scores, NRR,
// and pipeline metrics. CS managers use this to prioritize outreach.

type RenewalRecord = {
  id: string;
  contractNumber: string;
  accountName: string;
  totalValue: number;
  endDate: string;
  daysUntilExpiry: number;
  renewalStatus: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  ownerName: string;
};

type RenewalMetrics = {
  totalRenewableValue: number;
  totalRenewedValue: number;
  totalChurnedValue: number;
  totalAtRiskValue: number;
  renewalRate: number;
  netRevenueRetention: number;
  contractCount: number;
  atRiskCount: number;
};

type CpqRenewalDashboardProps = {
  renewals: RenewalRecord[];
  metrics: RenewalMetrics;
  onViewContract: (contractId: string) => void;
  onRunRenewalCheck: () => void;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
`;

const StyledMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

const StyledMetricCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: 16px;
`;

const StyledMetricLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.secondary};
  margin-bottom: 4px;
`;

const StyledMetricValue = styled.div`
  font-size: 24px;
  font-weight: 700;
`;

const StyledMetricSubtext = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.tertiary};
  margin-top: 4px;
`;

const StyledNrrBar = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: 16px;
`;

const StyledNrrValue = styled.span<{ isGood: boolean }>`
  font-size: 28px;
  font-weight: 700;
  color: ${({ isGood }) => (isGood ? '#22c55e' : '#ef4444')};
`;

const StyledProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.border.color.light};
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
`;

const StyledProgressFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${({ width }) => Math.min(width, 100)}%;
  background: ${({ color }) => color};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid ${({ theme }) => theme.border.color.medium};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledTd = styled.td`
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
`;

const StyledRiskBadge = styled.span<{ riskLevel: string }>`
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ riskLevel }) => {
    switch (riskLevel) {
      case 'critical': return '#ef444420';
      case 'high': return '#f9731620';
      case 'medium': return '#eab30820';
      default: return '#22c55e20';
    }
  }};
  color: ${({ riskLevel }) => {
    switch (riskLevel) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#22c55e';
    }
  }};
`;

const StyledExpiryBadge = styled.span<{ urgent: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ urgent }) => (urgent ? '#ef4444' : '#6b7280')};
`;

const StyledButton = styled.button<{ variant?: 'primary' }>`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: 14px;
  cursor: pointer;
  border: 1px solid ${({ theme, variant }) =>
    variant === 'primary' ? 'transparent' : theme.border.color.medium};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.color.blue : 'white'};
  color: ${({ variant }) => (variant === 'primary' ? 'white' : 'inherit')};
`;

const StyledClickableRow = styled.tr`
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.background.transparent.lighter};
  }
`;

const StyledFilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const StyledSelect = styled.select`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: 6px 12px;
  font-size: 13px;
`;

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const CpqRenewalDashboard = ({
  renewals,
  metrics,
  onViewContract,
  onRunRenewalCheck,
}: CpqRenewalDashboardProps) => {
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('daysUntilExpiry');

  const filteredRenewals = renewals
    .filter((renewal) => riskFilter === 'all' || renewal.riskLevel === riskFilter)
    .sort((renewalA, renewalB) => {
      if (sortBy === 'daysUntilExpiry') return renewalA.daysUntilExpiry - renewalB.daysUntilExpiry;
      if (sortBy === 'riskScore') return renewalB.riskScore - renewalA.riskScore;
      if (sortBy === 'totalValue') return renewalB.totalValue - renewalA.totalValue;
      return 0;
    });

  const nrrIsGood = metrics.netRevenueRetention >= 100;

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>Renewal Pipeline</StyledTitle>
        <StyledButton variant="primary" onClick={onRunRenewalCheck}>
          Run Renewal Check
        </StyledButton>
      </StyledHeader>

      <StyledMetricsGrid>
        <StyledMetricCard>
          <StyledMetricLabel>Renewable</StyledMetricLabel>
          <StyledMetricValue>{formatCurrency(metrics.totalRenewableValue)}</StyledMetricValue>
          <StyledMetricSubtext>{metrics.contractCount} contracts</StyledMetricSubtext>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricLabel>Renewal Rate</StyledMetricLabel>
          <StyledMetricValue>{metrics.renewalRate.toFixed(0)}%</StyledMetricValue>
          <StyledMetricSubtext>of contracts renewing</StyledMetricSubtext>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricLabel>At Risk</StyledMetricLabel>
          <StyledMetricValue>{metrics.atRiskCount}</StyledMetricValue>
          <StyledMetricSubtext>{formatCurrency(metrics.totalAtRiskValue)}</StyledMetricSubtext>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricLabel>Churned</StyledMetricLabel>
          <StyledMetricValue>{formatCurrency(metrics.totalChurnedValue)}</StyledMetricValue>
          <StyledMetricSubtext>lost revenue</StyledMetricSubtext>
        </StyledMetricCard>
      </StyledMetricsGrid>

      <StyledNrrBar>
        <StyledMetricLabel>Net Revenue Retention</StyledMetricLabel>
        <StyledNrrValue isGood={nrrIsGood}>
          {metrics.netRevenueRetention.toFixed(1)}%
        </StyledNrrValue>
        <StyledProgressBar>
          <StyledProgressFill
            width={metrics.netRevenueRetention}
            color={nrrIsGood ? '#22c55e' : '#ef4444'}
          />
        </StyledProgressBar>
      </StyledNrrBar>

      <StyledFilterBar>
        <StyledSelect
          value={riskFilter}
          onChange={(event) => setRiskFilter(event.target.value)}
          aria-label="Filter by risk level"
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </StyledSelect>
        <StyledSelect
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          aria-label="Sort by"
        >
          <option value="daysUntilExpiry">Expiration (soonest)</option>
          <option value="riskScore">Risk (highest)</option>
          <option value="totalValue">Value (highest)</option>
        </StyledSelect>
        <StyledMetricSubtext>
          {filteredRenewals.length} of {renewals.length} renewals
        </StyledMetricSubtext>
      </StyledFilterBar>

      {filteredRenewals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          No renewals match the current filters.
        </div>
      ) : (
        <StyledTable role="table">
          <thead>
            <tr>
              <StyledTh>Account</StyledTh>
              <StyledTh>Contract</StyledTh>
              <StyledTh>Value</StyledTh>
              <StyledTh>Expires</StyledTh>
              <StyledTh>Risk</StyledTh>
              <StyledTh>Status</StyledTh>
              <StyledTh>Owner</StyledTh>
            </tr>
          </thead>
          <tbody>
            {filteredRenewals.map((renewal) => (
              <StyledClickableRow
                key={renewal.id}
                onClick={() => onViewContract(renewal.id)}
              >
                <StyledTd>{renewal.accountName}</StyledTd>
                <StyledTd>{renewal.contractNumber}</StyledTd>
                <StyledTd>{formatCurrency(renewal.totalValue)}</StyledTd>
                <StyledTd>
                  <StyledExpiryBadge urgent={renewal.daysUntilExpiry <= 30}>
                    {renewal.daysUntilExpiry <= 0
                      ? 'Expired'
                      : `${renewal.daysUntilExpiry}d`}
                  </StyledExpiryBadge>
                </StyledTd>
                <StyledTd>
                  <StyledRiskBadge riskLevel={renewal.riskLevel}>
                    {renewal.riskLevel} ({renewal.riskScore})
                  </StyledRiskBadge>
                </StyledTd>
                <StyledTd>{renewal.renewalStatus.replace('_', ' ')}</StyledTd>
                <StyledTd>{renewal.ownerName}</StyledTd>
              </StyledClickableRow>
            ))}
          </tbody>
        </StyledTable>
      )}
    </StyledContainer>
  );
};
