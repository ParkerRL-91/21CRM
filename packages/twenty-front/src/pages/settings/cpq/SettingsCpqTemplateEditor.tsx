import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import {
  CPQ_PRICING_TEMPLATES,
  type PricingTemplate,
} from '@/cpq/constants/cpq-pricing-templates';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';

const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
  width: 100%;
  padding: 0 8px;
`;

const StyledFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
`;

const StyledInput = styled.input`
  padding: 8px 12px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--twentyfont-color-primary);
  background: var(--twentybackground-color);
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--twentyfont-color-primary);
  }
`;

const StyledSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--twentyfont-color-primary);
  background: var(--twentybackground-color);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--twentyfont-color-primary);
  }
`;

const StyledSectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
  margin: 16px 0 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--twentyborder-color);
`;

const StyledReadOnlyField = styled.div`
  padding: 8px 12px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--twentyfont-color-tertiary);
  background: var(--twentybackground-color-secondary, #f9fafb);
`;

const StyledTierRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  align-items: center;
`;

const StyledTierHeader = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--twentyfont-color-tertiary);
  text-transform: uppercase;
`;

const StyledButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  background: var(--twentycolor-blue, #3b82f6);
  color: white;
  align-self: flex-start;
  margin-top: 8px;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const StyledSuccessMessage = styled.div`
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--twentycolor-green, #16a34a);
  background: var(--twentycolor-green-10, #f0fdf4);
  border: 1px solid var(--twentycolor-green-20, #bbf7d0);
`;

const StyledNotFound = styled.div`
  padding: 40px;
  text-align: center;
  color: var(--twentyfont-color-secondary);
  font-size: 14px;
`;

const PRODUCT_TYPE_OPTIONS = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'one_time', label: 'One-Time' },
  { value: 'professional_service', label: 'Professional Service' },
];

const CHARGE_TYPE_OPTIONS = [
  { value: 'recurring', label: 'Recurring' },
  { value: 'one_time', label: 'One-Time' },
  { value: 'usage', label: 'Usage' },
];

const BILLING_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

const PRICING_MODEL_LABELS: Record<string, string> = {
  flat: 'Flat',
  per_unit: 'Per Unit',
  graduated: 'Graduated',
  volume: 'Volume',
};

type FormState = {
  productName: string;
  productType: PricingTemplate['defaults']['productType'];
  chargeType: PricingTemplate['defaults']['chargeType'];
  billingFrequency: 'monthly' | 'quarterly' | 'annual';
  defaultTermMonths: number;
  defaultPrice: number;
  tiers: Array<{ from: number; to: number | null; price: number }>;
};

const buildInitialFormState = (
  template: PricingTemplate,
  parsedDefaults: PricingTemplate['defaults'] | undefined,
): FormState => {
  const defaults = parsedDefaults ?? template.defaults;

  return {
    productName: '',
    productType: defaults.productType,
    chargeType: defaults.chargeType,
    billingFrequency: defaults.billingFrequency ?? 'monthly',
    defaultTermMonths: defaults.defaultTermMonths ?? 12,
    defaultPrice: defaults.defaultPrice ?? 0,
    tiers: defaults.placeholderTiers ?? [],
  };
};

