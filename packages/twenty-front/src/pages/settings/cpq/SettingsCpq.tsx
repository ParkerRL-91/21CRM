import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

// CPQ Settings Hub — navigates to CPQ pages without making backend calls.
// The old CpqSetupPage fetched /cpq/status which failed due to CORS when the
// frontend dev server runs on a different port than the backend.

const StyledWrapper = styled.div`
  padding: 24px;
  max-width: 960px;
`;

const StyledSectionLabel = styled.div`
  color: var(--twenty-font-color-tertiary, #6b7280);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 12px;
  margin-top: 24px;
`;

const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
`;

const StyledCard = styled.div`
  background: var(--twenty-background-secondary, #f9fafb);
  border: 1px solid var(--twenty-border-color-medium, #e5e7eb);
  border-radius: 8px;
  padding: 16px 20px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: var(--twenty-color-blue, #4f46e5);
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
  }
`;

const StyledCardTitle = styled.div`
  color: var(--twenty-font-color-primary, #111827);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const StyledCardDesc = styled.div`
  color: var(--twenty-font-color-tertiary, #6b7280);
  font-size: 12px;
  line-height: 1.4;
`;

type NavCard = { title: string; description: string; path: string };

const REP_CARDS: NavCard[] = [
  { title: 'Dashboard', description: 'ARR metrics, pipeline, and renewal alerts', path: '/cpq' },
  { title: 'Quick Quote', description: 'Create a quote from a preset deal config', path: '/cpq/quick-quote' },
  { title: 'All Quotes', description: 'Browse and manage all quotes', path: '/cpq/quotes' },
  { title: 'New Quote', description: 'Build a new quote from scratch', path: '/cpq/quotes/new' },
  { title: 'Contracts', description: 'Active, renewing, and expired contracts', path: '/cpq/contracts' },
  { title: 'Renewals', description: 'Renewal queue and automated renewal jobs', path: '/cpq/renewals' },
];

const ADMIN_CARDS: NavCard[] = [
  { title: 'General Settings', description: 'Currency, defaults, approval thresholds', path: '/cpq' },
  { title: 'Product Catalog', description: 'SKUs, billing types, list prices', path: '/cpq' },
  { title: 'Price Books', description: 'Standard, partner, and custom price books', path: '/cpq' },
  { title: 'Discount Schedules', description: 'Slab, range, and term discount rules', path: '/cpq' },
  { title: 'Approval Workflows', description: 'Approval rules and routing config', path: '/cpq' },
  { title: 'Quote Templates', description: 'Document templates and merge fields', path: '/cpq' },
  { title: 'Tax Configuration', description: 'Tax rules by region and product type', path: '/cpq' },
  { title: 'Bundle Rules', description: 'Product bundles and config constraints', path: '/cpq' },
  { title: 'Integrations', description: 'E-signature, billing, and webhooks', path: '/cpq' },
];

export const SettingsCpq = () => {
  const { t } = useLingui();
  const navigate = useNavigate();

  return (
    <SubMenuTopBarContainer
      title={t`CPQ`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        { children: t`CPQ` },
      ]}
    >
      <StyledWrapper>
        <StyledSectionLabel>{t`Rep Features`}</StyledSectionLabel>
        <StyledGrid>
          {REP_CARDS.map((card) => (
            <StyledCard key={card.title} onClick={() => navigate(card.path)}>
              <StyledCardTitle>{card.title}</StyledCardTitle>
              <StyledCardDesc>{card.description}</StyledCardDesc>
            </StyledCard>
          ))}
        </StyledGrid>

        <StyledSectionLabel>{t`Admin Configuration`}</StyledSectionLabel>
        <StyledGrid>
          {ADMIN_CARDS.map((card) => (
            <StyledCard key={card.title} onClick={() => navigate(card.path)}>
              <StyledCardTitle>{card.title}</StyledCardTitle>
              <StyledCardDesc>{card.description}</StyledCardDesc>
            </StyledCard>
          ))}
        </StyledGrid>
      </StyledWrapper>
    </SubMenuTopBarContainer>
  );
};
