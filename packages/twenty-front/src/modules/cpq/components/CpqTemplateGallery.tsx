import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  CPQ_PRICING_TEMPLATES,
  type PricingTemplate,
} from '@/cpq/constants/cpq-pricing-templates';

const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
`;

const StyledCard = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 2px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: 20px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: ${themeCssVariables.font.color.primary};
    background: ${themeCssVariables.background.transparent.blue};
  }

  &:focus {
    outline: 2px solid ${themeCssVariables.font.color.primary};
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
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
`;

const StyledSectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  width: 100%;
`;

const StyledTemplateIcon = styled.span`
  font-size: 24px;
`;

const StyledWrapper = styled.div`
  width: 100%;
`;

// Template gallery for quick-starting product/pricing setup.
// Shown on the CPQ settings page after CPQ is enabled.
// Each template pre-configures a common pricing model so admins
// can create their first product in under 60 seconds.
export const CpqTemplateGallery = () => {
  const handleSelectTemplate = (template: PricingTemplate) => {
    // Navigate to product creation with template defaults pre-filled
    // This would integrate with Twenty's navigation to open the
    // Quote or PriceConfiguration object creation form
    console.log('Selected template:', template.id, template.defaults);
  };

  return (
    <StyledWrapper>
      <StyledSectionTitle>Quick Start Templates</StyledSectionTitle>
      <StyledGrid>
        {CPQ_PRICING_TEMPLATES.map((template: PricingTemplate) => (
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
