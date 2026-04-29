import { styled } from '@linaria/react';
import {
  IconClock,
  IconCheck,
  IconX,
  IconSend,
  IconUserCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';

type ApprovalStep = {
  id: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  timestamp?: string;
  comment?: string;
};

type ApprovalStatusType =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

type CpqApprovalStatusProps = {
  status: ApprovalStatusType;
  steps: ApprovalStep[];
  onSubmitForApproval?: () => void;
  canSubmit?: boolean;
};

type StatusConfig = {
  label: string;
  icon: typeof IconClock | null;
  color: string;
  background: string;
};

const STATUS_CONFIG: Record<ApprovalStatusType, StatusConfig> = {
  draft: {
    label: 'Draft',
    icon: null,
    color: 'var(--twentyfont-color-secondary, #6b7280)',
    background: 'var(--twentycolor-gray-light, #f3f4f6)',
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: IconClock,
    color: 'var(--twentycolor-blue-dark, #1d4ed8)',
    background: 'var(--twentycolor-blue-light, #eff6ff)',
  },
  approved: {
    label: 'Approved',
    icon: IconCheck,
    color: 'var(--twentycolor-green-dark, #166534)',
    background: 'var(--twentycolor-green-light, #f0fdf4)',
  },
  rejected: {
    label: 'Rejected',
    icon: IconX,
    color: 'var(--twentycolor-red-dark, #991b1b)',
    background: 'var(--twentycolor-red-light, #fee2e2)',
  },
  changes_requested: {
    label: 'Changes Requested',
    icon: IconAlertTriangle,
    color: 'var(--twentycolor-yellow-dark, #854d0e)',
    background: 'var(--twentycolor-yellow-light, #fefce8)',
  },
};

const STEP_STATUS_ICON: Record<ApprovalStep['status'], typeof IconClock> = {
  pending: IconClock,
  approved: IconCheck,
  rejected: IconX,
  changes_requested: IconAlertTriangle,
};

const STEP_STATUS_COLOR: Record<ApprovalStep['status'], string> = {
  pending: 'var(--twentyfont-color-tertiary, #9ca3af)',
  approved: 'var(--twentycolor-green, #22c55e)',
  rejected: 'var(--twentycolor-red, #ef4444)',
  changes_requested: 'var(--twentycolor-yellow, #eab308)',
};

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StyledBanner = styled.div<{ background: string; color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  background: ${({ background }) => background};
  color: ${({ color }) => color};
  font-size: 13px;
  font-weight: 600;
`;

const StyledSubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  background: var(--twentycolor-blue, #3b82f6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 8px;
`;

const StyledTimelineItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px 0;
  position: relative;

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 34px;
    bottom: -2px;
    width: 2px;
    background: var(--twentyborder-color, #e5e7eb);
  }
`;

const StyledIconCircle = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  background: ${({ color }) => color}20;
  color: ${({ color }) => color};
`;

const StyledStepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledStepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`;

const StyledApproverName = styled.span`
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledApproverRole = styled.span`
  font-size: 12px;
  color: var(--twentyfont-color-tertiary, #9ca3af);
`;

const StyledStepStatusLabel = styled.span<{ color: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ color }) => color};
  text-transform: capitalize;
`;

const StyledTimestamp = styled.span`
  font-size: 11px;
  color: var(--twentyfont-color-tertiary, #9ca3af);
`;

const StyledComment = styled.div`
  font-size: 12px;
  color: var(--twentyfont-color-secondary, #6b7280);
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--twentybackground-color-secondary, #f9fafb);
  margin-top: 4px;
`;

const StyledPreviewLabel = styled.div`
  font-size: 12px;
  color: var(--twentyfont-color-tertiary, #9ca3af);
  font-style: italic;
  padding: 4px 0 2px;
`;

export const CpqApprovalStatus = ({
  status,
  steps,
  onSubmitForApproval,
  canSubmit = false,
}: CpqApprovalStatusProps) => {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <StyledWrapper>
      <StyledBanner background={config.background} color={config.color}>
        {StatusIcon !== null && <StatusIcon size={16} />}
        {config.label}

        {status === 'draft' && canSubmit && onSubmitForApproval && (
          <StyledSubmitButton onClick={onSubmitForApproval}>
            <IconSend size={14} />
            Submit for Approval
          </StyledSubmitButton>
        )}
      </StyledBanner>

      {steps.length > 0 && (
        <StyledTimeline>
          {status === 'draft' && (
            <StyledPreviewLabel>
              Expected approval chain:
            </StyledPreviewLabel>
          )}

          {steps.map((step) => {
            const StepIcon = STEP_STATUS_ICON[step.status];
            const stepColor = STEP_STATUS_COLOR[step.status];
            const statusLabel = step.status.replace('_', ' ');

            return (
              <StyledTimelineItem key={step.id}>
                <StyledIconCircle color={stepColor}>
                  <StepIcon size={14} />
                </StyledIconCircle>
                <StyledStepContent>
                  <StyledStepHeader>
                    <IconUserCheck size={14} color={stepColor} />
                    <StyledApproverName>{step.approverName}</StyledApproverName>
                    <StyledApproverRole>{step.approverRole}</StyledApproverRole>
                  </StyledStepHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StyledStepStatusLabel color={stepColor}>
                      {statusLabel}
                    </StyledStepStatusLabel>
                    {step.timestamp && (
                      <StyledTimestamp>{step.timestamp}</StyledTimestamp>
                    )}
                  </div>
                  {step.comment && (
                    <StyledComment>{step.comment}</StyledComment>
                  )}
                </StyledStepContent>
              </StyledTimelineItem>
            );
          })}
        </StyledTimeline>
      )}
    </StyledWrapper>
  );
};

export type { ApprovalStep, ApprovalStatusType, CpqApprovalStatusProps };
