import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';

import { useCpqPricing } from 'src/modules/cpq/hooks/use-cpq-pricing';

// Quote builder — the core CPQ workflow page.
// Sales reps add products, adjust quantities and discounts,
// and see real-time price calculations via the pricing engine.

type QuoteLineItemDraft = {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  listPrice: number;
  discountPercent: number;
  netUnitPrice: number;
  netTotal: number;
  billingType: 'recurring' | 'one_time' | 'usage';
  groupName: string;
  sortOrder: number;
};

type CpqQuoteBuilderProps = {
  quoteId: string;
  quoteNumber: string;
  status: string;
  subscriptionTermMonths: number;
  onSave: (lineItems: QuoteLineItemDraft[]) => void;
  onSubmitForApproval: () => void;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
`;

const StyledStatusBadge = styled.span<{ statusColor: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ statusColor }) => statusColor}20;
  color: ${({ statusColor }) => statusColor};
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid ${({ theme }) => theme.border.color.medium};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledTd = styled.td`
  padding: 8px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
  vertical-align: middle;
`;

const StyledInput = styled.input`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: 4px 8px;
  font-size: 14px;
  width: 80px;
  text-align: right;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.color.blue};
    border-color: transparent;
  }
`;

const StyledSummary = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  padding: 16px 12px;
  border-top: 2px solid ${({ theme }) => theme.border.color.medium};
`;

const StyledSummaryRow = styled.div<{ isTotal?: boolean }>`
  display: flex;
  justify-content: space-between;
  width: 300px;
  font-size: ${({ isTotal }) => (isTotal ? '16px' : '14px')};
  font-weight: ${({ isTotal }) => (isTotal ? '700' : '400')};
  color: ${({ theme, isTotal }) =>
    isTotal ? theme.font.color.primary : theme.font.color.secondary};
`;

const StyledButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ theme, variant }) =>
    variant === 'primary' ? 'transparent' : theme.border.color.medium};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.color.blue : 'white'};
  color: ${({ variant }) => (variant === 'primary' ? 'white' : 'inherit')};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledEmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: ${({ theme }) => theme.font.color.tertiary};
  border: 2px dashed ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
`;

const StyledRemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.font.color.tertiary};
  cursor: pointer;
  font-size: 16px;
  padding: 4px;

  &:hover {
    color: ${({ theme }) => theme.color.red};
  }
`;

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  in_review: '#3b82f6',
  approved: '#22c55e',
  denied: '#ef4444',
  presented: '#8b5cf6',
  accepted: '#22c55e',
  rejected: '#ef4444',
  expired: '#6b7280',
  contracted: '#22c55e',
};

let nextId = 1;

