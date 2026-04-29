import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';

import { useCpqPricing } from '@/cpq/hooks/use-cpq-pricing';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

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

  @media (max-width: 480px) {
    width: 100%;
    box-sizing: border-box;
  }
`;

const StyledRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 12px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
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

// Live pricing calculator component.
// Used in the quote builder to show real-time price calculations
// as the user adjusts quantity, discounts, or pricing model.
export const CpqPricingCalculator = () => {
  const { result, isCalculating, error, calculatePrice } = useCpqPricing();
  const { enqueueErrorSnackBar } = useSnackBar();
  const [listPrice, setListPrice] = useState('100');
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);

  const handleCalculate = useCallback(async () => {
    const calcResult = await calculatePrice({
      listPrice,
      quantity,
      manualDiscountPercent: discountPercent || undefined,
    });
    if (!calcResult && error) {
      enqueueErrorSnackBar({ message: error });
    }
  }, [listPrice, quantity, discountPercent, calculatePrice, error, enqueueErrorSnackBar]);

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
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: '1px solid var(--twentyborder-color)',
            background: 'white',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {isCalculating ? 'Calculating price…' : 'Calculate'}
        </button>
      </StyledRow>

      {error && (
        <div style={{ color: 'var(--twentycolor-red)', fontSize: 12 }}>{error}</div>
      )}

      {result && (
        <StyledResult>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Net Unit Price</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>${result.netUnitPrice}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Net Total</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>${result.netTotal}</span>
          </div>

          {result.auditSteps.length > 0 && (
            <details>
              <summary style={{ fontSize: 12, cursor: 'pointer', color: 'var(--twentyfont-color-secondary)' }}>
                Pricing audit trail ({result.auditSteps.length} steps)
              </summary>
              {result.auditSteps.map((step: { ruleName: string; inputPrice: string; outputPrice: string }, index: number) => (
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
