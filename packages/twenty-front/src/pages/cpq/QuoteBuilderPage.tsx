import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { CpqPricingCalculator } from '@/cpq/components/CpqPricingCalculator';
import { useCpqPricing } from '@/cpq/hooks/use-cpq-pricing';

// Line item type for the quote builder
type LineItem = {
  id: string;
  productName: string;
  listPrice: string;
  quantity: number;
  discountPercent: number;
  netTotal: string | null;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
`;

const StyledSection = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledSectionHeader = styled.div`
  padding: 12px 16px;
  background: var(--twentybackground-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
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
  color: var(--twentyfont-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);
`;

const StyledTd = styled.td`
  padding: 10px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--twentyborder-color);

  &:last-child {
    text-align: right;
  }
`;

const StyledInput = styled.input`
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  width: 80px;

  &:focus {
    outline: 2px solid var(--twentycolor-blue, #3b82f6);
    border-color: transparent;
  }
`;

const StyledProductInput = styled(StyledInput)`
  width: 200px;
`;

const StyledAddButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 1px dashed var(--twentyborder-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--twentyfont-color-secondary);
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: var(--twentybackground-color-secondary);
    color: var(--twentyfont-color-primary);
  }
`;

const StyledRemoveButton = styled.button`
  background: none;
  border: none;
  padding: 2px 6px;
  font-size: 16px;
  color: var(--twentyfont-color-tertiary);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: var(--twentycolor-red, #ef4444);
    background: var(--twentycolor-red-light, #fee2e2);
  }
`;

const StyledTotalsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  gap: 32px;
  border-top: 2px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);
`;

const StyledTotalItem = styled.div`
  text-align: right;
`;

const StyledTotalLabel = styled.div`
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
  margin-bottom: 2px;
`;

const StyledTotalValue = styled.div<{ large?: boolean }>`
  font-size: ${({ large }) => (large ? '18px' : '14px')};
  font-weight: ${({ large }) => (large ? '700' : '600')};
  color: var(--twentyfont-color-primary);
`;

const StyledStatusBadge = styled.span<{ status: 'draft' | 'sent' | 'accepted' | 'declined' }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ status }) => {
    switch (status) {
      case 'draft': return 'var(--twentycolor-gray-light, #f3f4f6)';
      case 'sent': return 'var(--twentycolor-blue-light, #eff6ff)';
      case 'accepted': return 'var(--twentycolor-green-light, #f0fdf4)';
      case 'declined': return 'var(--twentycolor-red-light, #fee2e2)';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'draft': return 'var(--twentyfont-color-secondary)';
      case 'sent': return 'var(--twentycolor-blue-dark, #1d4ed8)';
      case 'accepted': return 'var(--twentycolor-green-dark, #166534)';
      case 'declined': return 'var(--twentycolor-red-dark, #991b1b)';
    }
  }};
`;

const newLineItem = (): LineItem => ({
  id: `li-${Date.now()}`,
  productName: '',
  listPrice: '0',
  quantity: 1,
  discountPercent: 0,
  netTotal: null,
});

// Quote Builder page — TASK-093.
// Allows users to create a new quote with line items, real-time pricing,
// and status management. Uses CpqPricingCalculator for per-item price preview.
export const QuoteBuilderPage = () => {
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [quoteName, setQuoteName] = useState('');
  const [status] = useState<'draft' | 'sent' | 'accepted' | 'declined'>('draft');
  const { calculatePrice } = useCpqPricing();

  const updateLineItem = useCallback(
    (id: string, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const recalcLineItem = useCallback(
    async (item: LineItem) => {
      const result = await calculatePrice({
        listPrice: item.listPrice,
        quantity: item.quantity,
        manualDiscountPercent: item.discountPercent || undefined,
      });
      if (result) {
        setLineItems((prev) =>
          prev.map((li) =>
            li.id === item.id ? { ...li, netTotal: result.netTotal } : li,
          ),
        );
      }
    },
    [calculatePrice],
  );

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, newLineItem()]);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  }, []);

  const subtotal = lineItems.reduce((sum, li) => {
    return sum + parseFloat(li.netTotal ?? '0');
  }, 0);

  return (
    <SubMenuTopBarContainer
      title="New Quote"
      links={[
        { children: 'CPQ', href: '/cpq' },
        { children: 'Quotes', href: '/cpq/quotes' },
        { children: 'New Quote' },
      ]}
    >
      <StyledContainer>
        {/* Quote header */}
        <StyledSection>
          <StyledSectionHeader>Quote Details</StyledSectionHeader>
          <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--twentyfont-color-secondary)', display: 'block', marginBottom: 4 }}>
                Quote Name
              </label>
              <StyledProductInput
                style={{ width: 280 }}
                placeholder="e.g. Acme Corp — Q2 2026"
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--twentyfont-color-secondary)', display: 'block', marginBottom: 4 }}>
                Status
              </label>
              <StyledStatusBadge status={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</StyledStatusBadge>
            </div>
          </div>
        </StyledSection>

        {/* Line items */}
        <StyledSection>
          <StyledSectionHeader>Line Items</StyledSectionHeader>
          <StyledTable>
            <thead>
              <tr>
                <StyledTh>Product / Service</StyledTh>
                <StyledTh>List Price</StyledTh>
                <StyledTh>Qty</StyledTh>
                <StyledTh>Discount %</StyledTh>
                <StyledTh>Net Total</StyledTh>
                <StyledTh></StyledTh>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <StyledTd>
                    <StyledProductInput
                      placeholder="Product name"
                      value={item.productName}
                      onChange={(e) => updateLineItem(item.id, 'productName', e.target.value)}
                    />
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.listPrice}
                      onChange={(e) => updateLineItem(item.id, 'listPrice', e.target.value)}
                      onBlur={() => recalcLineItem(item)}
                    />
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      onBlur={() => recalcLineItem(item)}
                    />
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={0}
                      max={100}
                      value={item.discountPercent}
                      onChange={(e) => updateLineItem(item.id, 'discountPercent', Number(e.target.value))}
                      onBlur={() => recalcLineItem(item)}
                    />
                  </StyledTd>
                  <StyledTd>
                    {item.netTotal !== null
                      ? `$${parseFloat(item.netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </StyledTd>
                  <StyledTd>
                    <StyledRemoveButton
                      onClick={() => removeLineItem(item.id)}
                      aria-label="Remove line item"
                    >
                      ×
                    </StyledRemoveButton>
                  </StyledTd>
                </tr>
              ))}
            </tbody>
          </StyledTable>

          <div style={{ padding: '8px 16px' }}>
            <StyledAddButton onClick={addLineItem}>
              + Add line item
            </StyledAddButton>
          </div>

          <StyledTotalsRow>
            <StyledTotalItem>
              <StyledTotalLabel>Subtotal</StyledTotalLabel>
              <StyledTotalValue>
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </StyledTotalValue>
            </StyledTotalItem>
            <StyledTotalItem>
              <StyledTotalLabel>Total (excl. tax)</StyledTotalLabel>
              <StyledTotalValue large>
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </StyledTotalValue>
            </StyledTotalItem>
          </StyledTotalsRow>
        </StyledSection>

        {/* Pricing preview */}
        <StyledSection>
          <StyledSectionHeader>Pricing Preview</StyledSectionHeader>
          <div style={{ padding: 16 }}>
            <CpqPricingCalculator />
          </div>
        </StyledSection>
      </StyledContainer>
    </SubMenuTopBarContainer>
  );
};
