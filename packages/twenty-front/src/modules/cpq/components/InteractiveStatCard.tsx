import { styled } from '@linaria/react';

import { useDrillDown, DrillDownFilter } from '@/cpq/components/DrillDownProvider';

type InteractiveStatCardProps = {
  label: string;
  value: string | number;
  subLabel?: string;
  filter: DrillDownFilter;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percent: number;
  };
};

const StyledCard = styled.div<{ isActive: boolean }>`
  padding: 16px;
  border-radius: 8px;
  border: 2px solid ${({ isActive }) => (isActive ? 'var(--twentycolor-blue)' : 'var(--twentyborder-color)')};
  background: ${({ isActive }) => (isActive ? 'var(--twentycolor-blue-light, #eff6ff)' : 'var(--twentybackground-color-secondary)')};
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;

  &:hover {
    border-color: var(--twentycolor-blue);
  }
`;

const StyledLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--twentyfont-color-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StyledValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: var(--twentyfont-color-primary);
  line-height: 1.2;
`;

const StyledSubLabel = styled.div`
  font-size: 12px;
  color: var(--twentyfont-color-tertiary);
  margin-top: 4px;
`;

const StyledTrend = styled.span<{ direction: 'up' | 'down' | 'neutral' }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ direction }) =>
    direction === 'up'
      ? 'var(--twentycolor-green)'
      : direction === 'down'
        ? 'var(--twentycolor-red)'
        : 'var(--twentyfont-color-tertiary)'};
`;

const StyledActiveIndicator = styled.div`
  font-size: 11px;
  color: var(--twentycolor-blue);
  margin-top: 6px;
  font-weight: 500;
`;

// Clickable stat card that sets a drill-down filter when clicked.
// Requires a DrillDownProvider ancestor to work.
export const InteractiveStatCard = ({
  label,
  value,
  subLabel,
  filter,
  trend,
}: InteractiveStatCardProps) => {
  const { activeFilter, setFilter, clearFilter } = useDrillDown();

  const isActive =
    activeFilter?.field === filter.field && activeFilter?.value === filter.value;

  const handleClick = () => {
    if (isActive) {
      clearFilter();
    } else {
      setFilter(filter);
    }
  };

  const trendSymbol = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→';

  return (
    <StyledCard isActive={isActive} onClick={handleClick} role="button" aria-pressed={isActive}>
      <StyledLabel>{label}</StyledLabel>
      <StyledValue>{value}</StyledValue>
      {subLabel && <StyledSubLabel>{subLabel}</StyledSubLabel>}
      {trend && (
        <StyledTrend direction={trend.direction}>
          {trendSymbol} {trend.percent}%
        </StyledTrend>
      )}
      {isActive && (
        <StyledActiveIndicator>Filtering — click to clear</StyledActiveIndicator>
      )}
    </StyledCard>
  );
};
