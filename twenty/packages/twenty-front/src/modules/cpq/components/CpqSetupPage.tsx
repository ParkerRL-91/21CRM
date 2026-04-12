import { useEffect } from 'react';
import { styled } from '@linaria/react';

import { useCpqSetup } from 'src/modules/cpq/hooks/use-cpq-setup';
import { CpqTemplateGallery } from 'src/modules/cpq/components/CpqTemplateGallery';

type CpqSetupPageProps = {
  workspaceId: string;
};

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
  color: var(--twentyfont-color-secondary);
  margin-bottom: 32px;
`;

const StyledButton = styled.button`
  background: var(--twentyfont-color-primary);
  color: white;
  border: none;
  border-radius: 8px;
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
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  margin-bottom: 24px;
`;

const StyledCheckmark = styled.span`
  color: green;
  margin-right: 8px;
`;

const StyledError = styled.div`
  color: var(--twentycolor-red);
  font-size: 14px;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--twentycolor-red);
  border-radius: 4px;
  background: var(--twentycolor-red-10);
`;

// CPQ Setup Page — shown when CPQ hasn't been initialized for a workspace.
// Guides the admin through enabling CPQ, which creates all custom objects
// (Quote, Contract, Subscription, etc.) via Twenty's metadata API.
//
// After setup, these objects appear natively in Twenty's sidebar, record
// pages, search, and GraphQL API — no additional configuration needed.
export const CpqSetupPage = ({ workspaceId }: CpqSetupPageProps) => {
  const { isSetUp, isLoading, error, checkStatus, runSetup } =
    useCpqSetup(workspaceId);

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
        <h3 style={{ marginBottom: 12 }}>What gets created:</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {[
            { icon: '📄', label: 'Quotes', desc: 'Build and send proposals with line items' },
            { icon: '📋', label: 'Quote Line Items', desc: 'Products with pricing waterfall' },
            { icon: '📝', label: 'Contracts', desc: 'Track active agreements and renewals' },
            { icon: '🔄', label: 'Subscriptions', desc: 'Per-product entitlements with billing' },
            { icon: '📊', label: 'Amendments', desc: 'Immutable change history on contracts' },
            { icon: '💰', label: 'Price Configurations', desc: 'Tiered, volume, and term-based pricing' },
          ].map((item) => (
            <li
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid var(--twentyborder-color)',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div>
                <strong>{item.label}</strong>
                <div style={{ fontSize: 12, color: 'var(--twentyfont-color-tertiary)' }}>
                  {item.desc}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </StyledStatusCard>

      <StyledButton onClick={runSetup} disabled={isLoading}>
        {isLoading ? 'Setting up...' : 'Enable CPQ'}
      </StyledButton>

      {error && <StyledError>{error}</StyledError>}
    </StyledContainer>
  );
};
