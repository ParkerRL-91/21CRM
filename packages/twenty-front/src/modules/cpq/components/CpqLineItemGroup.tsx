import { useState, useRef, useEffect } from 'react';
import { styled } from '@linaria/react';
import { IconChevronDown, IconChevronUp, IconEdit } from '@tabler/icons-react';

type GroupedLineItem = {
  id: string;
  productName: string;
  listPrice: string;
  quantity: number;
  discountPercent: number;
  netTotal: string | null;
  group: string;
};

type LineItemGroup = {
  name: string;
  items: GroupedLineItem[];
  subtotal: number;
  isCollapsed: boolean;
};

type CpqLineItemGroupProps = {
  groups: LineItemGroup[];
  onToggleGroup: (groupName: string) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
};

const GROUP_HEADER_COLORS = [
  'var(--twentybackground-color-secondary, #f9fafb)',
  'var(--twentycolor-blue-10, rgba(59,130,246,0.06))',
  'var(--twentycolor-green-10, rgba(16,185,129,0.06))',
  'var(--twentycolor-orange-10, rgba(245,158,11,0.06))',
  'var(--twentycolor-purple-10, rgba(139,92,246,0.06))',
];

const StyledGroupContainer = styled.div`
  margin-bottom: 4px;
`;

const StyledGroupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--twentybackground-color-secondary, #f9fafb);
  border-top: 2px solid var(--twentyborder-color);
  border-bottom: 1px solid var(--twentyborder-color);
  cursor: pointer;
  user-select: none;
`;

const StyledGroupName = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: var(--twentyfont-color-primary, #111827);
  flex: 1;
`;

const StyledGroupNameInput = styled.input`
  font-size: 13px;
  font-weight: 700;
  color: var(--twentyfont-color-primary, #111827);
  flex: 1;
  border: 1px solid var(--twentycolor-blue, #3b82f6);
  border-radius: 4px;
  padding: 2px 6px;
  outline: none;
  background: var(--twentybackground-color-primary, #ffffff);
`;

const StyledItemCount = styled.span`
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: var(--twentycolor-blue-10, rgba(59, 130, 246, 0.1));
  color: var(--twentycolor-blue, #3b82f6);
`;

const StyledGroupSubtotal = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-primary);
`;

const StyledEditButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--twentyfont-color-tertiary);

  &:hover {
    background: var(--twentybackground-color-tertiary, #e5e7eb);
    color: var(--twentyfont-color-primary);
  }
`;

const StyledItemRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 0.8fr 1fr;
  gap: 8px;
  padding: 8px 16px;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px solid var(--twentyborder-color-light, #f3f4f6);

  &:hover {
    background: var(--twentybackground-color-secondary, #f9fafb);
  }
`;

const StyledItemCell = styled.span`
  color: var(--twentyfont-color-primary, #111827);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemCellRight = styled(StyledItemCell)`
  text-align: right;
`;

const StyledSubtotalRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 6px 16px;
  border-bottom: 2px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary, #f9fafb);
`;

const StyledChevronContainer = styled.span`
  display: inline-flex;
  align-items: center;
  color: var(--twentyfont-color-tertiary);
`;

const StyledEmptyMessage = styled.div`
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--twentyfont-color-tertiary);
`;

// Inline-editable group name with Enter/Escape/blur handling.
const GroupNameEditor = ({
  name,
  onRename,
  onCancel,
}: {
  name: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleCommit = () => {
    const trimmed = value.trim();

    if (trimmed.length > 0 && trimmed !== name) {
      onRename(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <StyledGroupNameInput
      ref={inputRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleCommit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          handleCommit();
        }

        if (event.key === 'Escape') {
          onCancel();
        }
      }}
      onClick={(event) => event.stopPropagation()}
    />
  );
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Renders quote line items organized into collapsible, color-coded groups.
// Each group has an editable name, item count badge, subtotal, and
// expand/collapse toggle. Items without a group appear under "Ungrouped".
export const CpqLineItemGroup = ({
  groups,
  onToggleGroup,
  onRenameGroup,
}: CpqLineItemGroupProps) => {
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  if (groups.length === 0) {
    return <StyledEmptyMessage>No line items to display.</StyledEmptyMessage>;
  }

  return (
    <div>
      {groups.map((group, groupIndex) => {
        const headerBackground =
          GROUP_HEADER_COLORS[groupIndex % GROUP_HEADER_COLORS.length];

        return (
          <StyledGroupContainer key={group.name}>
            <StyledGroupHeader
              style={{ background: headerBackground }}
              onClick={() => onToggleGroup(group.name)}
              role="button"
              aria-expanded={!group.isCollapsed}
              aria-label={`${group.name} section, ${group.items.length} items`}
            >
              <StyledChevronContainer>
                {group.isCollapsed ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronUp size={16} />
                )}
              </StyledChevronContainer>

              {editingGroup === group.name ? (
                <GroupNameEditor
                  name={group.name}
                  onRename={(newName) => {
                    onRenameGroup(group.name, newName);
                    setEditingGroup(null);
                  }}
                  onCancel={() => setEditingGroup(null)}
                />
              ) : (
                <StyledGroupName>{group.name}</StyledGroupName>
              )}

              <StyledItemCount>
                {group.items.length}{' '}
                {group.items.length === 1 ? 'item' : 'items'}
              </StyledItemCount>

              <StyledGroupSubtotal>
                {formatCurrency(group.subtotal)}
              </StyledGroupSubtotal>

              {editingGroup !== group.name && (
                <StyledEditButton
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingGroup(group.name);
                  }}
                  aria-label={`Rename ${group.name}`}
                >
                  <IconEdit size={14} />
                </StyledEditButton>
              )}
            </StyledGroupHeader>

            {!group.isCollapsed && (
              <>
                {group.items.map((item) => (
                  <StyledItemRow key={item.id}>
                    <StyledItemCell>{item.productName}</StyledItemCell>
                    <StyledItemCellRight>{item.listPrice}</StyledItemCellRight>
                    <StyledItemCellRight>{item.quantity}</StyledItemCellRight>
                    <StyledItemCellRight>
                      {item.discountPercent > 0
                        ? `${item.discountPercent}%`
                        : '-'}
                    </StyledItemCellRight>
                    <StyledItemCellRight>
                      {item.netTotal !== null
                        ? formatCurrency(parseFloat(item.netTotal))
                        : '-'}
                    </StyledItemCellRight>
                  </StyledItemRow>
                ))}
                <StyledSubtotalRow>
                  <StyledGroupSubtotal>
                    Section subtotal: {formatCurrency(group.subtotal)}
                  </StyledGroupSubtotal>
                </StyledSubtotalRow>
              </>
            )}
          </StyledGroupContainer>
        );
      })}
    </div>
  );
};
