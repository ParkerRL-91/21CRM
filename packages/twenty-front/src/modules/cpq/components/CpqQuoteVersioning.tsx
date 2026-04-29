import { useState, useMemo } from 'react';
import { styled } from '@linaria/react';
import { IconGitBranch, IconPlus, IconClock } from '@tabler/icons-react';

import type {
  QuoteVersion,
  VersionedLineItem,
} from '@/cpq/hooks/use-quote-versions';

type CpqQuoteVersioningProps = {
  versions: QuoteVersion[];
  currentVersion: number;
  onCreateVersion: () => void;
  onSelectVersion: (version: number) => void;
  getVersionSummary: (version: QuoteVersion) => string;
};

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

type DiffLineItem = {
  productName: string;
  status: DiffStatus;
  left: VersionedLineItem | null;
  right: VersionedLineItem | null;
};

// --- Styled components ---

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const StyledVersionSelect = styled.select`
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--twentyfont-color-primary);
  background: var(--twentybackground-color-primary, #fff);
  cursor: pointer;

  &:focus {
    outline: 2px solid var(--twentycolor-blue, #3b82f6);
    border-color: transparent;
  }
`;

const StyledNewVersionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--twentycolor-blue, #3b82f6);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }
`;

const StyledCompareLabel = styled.span`
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
  font-weight: 600;
`;

const StyledBranchIcon = styled.div`
  display: flex;
  align-items: center;
  color: var(--twentyfont-color-tertiary);
`;

const StyledReadOnlyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--twentycolor-gray-light, #f3f4f6);
  color: var(--twentyfont-color-tertiary);
`;

const StyledLatestBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--twentycolor-green-light, #f0fdf4);
  color: var(--twentycolor-green-dark, #166534);
`;

// Comparison table

const StyledComparisonSection = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledComparisonHeader = styled.div`
  padding: 10px 16px;
  background: var(--twentybackground-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
`;

const StyledComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const StyledComparisonTh = styled.th`
  text-align: left;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);
`;

const StyledComparisonTd = styled.td<{ diffStatus?: DiffStatus }>`
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--twentyborder-color);
  background: ${({ diffStatus }) => {
    switch (diffStatus) {
      case 'added':
        return 'var(--twentycolor-green-light, #f0fdf4)';
      case 'removed':
        return 'var(--twentycolor-red-light, #fee2e2)';
      case 'changed':
        return 'var(--twentycolor-orange-light, #ffedd5)';
      default:
        return 'transparent';
    }
  }};
`;

const StyledStrikethrough = styled.span`
  text-decoration: line-through;
  color: var(--twentyfont-color-tertiary);
  margin-right: 6px;
`;

const StyledNewValue = styled.span`
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledDiffTag = styled.span<{ diffStatus: DiffStatus }>`
  display: inline-block;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ diffStatus }) => {
    switch (diffStatus) {
      case 'added':
        return 'var(--twentycolor-green-dark, #166534)';
      case 'removed':
        return 'var(--twentycolor-red-dark, #991b1b)';
      case 'changed':
        return 'var(--twentycolor-orange, #f59e0b)';
      default:
        return 'var(--twentyfont-color-tertiary)';
    }
  }};
  background: ${({ diffStatus }) => {
    switch (diffStatus) {
      case 'added':
        return 'var(--twentycolor-green-light, #f0fdf4)';
      case 'removed':
        return 'var(--twentycolor-red-light, #fee2e2)';
      case 'changed':
        return 'var(--twentycolor-orange-light, #ffedd5)';
      default:
        return 'var(--twentycolor-gray-light, #f3f4f6)';
    }
  }};
`;

// History list

const StyledHistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const StyledHistoryItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--twentyborder-color);
  cursor: pointer;
  background: ${({ isActive }) =>
    isActive
      ? 'var(--twentycolor-blue-light, #eff6ff)'
      : 'transparent'};

  &:hover {
    background: var(--twentybackground-color-secondary);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const StyledHistoryVersion = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: var(--twentyfont-color-primary);
  min-width: 28px;
`;

const StyledHistoryMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledHistorySummary = styled.div`
  font-size: 13px;
  color: var(--twentyfont-color-primary);
`;

const StyledHistoryTimestamp = styled.div`
  font-size: 11px;
  color: var(--twentyfont-color-tertiary);
  margin-top: 2px;
`;

const StyledEmptyState = styled.div`
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--twentyfont-color-tertiary);
`;

// --- Helpers ---

const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const computeDiff = (
  leftVersion: QuoteVersion,
  rightVersion: QuoteVersion,
): DiffLineItem[] => {
  const leftMap = new Map(
    leftVersion.lineItems.map((li) => [li.productName, li]),
  );
  const rightMap = new Map(
    rightVersion.lineItems.map((li) => [li.productName, li]),
  );
  const allProducts = new Set([
    ...leftVersion.lineItems.map((li) => li.productName),
    ...rightVersion.lineItems.map((li) => li.productName),
  ]);

  const results: DiffLineItem[] = [];

  allProducts.forEach((productName) => {
    const left = leftMap.get(productName) ?? null;
    const right = rightMap.get(productName) ?? null;

    if (left && !right) {
      results.push({ productName, status: 'removed', left, right: null });
    } else if (!left && right) {
      results.push({ productName, status: 'added', left: null, right });
    } else if (left && right) {
      const hasChanged =
        left.quantity !== right.quantity ||
        left.discountPercent !== right.discountPercent ||
        left.listPrice !== right.listPrice ||
        left.netTotal !== right.netTotal;

      results.push({
        productName,
        status: hasChanged ? 'changed' : 'unchanged',
        left,
        right,
      });
    }
  });

  return results;
};

// Renders a cell value with old/new diff when values differ
const DiffCell = ({
  oldValue,
  newValue,
  status,
}: {
  oldValue: string;
  newValue: string;
  status: DiffStatus;
}) => {
  if (status === 'changed' && oldValue !== newValue) {
    return (
      <span>
        <StyledStrikethrough>{oldValue}</StyledStrikethrough>
        <StyledNewValue>{newValue}</StyledNewValue>
      </span>
    );
  }

  return <span>{newValue || oldValue}</span>;
};

// --- Main component ---

// Side-by-side quote version comparison view (TASK-127).
// Supports version selection, new version creation, and a visual diff
// showing added (green), removed (red), and changed (yellow) line items.
export const CpqQuoteVersioning = ({
  versions,
  currentVersion,
  onCreateVersion,
  onSelectVersion,
  getVersionSummary,
}: CpqQuoteVersioningProps) => {
  const [compareVersion, setCompareVersion] = useState<number | null>(null);

  const selectedVersion = versions.find((v) => v.version === currentVersion);
  const comparedVersion =
    compareVersion !== null
      ? versions.find((v) => v.version === compareVersion)
      : null;

  const isLatest =
    versions.length > 0 &&
    currentVersion === versions[versions.length - 1].version;

  const diffItems = useMemo(() => {
    if (!comparedVersion || !selectedVersion) {
      return [];
    }

    return computeDiff(comparedVersion, selectedVersion);
  }, [comparedVersion, selectedVersion]);

  if (versions.length === 0) {
    return (
      <StyledContainer>
        <StyledHeader>
          <StyledBranchIcon>
            <IconGitBranch size={16} />
          </StyledBranchIcon>
          <span style={{ fontSize: 13, color: 'var(--twentyfont-color-secondary)' }}>
            No versions yet
          </span>
          <StyledNewVersionButton onClick={onCreateVersion}>
            <IconPlus size={14} /> Snapshot as v1
          </StyledNewVersionButton>
        </StyledHeader>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      {/* Header with version selector + create button */}
      <StyledHeader>
        <StyledBranchIcon>
          <IconGitBranch size={16} />
        </StyledBranchIcon>
        <StyledVersionSelect
          value={currentVersion}
          onChange={(event) => onSelectVersion(Number(event.target.value))}
        >
          {versions.map((version) => (
            <option key={version.version} value={version.version}>
              v{version.version} - {version.quoteName || 'Untitled'}
            </option>
          ))}
        </StyledVersionSelect>
        {isLatest ? (
          <StyledLatestBadge>Current (editable)</StyledLatestBadge>
        ) : (
          <StyledReadOnlyBadge>Read-only</StyledReadOnlyBadge>
        )}
        <StyledNewVersionButton onClick={onCreateVersion}>
          <IconPlus size={14} /> Create New Version
        </StyledNewVersionButton>
      </StyledHeader>

      {/* Compare selector */}
      {versions.length > 1 && (
        <StyledHeader>
          <StyledCompareLabel>Compare with:</StyledCompareLabel>
          <StyledVersionSelect
            value={compareVersion ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setCompareVersion(value === '' ? null : Number(value));
            }}
          >
            <option value="">Select version...</option>
            {versions
              .filter((v) => v.version !== currentVersion)
              .map((version) => (
                <option key={version.version} value={version.version}>
                  v{version.version}
                </option>
              ))}
          </StyledVersionSelect>
        </StyledHeader>
      )}

      {/* Side-by-side comparison */}
      {comparedVersion && selectedVersion && diffItems.length > 0 && (
        <StyledComparisonSection>
          <StyledComparisonHeader>
            v{comparedVersion.version} vs v{selectedVersion.version} Comparison
          </StyledComparisonHeader>
          <StyledComparisonTable>
            <thead>
              <tr>
                <StyledComparisonTh>Status</StyledComparisonTh>
                <StyledComparisonTh>Product</StyledComparisonTh>
                <StyledComparisonTh>List Price</StyledComparisonTh>
                <StyledComparisonTh>Qty</StyledComparisonTh>
                <StyledComparisonTh>Discount %</StyledComparisonTh>
                <StyledComparisonTh>Net Total</StyledComparisonTh>
              </tr>
            </thead>
            <tbody>
              {diffItems.map((diff) => (
                <tr key={diff.productName}>
                  <StyledComparisonTd diffStatus={diff.status}>
                    <StyledDiffTag diffStatus={diff.status}>
                      {diff.status}
                    </StyledDiffTag>
                  </StyledComparisonTd>
                  <StyledComparisonTd diffStatus={diff.status}>
                    {diff.productName}
                  </StyledComparisonTd>
                  <StyledComparisonTd diffStatus={diff.status}>
                    <DiffCell
                      oldValue={diff.left?.listPrice ?? '—'}
                      newValue={diff.right?.listPrice ?? '—'}
                      status={diff.status}
                    />
                  </StyledComparisonTd>
                  <StyledComparisonTd diffStatus={diff.status}>
                    <DiffCell
                      oldValue={String(diff.left?.quantity ?? '—')}
                      newValue={String(diff.right?.quantity ?? '—')}
                      status={diff.status}
                    />
                  </StyledComparisonTd>
                  <StyledComparisonTd diffStatus={diff.status}>
                    <DiffCell
                      oldValue={
                        diff.left
                          ? `${diff.left.discountPercent}%`
                          : '—'
                      }
                      newValue={
                        diff.right
                          ? `${diff.right.discountPercent}%`
                          : '—'
                      }
                      status={diff.status}
                    />
                  </StyledComparisonTd>
                  <StyledComparisonTd diffStatus={diff.status}>
                    <DiffCell
                      oldValue={
                        diff.left?.netTotal
                          ? `$${parseFloat(diff.left.netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '—'
                      }
                      newValue={
                        diff.right?.netTotal
                          ? `$${parseFloat(diff.right.netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : '—'
                      }
                      status={diff.status}
                    />
                  </StyledComparisonTd>
                </tr>
              ))}
            </tbody>
          </StyledComparisonTable>
        </StyledComparisonSection>
      )}

      {/* Version history list */}
      <StyledComparisonSection>
        <StyledComparisonHeader>Version History</StyledComparisonHeader>
        {versions.length === 0 ? (
          <StyledEmptyState>No versions created yet</StyledEmptyState>
        ) : (
          <StyledHistoryList>
            {[...versions].reverse().map((version) => (
              <StyledHistoryItem
                key={version.version}
                isActive={version.version === currentVersion}
                onClick={() => onSelectVersion(version.version)}
              >
                <IconClock size={14} style={{ color: 'var(--twentyfont-color-tertiary)', flexShrink: 0 }} />
                <StyledHistoryVersion>v{version.version}</StyledHistoryVersion>
                <StyledHistoryMeta>
                  <StyledHistorySummary>
                    {getVersionSummary(version)}
                  </StyledHistorySummary>
                  <StyledHistoryTimestamp>
                    {formatTimestamp(version.timestamp)}
                  </StyledHistoryTimestamp>
                </StyledHistoryMeta>
                {version.version === versions[versions.length - 1].version && (
                  <StyledLatestBadge>Latest</StyledLatestBadge>
                )}
              </StyledHistoryItem>
            ))}
          </StyledHistoryList>
        )}
      </StyledComparisonSection>
    </StyledContainer>
  );
};
