import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';
import {
  IconDownload,
  IconCopy,
  IconFilter,
  IconMail,
  IconCheck,
  IconFileInvoice,
} from '@tabler/icons-react';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type RenewalAction = 'outreach' | 'contacted' | 'create_quote';

type RenewalRowStatus =
  | 'new'
  | 'contacted'
  | 'outreach_sent'
  | 'quote_created';

type RenewalRow = {
  id: string;
  accountName: string;
  renewalDate: string;
  contractValue: number;
  riskScore: number;
  riskLevel: RiskLevel;
  daysUntilRenewal: number;
};

type RenewalRowWithActions = RenewalRow & {
  status?: RenewalRowStatus;
  lastContactedBy?: string;
  lastContactedAt?: string;
};

type ActionLogEntry = {
  id: string;
  renewalId: string;
  accountName: string;
  action: RenewalAction;
  performedBy: string;
  timestamp: Date;
};

type CpqRenewalDashboardProps = {
  renewals: RenewalRow[];
  onViewContract?: (id: string) => void;
  currentUser?: string;
};

const RISK_COLORS: Record<RiskLevel, { background: string; color: string }> = {
  low: {
    background: 'var(--twentycolor-green-light, #f0fdf4)',
    color: 'var(--twentycolor-green-dark, #166534)',
  },
  medium: {
    background: 'var(--twentycolor-yellow-light, #fef9c3)',
    color: 'var(--twentycolor-yellow-dark, #854d0e)',
  },
  high: {
    background: 'var(--twentycolor-orange-light, #fff7ed)',
    color: 'var(--twentycolor-orange-dark, #9a3412)',
  },
  critical: {
    background: 'var(--twentycolor-red-light, #fee2e2)',
    color: 'var(--twentycolor-red-dark, #991b1b)',
  },
};

type RiskFilterOption = 'all' | RiskLevel;

// Utility: export filtered renewal data as a CSV file
const exportToCSV = (data: RenewalRow[], filter: string) => {
  const headers = [
    'Account Name',
    'Renewal Date',
    'Contract Value',
    'Risk Score',
    'Risk Level',
    'Days Until Renewal',
  ];
  const rows = data.map((row) => [
    row.accountName,
    row.renewalDate,
    row.contractValue.toFixed(2),
    row.riskScore.toString(),
    row.riskLevel,
    row.daysUntilRenewal.toString(),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.download = `renewals-${date}-${filter}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

// Utility: copy table data as tab-separated text to clipboard
const copyTableToClipboard = (data: RenewalRow[]) => {
  const headers = [
    'Account Name',
    'Renewal Date',
    'Contract Value',
    'Risk Score',
    'Risk Level',
    'Days Until Renewal',
  ];
  const rows = data.map((row) =>
    [
      row.accountName,
      row.renewalDate,
      row.contractValue.toFixed(2),
      row.riskScore,
      row.riskLevel,
      row.daysUntilRenewal,
    ].join('\t'),
  );
  const text = [headers.join('\t'), ...rows].join('\n');
  navigator.clipboard.writeText(text);
};

// Sample data so the dashboard is usable out of the box
const SAMPLE_RENEWALS: RenewalRow[] = [
  {
    id: 'ren-001',
    accountName: 'Acme Corp',
    renewalDate: '2026-06-15',
    contractValue: 48000,
    riskScore: 22,
    riskLevel: 'low',
    daysUntilRenewal: 47,
  },
  {
    id: 'ren-002',
    accountName: 'Globex Industries',
    renewalDate: '2026-05-28',
    contractValue: 125000,
    riskScore: 55,
    riskLevel: 'medium',
    daysUntilRenewal: 29,
  },
  {
    id: 'ren-003',
    accountName: 'Initech LLC',
    renewalDate: '2026-05-10',
    contractValue: 72000,
    riskScore: 78,
    riskLevel: 'high',
    daysUntilRenewal: 11,
  },
  {
    id: 'ren-004',
    accountName: 'Umbrella Corp',
    renewalDate: '2026-05-05',
    contractValue: 210000,
    riskScore: 91,
    riskLevel: 'critical',
    daysUntilRenewal: 6,
  },
  {
    id: 'ren-005',
    accountName: 'Stark Enterprises',
    renewalDate: '2026-07-20',
    contractValue: 340000,
    riskScore: 12,
    riskLevel: 'low',
    daysUntilRenewal: 82,
  },
  {
    id: 'ren-006',
    accountName: 'Wayne Industries',
    renewalDate: '2026-06-01',
    contractValue: 95000,
    riskScore: 63,
    riskLevel: 'medium',
    daysUntilRenewal: 33,
  },
  {
    id: 'ren-007',
    accountName: 'Oscorp',
    renewalDate: '2026-05-18',
    contractValue: 58000,
    riskScore: 85,
    riskLevel: 'critical',
    daysUntilRenewal: 19,
  },
];

// --- Styled components ---

const StyledDashboard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StyledMetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMetricCard = styled.div`
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);
`;

const StyledMetricLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--twentyfont-color-secondary);
  margin-bottom: 6px;
`;

const StyledMetricValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: var(--twentyfont-color-primary);
`;

const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const StyledFilterSelect = styled.select`
  appearance: none;
  padding: 6px 30px 6px 10px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--twentyfont-color-primary);
  background: var(--twentybackground-color-primary);
  cursor: pointer;

  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;

  &:focus {
    outline: 2px solid var(--twentycolor-blue, #3b82f6);
    border-color: transparent;
  }
`;

const StyledActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--twentyfont-color-primary);
  background: var(--twentybackground-color-primary);
  cursor: pointer;

  &:hover {
    background: var(--twentybackground-color-secondary);
  }
`;

const StyledTableWrapper = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);
  white-space: nowrap;
`;

const StyledTd = styled.td`
  padding: 10px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--twentyborder-color);
  white-space: nowrap;
