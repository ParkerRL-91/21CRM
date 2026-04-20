import { styled } from '@linaria/react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';

const StyledContainer = styled.div`
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
`;

const DEMO_CONTRACTS = [
  { id: 'CTR-2024-001', account: "BC Children's Hospital", arr: '$142,000', status: 'Active', endDate: '2027-03-31', subscriptions: 3 },
  { id: 'CTR-2024-002', account: 'SickKids Toronto', arr: '$215,000', status: 'Active', endDate: '2027-06-01', subscriptions: 5 },
  { id: 'CTR-2025-003', account: 'Mayo Clinic', arr: '$87,200', status: 'Active', endDate: '2026-04-01', subscriptions: 2 },
  { id: 'CTR-2025-004', account: 'Great Ormond Street', arr: '$28,500', status: 'Renewing', endDate: '2026-05-30', subscriptions: 1 },
  { id: 'CTR-2023-005', account: 'Regional Medical Center', arr: '$12,000', status: 'Expired', endDate: '2026-03-31', subscriptions: 1 },
];

export const ContractManagementPage = () => (
  <SubMenuTopBarContainer
    title="Contracts"
    links={[{ children: 'CPQ', href: '/cpq' }, { children: 'Contracts' }]}
  >
    <StyledContainer>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--twenty-font-color-primary, #111827)' }}>
          Active Contracts — {DEMO_CONTRACTS.filter(c => c.status === 'Active').length} active, {DEMO_CONTRACTS.filter(c => c.status === 'Renewing').length} renewing
        </h2>
        <button style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          + New Contract
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid var(--twenty-border-color, #e5e7eb)', borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: 'var(--twenty-background-secondary, #f9fafb)' }}>
            {['Contract ID', 'Account', 'ARR', 'Status', 'End Date', 'Subscriptions'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--twenty-font-color-secondary, #6b7280)', borderBottom: '1px solid var(--twenty-border-color, #e5e7eb)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEMO_CONTRACTS.map(c => (
            <tr key={c.id} style={{ cursor: 'pointer' }}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--twenty-border-color, #e5e7eb)', fontFamily: 'monospace', fontSize: 11, color: 'var(--twenty-font-color-secondary, #6b7280)' }}>{c.id}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--twenty-border-color, #e5e7eb)', fontWeight: 500, color: 'var(--twenty-font-color-primary, #111827)' }}>{c.account}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--twenty-border-color, #e5e7eb)', fontWeight: 600, color: 'var(--twenty-font-color-primary, #111827)' }}>{c.arr}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--twenty-border-color, #e5e7eb)' }}>
                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.status === 'Active' ? '#f0fdf4' : c.status === 'Renewing' ? '#eff6ff' : '#fee2e2', color: c.status === 'Active' ? '#166534' : c.status === 'Renewing' ? '#1d4ed8' : '#991b1b' }}>{c.status}</span>
              </td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--twenty-border-color, #e5e7eb)', color: new Date(c.endDate) < new Date() ? '#991b1b' : 'inherit' }}>{c.endDate}</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--twenty-border-color, #e5e7eb)' }}>{c.subscriptions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </StyledContainer>
  </SubMenuTopBarContainer>
);
