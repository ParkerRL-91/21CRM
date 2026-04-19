import { styled } from '@linaria/react';

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
    <div style={{ width: '100%' }}>
      <StyledSectionTitle>Quick Start Templates</StyledSectionTitle>
      <StyledGrid>
        {CPQ_PRICING_TEMPLATES.map((template) => (
          <StyledCard
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            aria-label={`Use ${template.title} template`}
          >
            <span style={{ fontSize: 24 }}>{template.icon}</span>
            <StyledTitle>{template.title}</StyledTitle>
            <StyledDescription>{template.description}</StyledDescription>
          </StyledCard>
        ))}
      </StyledGrid>
    </div>
  );
};
