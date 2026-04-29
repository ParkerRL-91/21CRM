import { useState, useMemo } from 'react';
import { styled } from '@linaria/react';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconSend,
  IconCheck,
  IconFileText,
  IconClock,
  IconChevronDown,
  IconChevronRight,
  IconFilter,
} from '@tabler/icons-react';

import type { AuditEntry, AuditEventType } from '@/cpq/hooks/use-quote-audit-trail';

type CpqAuditTrailProps = {
  entries: AuditEntry[];
  onAddEntry?: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
};

type EventMeta = {
  icon: typeof IconPlus;
  color: string;
  background: string;
};

const EVENT_META: Record<AuditEventType, EventMeta> = {
  quote_created: {
    icon: IconFileText,
    color: 'var(--twentycolor-green, #22c55e)',
    background: 'var(--twentycolor-green-light, #f0fdf4)',
  },
  line_item_added: {
    icon: IconPlus,
    color: 'var(--twentycolor-green, #22c55e)',
    background: 'var(--twentycolor-green-light, #f0fdf4)',
  },
  line_item_removed: {
    icon: IconTrash,
    color: 'var(--twentycolor-red, #ef4444)',
    background: 'var(--twentycolor-red-light, #fee2e2)',
  },
  line_item_edited: {
    icon: IconEdit,
    color: 'var(--twentycolor-blue, #3b82f6)',
    background: 'var(--twentycolor-blue-light, #eff6ff)',
  },
  discount_changed: {
    icon: IconEdit,
    color: 'var(--twentycolor-orange, #f59e0b)',
    background: 'var(--twentycolor-orange-light, #ffedd5)',
  },
  status_changed: {
    icon: IconClock,
    color: 'var(--twentycolor-blue, #3b82f6)',
    background: 'var(--twentycolor-blue-light, #eff6ff)',
  },
  approval_submitted: {
    icon: IconSend,
    color: 'var(--twentycolor-blue, #3b82f6)',
    background: 'var(--twentycolor-blue-light, #eff6ff)',
  },
  approval_approved: {
    icon: IconCheck,
    color: 'var(--twentycolor-green, #22c55e)',
    background: 'var(--twentycolor-green-light, #f0fdf4)',
  },
  approval_rejected: {
    icon: IconTrash,
    color: 'var(--twentycolor-red, #ef4444)',
    background: 'var(--twentycolor-red-light, #fee2e2)',
  },
  pdf_generated: {
    icon: IconFileText,
    color: 'var(--twentycolor-blue, #3b82f6)',
    background: 'var(--twentycolor-blue-light, #eff6ff)',
  },
};

const EVENT_TYPE_LABELS: Record<AuditEventType, string> = {
  quote_created: 'Quote Created',
  line_item_added: 'Item Added',
  line_item_removed: 'Item Removed',
  line_item_edited: 'Item Edited',
  discount_changed: 'Discount Changed',
  status_changed: 'Status Changed',
  approval_submitted: 'Approval Submitted',
  approval_approved: 'Approved',
  approval_rejected: 'Rejected',
  pdf_generated: 'PDF Generated',
};

