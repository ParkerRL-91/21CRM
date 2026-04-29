import { useMemo } from 'react';
import { styled } from '@linaria/react';
import { IconCheck, IconAlertTriangle, IconX } from '@tabler/icons-react';

type GuardrailLevel = 'auto_approved' | 'needs_approval' | 'exceeds_max';

type DiscountThresholds = {
  autoApproveMax: number;
  approvalRequiredMax: number;
};

type CpqDiscountGuardrailProps = {
  discountPercent: number;
  thresholds?: DiscountThresholds;
  onChange: (value: number) => void;
  onBlur?: () => void;
};

const DEFAULT_THRESHOLDS: DiscountThresholds = {
  autoApproveMax: 15,
  approvalRequiredMax: 30,
};

type LevelConfig = {
  color: string;
  icon: typeof IconCheck;
  label: string;
};

const LEVEL_CONFIG: Record<GuardrailLevel, LevelConfig> = {
  auto_approved: {
    color: 'var(--twentycolor-green, #22c55e)',
    icon: IconCheck,
    label: 'Auto-approved',
  },
  needs_approval: {
    color: 'var(--twentycolor-yellow, #eab308)',
    icon: IconAlertTriangle,
    label: 'Requires approval',
  },
  exceeds_max: {
    color: 'var(--twentycolor-red, #ef4444)',
    icon: IconX,
    label: 'Exceeds maximum',
  },
};

const getGuardrailLevel = (
  discountPercent: number,
  thresholds: DiscountThresholds,
): GuardrailLevel => {
  if (discountPercent <= thresholds.autoApproveMax) {
    return 'auto_approved';
  }
  if (discountPercent <= thresholds.approvalRequiredMax) {
    return 'needs_approval';
  }
  return 'exceeds_max';
};

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
`;

const StyledInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StyledInput = styled.input<{ borderColor: string }>`
  border: 2px solid ${({ borderColor }) => borderColor};
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 13px;
  width: 70px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ borderColor }) => borderColor}30;
  }
`;

const StyledStatusLabel = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ color }) => color};
  white-space: nowrap;
`;

const StyledThresholdInfo = styled.div`
  font-size: 10px;
  color: var(--twentyfont-color-tertiary, #9ca3af);
  line-height: 1.3;
`;

export const CpqDiscountGuardrail = ({
  discountPercent,
  thresholds = DEFAULT_THRESHOLDS,
  onChange,
  onBlur,
}: CpqDiscountGuardrailProps) => {
  const level = useMemo(
    () => getGuardrailLevel(discountPercent, thresholds),
    [discountPercent, thresholds],
  );

  const config = LEVEL_CONFIG[level];
  const LevelIcon = config.icon;

  return (
    <StyledWrapper>
      <StyledInputRow>
        <StyledInput
          type="number"
          min={0}
          max={100}
          value={discountPercent}
          borderColor={config.color}
          onChange={(event) => onChange(Number(event.target.value))}
          onBlur={onBlur}
        />
        <StyledStatusLabel color={config.color}>
          <LevelIcon size={12} />
          {config.label}
        </StyledStatusLabel>
      </StyledInputRow>
      <StyledThresholdInfo>
        0-{thresholds.autoApproveMax}% auto |{' '}
        {thresholds.autoApproveMax + 1}-{thresholds.approvalRequiredMax}% approval |{' '}
        &gt;{thresholds.approvalRequiredMax}% blocked
      </StyledThresholdInfo>
    </StyledWrapper>
  );
};

export type {
  GuardrailLevel,
  DiscountThresholds,
  CpqDiscountGuardrailProps,
};
