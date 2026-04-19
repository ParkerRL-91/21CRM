import { useCallback, useState } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useCpqPricing } from '@/cpq/hooks/use-cpq-pricing';
import { type PricingAuditStep } from '@/cpq/hooks/use-cpq-pricing';

const StyledContainer = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  padding: 16px;
  background: ${themeCssVariables.background.secondary};
`;

const StyledLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${themeCssVariables.font.color.secondary};
  display: block;
  margin-bottom: 4px;
`;

const StyledInput = styled.input`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: 8px 12px;
  font-size: 14px;
  width: 120px;

  &:focus {
    outline: 2px solid ${themeCssVariables.font.color.primary};
    border-color: transparent;
  }
`;

const StyledRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 12px;
`;

const StyledCalculateButton = styled.button`
  padding: 8px 16px;
  border-radius: ${themeCssVariables.border.radius.sm};
  border: 1px solid ${themeCssVariables.border.color.medium};
  background: ${themeCssVariables.background.primary};
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledResult = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${themeCssVariables.border.color.medium};
`;

const StyledPriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const StyledPriceLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
`;

const StyledNetTotal = styled.span`
  font-size: 16px;
  font-weight: 700;
`;

const StyledAuditSummary = styled.summary`
  font-size: 12px;
  cursor: pointer;
  color: ${themeCssVariables.font.color.secondary};
`;

const StyledAuditStep = styled.div`
  font-size: 12px;
  color: ${themeCssVariables.font.color.tertiary};
  padding: 2px 0;
`;

const StyledError = styled.div`
  color: ${themeCssVariables.color.red};
  font-size: 12px;
  margin-top: 8px;
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
            onChange={(event) =>
              setDiscountPercent(Number(event.target.value))
            }
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
          <StyledPriceRow>
            <StyledPriceLabel>Net Unit Price</StyledPriceLabel>
            <StyledPriceLabel>${result.netUnitPrice}</StyledPriceLabel>
          </StyledPriceRow>
          <StyledPriceRow>
            <StyledPriceLabel>Net Total</StyledPriceLabel>
            <StyledNetTotal>${result.netTotal}</StyledNetTotal>
          </StyledPriceRow>

          {result.auditSteps.length > 0 && (
            <details>
              <StyledAuditSummary>
                Pricing audit trail ({result.auditSteps.length} steps)
              </StyledAuditSummary>
              {result.auditSteps.map((step: PricingAuditStep, index: number) => (
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