// --- Styled components ---

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const StyledFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  flex-wrap: wrap;
`;

const StyledSearchInput = styled.input`
  flex: 1;
  min-width: 160px;
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--twentyfont-color-primary);
  background: var(--twentybackground-color-primary, #fff);

  &::placeholder {
    color: var(--twentyfont-color-tertiary);
  }

  &:focus {
    outline: 2px solid var(--twentycolor-blue, #3b82f6);
    border-color: transparent;
  }
`;

const StyledFilterSelect = styled.select`
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

const StyledTimeline = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  padding-left: 20px;

  &::before {
    content: '';
    position: absolute;
    left: 13px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--twentyborder-color);
    border-radius: 1px;
  }
`;

const StyledTimelineEntry = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  position: relative;
`;

const StyledIconBubble = styled.div<{ background: string; color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ background }) => background};
  color: ${({ color }) => color};
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border: 2px solid var(--twentybackground-color-primary, #fff);
`;

const StyledEntryBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledEntryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const StyledUserName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledDescription = styled.span`
  font-size: 13px;
  color: var(--twentyfont-color-secondary);
`;

const StyledTimestamp = styled.span`
  font-size: 11px;
  color: var(--twentyfont-color-tertiary);
  margin-left: auto;
  flex-shrink: 0;
`;

const StyledDetailsToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 2px 6px;
  background: none;
  border: none;
  font-size: 12px;
  color: var(--twentyfont-color-tertiary);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: var(--twentyfont-color-secondary);
    background: var(--twentybackground-color-secondary);
  }
`;

const StyledDetailsPanel = styled.div`
  margin-top: 6px;
  padding: 8px 10px;
  background: var(--twentybackground-color-secondary);
  border-radius: 6px;
  border: 1px solid var(--twentyborder-color);
`;

const StyledDetailRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 2px 0;
  font-size: 12px;
`;

const StyledDetailKey = styled.span`
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
  min-width: 80px;
`;

const StyledDetailValue = styled.span`
  color: var(--twentyfont-color-primary);
`;

const StyledEmpty = styled.div`
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: var(--twentyfont-color-tertiary);
`;

const StyledFilterIcon = styled.div`
  display: flex;
  align-items: center;
  color: var(--twentyfont-color-tertiary);
`;

// --- Helpers ---

const formatRelativeTime = (timestamp: Date): string => {
  const diffMs = Date.now() - timestamp.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 10) {
    return 'just now';
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
};

// --- Expandable entry sub-component ---

const AuditEntryRow = ({ entry }: { entry: AuditEntry }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = EVENT_META[entry.eventType];
  const IconComponent = meta.icon;
  const hasDetails =
    entry.details !== undefined && Object.keys(entry.details).length > 0;

  return (
    <StyledTimelineEntry>
      <StyledIconBubble background={meta.background} color={meta.color}>
        <IconComponent size={14} />
      </StyledIconBubble>
      <StyledEntryBody>
        <StyledEntryHeader>
          <StyledUserName>{entry.userName}</StyledUserName>
          <StyledDescription>{entry.description}</StyledDescription>
          <StyledTimestamp>{formatRelativeTime(entry.timestamp)}</StyledTimestamp>
        </StyledEntryHeader>
        {hasDetails && (
          <>
            <StyledDetailsToggle
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-label="Toggle details"
            >
              {isExpanded ? (
                <IconChevronDown size={12} />
              ) : (
                <IconChevronRight size={12} />
              )}
              Details
            </StyledDetailsToggle>
            {isExpanded && (
              <StyledDetailsPanel>
                {Object.entries(entry.details!).map(([key, value]) => (
                  <StyledDetailRow key={key}>
                    <StyledDetailKey>{key}</StyledDetailKey>
                    <StyledDetailValue>{value}</StyledDetailValue>
                  </StyledDetailRow>
                ))}
              </StyledDetailsPanel>
            )}
          </>
        )}
      </StyledEntryBody>
    </StyledTimelineEntry>
  );
};

// --- Main component ---

// Vertical timeline audit trail for CPQ quotes (TASK-125).
// Displays who created the quote, who added/removed line items, who changed
// discounts, etc. Entries are most-recent-first with color-coded icons and an
// optional expandable details panel per entry.
export const CpqAuditTrail = ({ entries }: CpqAuditTrailProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<
    AuditEventType | 'all'
  >('all');

  const filteredEntries = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();

    return entries.filter((entry) => {
      if (
        eventTypeFilter !== 'all' &&
        entry.eventType !== eventTypeFilter
      ) {
        return false;
      }

      if (lowerQuery.length === 0) {
        return true;
      }

      return (
        entry.userName.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery) ||
        EVENT_TYPE_LABELS[entry.eventType].toLowerCase().includes(lowerQuery)
      );
    });
  }, [entries, searchQuery, eventTypeFilter]);

  // Collect unique event types present in the current entries for the filter dropdown
  const availableEventTypes = useMemo(() => {
    const typesSet = new Set(entries.map((entry) => entry.eventType));

    return Array.from(typesSet).sort();
  }, [entries]);

  return (
    <StyledContainer>
      <StyledFilterBar>
        <StyledFilterIcon>
          <IconFilter size={14} />
        </StyledFilterIcon>
        <StyledSearchInput
          type="text"
          placeholder="Filter by user or description..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <StyledFilterSelect
          value={eventTypeFilter}
          onChange={(event) =>
            setEventTypeFilter(event.target.value as AuditEventType | 'all')
          }
        >
          <option value="all">All Events</option>
          {availableEventTypes.map((eventType) => (
            <option key={eventType} value={eventType}>
              {EVENT_TYPE_LABELS[eventType]}
            </option>
          ))}
        </StyledFilterSelect>
      </StyledFilterBar>

      {filteredEntries.length === 0 ? (
        <StyledEmpty>
          {entries.length === 0
            ? 'No activity recorded yet'
            : 'No matching entries'}
        </StyledEmpty>
      ) : (
        <StyledTimeline>
          {filteredEntries.map((entry) => (
            <AuditEntryRow key={entry.id} entry={entry} />
          ))}
        </StyledTimeline>
      )}
    </StyledContainer>
  );
};
