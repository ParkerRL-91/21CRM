import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
} from '@tabler/icons-react';

type ConditionField =
  | 'discount_percent'
  | 'total_value'
  | 'product_family'
  | 'billing_type';

type ConditionOperator =
  | 'greater_than'
  | 'less_than'
  | 'equals'
  | 'between';

type ActionType =
  | 'auto_approve'
  | 'route_to_role'
  | 'route_to_user'
  | 'require_multiple';

type RuleCondition = {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
  value2?: string;
};

type RuleAction = {
  type: ActionType;
  target?: string;
  count?: number;
};

type ApprovalRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  action: RuleAction;
};

const CONDITION_FIELD_OPTIONS: Array<{
  value: ConditionField;
  label: string;
}> = [
  { value: 'discount_percent', label: 'Discount %' },
  { value: 'total_value', label: 'Total Deal Value' },
  { value: 'product_family', label: 'Product Family' },
  { value: 'billing_type', label: 'Billing Type' },
];

const OPERATOR_OPTIONS: Array<{
  value: ConditionOperator;
  label: string;
}> = [
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'equals', label: 'equals' },
  { value: 'between', label: 'is between' },
];

const ACTION_TYPE_OPTIONS: Array<{ value: ActionType; label: string }> = [
  { value: 'auto_approve', label: 'Auto-approve' },
  { value: 'route_to_role', label: 'Route to role' },
  { value: 'route_to_user', label: 'Route to user' },
  { value: 'require_multiple', label: 'Require multiple approvers' },
];

const STORAGE_KEY = 'cpq-approval-rules';

const loadRules = (): ApprovalRule[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ApprovalRule[]) : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
};