`;

const StyledClickableRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: var(--twentybackground-color-secondary);
  }
`;

const StyledRiskBadge = styled.span<{ riskLevel: RiskLevel }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ riskLevel }) => RISK_COLORS[riskLevel].background};
  color: ${({ riskLevel }) => RISK_COLORS[riskLevel].color};
  text-transform: capitalize;
`;

const StyledEmptyState = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: var(--twentyfont-color-tertiary);
  font-size: 14px;
`;

const ACTION_STATUS_COLORS: Record<
  RenewalRowStatus,
  { background: string; color: string }
> = {
  new: {
    background: 'transparent',
    color: 'transparent',
  },
  contacted: {
    background: 'var(--twentycolor-green-light, #f0fdf4)',
    color: 'var(--twentycolor-green-dark, #166534)',
  },
  outreach_sent: {
    background: 'var(--twentycolor-blue-light, #eff6ff)',
    color: 'var(--twentycolor-blue-dark, #1e40af)',
  },
  quote_created: {
    background: 'var(--twentycolor-purple-light, #faf5ff)',
    color: 'var(--twentycolor-purple-dark, #6b21a8)',
  },
};

const StyledActionBadge = styled.span<{ status: RenewalRowStatus }>`
  display: ${({ status }) => (status === 'new' ? 'none' : 'inline-flex')};
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ status }) => ACTION_STATUS_COLORS[status].background};
  color: ${({ status }) => ACTION_STATUS_COLORS[status].color};
  text-transform: capitalize;
  white-space: nowrap;
`;

