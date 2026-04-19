import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';

import { useCpqPricing } from 'src/modules/cpq/hooks/use-cpq-pricing';

const StyledContainer = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--twentybackground-color-secondary);
`;

const StyledLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: var(--twentyfont-color-secondary);
  display: block;
  margin-bottom: 4px;
`;

const StyledInput = styled.input`
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  width: 120px;

  &:focus {
    outline: 2px solid var(--twentyfont-color-primary);
    border-color: transparent;
  }
`;

const StyledRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 12px;
`;

const StyledResult = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--twentyborder-color);
`;

const StyledAuditStep = styled.div`
  font-size: 12px;
  color: var(--twentyfont-color-tertiary);
  padding: 2px 0;
`;

const StyledCalculateButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--twentyborder-color);
  background: white;
  cursor: pointer;
  font-size: 14px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledError = styled.div`
  color: var(--twentycolor-red);
  font-size: 12px;
`;

const StyledResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const StyledResultRowLast = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const StyledNetUnitLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const StyledNetTotalLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const StyledNetTotalValue = styled.span`
  font-size: 16px;
  font-weight: 700;
`;

const StyledAuditSummary = styled.summary`
  font-size: 12px;
  cursor: pointer;
  color: var(--twentyfont-color-secondary);
`;

// Live pricing calculator component.
// Used in the quote builder to show real-time price calculations
// as the user adjusts quantity, discounts, or pricing model.
export const CpqPricingCalculator = () => {
  const { result, isCalculating, error, calculatePrice } = useCpqPricing();
  const [listPrice, setListPrice] = useState('100');
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);

  const handleCalculate = useCallback(() => {
    calculatePrice({
      listPrice,
      quantity,
      manualDiscountPercent: discountPercent || undefined,
    });
  }, [listPrice, quantity, discountPercent, calculatePrice]);

  return (
    <StyledContainer>
      <StyledLabel>Pricing Preview</StyledLabel>
      <StyledRow>
        <div>
          <StyledLabel htmlFor="cpq-list-price">List Price</StyledLabel>
          <StyledInput
            id="cpq-list-price"
            type="number"
            value={listPrice}
            onChange={(event) => setListPrice(event.target.value)}
            min={0}
            step={0.01}
          />
        </div>
        <div>
          <StyledLabel htmlFor="cpq-quantity">Qty</StyledLabel>
          <StyledInput
            id="cpq-quantity"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            min={1}
          />
        </div>
        <div>
          <StyledLabel htmlFor="cpq-discount">Discount %</StyledLabel>
          <StyledInput
            id="cpq-discount"
            type="number"
            value={discountPercent}
            onChange={(event) => setDiscountPercent(Number(event.target.value))}
            min={0}
            max={100}
          />
        </div>
        <StyledCalculateButton onClick={handleCalculate} disabled={isCalculating}>
          {isCalculating ? '...' : 'Calculate'}
        </StyledCalculateButton>
      </StyledRow>

      {error && <StyledError>{error}</StyledError>}

      {result && (
        <StyledResult>
          <StyledResultRow>
            <StyledNetUnitLabel>Net Unit Price</StyledNetUnitLabel>
            <StyledNetUnitLabel>${result.netUnitPrice}</StyledNetUnitLabel>
          </StyledResultRow>
          <StyledResultRowLast>
            <StyledNetTotalLabel>Net Total</StyledNetTotalLabel>
            <StyledNetTotalValue>${result.netTotal}</StyledNetTotalValue>
          </StyledResultRowLast>

          {result.auditSteps.length > 0 && (
            <details>
              <StyledAuditSummary>
                Pricing audit trail ({result.auditSteps.length} steps)
              </StyledAuditSummary>
              {result.auditSteps.map((step, index) => (
                <StyledAuditStep key={index}>
                  {step.ruleName}: ${step.inputPrice} → ${step.outputPrice}
                </StyledAuditStep>
              ))}
            </details>
          )}
        </StyledResult>
      )}
    </StyledContainer>
  );
};
