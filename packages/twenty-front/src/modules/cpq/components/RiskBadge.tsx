import { styled } from '@linaria/react';

export type DealRiskType = 'stale' | 'slipped' | 'no-close-date' | 'at-risk';

type RiskBadgeProps = {
  risk: DealRiskType;
  detail?: string;
};

const RISK_LABELS: Record<DealRiskType, string> = {
  stale: 'Stale',
  slipped: 'Slipped',
  'no-close-date': 'No Close Date',
  'at-risk': 'At Risk',
};

const StyledBadge = styled.span<{ risk: DealRiskType }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ risk }) => {
    switch (risk) {
      case 'stale':
        return 'var(--twentycolor-yellow-light, #fef9c3)';
      case 'slipped':
        return 'var(--twentycolor-red-light, #fee2e2)';
      case 'no-close-date':
        return 'var(--twentycolor-gray-light, #f3f4f6)';
      case 'at-risk':
        return 'var(--twentycolor-orange-light, #ffedd5)';
    }
  }};
  color: ${({ risk }) => {
    switch (risk) {
      case 'stale':
        return 'var(--twentycolor-yellow-dark, #854d0e)';
      case 'slipped':
        return 'var(--twentycolor-red-dark, #991b1b)';
      case 'no-close-date':
        return 'var(--twentyfont-color-secondary)';
      case 'at-risk':
        return 'var(--twentycolor-orange-dark, #9a3412)';
    }
  }};
`;

const StyledDot = styled.span<{ risk: DealRiskType }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ risk }) => {
    switch (risk) {
      case 'stale':
        return 'var(--twentycolor-yellow, #eab308)';
      case 'slipped':
        return 'var(--twentycolor-red, #ef4444)';
      case 'no-close-date':
        return 'var(--twentyfont-color-tertiary)';
      case 'at-risk':
        return 'var(--twentycolor-orange, #f97316)';
    }
  }};
  flex-shrink: 0;
`;

// Risk badge shown on deal cards and pipeline rows.
// Displays stale (14+ days in stage), slipped (close date past), or no-close-date flags.
export const RiskBadge = ({ risk, detail }: RiskBadgeProps) => {
  const label = detail ?? RISK_LABELS[risk];

  return (
    <StyledBadge risk={risk} title={label}>
      <StyledDot risk={risk} />
      {label}
    </StyledBadge>
  );
};

type RiskSummaryProps = {
  risks: Array<{ risk: DealRiskType; count: number; totalValue?: number }>;
  onRiskClick?: (risk: DealRiskType) => void;
};

const StyledSummaryContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const StyledSummaryItem = styled.button<{ risk: DealRiskType }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: ${({ risk }) => {
    switch (risk) {
      case 'stale':
        return 'var(--twentycolor-yellow-light, #fef9c3)';
      case 'slipped':
        return 'var(--twentycolor-red-light, #fee2e2)';
      case 'no-close-date':
        return 'var(--twentycolor-gray-light, #f3f4f6)';
      case 'at-risk':
        return 'var(--twentycolor-orange-light, #ffedd5)';
    }
  }};
  color: ${({ risk }) => {
    switch (risk) {
      case 'stale':
        return 'var(--twentycolor-yellow-dark, #854d0e)';
      case 'slipped':
        return 'var(--twentycolor-red-dark, #991b1b)';
      case 'no-close-date':
        return 'var(--twentyfont-color-secondary)';
      case 'at-risk':
        return 'var(--twentycolor-orange-dark, #9a3412)';
    }
  }};
`;

// Risk summary bar shown at the top of the pipeline page.
export const RiskSummary = ({ risks, onRiskClick }: RiskSummaryProps) => {
  const totalAtRisk = risks.reduce((sum, r) => sum + r.count, 0);
  if (totalAtRisk === 0) return null;

  return (
    <StyledSummaryContainer>
      <span style={{ fontSize: 12, color: 'var(--twentyfont-color-secondary)', fontWeight: 500 }}>
        {totalAtRisk} deal{totalAtRisk !== 1 ? 's' : ''} at risk:
      </span>
      {risks.map(({ risk, count, totalValue }) => (
        <StyledSummaryItem
          key={risk}
          risk={risk}
          onClick={() => onRiskClick?.(risk)}
        >
          {RISK_LABELS[risk]}: {count}
          {totalValue !== undefined && ` ($${(totalValue / 1000).toFixed(0)}k)`}
        </StyledSummaryItem>
      ))}
    </StyledSummaryContainer>
  );
};
