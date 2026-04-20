import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@linaria/react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';

// Pre-configured deal configurations for PhenoTips — TASK-145: Quick Quote Express Lane.
// Sales reps pick a template, review quantities, and generate a quote in seconds.

type DealConfig = {
  id: string;
  name: string;
  description: string;
  products: Array<{ name: string; unitPrice: number; quantity: number }>;
  targetCustomer: string;
  typicalTerm: number;
  badgeColor: string;
};

const DEAL_CONFIGS: DealConfig[] = [
  {
    id: 'phenotips-starter',
    name: 'Clinical Starter',
    description: 'Core phenotyping platform for small clinical teams. Up to 3 concurrent users.',
    products: [
      { name: 'PhenoTips Clinical License', unitPrice: 12000, quantity: 1 },
      { name: 'Onboarding Package', unitPrice: 2500, quantity: 1 },
    ],
    targetCustomer: 'Community hospitals, small clinics',
    typicalTerm: 1,
    badgeColor: '#6366f1',
  },
  {
    id: 'phenotips-professional',
    name: 'Professional Suite',
    description: 'Full clinical platform with analytics and API access. Up to 10 users.',
    products: [
      { name: 'PhenoTips Professional License', unitPrice: 35000, quantity: 1 },
      { name: 'Analytics Add-on', unitPrice: 8000, quantity: 1 },
      { name: 'API Access Package', unitPrice: 5000, quantity: 1 },
      { name: 'Premium Support (Year 1)', unitPrice: 6000, quantity: 1 },
    ],
    targetCustomer: 'Regional medical centers, specialty clinics',
    typicalTerm: 2,
    badgeColor: '#3b82f6',
  },
  {
    id: 'phenotips-enterprise',
    name: 'Enterprise',
    description: 'Unlimited users, custom integrations, dedicated CSM, SLA guarantee.',
    products: [
      { name: 'PhenoTips Enterprise License', unitPrice: 85000, quantity: 1 },
      { name: 'Custom Integration Module', unitPrice: 15000, quantity: 1 },
      { name: 'Analytics Add-on', unitPrice: 8000, quantity: 1 },
      { name: 'Dedicated CSM', unitPrice: 12000, quantity: 1 },
      { name: 'Premium Support Bundle', unitPrice: 18000, quantity: 1 },
    ],
    targetCustomer: 'Academic medical centers, large hospital networks',
    typicalTerm: 3,
    badgeColor: '#8b5cf6',
  },
  {
    id: 'analytics-addon',
    name: 'Analytics Add-on',
    description: 'Bolt-on analytics package for existing PhenoTips customers.',
    products: [
      { name: 'Analytics Add-on License', unitPrice: 8000, quantity: 1 },
      { name: 'Analytics Onboarding', unitPrice: 1500, quantity: 1 },
    ],
    targetCustomer: 'Existing customers expanding capabilities',
    typicalTerm: 1,
    badgeColor: '#06b6d4',
  },
  {
    id: 'research-license',
    name: 'Research License',
    description: 'Academic and research institution package with flexible data export.',
    products: [
      { name: 'Research License', unitPrice: 18000, quantity: 1 },
      { name: 'Data Export Module', unitPrice: 4000, quantity: 1 },
      { name: 'Research Support Package', unitPrice: 3000, quantity: 1 },
    ],
    targetCustomer: 'Universities, research hospitals, biobanks',
    typicalTerm: 1,
    badgeColor: '#10b981',
  },
];

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
`;

const StyledHeader = styled.div`
  text-align: center;
  padding: 8px 0 16px;
`;

const StyledHeaderTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: var(--t-font-color-primary);
  margin: 0 0 8px;
`;

const StyledHeaderSub = styled.p`
  font-size: 14px;
  color: var(--t-font-color-secondary);
  margin: 0;
`;

const StyledStepBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 8px;
`;

const StyledStep = styled.div<{ active: boolean; done: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? '700' : '500')};
  color: ${({ active, done }) =>
    done ? '#10b981' : active ? '#3b82f6' : 'var(--t-font-color-tertiary)'};
`;

