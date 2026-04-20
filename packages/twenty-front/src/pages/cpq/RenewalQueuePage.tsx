import { styled } from '@linaria/react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';

const StyledContainer = styled.div`
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
`;

const RENEWAL_QUEUE = [
  { id: 'CTR-2024-001', account: "BC Children's Hospital", arr: '$142,000', daysLeft: 18, urgency: 'high' as const, owner: 'Sarah Kim' },
  { id: 'CTR-2024-002', account: 'SickKids Toronto', arr: '$215,000', daysLeft: 32, urgency: 'high' as const, owner: 'Marcus Torres' },
  { id: 'CTR-2025-003', account: 'Mayo Clinic', arr: '$87,200', daysLeft: 58, urgency: 'medium' as const, owner: 'Sarah Kim' },
  { id: 'CTR-2025-004', account: 'Great Ormond Street', arr: '$28,500', daysLeft: 61, urgency: 'medium' as const, owner: 'Marcus Torres' },
];

const URGENCY_COLORS = {
  high: { bg: '#fee2e2', color: '#991b1b', label: 'Urgent' },
  medium: { bg: '#fef9c3', color: '#92400e', label: 'Due Soon' },
  low: { bg: '#f0fdf4', color: '#166534', label: 'On Track' },
};

export const RenewalQueuePage = () => (
  <SubMenuTopBarContainer
    title="Renewal Queue"
    links={[{ children: 'CPQ', href: '/cpq' }, { children: 'Renewals' }]}
  >
    <StyledContainer>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--t-font-color-primary)' }}>
          Renewal Queue — {RENEWAL_QUEUE.length} contracts expiring within 90 days
        </h2>
        <button style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          Run Renewal Job
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid var(--t-border-color-medium)', borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: 'var(--t-background-secondary)' }}>
            {['Contract', 'Account', 'ARR', 'Days Left', 'Urgency', 'Owner', 'Action'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--t-font-color-secondary)', borderBottom: '1px solid var(--t-border-color-medium)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RENEWAL_QUEUE.map(r => {
            const urg = URGENCY_COLORS[r.urgency];
            return (
              <tr key={r.id}>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border-color-medium)', fontFamily: 'monospace', fontSize: 11, color: 'var(--t-font-color-secondary)' }}>{r.id}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border-color-medium)', fontWeight: 500, color: 'var(--t-font-color-primary)' }}>{r.account}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border-color-medium)', fontWeight: 600 }}>{r.arr}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border-color-medium)', fontWeight: 700, color: r.daysLeft <= 30 ? '#991b1b' : r.daysLeft <= 60 ? '#92400e' : '#166534' }}>{r.daysLeft}d</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border-color-medium)' }}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: urg.bg, color: urg.color }}>{urg.label}</span>
                </td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border-color-medium)', color: 'var(--t-font-color-secondary)' }}>{r.owner}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border-color-medium)' }}>
                  <button style={{ padding: '4px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Start Renewal</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </StyledContainer>
  </SubMenuTopBarContainer>
);