export const SettingsCpqTemplateEditor = () => {
  const { t } = useLingui();
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();

  const template = CPQ_PRICING_TEMPLATES.find(
    (tmpl) => tmpl.id === templateId,
  );

  const parsedDefaults = (() => {
    const defaultsParam = searchParams.get('defaults');
    if (!isDefined(defaultsParam)) {
      return undefined;
    }
    try {
      return JSON.parse(defaultsParam) as PricingTemplate['defaults'];
    } catch {
      return undefined;
    }
  })();

  const [formState, setFormState] = useState<FormState>(() =>
    isDefined(template)
      ? buildInitialFormState(template, parsedDefaults)
      : {
          productName: '',
          productType: 'subscription',
          chargeType: 'recurring',
          billingFrequency: 'monthly',
          defaultTermMonths: 12,
          defaultPrice: 0,
          tiers: [],
        },
  );

  const [showSuccess, setShowSuccess] = useState(false);

  const handleFieldChange = (
    field: keyof FormState,
    value: string | number,
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setShowSuccess(false);
  };

  const handleTierChange = (
    index: number,
    field: 'from' | 'to' | 'price',
    value: string,
  ) => {
    setFormState((prev) => {
      const updatedTiers = [...prev.tiers];
      const numericValue = parseFloat(value);

      if (field === 'to' && value === '') {
        updatedTiers[index] = { ...updatedTiers[index], to: null };
      } else {
        updatedTiers[index] = {
          ...updatedTiers[index],
          [field]: isNaN(numericValue) ? 0 : numericValue,
        };
      }

      return { ...prev, tiers: updatedTiers };
    });
    setShowSuccess(false);
  };

  const handleSave = () => {
    // Backend integration placeholder
    setShowSuccess(true);
  };

  if (!isDefined(template)) {
    return (
      <SubMenuTopBarContainer
        title={t`Template Not Found`}
        links={[
          {
            children: t`Workspace`,
            href: getSettingsPath(SettingsPath.Workspace),
          },
          {
            children: t`CPQ`,
            href: getSettingsPath(SettingsPath.Cpq),
          },
          { children: t`Templates` },
        ]}
      >
        <StyledNotFound>
          Template with ID &quot;{templateId}&quot; was not found.
        </StyledNotFound>
      </SubMenuTopBarContainer>
    );
  }

  const showBillingFrequency = formState.chargeType === 'recurring';
  const hasTiers = formState.tiers.length > 0;
  const pricingModel = template.defaults.pricingModel;

  return (
    <SubMenuTopBarContainer
      title={template.title}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.Workspace),
        },
        {
          children: t`CPQ`,
          href: getSettingsPath(SettingsPath.Cpq),
        },
        {
          children: t`Templates`,
          href: getSettingsPath(SettingsPath.Cpq),
        },
        { children: template.title },
      ]}
    >
      <StyledForm>
        <StyledFieldGroup>
          <StyledLabel htmlFor="productName">Product Name</StyledLabel>
          <StyledInput
            id="productName"
            type="text"
            placeholder={`e.g. ${template.title} Plan`}
            value={formState.productName}
            onChange={(event) =>
              handleFieldChange('productName', event.target.value)
            }
          />
        </StyledFieldGroup>

        <StyledFieldGroup>
          <StyledLabel htmlFor="productType">Product Type</StyledLabel>
          <StyledSelect
            id="productType"
            value={formState.productType}
            onChange={(event) =>
              handleFieldChange('productType', event.target.value)
            }
          >
            {PRODUCT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </StyledSelect>
        </StyledFieldGroup>

        <StyledFieldGroup>
          <StyledLabel htmlFor="chargeType">Charge Type</StyledLabel>
          <StyledSelect
            id="chargeType"
            value={formState.chargeType}
            onChange={(event) =>
              handleFieldChange('chargeType', event.target.value)
            }
          >
            {CHARGE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </StyledSelect>
        </StyledFieldGroup>

        {showBillingFrequency && (
          <StyledFieldGroup>
            <StyledLabel htmlFor="billingFrequency">
              Billing Frequency
            </StyledLabel>
            <StyledSelect
              id="billingFrequency"
              value={formState.billingFrequency}
              onChange={(event) =>
                handleFieldChange('billingFrequency', event.target.value)
              }
            >
              {BILLING_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </StyledSelect>
          </StyledFieldGroup>
        )}

        <StyledFieldGroup>
          <StyledLabel htmlFor="defaultTermMonths">
            Default Term (months)
          </StyledLabel>
          <StyledInput
            id="defaultTermMonths"
            type="number"
            min={1}
            value={formState.defaultTermMonths}
            onChange={(event) =>
              handleFieldChange(
                'defaultTermMonths',
                parseInt(event.target.value, 10) || 0,
              )
            }
          />
        </StyledFieldGroup>

        <StyledFieldGroup>
          <StyledLabel>Pricing Model</StyledLabel>
          <StyledReadOnlyField>
            {PRICING_MODEL_LABELS[pricingModel] ?? pricingModel}
          </StyledReadOnlyField>
        </StyledFieldGroup>

        {!hasTiers && (
          <StyledFieldGroup>
            <StyledLabel htmlFor="defaultPrice">Default Price ($)</StyledLabel>
            <StyledInput
              id="defaultPrice"
              type="number"
              min={0}
              step={0.01}
              value={formState.defaultPrice}
              onChange={(event) =>
                handleFieldChange(
                  'defaultPrice',
                  parseFloat(event.target.value) || 0,
                )
              }
            />
          </StyledFieldGroup>
        )}

        {hasTiers && (
          <>
            <StyledSectionTitle>Pricing Tiers</StyledSectionTitle>
            <StyledTierRow>
              <StyledTierHeader>From</StyledTierHeader>
              <StyledTierHeader>To</StyledTierHeader>
              <StyledTierHeader>Price ($)</StyledTierHeader>
            </StyledTierRow>
            {formState.tiers.map((tier, index) => (
              <StyledTierRow key={index}>
                <StyledInput
                  type="number"
                  min={0}
                  value={tier.from}
                  onChange={(event) =>
                    handleTierChange(index, 'from', event.target.value)
                  }
                />
                <StyledInput
                  type="number"
                  min={0}
                  placeholder="Unlimited"
                  value={isDefined(tier.to) ? tier.to : ''}
                  onChange={(event) =>
                    handleTierChange(index, 'to', event.target.value)
                  }
                />
                <StyledInput
                  type="number"
                  min={0}
                  step={0.001}
                  value={tier.price}
                  onChange={(event) =>
                    handleTierChange(index, 'price', event.target.value)
                  }
                />
              </StyledTierRow>
            ))}
          </>
        )}

        <StyledButton type="button" onClick={handleSave}>
          Save Configuration
        </StyledButton>

        {showSuccess && (
          <StyledSuccessMessage>
            Template configuration saved successfully. Backend integration
            coming soon.
          </StyledSuccessMessage>
        )}
      </StyledForm>
    </SubMenuTopBarContainer>
  );
};
