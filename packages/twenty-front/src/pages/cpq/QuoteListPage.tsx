import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@linaria/react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
`;

const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const StyledSearch = styled.input`
  padding: 8px 14px;
  border: 1px solid var(--t-border-color-medium);
  border-radius: 6px;
  font-size: 13px;
  width: 280px;
  background: var(--t-background-primary);
  color: var(--t-font-color-primary);

  &::placeholder {
    color: var(--t-font-color-secondary);
  }

  &:focus {
    outline: 2px solid #3b82f6;
    border-color: transparent;
  }
`;

const StyledNewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.88;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--t-font-color-secondary);
  background: var(--t-background-secondary);
  border-bottom: 1px solid var(--t-border-color-medium);
`;

const StyledTd = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid var(--t-border-color-medium);
  color: var(--t-font-color-primary);

  &:last-child {
    border-bottom: 0;
  }
`;

const StyledTr = styled.tr`
  cursor: pointer;
  transition: background 0.1s;

  &:hover td {
    background: var(--t-background-transparent-primary));
  }
`;

const StyledStatusBadge = styled.span<{
  status: 'draft' | 'sent' | 'approved' | 'expired' | 'won' | 'lost';
}>`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ status }) =>
    status === 'draft'
      ? '#f3f4f6'
      : status === 'sent'
        ? '#eff6ff'
        : status === 'approved' || status === 'won'
          ? '#f0fdf4'
          : status === 'expired' || status === 'lost'
            ? '#fee2e2'
            : '#f3f4f6'};
  color: ${({ status }) =>
    status === 'draft'
      ? '#6b7280'
      : status === 'sent'
        ? '#1d4ed8'
        : status === 'approved' || status === 'won'
          ? '#166534'
          : status === 'expired' || status === 'lost'
            ? '#991b1b'
            : '#6b7280'};
`;

const StyledAmountCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid var(--t-border-color-medium);
  font-weight: 600;
  color: var(--t-font-color-primary);
  font-variant-numeric: tabular-nums;
`;

const DEMO_QUOTES = [
  {
    id: 'QTE-2026-0001',
    name: 'PhenoTips Clinical Suite — BC Children\'s Hospital',
    customer: 'BC Children\'s Hospital',
    owner: 'Sarah Kim',
    amount: '$142,000',
    status: 'sent' as const,
    validUntil: '2026-05-15',
    term: '3 years',
  },
  {
    id: 'QTE-2026-0002',
    name: 'Analytics Add-on — Great Ormond Street',
    customer: 'Great Ormond Street Hospital',
    owner: 'Marcus Torres',
    amount: '$28,500',
    status: 'draft' as const,
    validUntil: '2026-05-30',
    term: '1 year',
  },
  {
    id: 'QTE-2026-0003',
    name: 'Enterprise Renewal — SickKids',
    customer: 'The Hospital for Sick Children',
    owner: 'Marcus Torres',
    amount: '$215,000',
    status: 'approved' as const,
    validUntil: '2026-06-01',
    term: '3 years',
  },
  {
    id: 'QTE-2026-0004',
    name: 'Premium Support Bundle — Mayo Clinic',
    customer: 'Mayo Clinic',
    owner: 'Sarah Kim',
    amount: '$87,200',
    status: 'won' as const,
    validUntil: '2026-04-01',
    term: '2 years',
  },
  {
    id: 'QTE-2026-0005',
    name: 'Starter Package — Regional Medical Center',
    customer: 'Regional Medical Center',
    owner: 'Marcus Torres',
    amount: '$12,000',
    status: 'expired' as const,
    validUntil: '2026-03-31',
    term: '1 year',
  },
];

// Quote list page — shows all quotes with status, amount, and quick actions.
// Navigates to the builder for new quotes.
export const QuoteListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = DEMO_QUOTES.filter(
    (q) =>
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.customer.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SubMenuTopBarContainer
      title="Quotes"
      links={[
        { children: 'CPQ', href: '/cpq' },
        { children: 'Quotes' },
      ]}
    >
      <StyledContainer>
        <StyledToolbar>
          <StyledSearch
            placeholder="Search quotes by name, ID, or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <StyledNewButton onClick={() => navigate('/cpq/quotes/new')}>
            + New Quote
          </StyledNewButton>
        </StyledToolbar>

        <StyledTable>
          <thead>
            <tr>
              <StyledTh>Quote ID</StyledTh>
              <StyledTh>Name</StyledTh>
              <StyledTh>Customer</StyledTh>
              <StyledTh>Owner</StyledTh>
              <StyledTh>Term</StyledTh>
              <StyledTh>Amount</StyledTh>
              <StyledTh>Status</StyledTh>
              <StyledTh>Valid Until</StyledTh>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quote) => (
              <StyledTr
                key={quote.id}
                onClick={() => navigate(`/cpq/quotes/${quote.id}`)}
              >
                <StyledTd>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: 'var(--t-font-color-secondary)',
                    }}
                  >
                    {quote.id}
                  </span>
                </StyledTd>
                <StyledTd>
                  <div style={{ fontWeight: 500 }}>{quote.name}</div>
                </StyledTd>
                <StyledTd>{quote.customer}</StyledTd>
                <StyledTd>{quote.owner}</StyledTd>
                <StyledTd>{quote.term}</StyledTd>
                <StyledAmountCell>{quote.amount}</StyledAmountCell>
                <StyledTd>
                  <StyledStatusBadge status={quote.status}>
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </StyledStatusBadge>
                </StyledTd>
                <StyledTd
                  style={{
                    color:
                      new Date(quote.validUntil) < new Date()
                        ? '#991b1b'
                        : 'inherit',
                  }}
                >
                  {quote.validUntil}
                </StyledTd>
              </StyledTr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <StyledTd
                  colSpan={8}
                  style={{ textAlign: 'center', color: '#6b7280', padding: 32 }}
                >
                  No quotes match your search.
                </StyledTd>
              </tr>
            )}
          </tbody>
        </StyledTable>
      </StyledContainer>
    </SubMenuTopBarContainer>
  );
};