const saveRules = (rules: ApprovalRule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

const DEFAULT_RULES: ApprovalRule[] = [
  {
    id: 'rule-default-1',
    name: 'Standard discount approval',
    enabled: true,
    priority: 1,
    conditions: [
      { field: 'discount_percent', operator: 'greater_than', value: '15' },
    ],
    action: { type: 'route_to_role', target: 'Sales Manager' },
  },
  {
    id: 'rule-default-2',
    name: 'Large deal VP approval',
    enabled: true,
    priority: 2,
    conditions: [
      { field: 'total_value', operator: 'greater_than', value: '50000' },
    ],
    action: { type: 'route_to_role', target: 'VP Sales' },
  },
  {
    id: 'rule-default-3',
    name: 'Small discount auto-approve',
    enabled: true,
    priority: 3,
    conditions: [
      { field: 'discount_percent', operator: 'less_than', value: '10' },
    ],
    action: { type: 'auto_approve' },
  },
];

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StyledTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: var(--twentyfont-color-primary, #111827);
  margin: 0;
`;

const StyledSubtitle = styled.p`
  font-size: 13px;
  color: var(--twentyfont-color-secondary, #6b7280);
  margin: 4px 0 0;
`;

const StyledAddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--twentycolor-blue, #3b82f6);
  background: transparent;
  color: var(--twentycolor-blue, #3b82f6);
  transition: background 0.15s;

  &:hover {
    background: rgba(59, 130, 246, 0.06);
  }
`;

const StyledRuleCard = styled.div<{ disabled: boolean }>`
  border: 1px solid var(--twentyborder-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  opacity: ${({ disabled }) => (disabled ? 0.55 : 1)};
  transition: opacity 0.2s;
`;

const StyledRuleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--twentybackground-color-secondary, #f9fafb);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--twentybackground-color-tertiary, #f3f4f6);
  }

  @media (max-width: 480px) {
    flex-wrap: wrap;
  }
`;

const StyledGrip = styled.div`
  color: var(--twentyfont-color-tertiary, #9ca3af);
  display: flex;
  cursor: grab;
`;

const StyledRuleName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-primary, #111827);
  flex: 1;
`;

const StyledRuleSummary = styled.span`
  font-size: 12px;
  color: var(--twentyfont-color-secondary, #6b7280);
`;

const StyledToggle = styled.button<{ active: boolean }>`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  position: relative;
  background: ${({ active }) => (active ? '#3b82f6' : '#d1d5db')};
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ active }) => (active ? '18px' : '2px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
  }
`;

const StyledDeleteButton = styled.button`
  display: flex;
  align-items: center;
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--twentyfont-color-tertiary, #9ca3af);
  border-radius: 4px;

  &:hover {
    color: var(--twentycolor-red, #ef4444);
    background: rgba(239, 68, 68, 0.08);
  }
`;

const StyledExpandIcon = styled.div`
  display: flex;
  color: var(--twentyfont-color-tertiary, #9ca3af);
`;

const StyledRuleBody = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-top: 1px solid var(--twentyborder-color, #e5e7eb);
`;

const StyledFieldRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StyledLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary, #6b7280);
  min-width: 80px;
`;

const StyledInput = styled.input`
  border: 1px solid var(--twentyborder-color, #e5e7eb);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--twentyfont-color-primary, #111827);
  outline: none;

  &:focus {
    border-color: var(--twentycolor-blue, #3b82f6);
  }
`;

const StyledSelect = styled.select`
  border: 1px solid var(--twentyborder-color, #e5e7eb);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--twentyfont-color-primary, #111827);
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: var(--twentycolor-blue, #3b82f6);
  }
`;

const StyledConditionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: var(--twentybackground-color-secondary, #f9fafb);
  border-radius: 6px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StyledAddConditionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px dashed var(--twentyborder-color, #e5e7eb);
  border-radius: 4px;
  background: none;
  font-size: 12px;
  color: var(--twentyfont-color-secondary, #6b7280);
  cursor: pointer;

  &:hover {
    background: var(--twentybackground-color-secondary, #f9fafb);
    border-color: var(--twentycolor-blue, #3b82f6);
    color: var(--twentycolor-blue, #3b82f6);
  }
`;

const StyledSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--twentyfont-color-tertiary, #9ca3af);
  margin-bottom: 4px;
`;

const summarizeRule = (rule: ApprovalRule): string => {
  const condParts = rule.conditions.map((c) => {
    const fieldLabel =
      CONDITION_FIELD_OPTIONS.find((f) => f.value === c.field)?.label ??
      c.field;
    const opLabel =
      OPERATOR_OPTIONS.find((o) => o.value === c.operator)?.label ??
      c.operator;
    return `${fieldLabel} ${opLabel} ${c.value}${c.value2 ? ` and ${c.value2}` : ''}`;
  });
  const actionLabel =
    ACTION_TYPE_OPTIONS.find((a) => a.value === rule.action.type)?.label ??
    rule.action.type;
  const target = rule.action.target ? ` → ${rule.action.target}` : '';
  return `If ${condParts.join(' AND ')} → ${actionLabel}${target}`;
};

export const CpqApprovalRulesEditor = () => {
  const [rules, setRules] = useState<ApprovalRule[]>(loadRules);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const persistRules = useCallback((updated: ApprovalRule[]) => {
    setRules(updated);
    saveRules(updated);
  }, []);

  const addRule = useCallback(() => {
    const newRule: ApprovalRule = {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      enabled: true,
      priority: rules.length + 1,
      conditions: [
        {
          field: 'discount_percent',
          operator: 'greater_than',
          value: '15',
        },
      ],
      action: { type: 'route_to_role', target: 'Sales Manager' },
    };
    persistRules([...rules, newRule]);
    setExpandedId(newRule.id);
  }, [rules, persistRules]);

  const updateRule = useCallback(
    (id: string, updates: Partial<ApprovalRule>) => {
      persistRules(
        rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
    },
    [rules, persistRules],
  );

  const deleteRule = useCallback(
    (id: string) => {
      persistRules(rules.filter((r) => r.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
      }
    },
    [rules, persistRules, expandedId],
  );

  const toggleEnabled = useCallback(
    (id: string) => {
      const rule = rules.find((r) => r.id === id);
      if (rule) {
        updateRule(id, { enabled: !rule.enabled });
      }
    },
    [rules, updateRule],
  );

  const updateCondition = useCallback(
    (ruleId: string, condIndex: number, updates: Partial<RuleCondition>) => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;
      const updatedConditions = [...rule.conditions];
      updatedConditions[condIndex] = {
        ...updatedConditions[condIndex],
        ...updates,
      };
      updateRule(ruleId, { conditions: updatedConditions });
    },
    [rules, updateRule],
  );

  const addCondition = useCallback(
    (ruleId: string) => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;
      updateRule(ruleId, {
        conditions: [
          ...rule.conditions,
          {
            field: 'discount_percent',
            operator: 'greater_than',
            value: '0',
          },
        ],
      });
    },
    [rules, updateRule],
  );

  const removeCondition = useCallback(
    (ruleId: string, condIndex: number) => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule || rule.conditions.length <= 1) return;
      updateRule(ruleId, {
        conditions: rule.conditions.filter((_, i) => i !== condIndex),
      });
    },
    [rules, updateRule],
  );

  const updateAction = useCallback(
    (ruleId: string, updates: Partial<RuleAction>) => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;
      updateRule(ruleId, { action: { ...rule.action, ...updates } });
    },
    [rules, updateRule],
  );

  return (
    <StyledContainer>
      <StyledHeader>
        <div>
          <StyledTitle>Approval Rules</StyledTitle>
          <StyledSubtitle>
            Configure when quotes need approval and who approves them.
          </StyledSubtitle>
        </div>
        <StyledAddButton onClick={addRule}>
          <IconPlus size={14} /> Add Rule
        </StyledAddButton>
      </StyledHeader>

      {rules.map((rule) => {
        const isExpanded = expandedId === rule.id;

        return (
          <StyledRuleCard key={rule.id} disabled={!rule.enabled}>
            <StyledRuleHeader
              onClick={() =>
                setExpandedId(isExpanded ? null : rule.id)
              }
            >
              <StyledGrip>
                <IconGripVertical size={14} />
              </StyledGrip>
              <StyledRuleName>{rule.name}</StyledRuleName>
              <StyledRuleSummary>{summarizeRule(rule)}</StyledRuleSummary>
              <StyledToggle
                active={rule.enabled}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleEnabled(rule.id);
                }}
                aria-label={
                  rule.enabled ? 'Disable rule' : 'Enable rule'
                }
              />
              <StyledDeleteButton
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRule(rule.id);
                }}
                aria-label="Delete rule"
              >
                <IconTrash size={14} />
              </StyledDeleteButton>
              <StyledExpandIcon>
                {isExpanded ? (
                  <IconChevronUp size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )}
              </StyledExpandIcon>
            </StyledRuleHeader>

            {isExpanded && (
              <StyledRuleBody>
                <StyledFieldRow>
                  <StyledLabel>Rule Name</StyledLabel>
                  <StyledInput
                    value={rule.name}
                    onChange={(e) =>
                      updateRule(rule.id, { name: e.target.value })
                    }
                    style={{ flex: 1 }}
                  />
                </StyledFieldRow>

                <StyledSectionLabel>Conditions (AND)</StyledSectionLabel>
                {rule.conditions.map((cond, condIndex) => (
                  <StyledConditionRow key={condIndex}>
                    <StyledSelect
                      value={cond.field}
                      onChange={(e) =>
                        updateCondition(rule.id, condIndex, {
                          field: e.target.value as ConditionField,
                        })
                      }
                    >
                      {CONDITION_FIELD_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </StyledSelect>
                    <StyledSelect
                      value={cond.operator}
                      onChange={(e) =>
                        updateCondition(rule.id, condIndex, {
                          operator: e.target.value as ConditionOperator,
                        })
                      }
                    >
                      {OPERATOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </StyledSelect>
                    <StyledInput
                      value={cond.value}
                      onChange={(e) =>
                        updateCondition(rule.id, condIndex, {
                          value: e.target.value,
                        })
                      }
                      style={{ width: 100 }}
                    />
                    {cond.operator === 'between' && (
                      <>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          and
                        </span>
                        <StyledInput
                          value={cond.value2 ?? ''}
                          onChange={(e) =>
                            updateCondition(rule.id, condIndex, {
                              value2: e.target.value,
                            })
                          }
                          style={{ width: 100 }}
                        />
                      </>
                    )}
                    {rule.conditions.length > 1 && (
                      <StyledDeleteButton
                        onClick={() =>
                          removeCondition(rule.id, condIndex)
                        }
                        aria-label="Remove condition"
                      >
                        <IconTrash size={12} />
                      </StyledDeleteButton>
                    )}
                  </StyledConditionRow>
                ))}
                <StyledAddConditionButton
                  onClick={() => addCondition(rule.id)}
                >
                  <IconPlus size={12} /> Add condition
                </StyledAddConditionButton>

                <StyledSectionLabel>Action</StyledSectionLabel>
                <StyledFieldRow>
                  <StyledSelect
                    value={rule.action.type}
                    onChange={(e) =>
                      updateAction(rule.id, {
                        type: e.target.value as ActionType,
                      })
                    }
                  >
                    {ACTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </StyledSelect>
                  {(rule.action.type === 'route_to_role' ||
                    rule.action.type === 'route_to_user') && (
                    <StyledInput
                      placeholder={
                        rule.action.type === 'route_to_role'
                          ? 'Role name'
                          : 'User email'
                      }
                      value={rule.action.target ?? ''}
                      onChange={(e) =>
                        updateAction(rule.id, {
                          target: e.target.value,
                        })
                      }
                      style={{ flex: 1 }}
                    />
                  )}
                  {rule.action.type === 'require_multiple' && (
                    <StyledInput
                      type="number"
                      min={2}
                      placeholder="# approvers"
                      value={rule.action.count ?? 2}
                      onChange={(e) =>
                        updateAction(rule.id, {
                          count: parseInt(e.target.value, 10) || 2,
                        })
                      }
                      style={{ width: 100 }}
                    />
                  )}
                </StyledFieldRow>
              </StyledRuleBody>
            )}
          </StyledRuleCard>
        );
      })}

      {rules.length === 0 && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--twentyfont-color-secondary, #6b7280)',
            fontSize: 13,
          }}
        >
          No approval rules configured. Click "Add Rule" to create
          your first rule.
        </div>
      )}
    </StyledContainer>
  );
};
