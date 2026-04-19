import { styled } from '@linaria/react';

export type LineItem = {
  id: string;
  product: string;
  quantity: number;
  listPrice: string;
  discountPercent: number;
  netPrice: string;
  netTotal: string;
};

type CpqLineItemTableProps = {
  lineItems: LineItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onDiscountChange: (id: string, discountPercent: number) => void;
  onRemove: (id: string) => void;
};

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const StyledThead = styled.thead`
  background: ${({ theme }) => theme.background.tertiary};
`;

const StyledTh = styled.th`
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: ${({ theme }) => theme.font.color.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.border.color.medium};
  white-space: nowrap;
`;

const StyledThRight = styled(StyledTh)`
  text-align: right;
`;

const StyledTbody = styled.tbody``;

const StyledTr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.border.color.light};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.background.secondary};
  }
`;

const StyledTd = styled.td`
  padding: 10px 12px;
  vertical-align: middle;
  color: ${({ theme }) => theme.font.color.primary};
`;

const StyledTdRight = styled(StyledTd)`
  text-align: right;
`;

const StyledProductName = styled.span`
  font-weight: 500;
`;

const StyledNumberInput = styled.input`
  width: 64px;
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: 14px;
  text-align: right;
  background: ${({ theme }) => theme.background.primary};
  color: ${({ theme }) => theme.font.color.primary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.blue};
  }
`;

const StyledRemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.font.color.tertiary};
  padding: 4px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.color.red};
    background: ${({ theme }) => theme.background.danger};
  }
`;

const StyledEmptyRow = styled.tr``;

const StyledEmptyCell = styled.td`
  padding: 24px 12px;
  text-align: center;
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: 14px;
`;

export const CpqLineItemTable = ({
  lineItems,
  onQuantityChange,
  onDiscountChange,
  onRemove,
}: CpqLineItemTableProps) => {
  return (
    <StyledTable>
      <StyledThead>
        <tr>
          <StyledTh>Product</StyledTh>
          <StyledThRight>Qty</StyledThRight>
          <StyledThRight>List Price</StyledThRight>
          <StyledThRight>Discount %</StyledThRight>
          <StyledThRight>Net Price</StyledThRight>
          <StyledThRight>Total</StyledThRight>
          <StyledTh />
        </tr>
      </StyledThead>
      <StyledTbody>
        {lineItems.length === 0 ? (
          <StyledEmptyRow>
            <StyledEmptyCell colSpan={7}>
              No products added yet. Search for a product above to get started.
            </StyledEmptyCell>
          </StyledEmptyRow>
        ) : (
          lineItems.map((item) => (
            <StyledTr key={item.id}>
              <StyledTd>
                <StyledProductName>{item.product}</StyledProductName>
              </StyledTd>
              <StyledTdRight>
                <StyledNumberInput
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    onQuantityChange(item.id, Number(e.target.value))
                  }
                />
              </StyledTdRight>
              <StyledTdRight>{item.listPrice}</StyledTdRight>
              <StyledTdRight>
                <StyledNumberInput
                  type="number"
                  min={0}
                  max={100}
                  value={item.discountPercent}
                  onChange={(e) =>
                    onDiscountChange(item.id, Number(e.target.value))
                  }
                />
              </StyledTdRight>
              <StyledTdRight>{item.netPrice}</StyledTdRight>
              <StyledTdRight>{item.netTotal}</StyledTdRight>
              <StyledTd>
                <StyledRemoveButton
                  onClick={() => onRemove(item.id)}
                  title="Remove line item"
                >
                  ×
                </StyledRemoveButton>
              </StyledTd>
            </StyledTr>
          ))
        )}
      </StyledTbody>
    </StyledTable>
  );
};
