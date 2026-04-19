import { styled } from '@linaria/react';

import {
  CPQ_PRICING_TEMPLATES,
  type PricingTemplate,
} from 'src/modules/cpq/constants/cpq-pricing-templates';

const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
`;

const StyledCard = styled.button`
  background: white;
  border: 2px solid var(--twentyborder-color);
  border-radius: 8px;
  padding: 20px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: var(--twentyfont-color-primary);
    background: var(--twentycolor-blue-10);
  }

  &:focus {
    outline: 2px solid var(--twentyfont-color-primary);
    outline-offset: 2px;
  }
`;

const StyledTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 4px;
`;

const StyledDescription = styled.p`
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
  margin: 0;
`;

const StyledSectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  width: 100%;
`;

const StyledWrapper = styled.div`
  width: 100%;
`;

const StyledTemplateIcon = styled.span`
  font-size: 24px;
`;

// Template gallery for quick-starting product/pricing setup.
// Shown on the CPQ settings page after CPQ is enabled.
// Each template pre-configures a common pricing model so admins
// can create their first product in under 60 seconds.
export const CpqTemplateGallery = () => {
  const handleSelectTemplate = (_template: PricingTemplate) => {
    // Navigation to the object creation form is wired up at the page level
    // when this gallery is embedded in the CPQ settings route.
  };

  return (
    <StyledWrapper>
      <StyledSectionTitle>Quick Start Templates</StyledSectionTitle>
      <StyledGrid>
        {CPQ_PRICING_TEMPLATES.map((template) => (
          <StyledCard
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            aria-label={`Use ${template.title} template`}
          >
            <StyledTemplateIcon>{template.icon}</StyledTemplateIcon>
            <StyledTitle>{template.title}</StyledTitle>
            <StyledDescription>{template.description}</StyledDescription>
          </StyledCard>
        ))}
      </StyledGrid>
    </StyledWrapper>
  );
};