const StyledStepNum = styled.span<{ active: boolean; done: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: ${({ active, done }) =>
    done ? '#10b981' : active ? '#3b82f6' : 'var(--t-border-color-medium)'};
  color: ${({ active, done }) =>
    done || active ? '#fff' : 'var(--t-font-color-tertiary)'};
`;

const StyledStepConnector = styled.div`
  width: 40px;
  height: 1px;
  background: var(--t-border-color-medium);
  margin: 0 8px;
`;

const StyledConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const StyledConfigCard = styled.div<{ selected: boolean; accentColor: string }>`
  border: 2px solid ${({ selected, accentColor }) => (selected ? accentColor : 'var(--t-border-color-medium)')};
  border-radius: 10px;
  padding: 18px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: ${({ selected }) => (selected ? 'rgba(59,130,246,0.04)' : 'var(--t-background-primary)')};
  box-shadow: ${({ selected }) => (selected ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none')};

  &:hover {
    border-color: ${({ accentColor }) => accentColor};
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
`;

const StyledConfigBadge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  background: ${({ color }) => color}22;
  color: ${({ color }) => color};
  margin-bottom: 10px;
`;

const StyledConfigName = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: var(--t-font-color-primary);
  margin: 0 0 6px;
`;

const StyledConfigDesc = styled.p`
  font-size: 13px;
  color: var(--t-font-color-secondary);
  margin: 0 0 10px;
  line-height: 1.5;
`;

const StyledConfigMeta = styled.div`
  font-size: 11px;
  color: var(--t-font-color-tertiary);
`;

const StyledConfigPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: var(--t-font-color-primary);
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--t-border-color-medium);
`;

const StyledReviewSection = styled.div`
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledReviewHeader = styled.div`
  padding: 12px 16px;
  background: var(--t-background-secondary);
  border-bottom: 1px solid var(--t-border-color-medium);
  font-size: 13px;
  font-weight: 600;
  color: var(--t-font-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--t-font-color-secondary);
  border-bottom: 1px solid var(--t-border-color-medium);
`;

const StyledTd = styled.td`
  padding: 10px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--t-border-color-medium);
  color: var(--t-font-color-primary);
`;

const StyledQtyInput = styled.input`
  width: 60px;
  padding: 4px 8px;
  border: 1px solid var(--t-border-color-medium);
  border-radius: 4px;
  font-size: 13px;
  background: var(--t-background-primary);
  color: var(--t-font-color-primary);

  &:focus {
    outline: 2px solid #3b82f6;
  }
`;

const StyledActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 2px solid var(--t-border-color-medium);
  background: var(--t-background-secondary);
`;

const StyledBtn = styled.button<{ variant?: 'primary' | 'outline' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  border: ${({ variant }) => variant === 'outline' ? '1px solid var(--t-border-color-medium)' : 'none'};
  background: ${({ variant }) => {
    switch (variant) {
      case 'primary': return '#3b82f6';
      case 'outline': return 'transparent';
      default: return 'transparent';
    }
  }};
  color: ${({ variant }) => {
    switch (variant) {
      case 'primary': return '#fff';
      case 'outline': return 'var(--t-font-color-primary)';
      default: return 'var(--t-font-color-secondary)';
    }
  }};

  &:hover { opacity: 0.85; }
`;

const StyledCustomerRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const StyledFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--t-font-color-secondary);
`;

const StyledInput = styled.input`
  padding: 7px 10px;
  border: 1px solid var(--t-border-color-medium);
  border-radius: 6px;
  font-size: 13px;
  background: var(--t-background-primary);
  color: var(--t-font-color-primary);
  width: 220px;

  &:focus { outline: 2px solid #3b82f6; }
`;

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Quick Quote — Express Lane (TASK-145)
// 2-step flow: (1) pick a pre-configured deal type, (2) review & adjust quantities, then create quote.
export const QuickQuotePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedConfig, setSelectedConfig] = useState<DealConfig | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [created, setCreated] = useState(false);

  const handleSelectConfig = (config: DealConfig) => {
    setSelectedConfig(config);
    // Initialize quantities from config defaults
    const qtyMap: Record<string, number> = {};
    config.products.forEach((p) => {
      qtyMap[p.name] = p.quantity;
    });
    setQuantities(qtyMap);
  };

  const handleNext = () => {
    if (selectedConfig) setStep(2);
  };

  const getQty = (name: string, defaultQty: number) => quantities[name] ?? defaultQty;

  const lineTotal = (price: number, qty: number) => price * qty;

  const quoteTotal = selectedConfig
    ? selectedConfig.products.reduce(
        (sum, p) => sum + lineTotal(p.unitPrice, getQty(p.name, p.quantity)),
        0,
      )
    : 0;

  const handleCreateQuote = () => {
    setCreated(true);
    const newId = `QTE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setTimeout(() => navigate(`/cpq/quotes/${newId}`), 2000);
  };

  return (
    <SubMenuTopBarContainer
      title="Quick Quote"
      links={[
        { children: 'CPQ', href: '/cpq' },
        { children: 'Quotes', href: '/cpq/quotes' },
        { children: 'Quick Quote' },
      ]}
    >
      <StyledContainer>
        {/* Step indicator */}
        <StyledStepBar>
          <StyledStep active={step === 1} done={step > 1}>
            <StyledStepNum active={step === 1} done={step > 1}>
              {step > 1 ? '✓' : '1'}
            </StyledStepNum>
            Select Deal Configuration
          </StyledStep>
          <StyledStepConnector />
          <StyledStep active={step === 2} done={created}>
            <StyledStepNum active={step === 2} done={created}>
              {created ? '✓' : '2'}
            </StyledStepNum>
            Review & Create Quote
          </StyledStep>
        </StyledStepBar>

        {created ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
              Quote Created Successfully!
            </div>
            <div style={{ fontSize: 14, color: '#15803d' }}>
              Redirecting to Quotes list…
            </div>
          </div>
        ) : step === 1 ? (
          <>
            <StyledHeader>
              <StyledHeaderTitle>Choose a Deal Configuration</StyledHeaderTitle>
              <StyledHeaderSub>
                Select a pre-configured package. You can adjust quantities and pricing in the next step.
              </StyledHeaderSub>
            </StyledHeader>

            <StyledConfigGrid>
              {DEAL_CONFIGS.map((config) => {
                const totalPrice = config.products.reduce(
                  (sum, p) => sum + p.unitPrice * p.quantity,
                  0,
                );
                return (
                  <StyledConfigCard
                    key={config.id}
                    selected={selectedConfig?.id === config.id}
                    accentColor={config.badgeColor}
                    onClick={() => handleSelectConfig(config)}
                  >
                    <StyledConfigBadge color={config.badgeColor}>
                      {config.products.length} products
                    </StyledConfigBadge>
                    <StyledConfigName>{config.name}</StyledConfigName>
                    <StyledConfigDesc>{config.description}</StyledConfigDesc>
                    <StyledConfigMeta>
                      🎯 {config.targetCustomer}<br />
                      📅 Typical term: {config.typicalTerm} year{config.typicalTerm > 1 ? 's' : ''}
                    </StyledConfigMeta>
                    <StyledConfigPrice>
                      Starting at ${fmt(totalPrice)} / yr
                    </StyledConfigPrice>
                  </StyledConfigCard>
                );
              })}
            </StyledConfigGrid>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <StyledBtn variant="outline" onClick={() => navigate('/cpq/quotes')}>Cancel</StyledBtn>
              <StyledBtn
                variant="primary"
                onClick={handleNext}
                disabled={!selectedConfig}
                style={{ opacity: selectedConfig ? 1 : 0.5 }}
              >
                Next: Review Quantities →
              </StyledBtn>
            </div>
          </>
        ) : (
          selectedConfig !== null ? (
            <>
              <StyledHeader>
                <StyledHeaderTitle>Review: {selectedConfig.name}</StyledHeaderTitle>
                <StyledHeaderSub>
                  Adjust quantities and enter customer details, then create the quote.
                </StyledHeaderSub>
              </StyledHeader>

              {/* Customer info */}
              <StyledReviewSection>
                <StyledReviewHeader>Customer Details</StyledReviewHeader>
                <div style={{ padding: 16 }}>
                  <StyledCustomerRow>
                    <StyledFieldGroup>
                      <StyledLabel>Customer / Account Name</StyledLabel>
                      <StyledInput
                        placeholder="e.g. BC Children's Hospital"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </StyledFieldGroup>
                    <StyledFieldGroup>
                      <StyledLabel>Contact</StyledLabel>
                      <StyledInput placeholder="Contact name" />
                    </StyledFieldGroup>
                    <StyledFieldGroup>
                      <StyledLabel>Term (Years)</StyledLabel>
                      <select
                        defaultValue={selectedConfig.typicalTerm}
                        style={{
                          padding: '7px 10px', border: '1px solid var(--t-border-color-medium)',
                          borderRadius: 6, fontSize: 13, background: 'var(--t-background-primary)',
                          color: 'var(--t-font-color-primary)',
                        }}
                      >
                        <option value={1}>1 Year</option>
                        <option value={2}>2 Years</option>
                        <option value={3}>3 Years</option>
                      </select>
                    </StyledFieldGroup>
                  </StyledCustomerRow>
                </div>
              </StyledReviewSection>

              {/* Line items review */}
              <StyledReviewSection>
                <StyledReviewHeader>Products & Pricing</StyledReviewHeader>
                <StyledTable>
                  <thead>
                    <tr>
                      <StyledTh>Product</StyledTh>
                      <StyledTh>Unit Price</StyledTh>
                      <StyledTh>Qty</StyledTh>
                      <StyledTh>Line Total</StyledTh>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedConfig.products.map((product) => {
                      const qty = getQty(product.name, product.quantity);
                      return (
                        <tr key={product.name}>
                          <StyledTd style={{ fontWeight: 500 }}>{product.name}</StyledTd>
                          <StyledTd>${fmt(product.unitPrice)}</StyledTd>
                          <StyledTd>
                            <StyledQtyInput
                              type="number"
                              min={1}
                              value={qty}
                              onChange={(e) =>
                                setQuantities((prev) => ({
                                  ...prev,
                                  [product.name]: Math.max(1, Number(e.target.value)),
                                }))
                              }
                            />
                          </StyledTd>
                          <StyledTd style={{ fontWeight: 600 }}>
                            ${fmt(lineTotal(product.unitPrice, qty))}
                          </StyledTd>
                        </tr>
                      );
                    })}
                  </tbody>
                </StyledTable>
                <StyledActionsRow>
                  <StyledBtn variant="outline" onClick={() => setStep(1)}>← Back</StyledBtn>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--t-font-color-secondary)' }}>
                        Annual Total
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-font-color-primary)' }}>
                        ${fmt(quoteTotal)}
                      </div>
                    </div>
                    <StyledBtn variant="primary" onClick={handleCreateQuote}>
                      ✓ Create Quote
                    </StyledBtn>
                  </div>
                </StyledActionsRow>
              </StyledReviewSection>
            </>
          ) : null
        )}
      </StyledContainer>
    </SubMenuTopBarContainer>
  );
};
