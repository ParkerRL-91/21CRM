import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { v4 as uuidv4 } from 'uuid';

import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useCpqPricing } from '@/cpq/hooks/use-cpq-pricing';
import { cpqQuoteLineItemsState, type CpqLineItem } from '@/cpq/states/cpqQuoteLineItemsState';
import { cpqQuoteStatusState, type CpqQuoteStatus } from '@/cpq/states/cpqQuoteStatusState';
import { cpqQuoteTotalsState } from '@/cpq/states/cpqQuoteTotalsState';

// ─── Styled Components ───────────────────────────────────────────────────────

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const StyledTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  background: ${themeCssVariables.background.primary};
`;

const StyledTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const StyledActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const StyledStatusBadge = styled.span<{ quoteStatus: CpqQuoteStatus }>`
  padding: 4px 10px;
  border-radius: ${themeCssVariables.border.radius.pill};
  font-size: 12px;
  font-weight: 500;
  background: ${({ quoteStatus }) => {
    if (quoteStatus === 'accepted') return themeCssVariables.color.green;
    if (quoteStatus === 'rejected') return themeCssVariables.color.red;
    if (quoteStatus === 'sent') return themeCssVariables.color.blue;
    return themeCssVariables.background.tertiary;
  }};
  color: ${({ quoteStatus }) =>
    quoteStatus === 'draft'
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.inverted};
`;

const StyledButton = styled.button`
  padding: 8px 16px;
  border-radius: ${themeCssVariables.border.radius.sm};
  border: 1px solid ${themeCssVariables.border.color.medium};
  background: ${themeCssVariables.background.primary};
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledPrimaryButton = styled.button`
  padding: 8px 16px;
  border-radius: ${themeCssVariables.border.radius.sm};
  border: none;
  background: ${themeCssVariables.color.blue};
  color: ${themeCssVariables.font.color.inverted};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const StyledSection = styled.div`
  margin-bottom: 32px;
`;

const StyledSectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const StyledProductSearch = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const StyledSearchInput = styled.input`
  flex: 1;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: 8px 12px;
  font-size: 14px;

  &:focus {
    outline: 2px solid ${themeCssVariables.color.blue};
    border-color: transparent;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid ${themeCssVariables.border.color.medium};
  font-size: 12px;
  font-weight: 600;
  color: ${themeCssVariables.font.color.secondary};
`;

const StyledTd = styled.td`
  padding: 10px 12px;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  vertical-align: middle;
`;

const StyledInlineInput = styled.input`
  border: 1px solid transparent;
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: 4px 8px;
  font-size: 14px;
  width: 80px;
  text-align: right;

  &:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }

  &:focus {
    outline: 2px solid ${themeCssVariables.color.blue};
    border-color: transparent;
  }
`;

const StyledRemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 16px;
  padding: 2px 6px;

  &:hover {
    color: ${themeCssVariables.color.red};
  }
`;

const StyledTotalsPanel = styled.div`
  margin-left: auto;
  width: 320px;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: 16px;
  background: ${themeCssVariables.background.secondary};
`;

const StyledTotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
`;

const StyledGrandTotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0 0;
  margin-top: 8px;
  border-top: 2px solid ${themeCssVariables.border.color.medium};
  font-size: 16px;
  font-weight: 700;
`;

const StyledEmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 14px;
`;

// ─── Component ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CpqQuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

// Quote builder page — create and edit CPQ quotes with real-time pricing.
// Line item state lives in Jotai; server data flows through Apollo mutations.
export const QuoteBuilderPage = () => {
  const { id } = useParams<{ id?: string }>();
  const isNewQuote = !id;

  const [lineItems, setLineItems] = useAtomState(cpqQuoteLineItemsState);
  const [status, setStatus] = useAtomState(cpqQuoteStatusState);
  const totals = useAtomStateValue(cpqQuoteTotalsState);
  const [, setTotals] = useAtomState(cpqQuoteTotalsState);

  const { calculatePrice, isCalculating } = useCpqPricing();

  const [productSearchQuery, setProductSearchQuery] = useState('');

  const recomputeTotals = useCallback((items: CpqLineItem[]) => {
    const subtotal = items
      .reduce((sum, item) => sum + parseFloat(item.netTotal || '0'), 0)
      .toFixed(2);
    const listTotal = items
      .reduce(
        (sum, item) =>
          sum + parseFloat(item.listPrice) * item.quantity,
        0,
      )
      .toFixed(2);
    const totalDiscount = (parseFloat(listTotal) - parseFloat(subtotal)).toFixed(2);

    setTotals({
      subtotal,
      totalDiscount,
      grandTotal: subtotal,
    });
  }, [setTotals]);

  const handleAddProduct = useCallback(async () => {
    if (!productSearchQuery.trim()) return;

    const newItem: CpqLineItem = {
      id: uuidv4(),
      productName: productSearchQuery.trim(),
      listPrice: '100.00',
      quantity: 1,
      discountPercent: 0,
      netUnitPrice: '100.00',
      netTotal: '100.00',
    };

    const pricingResult = await calculatePrice({
      listPrice: newItem.listPrice,
      quantity: newItem.quantity,
    });

    if (pricingResult) {
      newItem.netUnitPrice = pricingResult.netUnitPrice;
      newItem.netTotal = pricingResult.netTotal;
    }

    const updated = [...lineItems, newItem];
    setLineItems(updated);
    recomputeTotals(updated);
    setProductSearchQuery('');
  }, [productSearchQuery, lineItems, setLineItems, calculatePrice, recomputeTotals]);

  const handleQuantityChange = useCallback(
    async (itemId: string, newQuantity: number) => {
      const item = lineItems.find((li) => li.id === itemId);
      if (!item) return;

      const pricingResult = await calculatePrice({
        listPrice: item.listPrice,
        quantity: newQuantity,
        manualDiscountPercent: item.discountPercent || undefined,
      });

      const updated = lineItems.map((li) =>
        li.id === itemId
          ? {
              ...li,
              quantity: newQuantity,
              netUnitPrice: pricingResult?.netUnitPrice ?? li.netUnitPrice,
              netTotal: pricingResult?.netTotal ?? li.netTotal,
            }
          : li,
      );
      setLineItems(updated);
      recomputeTotals(updated);
    },
    [lineItems, setLineItems, calculatePrice, recomputeTotals],
  );

  const handleDiscountChange = useCallback(
    async (itemId: string, newDiscount: number) => {
      const item = lineItems.find((li) => li.id === itemId);
      if (!item) return;

      const pricingResult = await calculatePrice({
        listPrice: item.listPrice,
        quantity: item.quantity,
        manualDiscountPercent: newDiscount || undefined,
      });

      const updated = lineItems.map((li) =>
        li.id === itemId
          ? {
              ...li,
              discountPercent: newDiscount,
              netUnitPrice: pricingResult?.netUnitPrice ?? li.netUnitPrice,
              netTotal: pricingResult?.netTotal ?? li.netTotal,
            }
          : li,
      );
      setLineItems(updated);
      recomputeTotals(updated);
    },
    [lineItems, setLineItems, calculatePrice, recomputeTotals],
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      const updated = lineItems.filter((li) => li.id !== itemId);
      setLineItems(updated);
      recomputeTotals(updated);
    },
    [lineItems, setLineItems, recomputeTotals],
  );

  const handleSave = useCallback(() => {
    // Persist quote — will wire to Apollo mutation once Quote object exists
    console.log('Saving quote', { id, lineItems, status, totals });
  }, [id, lineItems, status, totals]);

  const handleSubmit = useCallback(() => {
    setStatus('sent');
    handleSave();
  }, [setStatus, handleSave]);

  return (
    <StyledPage>
      <StyledTopBar>
        <StyledTitle>
          {isNewQuote ? 'New Quote' : `Quote #${id}`}
        </StyledTitle>
        <StyledActions>
          <StyledStatusBadge quoteStatus={status}>
            {STATUS_LABELS[status]}
          </StyledStatusBadge>
          <StyledButton onClick={handleSave} disabled={isCalculating}>
            Save
          </StyledButton>
          {status === 'draft' && (
            <StyledPrimaryButton onClick={handleSubmit} disabled={isCalculating}>
              Send Quote
            </StyledPrimaryButton>
          )}
        </StyledActions>
      </StyledTopBar>

      <StyledContent>
        <StyledSection>
          <StyledSectionTitle>Add Products</StyledSectionTitle>
          <StyledProductSearch>
            <StyledSearchInput
              type="text"
              placeholder="Product name..."
              value={productSearchQuery}
              onChange={(event) => setProductSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleAddProduct();
                }
              }}
            />
            <StyledButton
              onClick={handleAddProduct}
              disabled={isCalculating || !productSearchQuery.trim()}
            >
              {isCalculating ? 'Calculating...' : 'Add'}
            </StyledButton>
          </StyledProductSearch>
        </StyledSection>

        <StyledSection>
          <StyledSectionTitle>Line Items</StyledSectionTitle>
          {lineItems.length === 0 ? (
            <StyledEmptyState>
              No products added yet. Search above to add your first line item.
            </StyledEmptyState>
          ) : (
            <StyledTable>
              <thead>
                <tr>
                  <StyledTh>Product</StyledTh>
                  <StyledTh>List Price</StyledTh>
                  <StyledTh>Qty</StyledTh>
                  <StyledTh>Discount %</StyledTh>
                  <StyledTh>Net Unit</StyledTh>
                  <StyledTh>Net Total</StyledTh>
                  <StyledTh></StyledTh>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id}>
                    <StyledTd>{item.productName}</StyledTd>
                    <StyledTd>${item.listPrice}</StyledTd>
                    <StyledTd>
                      <StyledInlineInput
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={(event) =>
                          handleQuantityChange(
                            item.id,
                            Math.max(1, Number(event.target.value)),
                          )
                        }
                      />
                    </StyledTd>
                    <StyledTd>
                      <StyledInlineInput
                        type="number"
                        value={item.discountPercent}
                        min={0}
                        max={100}
                        onChange={(event) =>
                          handleDiscountChange(
                            item.id,
                            Number(event.target.value),
                          )
                        }
                      />
                    </StyledTd>
                    <StyledTd>${item.netUnitPrice}</StyledTd>
                    <StyledTd>${item.netTotal}</StyledTd>
                    <StyledTd>
                      <StyledRemoveButton
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label={`Remove ${item.productName}`}
                      >
                        ×
                      </StyledRemoveButton>
                    </StyledTd>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          )}
        </StyledSection>

        {lineItems.length > 0 && (
          <StyledTotalsPanel>
            <StyledTotalRow>
              <span>Subtotal</span>
              <span>${totals.subtotal}</span>
            </StyledTotalRow>
            <StyledTotalRow>
              <span>Total Discount</span>
              <span>-${totals.totalDiscount}</span>
            </StyledTotalRow>
            <StyledGrandTotalRow>
              <span>Grand Total</span>
              <span>${totals.grandTotal}</span>
            </StyledGrandTotalRow>
          </StyledTotalsPanel>
        )}
      </StyledContent>
    </StyledPage>
  );
};
