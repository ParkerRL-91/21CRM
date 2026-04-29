import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import {
  IconFileText,
  IconSettings,
  IconRefresh,
  IconChartBar,
} from '@tabler/icons-react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px 24px;
  max-width: 960px;
  margin: 0 auto;
`;

const StyledHeading = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: var(--twentyfont-color-primary);
  margin: 0;
`;

const StyledSubheading = styled.p`
  font-size: 14px;
  color: var(--twentyfont-color-secondary);
  margin: 4px 0 0;
`;

const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`;

const StyledCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 20px;
  background: var(--twentybackground-color-primary);
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    border-color: var(--twentycolor-blue, #3b82f6);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`;

const StyledIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--twentybackground-color-secondary);
  color: var(--twentyfont-color-secondary);
`;

const StyledCardTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledCardDescription = styled.span`
  font-size: 13px;
  color: var(--twentyfont-color-secondary);
  line-height: 1.4;
`;

type NavigationCard = {
  title: string;
  description: string;
  path: string;
  icon: typeof IconFileText;
};

const NAVIGATION_CARDS: NavigationCard[] = [
  {
    title: 'New Quote',
    description: 'Create a new quote with products and pricing',
    path: '/cpq/quotes/new',
    icon: IconFileText,
  },
  {
    title: 'Renewals',
    description: 'Track upcoming renewals and risk scores',
    path: '/cpq/renewals',
    icon: IconRefresh,
  },
  {
    title: 'CPQ Settings',
    description: 'Manage products, templates, and approval rules',
    path: '/settings/cpq',
    icon: IconSettings,
  },
  {
    title: 'Dashboard',
    description: 'Pipeline metrics and health overview',
    path: '/cpq/dashboard',
    icon: IconChartBar,
  },
];

export const CpqLandingPage = () => {
  const navigate = useNavigate();

  return (
    <SubMenuTopBarContainer
      title="CPQ"
      links={[{ children: 'CPQ' }]}
    >
      <StyledContainer>
        <div>
          <StyledHeading>CPQ — Configure, Price, Quote</StyledHeading>
          <StyledSubheading>
            Build quotes, manage renewals, and monitor your pipeline from one
            place.
          </StyledSubheading>
        </div>

        <StyledGrid>
          {NAVIGATION_CARDS.map((card) => {
            const CardIcon = card.icon;

            return (
              <StyledCard
                key={card.path}
                onClick={() => navigate(card.path)}
              >
                <StyledIconWrapper>
                  <CardIcon size={20} />
                </StyledIconWrapper>
                <StyledCardTitle>{card.title}</StyledCardTitle>
                <StyledCardDescription>
                  {card.description}
                </StyledCardDescription>
              </StyledCard>
            );
          })}
        </StyledGrid>
      </StyledContainer>
    </SubMenuTopBarContainer>
  );
};