const StyledRowActionButton = styled.button<{ variant?: 'primary' | 'default' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ variant }) =>
    variant === 'primary'
      ? 'var(--twentycolor-blue-dark, #1e40af)'
      : 'var(--twentyfont-color-primary)'};
  background: ${({ variant }) =>
    variant === 'primary'
      ? 'var(--twentycolor-blue-light, #eff6ff)'
      : 'var(--twentybackground-color-primary)'};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: ${({ variant }) =>
      variant === 'primary'
        ? 'var(--twentycolor-blue, #3b82f6)'
        : 'var(--twentybackground-color-secondary)'};
    color: ${({ variant }) =>
      variant === 'primary' ? '#fff' : 'var(--twentyfont-color-primary)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledRowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StyledActionLogSection = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledActionLogHeader = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
  background: var(--twentybackground-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
`;

const StyledActionLogList = styled.div`
  max-height: 240px;
  overflow-y: auto;
`;

const StyledActionLogEntry = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--twentyborder-color);
  color: var(--twentyfont-color-primary);

  &:last-child {
    border-bottom: none;
  }
`;

const StyledActionLogTimestamp = styled.span`
  color: var(--twentyfont-color-tertiary);
  font-size: 12px;
  white-space: nowrap;
`;

const StyledActionLogText = styled.span`
  flex: 1;
`;

const StyledActionLogEmpty = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: var(--twentyfont-color-tertiary);
  font-size: 13px;
`;

const ACTION_LABELS: Record<RenewalAction, string> = {
  outreach: 'Outreach Sent',
  contacted: 'Marked Contacted',
  create_quote: 'Quote Created',
};

const STATUS_LABELS: Record<RenewalRowStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  outreach_sent: 'Outreach Sent',
  quote_created: 'Quote Created',
};

const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// TASK-128: Renewal dashboard with CSV export and clipboard copy.
// TASK-136: Action buttons for renewal rows.
export const CpqRenewalDashboard = ({
  renewals = SAMPLE_RENEWALS,
  onViewContract,
  currentUser = 'Current User',
}: CpqRenewalDashboardProps) => {
  const [riskFilter, setRiskFilter] = useState<RiskFilterOption>('all');
  const [renewalStatuses, setRenewalStatuses] = useState<
    Record<string, RenewalRowWithActions>
  >({});
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);

  const { enqueueSuccessSnackBar, enqueueInfoSnackBar } = useSnackBar();

  const filteredRenewals =
    riskFilter === 'all'
      ? renewals
      : renewals.filter((row) => row.riskLevel === riskFilter);

  // Metric computations
  const totalRenewable = renewals.reduce(
    (sum, row) => sum + row.contractValue,
    0,
  );
  const atRiskCount = renewals.filter(
    (row) => row.riskLevel === 'high' || row.riskLevel === 'critical',
  ).length;
  const churnedCount = renewals.filter(
    (row) => row.riskLevel === 'critical',
  ).length;
  const renewalRate =
    renewals.length > 0
      ? (((renewals.length - churnedCount) / renewals.length) * 100).toFixed(1)
      : '0';

  const handleExport = useCallback(() => {
    exportToCSV(filteredRenewals, riskFilter);
  }, [filteredRenewals, riskFilter]);

  const handleCopy = useCallback(() => {
    copyTableToClipboard(filteredRenewals);
  }, [filteredRenewals]);

  const getRowStatus = useCallback(
    (renewalId: string): RenewalRowStatus => {
      return renewalStatuses[renewalId]?.status ?? 'new';
    },
    [renewalStatuses],
  );

  const addActionLogEntry = useCallback(
    (renewalId: string, accountName: string, action: RenewalAction) => {
      const entry: ActionLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        renewalId,
        accountName,
        action,
        performedBy: currentUser,
        timestamp: new Date(),
      };
      setActionLog((prev) => [entry, ...prev]);
    },
    [currentUser],
  );

  const handleMarkContacted = useCallback(
    (event: React.MouseEvent, row: RenewalRow) => {
      event.stopPropagation();
      const now = new Date().toISOString();
      setRenewalStatuses((prev) => ({
        ...prev,
        [row.id]: {
          ...row,
          ...prev[row.id],
          status: 'contacted',
          lastContactedBy: currentUser,
          lastContactedAt: now,
        },
      }));
      addActionLogEntry(row.id, row.accountName, 'contacted');
      enqueueSuccessSnackBar({
        message: `${row.accountName} marked as contacted`,
      });
    },
    [currentUser, addActionLogEntry, enqueueSuccessSnackBar],
  );

  const handleSendOutreach = useCallback(
    (event: React.MouseEvent, row: RenewalRow) => {
      event.stopPropagation();
      setRenewalStatuses((prev) => ({
        ...prev,
        [row.id]: {
          ...row,
          ...prev[row.id],
          status: 'outreach_sent',
        },
      }));
      addActionLogEntry(row.id, row.accountName, 'outreach');
      enqueueSuccessSnackBar({
        message: `Outreach email sent to ${row.accountName}`,
      });
    },
    [addActionLogEntry, enqueueSuccessSnackBar],
  );

  const handleCreateRenewalQuote = useCallback(
    (event: React.MouseEvent, row: RenewalRow) => {
      event.stopPropagation();
      setRenewalStatuses((prev) => ({
        ...prev,
        [row.id]: {
          ...row,
          ...prev[row.id],
          status: 'quote_created',
        },
      }));
      addActionLogEntry(row.id, row.accountName, 'create_quote');
      enqueueInfoSnackBar({
        message: `Creating renewal quote for ${row.accountName}...`,
      });
    },
    [addActionLogEntry, enqueueInfoSnackBar],
  );

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

  return (
    <StyledDashboard>
      {/* Metric cards */}
      <StyledMetricsRow>
        <StyledMetricCard>
          <StyledMetricLabel>Total Renewable</StyledMetricLabel>
          <StyledMetricValue>{formatCurrency(totalRenewable)}</StyledMetricValue>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricLabel>Renewal Rate</StyledMetricLabel>
          <StyledMetricValue>{renewalRate}%</StyledMetricValue>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricLabel>At Risk</StyledMetricLabel>
          <StyledMetricValue>{atRiskCount}</StyledMetricValue>
        </StyledMetricCard>
        <StyledMetricCard>
          <StyledMetricLabel>Churned</StyledMetricLabel>
          <StyledMetricValue>{churnedCount}</StyledMetricValue>
        </StyledMetricCard>
      </StyledMetricsRow>

      {/* Toolbar: filter + actions */}
      <StyledToolbar>
        <IconFilter size={16} />
        <StyledFilterSelect
          value={riskFilter}
          onChange={(e) =>
            setRiskFilter(e.target.value as RiskFilterOption)
          }
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </StyledFilterSelect>

        <StyledActionButton onClick={handleExport}>
          <IconDownload size={14} />
          Export CSV
        </StyledActionButton>

        <StyledActionButton onClick={handleCopy}>
          <IconCopy size={14} />
          Copy Table
        </StyledActionButton>
      </StyledToolbar>

      {/* Renewal table */}
      <StyledTableWrapper>
        <StyledTable>
          <thead>
            <tr>
              <StyledTh>Account Name</StyledTh>
              <StyledTh>Renewal Date</StyledTh>
              <StyledTh>Contract Value</StyledTh>
              <StyledTh>Risk Score</StyledTh>
              <StyledTh>Risk Level</StyledTh>
              <StyledTh>Days Until Renewal</StyledTh>
              <StyledTh>Status</StyledTh>
              <StyledTh>Actions</StyledTh>
            </tr>
          </thead>
          <tbody>
            {filteredRenewals.length === 0 ? (
              <tr>
                <StyledTd colSpan={8}>
                  <StyledEmptyState>
                    No renewals match the selected filter.
                  </StyledEmptyState>
                </StyledTd>
              </tr>
            ) : (
              filteredRenewals.map((row) => {
                const rowStatus = getRowStatus(row.id);
                return (
                  <StyledClickableRow
                    key={row.id}
                    onClick={() => onViewContract?.(row.id)}
                  >
                    <StyledTd>{row.accountName}</StyledTd>
                    <StyledTd>{row.renewalDate}</StyledTd>
                    <StyledTd>{formatCurrency(row.contractValue)}</StyledTd>
                    <StyledTd>{row.riskScore}</StyledTd>
                    <StyledTd>
                      <StyledRiskBadge riskLevel={row.riskLevel}>
                        {row.riskLevel}
                      </StyledRiskBadge>
                    </StyledTd>
                    <StyledTd>{row.daysUntilRenewal}</StyledTd>
                    <StyledTd>
                      {rowStatus !== 'new' ? (
                        <StyledActionBadge status={rowStatus}>
                          {STATUS_LABELS[rowStatus]}
                        </StyledActionBadge>
                      ) : (
                        '—'
                      )}
                    </StyledTd>
                    <StyledTd>
                      <StyledRowActions>
                        <StyledRowActionButton
                          onClick={(event) => handleMarkContacted(event, row)}
                          disabled={rowStatus === 'contacted'}
                          title="Mark as contacted"
                        >
                          <IconCheck size={12} />
                          Contacted
                        </StyledRowActionButton>
                        <StyledRowActionButton
                          variant="primary"
                          onClick={(event) => handleSendOutreach(event, row)}
                          disabled={rowStatus === 'outreach_sent'}
                          title="Send outreach email"
                        >
                          <IconMail size={12} />
                          Outreach
                        </StyledRowActionButton>
                        <StyledRowActionButton
                          onClick={(event) =>
                            handleCreateRenewalQuote(event, row)
                          }
                          disabled={rowStatus === 'quote_created'}
                          title="Create renewal quote"
                        >
                          <IconFileInvoice size={12} />
                          Quote
                        </StyledRowActionButton>
                      </StyledRowActions>
                    </StyledTd>
                  </StyledClickableRow>
                );
              })
            )}
          </tbody>
        </StyledTable>
      </StyledTableWrapper>

      {/* Action log */}
      <StyledActionLogSection>
        <StyledActionLogHeader>Action Log</StyledActionLogHeader>
        <StyledActionLogList>
          {actionLog.length === 0 ? (
            <StyledActionLogEmpty>
              No actions performed yet. Use the buttons above to act on
              renewals.
            </StyledActionLogEmpty>
          ) : (
            actionLog.map((entry) => (
              <StyledActionLogEntry key={entry.id}>
                <StyledActionLogTimestamp>
                  {formatTimestamp(entry.timestamp)}
                </StyledActionLogTimestamp>
                <StyledActionLogText>
                  <strong>{entry.performedBy}</strong>{' '}
                  {ACTION_LABELS[entry.action]} for{' '}
                  <strong>{entry.accountName}</strong>
                </StyledActionLogText>
              </StyledActionLogEntry>
            ))
          )}
        </StyledActionLogList>
      </StyledActionLogSection>
    </StyledDashboard>
  );
};

export type {
  RenewalRow,
  RenewalRowWithActions,
  RenewalAction,
  RenewalRowStatus,
  ActionLogEntry,
  RiskLevel,
  CpqRenewalDashboardProps,
};
