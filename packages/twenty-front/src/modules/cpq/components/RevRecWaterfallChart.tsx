import { styled } from '@linaria/react';

export type WaterfallEntry = {
  month: string;
  openingBalance: number;
  newBookings: number;
  recognized: number;
  closingBalance: number;
  // Projected amounts shown as lighter overlay
  projectedBookings?: number;
  projectedRecognized?: number;
};

type RevRecWaterfallChartProps = {
  data: WaterfallEntry[];
  showProjected?: boolean;
  height?: number;
};

const StyledContainer = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--twentybackground-color-secondary);
  overflow-x: auto;
`;

const StyledTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
  margin-bottom: 16px;
`;

const StyledChart = styled.div<{ height: number }>`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-width: max-content;
  height: ${({ height }) => height}px;
  padding-bottom: 0;
  position: relative;
`;

const StyledMonthGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const StyledBars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
`;

const StyledBar = styled.div<{ heightPx: number; color: string; projected?: boolean }>`
  width: 18px;
  height: ${({ heightPx }) => Math.max(heightPx, 2)}px;
  background: ${({ color }) => color};
  border-radius: 2px 2px 0 0;
  opacity: ${({ projected }) => (projected ? 0.45 : 1)};
  position: relative;
  cursor: default;

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
  }
`;

const StyledMonthLabel = styled.div`
  font-size: 11px;
  color: var(--twentyfont-color-tertiary);
  text-align: center;
  margin-top: 6px;
  white-space: nowrap;
`;

const StyledLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--twentyborder-color);
`;

const StyledLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
`;

const StyledLegendSwatch = styled.span<{ color: string; projected?: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${({ color }) => color};
  opacity: ${({ projected }) => (projected ? 0.45 : 1)};
  flex-shrink: 0;
`;

const COLORS = {
  opening: '#64748b',
  bookings: '#3b82f6',
  recognized: '#10b981',
  closing: '#8b5cf6',
  projectedBookings: '#3b82f6',
  projectedRecognized: '#10b981',
};

const formatK = (n: number) =>
  n >= 1000000
    ? `$${(n / 1000000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}k`
      : `$${n}`;

// Deferred revenue waterfall chart: Opening → Bookings → Recognized → Closing balance.
// Supports projected overlay (lighter bars) when showProjected is true.
export const RevRecWaterfallChart = ({
  data,
  showProjected = false,
  height = 200,
}: RevRecWaterfallChartProps) => {
  if (data.length === 0) {
    return (
      <StyledContainer>
        <StyledTitle>Deferred Revenue Waterfall</StyledTitle>
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--twentyfont-color-tertiary)' }}>
          No waterfall data available
        </div>
      </StyledContainer>
    );
  }

  const allValues = data.flatMap((d) => [
    d.openingBalance,
    d.newBookings,
    d.recognized,
    d.closingBalance,
    d.projectedBookings ?? 0,
    d.projectedRecognized ?? 0,
  ]);
  const maxVal = Math.max(...allValues, 1);
  const chartHeight = height - 28; // reserve space for month labels

  const toBarHeight = (val: number) => Math.round((val / maxVal) * chartHeight);

  return (
    <StyledContainer>
      <StyledTitle>Deferred Revenue Waterfall</StyledTitle>

      <StyledChart height={height}>
        {data.map((entry) => (
          <StyledMonthGroup key={entry.month}>
            <StyledBars>
              <StyledBar
                heightPx={toBarHeight(entry.openingBalance)}
                color={COLORS.opening}
                data-tooltip={`Opening: ${formatK(entry.openingBalance)}`}
              />
              <StyledBar
                heightPx={toBarHeight(entry.newBookings)}
                color={COLORS.bookings}
                data-tooltip={`Bookings: ${formatK(entry.newBookings)}`}
              />
              {showProjected && entry.projectedBookings !== undefined && (
                <StyledBar
                  heightPx={toBarHeight(entry.projectedBookings)}
                  color={COLORS.projectedBookings}
                  projected
                  data-tooltip={`Proj. Bookings: ${formatK(entry.projectedBookings)}`}
                />
              )}
              <StyledBar
                heightPx={toBarHeight(entry.recognized)}
                color={COLORS.recognized}
                data-tooltip={`Recognized: ${formatK(entry.recognized)}`}
              />
              {showProjected && entry.projectedRecognized !== undefined && (
                <StyledBar
                  heightPx={toBarHeight(entry.projectedRecognized)}
                  color={COLORS.projectedRecognized}
                  projected
                  data-tooltip={`Proj. Recognized: ${formatK(entry.projectedRecognized)}`}
                />
              )}
              <StyledBar
                heightPx={toBarHeight(entry.closingBalance)}
                color={COLORS.closing}
                data-tooltip={`Closing: ${formatK(entry.closingBalance)}`}
              />
            </StyledBars>
            <StyledMonthLabel>{entry.month}</StyledMonthLabel>
          </StyledMonthGroup>
        ))}
      </StyledChart>

      <StyledLegend>
        <StyledLegendItem>
          <StyledLegendSwatch color={COLORS.opening} />
          Opening Balance
        </StyledLegendItem>
        <StyledLegendItem>
          <StyledLegendSwatch color={COLORS.bookings} />
          New Bookings
        </StyledLegendItem>
        <StyledLegendItem>
          <StyledLegendSwatch color={COLORS.recognized} />
          Recognized
        </StyledLegendItem>
        <StyledLegendItem>
          <StyledLegendSwatch color={COLORS.closing} />
          Closing Balance
        </StyledLegendItem>
        {showProjected && (
          <>
            <StyledLegendItem>
              <StyledLegendSwatch color={COLORS.projectedBookings} projected />
              Projected Bookings
            </StyledLegendItem>
            <StyledLegendItem>
              <StyledLegendSwatch color={COLORS.projectedRecognized} projected />
              Projected Recognized
            </StyledLegendItem>
          </>
        )}
      </StyledLegend>
    </StyledContainer>
  );
};
