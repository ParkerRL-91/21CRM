import { styled } from '@linaria/react';
import { useNavigate } from 'react-router-dom';
import {
  IconUsers,
  IconChartBar,
  IconBox,
  IconTrendingUp,
  IconTool,
  IconUser,
} from '@tabler/icons-react';

import {
  CPQ_PRICING_TEMPLATES,
  type PricingTemplate,
} from '@/cpq/constants/cpq-pricing-templates';

const TEMPLATE_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  IconUsers,
  IconChartBar,
  IconBox,
  IconTrendingUp,
  IconTool,
  IconUser,
};

const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCard = styled.button`
  background: white;
  border: 2px solid var(--twentyborder-color);
  border-radius: 8px;
  padding: 20px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.1s;

  &:hover {
    border-color: var(--twentyfont-color-primary);
    background: var(--twentycolor-blue-10);
  }

  &:active {
    transform: scale(0.98);
    border-color: var(--twentycolor-blue, #3b82f6);
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

const StyledIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--twentycolor-blue-10, rgba(59, 130, 246, 0.1));
  color: var(--twentycolor-blue, #3b82f6);
`;

// Template gallery for quick-starting product/pricing setup.
// Shown on the CPQ settings page after CPQ is enabled.
// Each template pre-configures a common pricing model so admins
// can create their first product in under 60 seconds.
export const CpqTemplateGallery = () => {
  const navigate = useNavigate();

  const handleSelectTemplate = (template: PricingTemplate) => {
    const params = new URLSearchParams({
      templateId: template.id,
      defaults: JSON.stringify(template.defaults),
    });
    navigate(`/settings/cpq/templates/${template.id}?${params.toString()}`);
  };

  return (
    <div style={{ width: '100%' }}>
      <StyledSectionTitle>Quick Start Templates</StyledSectionTitle>
      <StyledGrid>
        {CPQ_PRICING_TEMPLATES.map((template) => {
          const IconComponent = TEMPLATE_ICON_MAP[template.icon];

          return (
            <StyledCard
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              aria-label={`Use ${template.title} template`}
            >
              <StyledIconContainer>
                {IconComponent ? <IconComponent size={24} /> : null}
              </StyledIconContainer>
              <StyledTitle>{template.title}</StyledTitle>
              <StyledDescription>{template.description}</StyledDescription>
            </StyledCard>
          );
        })}
      </StyledGrid>
    </div>
  );
};
