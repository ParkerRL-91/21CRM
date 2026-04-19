import { styled } from '@linaria/react';
import { ResponsivePie } from '@nivo/pie';

export type HealthMetric = {
  id: string;
  label: string;
  value: number;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  target?: number;
};

export type PipelineStageBreakdown = {
  stage: string;
  count: number;
  value: number;
};

type CpqHealthDashboardProps = {
  metrics: HealthMetric[];
  stageBreakdown?: PipelineStageBreakdown[];
  periodLabel?: string;
};

const STATUS_COLORS = {
  good: 'var(--twentycolor-green)',
  warning: 'var(--twentycolor-yellow)',
  critical: 'var(--twentycolor-red)',
} as const;

const STATUS_BG = {
  good: 'var(--twentycolor-green-light, #f0fdf4)',
  warning: 'var(--twentycolor-yellow-light, #fef9c3)',
  critical: 'var(--twentycolor-red-light, #fee2e2)',
} as const;

const StyledDashboard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StyledSectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px;
`;

const StyledMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMetricCard = styled.div<{ status: HealthMetric['status'] }>`
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--twentyborder-color);
  background: ${({ status }) => STATUS_BG[status]};
  position: relative;
  overflow: hidden;
`;

const StyledMetricLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--twentyfont-color-secondary);
  margin-bottom: 6px;
`;

const StyledMetricValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: var(--twentyfont-color-primary);
  line-height: 1;
`;

const StyledMetricUnit = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--twentyfont-color-secondary);
  margin-left: 2px;
`;

const StyledStatusDot = styled.span<{ status: HealthMetric['status'] }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ status }) => STATUS_COLORS[status]};
  position: absolute;
  top: 12px;
  right: 12px;
`;

const StyledTargetBar = styled.div`
  margin-top: 8px;
  height: 4px;
  border-radius: 2px;
  background: var(--twentyborder-color);
  overflow: hidden;
`;

const StyledTargetProgress = styled.div<{ percent: number; status: HealthMetric['status'] }>`
  height: 100%;
  border-radius: 2px;
  width: ${({ percent }) => Math.min(percent, 100)}%;
  background: ${({ status }) => STATUS_COLORS[status]};
  transition: width 0.3s ease;
`;

const StyledChartSection = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--twentybackground-color-secondary);
`;

const StyledChartContainer = styled.div`
  height: 220px;
`;

const StyledLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
`;

const StyledLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
`;

const StyledLegendDot = styled.span<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

const STAGE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
];

// Pipeline health dashboard showing KPI cards and stage breakdown pie chart.
// Designed for the CPQ/revenue overview page.
export const CpqHealthDashboard = ({
  metrics,
  stageBreakdown,
  periodLabel = 'This Quarter',
}: CpqHealthDashboardProps) => {
  const pieData = stageBreakdown?.map((s, idx) => ({
    id: s.stage,
    label: s.stage,
    value: s.value,
    color: STAGE_COLORS[idx % STAGE_COLORS.length],
  })) ?? [];

  return (
    <StyledDashboard>
      <div>
        <StyledSectionTitle>Health Metrics — {periodLabel}</StyledSectionTitle>
        <StyledMetricsGrid>
          {metrics.map((metric) => {
            const progressPercent =
              metric.target && metric.target > 0
                ? (metric.value / metric.target) * 100
                : null;

            return (
              <StyledMetricCard key={metric.id} status={metric.status}>
                <StyledStatusDot status={metric.status} />
                <StyledMetricLabel>{metric.label}</StyledMetricLabel>
                <StyledMetricValue>
                  {metric.value.toLocaleString()}
                  {metric.unit && <StyledMetricUnit>{metric.unit}</StyledMetricUnit>}
                </StyledMetricValue>
                {progressPercent !== null && (
                  <StyledTargetBar>
                    <StyledTargetProgress
                      percent={progressPercent}
                      status={metric.status}
                    />
                  </StyledTargetBar>
                )}
                {metric.target !== undefined && (
                  <div style={{ fontSize: 11, color: 'var(--twentyfont-color-tertiary)', marginTop: 4 }}>
                    Target: {metric.target.toLocaleString()}{metric.unit}
                  </div>
                )}
              </StyledMetricCard>
            );
          })}
        </StyledMetricsGrid>
      </div>

      {stageBreakdown && stageBreakdown.length > 0 && (
        <StyledChartSection>
          <StyledSectionTitle>Pipeline by Stage</StyledSectionTitle>
          <StyledChartContainer>
            <ResponsivePie
              data={pieData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.55}
              padAngle={1.5}
              cornerRadius={3}
              colors={({ data }) => data.color as string}
              borderWidth={0}
              enableArcLabels={false}
              enableArcLinkLabels={false}
              tooltip={({ datum }) => (
                <div
                  style={{
                    background: 'white',
                    border: '1px solid var(--twentyborder-color)',
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontSize: 12,
                  }}
                >
                  <strong>{datum.label}</strong>: ${datum.value.toLocaleString()}
                </div>
              )}
            />
          </StyledChartContainer>
          <StyledLegend>
            {stageBreakdown.map((s, idx) => (
              <StyledLegendItem key={s.stage}>
                <StyledLegendDot color={STAGE_COLORS[idx % STAGE_COLORS.length]} />
                {s.stage} ({s.count})
              </StyledLegendItem>
            ))}
          </StyledLegend>
        </StyledChartSection>
      )}
    </StyledDashboard>
  );
};
