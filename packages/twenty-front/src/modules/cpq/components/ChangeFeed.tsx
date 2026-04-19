import { styled } from '@linaria/react';

export type ChangeEventType =
  | 'stage-change'
  | 'amount-change'
  | 'close-date-slip'
  | 'new-deal'
  | 'deal-closed'
  | 'risk-flag';

export type ChangeFeedItem = {
  id: string;
  type: ChangeEventType;
  dealName: string;
  description: string;
  dollarImpact?: number;
  timestamp: string;
  actor?: string;
};

type ChangeFeedProps = {
  items: ChangeFeedItem[];
  emptyMessage?: string;
  maxItems?: number;
};

const TYPE_META: Record<ChangeEventType, { icon: string; color: string; bg: string }> = {
  'stage-change': { icon: '→', color: 'var(--twentycolor-blue)', bg: 'var(--twentycolor-blue-light, #eff6ff)' },
  'amount-change': { icon: '$', color: 'var(--twentycolor-green)', bg: 'var(--twentycolor-green-light, #f0fdf4)' },
  'close-date-slip': { icon: '!', color: 'var(--twentycolor-red)', bg: 'var(--twentycolor-red-light, #fee2e2)' },
  'new-deal': { icon: '+', color: 'var(--twentycolor-purple, #7c3aed)', bg: 'var(--twentycolor-purple-light, #f5f3ff)' },
  'deal-closed': { icon: '✓', color: 'var(--twentycolor-green)', bg: 'var(--twentycolor-green-light, #f0fdf4)' },
  'risk-flag': { icon: '⚠', color: 'var(--twentycolor-orange)', bg: 'var(--twentycolor-orange-light, #ffedd5)' },
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--twentybackground-color-secondary);
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--twentyborder-color);
`;

const StyledTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledCount = styled.span`
  font-size: 12px;
  color: var(--twentyfont-color-tertiary);
`;

const StyledItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--twentyborder-color);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--twentybackground-color-tertiary, rgba(0, 0, 0, 0.02));
  }
`;

const StyledIconBubble = styled.div<{ bg: string; color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  background: ${({ bg }) => bg};
  color: ${({ color }) => color};
  flex-shrink: 0;
  margin-top: 1px;
`;

const StyledBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledDealName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledDescription = styled.div`
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
`;

const StyledTimestamp = styled.span`
  font-size: 11px;
  color: var(--twentyfont-color-tertiary);
`;

const StyledImpact = styled.span<{ positive: boolean }>`
  font-size: 11px;
  font-weight: 600;
  color: ${({ positive }) =>
    positive ? 'var(--twentycolor-green)' : 'var(--twentycolor-red)'};
`;

const StyledEmpty = styled.div`
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--twentyfont-color-tertiary);
`;

const formatRelativeTime = (timestamp: string): string => {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Activity feed showing recent deal changes: stage moves, amount updates, slipped close dates, new deals.
// Sorted by recency; shows last 7 days by default.
export const ChangeFeed = ({
  items,
  emptyMessage = 'All quiet — no changes in the last 7 days',
  maxItems = 20,
}: ChangeFeedProps) => {
  const visibleItems = items.slice(0, maxItems);

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledTitle>Recent Changes</StyledTitle>
        <StyledCount>{items.length} event{items.length !== 1 ? 's' : ''}</StyledCount>
      </StyledHeader>

      {visibleItems.length === 0 ? (
        <StyledEmpty>{emptyMessage}</StyledEmpty>
      ) : (
        visibleItems.map((item) => {
          const meta = TYPE_META[item.type];
          return (
            <StyledItem key={item.id}>
              <StyledIconBubble bg={meta.bg} color={meta.color}>
                {meta.icon}
              </StyledIconBubble>
              <StyledBody>
                <StyledDealName>{item.dealName}</StyledDealName>
                <StyledDescription>{item.description}</StyledDescription>
                <StyledMeta>
                  <StyledTimestamp>{formatRelativeTime(item.timestamp)}</StyledTimestamp>
                  {item.actor && (
                    <StyledTimestamp>· {item.actor}</StyledTimestamp>
                  )}
                  {item.dollarImpact !== undefined && (
                    <StyledImpact positive={item.dollarImpact >= 0}>
                      {item.dollarImpact >= 0 ? '+' : ''}${Math.abs(item.dollarImpact).toLocaleString()}
                    </StyledImpact>
                  )}
                </StyledMeta>
              </StyledBody>
            </StyledItem>
          );
        })
      )}
    </StyledContainer>
  );
};