export const CpqQuoteBuilder = ({
  quoteNumber,
  status,
  subscriptionTermMonths,
  onSave,
  onSubmitForApproval,
}: CpqQuoteBuilderProps) => {
  const [lineItems, setLineItems] = useState<QuoteLineItemDraft[]>([]);
  const { calculatePrice } = useCpqPricing();
  const isEditable = status === 'draft' || status === 'denied';

  const addLineItem = useCallback(() => {
    const newItem: QuoteLineItemDraft = {
      id: `draft-${nextId++}`,
      productName: '',
      productSku: '',
      quantity: 1,
      listPrice: 0,
      discountPercent: 0,
      netUnitPrice: 0,
      netTotal: 0,
      billingType: 'recurring',
      groupName: '',
      sortOrder: lineItems.length * 10 + 10,
    };
    setLineItems((previous) => [...previous, newItem]);
  }, [lineItems.length]);

  const updateLineItem = useCallback(
    async (itemId: string, field: string, value: string | number) => {
      setLineItems((previous) =>
        previous.map((item) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, [field]: value };

          // Recalculate pricing when quantity, price, or discount changes
          if (field === 'quantity' || field === 'listPrice' || field === 'discountPercent') {
            const listPrice = field === 'listPrice' ? Number(value) : item.listPrice;
            const quantity = field === 'quantity' ? Number(value) : item.quantity;
            const discount = field === 'discountPercent' ? Number(value) : item.discountPercent;

            // Local calculation — pricing engine call for complex scenarios
            const discountMultiplier = 1 - discount / 100;
            const netUnit = Math.round(listPrice * discountMultiplier * 100) / 100;
            const netTotal = Math.round(netUnit * quantity * 100) / 100;

            updated.netUnitPrice = netUnit;
            updated.netTotal = netTotal;
          }

          return updated;
        }),
      );
    },
    [],
  );

  const removeLineItem = useCallback((itemId: string) => {
    setLineItems((previous) => previous.filter((item) => item.id !== itemId));
  }, []);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.netTotal, 0);
  const discountTotal = lineItems.reduce(
    (sum, item) => sum + (item.listPrice * item.quantity - item.netTotal),
    0,
  );
  const grandTotal = subtotal;

  return (
    <StyledContainer>
      <StyledHeader>
        <div>
          <StyledTitle>Quote {quoteNumber}</StyledTitle>
          <StyledStatusBadge statusColor={STATUS_COLORS[status] || '#6b7280'}>
            {status.replace('_', ' ').toUpperCase()}
          </StyledStatusBadge>
          {subscriptionTermMonths && (
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>
              {subscriptionTermMonths} month term
            </span>
          )}
        </div>
        <StyledActions>
          {isEditable && (
            <>
              <StyledButton onClick={() => onSave(lineItems)}>
                Save Draft
              </StyledButton>
              <StyledButton
                variant="primary"
                onClick={onSubmitForApproval}
                disabled={lineItems.length === 0}
              >
                Submit for Approval
              </StyledButton>
            </>
          )}
        </StyledActions>
      </StyledHeader>

      {lineItems.length === 0 ? (
        <StyledEmptyState>
          <p>No line items yet.</p>
          {isEditable && (
            <StyledButton onClick={addLineItem} variant="primary">
              + Add Product
            </StyledButton>
          )}
        </StyledEmptyState>
      ) : (
        <>
          <StyledTable role="table">
            <thead>
              <tr>
                <StyledTh>Product</StyledTh>
                <StyledTh>Qty</StyledTh>
                <StyledTh>List Price</StyledTh>
                <StyledTh>Discount %</StyledTh>
                <StyledTh>Net Price</StyledTh>
                <StyledTh>Total</StyledTh>
                <StyledTh>Type</StyledTh>
                {isEditable && <StyledTh></StyledTh>}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <StyledTd>
                    {isEditable ? (
                      <StyledInput
                        type="text"
                        value={item.productName}
                        onChange={(event) =>
                          updateLineItem(item.id, 'productName', event.target.value)
                        }
                        placeholder="Product name"
                        style={{ width: 200 }}
                        aria-label="Product name"
                      />
                    ) : (
                      item.productName
                    )}
                  </StyledTd>
                  <StyledTd>
                    {isEditable ? (
                      <StyledInput
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          updateLineItem(item.id, 'quantity', Number(event.target.value))
                        }
                        min={1}
                        aria-label="Quantity"
                      />
                    ) : (
                      item.quantity
                    )}
                  </StyledTd>
                  <StyledTd>
                    {isEditable ? (
                      <StyledInput
                        type="number"
                        value={item.listPrice}
                        onChange={(event) =>
                          updateLineItem(item.id, 'listPrice', Number(event.target.value))
                        }
                        min={0}
                        step={0.01}
                        aria-label="List price"
                      />
                    ) : (
                      `$${item.listPrice.toLocaleString()}`
                    )}
                  </StyledTd>
                  <StyledTd>
                    {isEditable ? (
                      <StyledInput
                        type="number"
                        value={item.discountPercent}
                        onChange={(event) =>
                          updateLineItem(item.id, 'discountPercent', Number(event.target.value))
                        }
                        min={0}
                        max={100}
                        aria-label="Discount percent"
                      />
                    ) : (
                      `${item.discountPercent}%`
                    )}
                  </StyledTd>
                  <StyledTd>${item.netUnitPrice.toLocaleString()}</StyledTd>
                  <StyledTd>${item.netTotal.toLocaleString()}</StyledTd>
                  <StyledTd>
                    <span style={{ fontSize: 12 }}>
                      {item.billingType === 'recurring' ? '🔄' : '💳'}{' '}
                      {item.billingType.replace('_', ' ')}
                    </span>
                  </StyledTd>
                  {isEditable && (
                    <StyledTd>
                      <StyledRemoveButton
                        onClick={() => removeLineItem(item.id)}
                        aria-label={`Remove ${item.productName}`}
                      >
                        ×
                      </StyledRemoveButton>
                    </StyledTd>
                  )}
                </tr>
              ))}
            </tbody>
          </StyledTable>

          {isEditable && (
            <StyledButton onClick={addLineItem}>+ Add Product</StyledButton>
          )}

          <StyledSummary>
            <StyledSummaryRow>
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </StyledSummaryRow>
            {discountTotal > 0 && (
              <StyledSummaryRow>
                <span>Discount</span>
                <span>-${discountTotal.toLocaleString()}</span>
              </StyledSummaryRow>
            )}
            <StyledSummaryRow isTotal>
              <span>Grand Total</span>
              <span>${grandTotal.toLocaleString()}</span>
            </StyledSummaryRow>
          </StyledSummary>
        </>
      )}
    </StyledContainer>
  );
};
