import { styled } from '@linaria/react';

export type RevRecMode = 'closed-only' | 'projected';

type RevRecToggleProps = {
  mode: RevRecMode;
  onChange: (mode: RevRecMode) => void;
  disabled?: boolean;
};

const StyledContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const StyledLabel = styled.span`
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
  font-weight: 500;
`;

const StyledToggleTrack = styled.button<{ active: boolean; disabled?: boolean }>`
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  background: ${({ active }) => (active ? 'var(--twentycolor-blue, #3b82f6)' : 'var(--twentyborder-color)')};
  transition: background 0.2s;
  padding: 0;
  flex-shrink: 0;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:focus-visible {
    outline: 2px solid var(--twentycolor-blue);
    outline-offset: 2px;
  }
`;

const StyledToggleThumb = styled.span<{ active: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ active }) => (active ? '21px' : '3px')};
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: left 0.2s;
`;

const StyledModeLabel = styled.span<{ isActive: boolean }>`
  font-size: 12px;
  font-weight: ${({ isActive }) => (isActive ? '600' : '400')};
  color: ${({ isActive }) => (isActive ? 'var(--twentyfont-color-primary)' : 'var(--twentyfont-color-tertiary)')};
  transition: color 0.15s;
`;

// Toggle between closed-only and projected revenue recognition modes.
// Projected mode overlays forecast data on charts; closed-only shows actuals only.
export const RevRecToggle = ({ mode, onChange, disabled = false }: RevRecToggleProps) => {
  const isProjected = mode === 'projected';

  const handleToggle = () => {
    if (!disabled) {
      onChange(isProjected ? 'closed-only' : 'projected');
    }
  };

  return (
    <StyledContainer>
      <StyledModeLabel isActive={!isProjected}>Actuals only</StyledModeLabel>
      <StyledToggleTrack
        active={isProjected}
        disabled={disabled}
        onClick={handleToggle}
        role="switch"
        aria-checked={isProjected}
        aria-label="Toggle projected revenue recognition"
      >
        <StyledToggleThumb active={isProjected} />
      </StyledToggleTrack>
      <StyledModeLabel isActive={isProjected}>Include projected</StyledModeLabel>
    </StyledContainer>
  );
};

type RevRecModeSelectorProps = {
  mode: RevRecMode;
  onChange: (mode: RevRecMode) => void;
};

const StyledSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  background: var(--twentybackground-color-secondary);
`;

// Full mode selector with label and description, for use in page headers.
export const RevRecModeSelector = ({ mode, onChange }: RevRecModeSelectorProps) => {
  return (
    <StyledSelector>
      <StyledLabel>Revenue Mode:</StyledLabel>
      <RevRecToggle mode={mode} onChange={onChange} />
    </StyledSelector>
  );
};
