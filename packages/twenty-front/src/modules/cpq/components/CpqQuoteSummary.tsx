import { styled } from '@linaria/react';

type CpqQuoteSummaryProps = {
  subtotal: string;
  totalDiscount: string;
  grandTotal: string;
};

const StyledSummaryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  padding: 16px 0;
  border-top: 2px solid ${({ theme }) => theme.border.color.medium};
  margin-top: 8px;
`;

const StyledRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 280px;
  font-size: 14px;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledGrandTotalRow = styled(StyledRow)`
  font-weight: 600;
  font-size: 16px;
  color: ${({ theme }) => theme.font.color.primary};
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => theme.border.color.medium};
  margin-top: 4px;
`;

const StyledDiscountRow = styled(StyledRow)`
  color: ${({ theme }) => theme.color.green};
`;

const StyledLabel = styled.span``;

const StyledValue = styled.span``;

export const CpqQuoteSummary = ({
  subtotal,
  totalDiscount,
  grandTotal,
}: CpqQuoteSummaryProps) => {
  return (
    <StyledSummaryContainer>
      <StyledRow>
        <StyledLabel>Subtotal</StyledLabel>
        <StyledValue>{subtotal}</StyledValue>
      </StyledRow>
      <StyledDiscountRow>
        <StyledLabel>Total Discount</StyledLabel>
        <StyledValue>-{totalDiscount}</StyledValue>
      </StyledDiscountRow>
      <StyledGrandTotalRow>
        <StyledLabel>Grand Total</StyledLabel>
        <StyledValue>{grandTotal}</StyledValue>
      </StyledGrandTotalRow>
    </StyledSummaryContainer>
  );
};
