import { useEffect } from 'react';
import { styled } from '@linaria/react';

import { useCpqSetup } from 'src/modules/cpq/hooks/use-cpq-setup';
import { CpqTemplateGallery } from 'src/modules/cpq/components/CpqTemplateGallery';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const StyledTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const StyledSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.font.color.secondary};
  margin-bottom: 32px;
`;

const StyledButton = styled.button`
  background: ${({ theme }) => theme.color.blue};
  color: ${({ theme }) => theme.font.color.inverted};
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledStatusCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: 24px;
  width: 100%;
  margin-bottom: 24px;
`;

const StyledCardTitle = styled.h3`
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
`;

const StyledObjectList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const StyledObjectItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
`;

const StyledObjectIcon = styled.span`
  font-size: 20px;
`;

const StyledObjectLabel = styled.strong`
  font-size: 14px;
`;

const StyledObjectDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

const StyledCheckmark = styled.span`
  color: ${({ theme }) => theme.color.green};
  margin-right: 8px;
`;

const StyledError = styled.div`
  color: ${({ theme }) => theme.color.red};
  font-size: 14px;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.color.red};
  border-radius: ${({ theme }) => theme.border.radius.sm};
`;

const CPQ_OBJECTS_LIST = [
  { icon: '📄', label: 'Quotes', description: 'Build and send proposals with line items' },
  { icon: '📋', label: 'Quote Line Items', description: 'Products with pricing waterfall' },
  { icon: '📝', label: 'Contracts', description: 'Track active agreements and renewals' },
  { icon: '🔄', label: 'Subscriptions', description: 'Per-product entitlements with billing' },
  { icon: '📊', label: 'Amendments', description: 'Immutable change history on contracts' },
  { icon: '💰', label: 'Price Configurations', description: 'Tiered, volume, and term-based pricing' },
];

// CPQ setup page — shown when CPQ hasn't been initialized for a workspace.
// Guides the admin through enabling CPQ, which creates all custom objects
// via Twenty's metadata API. After setup, objects appear natively in the
// sidebar, record pages, search, and GraphQL API.
export const CpqSetupPage = () => {
  const { isSetUp, isLoading, error, checkStatus, runSetup } = useCpqSetup();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (isLoading && isSetUp === null) {
    return (
      <StyledContainer>
        <StyledTitle>Loading CPQ...</StyledTitle>
      </StyledContainer>
    );
  }

  if (isSetUp) {
    return (
      <StyledContainer>
        <StyledStatusCard>
          <StyledCheckmark>✓</StyledCheckmark>
          CPQ is enabled. Quotes, Contracts, and Subscriptions are available
          in the sidebar.
        </StyledStatusCard>
        <CpqTemplateGallery />
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledTitle>Enable CPQ</StyledTitle>
      <StyledSubtitle>
        Configure, Price, Quote — add quoting, contracts, and subscription
        management to your CRM. This creates native objects that integrate
        with your existing companies and opportunities.
      </StyledSubtitle>

      <StyledStatusCard>
        <StyledCardTitle>What gets created:</StyledCardTitle>
        <StyledObjectList>
          {CPQ_OBJECTS_LIST.map((item) => (
            <StyledObjectItem key={item.label}>
              <StyledObjectIcon>{item.icon}</StyledObjectIcon>
              <div>
                <StyledObjectLabel>{item.label}</StyledObjectLabel>
                <StyledObjectDesc>{item.description}</StyledObjectDesc>
              </div>
            </StyledObjectItem>
          ))}
        </StyledObjectList>
      </StyledStatusCard>

      <StyledButton onClick={runSetup} disabled={isLoading}>
        {isLoading ? 'Setting up...' : 'Enable CPQ'}
      </StyledButton>

      {error && <StyledError>{error}</StyledError>}
    </StyledContainer>
  );
};
