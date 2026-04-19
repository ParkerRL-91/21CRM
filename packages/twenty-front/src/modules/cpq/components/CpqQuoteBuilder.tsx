import { useState } from 'react';
import { styled } from '@linaria/react';
import { useAtom } from 'jotai';
import { atom } from 'jotai';

import { useCpqQuoteBuilder } from 'src/modules/cpq/hooks/use-cpq-quote-builder';
import { CpqLineItemTable } from 'src/modules/cpq/components/CpqLineItemTable';
import { CpqQuoteSummary } from 'src/modules/cpq/components/CpqQuoteSummary';

// Local UI state atoms
const productSearchAtom = atom('');

type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

type CpqQuoteBuilderProps = {
  quoteId?: string;
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'gray',
  pending_approval: 'yellow',
  approved: 'green',
  rejected: 'red',
};

const StyledPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }

  @media (max-width: 375px) {
    padding: 12px;
    gap: 12px;
  }
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StyledTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.primary};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const StyledStatusBadge = styled.span<{ statusColor: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ statusColor, theme }) => {
    if (statusColor === 'green') {
      return theme.color.green20;
    }
    if (statusColor === 'yellow') {
      return theme.color.yellow20;
    }
    if (statusColor === 'red') {
      return theme.color.red20;
    }
    return theme.background.tertiary;
  }};
  color: ${({ statusColor, theme }) => {
    if (statusColor === 'green') {
      return theme.color.green;
    }
    if (statusColor === 'yellow') {
      return theme.color.yellow;
    }
    if (statusColor === 'red') {
      return theme.color.red;
    }
    return theme.font.color.secondary;
  }};
`;

const StyledCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.background.primary};
  overflow: hidden;
`;

const StyledCardHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledCardBody = styled.div`
  padding: 20px;
`;

const StyledProductSearchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }

  @media (max-width: 375px) {
    flex-direction: column;
  }
`;

const StyledSearchInput = styled.input`
  flex: 1;
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  font-size: 14px;
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};

  &::placeholder {
    color: ${({ theme }) => theme.font.color.tertiary};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
  }
`;

const StyledAddButton = styled.button`
  padding: 8px 20px;
  background: ${({ theme }) => theme.color.blue};
  color: ${({ theme }) => theme.font.color.inverted};
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledTableWrapper = styled.div`
  overflow-x: auto;

  @media (max-width: 768px) {
    margin: 0 -20px;
    padding: 0 20px;
  }
`;

const StyledSummaryWrapper = styled.div`
  padding: 0 20px 20px;
`;

const StyledActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: stretch;
  }

  @media (max-width: 375px) {
    flex-direction: column;
  }
`;

const StyledSecondaryButton = styled.button`
  padding: 8px 20px;
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.background.secondary};
  }

  @media (max-width: 375px) {
    width: 100%;
  }
`;

const StyledPrimaryButton = styled.button`
  padding: 8px 20px;
  background: ${({ theme }) => theme.color.blue};
  color: ${({ theme }) => theme.font.color.inverted};
  border: none;
  border-radius: ${({ theme }) => theme.border.radius.md};
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

  @media (max-width: 375px) {
    width: 100%;
  }
`;

export const CpqQuoteBuilder = ({ quoteId }: CpqQuoteBuilderProps) => {
  const [productSearch, setProductSearch] = useAtom(productSearchAtom);
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('draft');

  const {
    lineItems,
    subtotal,
    totalDiscount,
    grandTotal,
    addLineItem,
    updateQuantity,
    updateDiscount,
    removeLineItem,
  } = useCpqQuoteBuilder();

  const handleAddProduct = async () => {
    if (!productSearch.trim()) {
      return;
    }
    await addLineItem(productSearch.trim());
    setProductSearch('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddProduct();
    }
  };

  const handleSaveDraft = () => {
    setQuoteStatus('draft');
    // TODO: persist quote via mutation
  };

  const handleSubmitForApproval = () => {
    setQuoteStatus('pending_approval');
    // TODO: persist quote and trigger approval workflow
  };

  const isNewQuote = !quoteId;

  return (
    <StyledPageContainer>
      <StyledHeader>
        <StyledTitle>{isNewQuote ? 'New Quote' : 'Edit Quote'}</StyledTitle>
        <StyledStatusBadge statusColor={STATUS_COLORS[quoteStatus]}>
          {STATUS_LABELS[quoteStatus]}
        </StyledStatusBadge>
      </StyledHeader>

      <StyledCard>
        <StyledCardHeader>Add Products</StyledCardHeader>
        <StyledCardBody>
          <StyledProductSearchRow>
            <StyledSearchInput
              type="text"
              placeholder="Search for a product by name..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <StyledAddButton
              onClick={handleAddProduct}
              disabled={!productSearch.trim()}
            >
              Add Product
            </StyledAddButton>
          </StyledProductSearchRow>
        </StyledCardBody>
      </StyledCard>

      <StyledCard>
        <StyledCardHeader>Line Items</StyledCardHeader>
        <StyledTableWrapper>
          <CpqLineItemTable
            lineItems={lineItems}
            onQuantityChange={updateQuantity}
            onDiscountChange={updateDiscount}
            onRemove={removeLineItem}
          />
        </StyledTableWrapper>
        <StyledSummaryWrapper>
          <CpqQuoteSummary
            subtotal={subtotal}
            totalDiscount={totalDiscount}
            grandTotal={grandTotal}
          />
        </StyledSummaryWrapper>
      </StyledCard>

      <StyledActions>
        <StyledSecondaryButton onClick={handleSaveDraft}>
          Save Draft
        </StyledSecondaryButton>
        <StyledPrimaryButton
          onClick={handleSubmitForApproval}
          disabled={lineItems.length === 0}
        >
          Submit for Approval
        </StyledPrimaryButton>
      </StyledActions>
    </StyledPageContainer>
  );
};
