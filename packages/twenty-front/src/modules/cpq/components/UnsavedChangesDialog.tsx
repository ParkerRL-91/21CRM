import { styled } from '@linaria/react';

type UnsavedChangesDialogProps = {
  isOpen: boolean;
  onDiscard: () => void;
  onCancel: () => void;
};

const StyledOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const StyledDialog = styled.div`
  background: var(--twentybackground-color-primary);
  border-radius: 8px;
  padding: 24px;
  min-width: 360px;
  max-width: 440px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
`;

const StyledTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledMessage = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--twentyfont-color-secondary);
  line-height: 1.5;
`;

const StyledButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const StyledButton = styled.button<{ variant: 'danger' | 'primary' }>`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid
    ${({ variant }) =>
      variant === 'danger'
        ? 'var(--twentycolor-red, #ef4444)'
        : 'var(--twentyborder-color)'};
  background: ${({ variant }) =>
    variant === 'danger'
      ? 'var(--twentycolor-red, #ef4444)'
      : 'var(--twentybackground-color-primary)'};
  color: ${({ variant }) =>
    variant === 'danger' ? '#fff' : 'var(--twentyfont-color-primary)'};

  &:hover {
    opacity: 0.9;
  }
`;

export const UnsavedChangesDialog = ({
  isOpen,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <StyledOverlay onClick={onCancel}>
      <StyledDialog onClick={(event) => event.stopPropagation()}>
        <StyledTitle>Unsaved Changes</StyledTitle>
        <StyledMessage>
          You have unsaved changes that will be lost.
        </StyledMessage>
        <StyledButtonRow>
          <StyledButton variant="primary" onClick={onCancel}>
            Stay
          </StyledButton>
          <StyledButton variant="danger" onClick={onDiscard}>
            Discard & Leave
          </StyledButton>
        </StyledButtonRow>
      </StyledDialog>
    </StyledOverlay>
  );
};
