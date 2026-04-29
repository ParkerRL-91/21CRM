import { useState, useCallback, useEffect, useRef } from 'react';
import { styled } from '@linaria/react';
import { IconX } from '@tabler/icons-react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { CpqPricingCalculator } from '@/cpq/components/CpqPricingCalculator';
import { CpqProductPicker } from '@/cpq/components/CpqProductPicker';
import { CpqAuditTrail } from '@/cpq/components/CpqAuditTrail';
import { CpqApprovalStatus } from '@/cpq/components/CpqApprovalStatus';
import type { ApprovalStep } from '@/cpq/components/CpqApprovalStatus';
import { CpqDiscountGuardrail } from '@/cpq/components/CpqDiscountGuardrail';
import { CpqQuotePdf } from '@/cpq/components/CpqQuotePdf';
import { UnsavedChangesDialog } from '@/cpq/components/UnsavedChangesDialog';
import { useUnsavedChangesWarning } from '@/cpq/hooks/use-unsaved-changes-warning';
import { useCpqPricing } from '@/cpq/hooks/use-cpq-pricing';
import { useCpqCatalog } from '@/cpq/hooks/use-cpq-catalog';
import { useQuoteAuditTrail } from '@/cpq/hooks/use-quote-audit-trail';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useDialogManager } from '@/ui/feedback/dialog-manager/hooks/useDialogManager';
import type { CatalogEntry } from '@/cpq/constants/cpq-phenotips-catalog';

// Line item type for the quote builder
type LineItem = {
  id: string;
  productName: string;
  listPrice: string;
  quantity: number;
  discountPercent: number;
  netTotal: string | null;
  sku: string;
  selectedProduct: CatalogEntry | null;
  billingType: 'recurring' | 'one_time';
};

// TASK-129: Validation error type for preventing invalid quotes
type ValidationError = {
  field: string;
  lineItemId?: string;
  message: string;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const StyledSection = styled.div`
  border: 1px solid var(--twentyborder-color);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledSectionHeader = styled.div`
  padding: 12px 16px;
  background: var(--twentybackground-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
  font-size: 13px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StyledTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--twentyfont-color-secondary);
  border-bottom: 1px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);
`;

const StyledTd = styled.td`
  padding: 10px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--twentyborder-color);

  &:last-child {
    text-align: right;
  }
`;

const StyledInput = styled.input`
  border: 1px solid var(--twentyborder-color);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  width: 80px;

  &:focus {
    outline: 2px solid var(--twentycolor-blue, #3b82f6);
    border-color: transparent;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const StyledProductInput = styled(StyledInput)`
  width: 200px;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const StyledAddButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 1px dashed var(--twentyborder-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--twentyfont-color-secondary);
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: var(--twentybackground-color-secondary);
    color: var(--twentyfont-color-primary);
  }
`;

const StyledRemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 4px;
  color: var(--twentyfont-color-tertiary);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: var(--twentycolor-red, #ef4444);
    background: var(--twentycolor-red-light, #fee2e2);
  }
`;

const StyledTotalsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  gap: 32px;
  border-top: 2px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
`;

const StyledTotalItem = styled.div`
  text-align: right;
`;

const StyledTotalLabel = styled.div`
  font-size: 12px;
  color: var(--twentyfont-color-secondary);
  margin-bottom: 2px;
`;

const StyledTotalValue = styled.div<{ large?: boolean }>`
  font-size: ${({ large }) => (large ? '18px' : '14px')};
  font-weight: ${({ large }) => (large ? '700' : '600')};
  color: var(--twentyfont-color-primary);
`;

const StyledStatusBadge = styled.span<{ status: 'draft' | 'sent' | 'accepted' | 'declined' }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ status }) => {
    switch (status) {
      case 'draft': return 'var(--twentycolor-gray-light, #f3f4f6)';
      case 'sent': return 'var(--twentycolor-blue-light, #eff6ff)';
      case 'accepted': return 'var(--twentycolor-green-light, #f0fdf4)';
      case 'declined': return 'var(--twentycolor-red-light, #fee2e2)';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'draft': return 'var(--twentyfont-color-secondary)';
      case 'sent': return 'var(--twentycolor-blue-dark, #1d4ed8)';
      case 'accepted': return 'var(--twentycolor-green-dark, #166534)';
      case 'declined': return 'var(--twentycolor-red-dark, #991b1b)';
    }
  }};
`;

// TASK-129: Validation error display
const StyledValidationError = styled.div`
  font-size: 11px;
  color: var(--twentycolor-red, #ef4444);
  margin-top: 2px;
`;

// TASK-129: Validation summary banner
const StyledValidationSummary = styled.div`
  padding: 10px 16px;
  border-radius: 6px;
  background: var(--twentycolor-red-light, #fee2e2);
  color: var(--twentycolor-red-dark, #991b1b);
  font-size: 13px;
  font-weight: 600;
`;

// TASK-129: Submit button
const StyledSubmitButton = styled.button`
  padding: 10px 24px;
  background: var(--twentycolor-blue, #3b82f6);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  align-self: flex-end;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }
`;

// TASK-133: Billing type toggle badge
const StyledBillingToggle = styled.button<{ isRecurring: boolean }>`
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  background: ${({ isRecurring }) =>
    isRecurring ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)'};
  color: ${({ isRecurring }) => (isRecurring ? '#059669' : '#7c3aed')};

  &:hover {
    border-color: ${({ isRecurring }) =>
      isRecurring ? '#059669' : '#7c3aed'};
  }
`;

const newLineItem = (): LineItem => ({
  id: `li-${Date.now()}`,
  productName: '',
  listPrice: '0',
  quantity: 1,
  discountPercent: 0,
  netTotal: null,
  sku: '',
  selectedProduct: null,
  billingType: 'recurring',
});

// Helper to find a validation error for a specific field + optional line item
const findFieldError = (
  errors: ValidationError[],
  field: string,
  lineItemId?: string,
): ValidationError | undefined =>
  errors.find(
    (error) => error.field === field && error.lineItemId === lineItemId,
  );

// Quote Builder page — TASK-093.
// Allows users to create a new quote with line items, real-time pricing,
// and status management. Uses CpqPricingCalculator for per-item price preview.
export const QuoteBuilderPage = () => {
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [quoteName, setQuoteName] = useState('');
  const [status] = useState<'draft' | 'sent' | 'accepted' | 'declined'>('draft');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  // TASK-120: Approval status state
  const [approvalStatus, setApprovalStatus] = useState<'draft' | 'pending_approval' | 'approved' | 'rejected' | 'changes_requested'>('draft');
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const { calculatePrice } = useCpqPricing();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { enqueueDialog } = useDialogManager();
  const { products } = useCpqCatalog();
  const { entries: auditEntries, addEntry: addAuditEntry } = useQuoteAuditTrail();
  const hasLoggedCreation = useRef(false);
  const { isBlocked, proceed, cancel } = useUnsavedChangesWarning(isDirty);

  // Log the initial quote creation event once on mount
  useEffect(() => {
    if (!hasLoggedCreation.current) {
      hasLoggedCreation.current = true;
      addAuditEntry({
        userId: 'current',
        userName: 'Current User',
        eventType: 'quote_created',
        description: 'Quote created',
      });
    }
  }, [addAuditEntry]);

  const updateLineItem = useCallback(
    (id: string, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      );
      setIsDirty(true);
    },
    [],
  );

  const recalcLineItem = useCallback(
    async (item: LineItem) => {
      const result = await calculatePrice({
        listPrice: item.listPrice,
        quantity: item.quantity,
        manualDiscountPercent: item.discountPercent || undefined,
      });
      if (result) {
        setLineItems((prev) =>
          prev.map((li) =>
            li.id === item.id ? { ...li, netTotal: result.netTotal } : li,
          ),
        );
      } else {
        enqueueErrorSnackBar({ message: 'Pricing calculation failed' });
      }
    },
    [calculatePrice, enqueueErrorSnackBar],
  );

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, newLineItem()]);
    setIsDirty(true);
    addAuditEntry({
      userId: 'current',
      userName: 'Current User',
      eventType: 'line_item_added',
      description: 'Added new line item',
    });
  }, [addAuditEntry]);

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
    setIsDirty(true);
  }, []);

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) {
      return;
    }
    const item = lineItems.find((li) => li.id === id);
    enqueueDialog({
      title: 'Remove Line Item',
      message: `Remove "${item?.productName || 'this line item'}" from the quote?`,
      buttons: [
        { title: 'Cancel', variant: 'secondary' },
        {
          title: 'Remove',
          variant: 'secondary',
          accent: 'danger',
          onClick: () => {
            removeLineItem(id);
            addAuditEntry({
              userId: 'current',
              userName: 'Current User',
              eventType: 'line_item_removed',
              description: `Removed line item "${item?.productName || 'Untitled'}"`,
            });
          },
          role: 'confirm',
        },
      ],
    });
  };

  // TASK-129: Validate quote before submission
  const validateQuote = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!quoteName.trim()) {
      errors.push({ field: 'quoteName', message: 'Quote name is required' });
    }

    if (lineItems.length === 0) {
      errors.push({ field: 'lineItems', message: 'At least one line item is required' });
    }

    lineItems.forEach((item) => {
      if (!item.productName.trim()) {
        errors.push({ field: 'productName', lineItemId: item.id, message: 'Product is required' });
      }

      const price = parseFloat(item.listPrice);
      if (isNaN(price) || price <= 0) {
        errors.push({ field: 'listPrice', lineItemId: item.id, message: 'List price must be greater than $0' });
      }

      if (item.quantity < 1) {
        errors.push({ field: 'quantity', lineItemId: item.id, message: 'Quantity must be at least 1' });
      }

      if (item.discountPercent < 0 || item.discountPercent > 100) {
        errors.push({ field: 'discountPercent', lineItemId: item.id, message: 'Discount must be between 0% and 100%' });
      }
    });

    return errors;
  }, [quoteName, lineItems]);

  // TASK-129: Handle quote submission with validation
  const handleSubmitQuote = useCallback(() => {
    const errors = validateQuote();
    setValidationErrors(errors);
    if (errors.length === 0) {
      enqueueSuccessSnackBar({ message: 'Quote submitted successfully' });
    }
  }, [validateQuote, enqueueSuccessSnackBar]);

  // TASK-120: Submit quote for approval
  const handleSubmitForApproval = useCallback(() => {
    setApprovalStatus('pending_approval');
    setApprovalSteps([
      {
        id: `step-${Date.now()}`,
        approverName: 'Sales Manager',
        approverRole: 'Manager',
        status: 'pending',
      },
    ]);
    enqueueSuccessSnackBar({ message: 'Quote submitted for approval' });
  }, [enqueueSuccessSnackBar]);

  const subtotal = lineItems.reduce((sum, li) => {
    return sum + parseFloat(li.netTotal ?? '0');
  }, 0);

  // TASK-133: Separate recurring and one-time subtotals
  const recurringSubtotal = lineItems
    .filter((li) => li.billingType === 'recurring')
    .reduce((sum, li) => sum + parseFloat(li.netTotal ?? '0'), 0);
  const oneTimeSubtotal = lineItems
    .filter((li) => li.billingType === 'one_time')
    .reduce((sum, li) => sum + parseFloat(li.netTotal ?? '0'), 0);

  const quoteNameError = findFieldError(validationErrors, 'quoteName');
  const lineItemsError = findFieldError(validationErrors, 'lineItems');

  return (
    <>
    <SubMenuTopBarContainer
      title="New Quote"
      links={[
        { children: 'CPQ', href: '/cpq' },
        { children: 'Quotes', href: '/cpq/quotes' },
        { children: 'New Quote' },
      ]}
    >
      <StyledContainer>
        {/* Quote header */}
        <StyledSection>
          <StyledSectionHeader>Quote Details</StyledSectionHeader>
          <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--twentyfont-color-secondary)', display: 'block', marginBottom: 4 }}>
                Quote Name
              </label>
              <StyledProductInput
                style={{ width: 280 }}
                placeholder="e.g. Acme Corp — Q2 2026"
                value={quoteName}
                onChange={(e) => {
                  setQuoteName(e.target.value);
                  setIsDirty(true);
                }}
              />
              {quoteNameError && (
                <StyledValidationError>{quoteNameError.message}</StyledValidationError>
              )}
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--twentyfont-color-secondary)', display: 'block', marginBottom: 4 }}>
                Status
              </label>
              <StyledStatusBadge status={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</StyledStatusBadge>
            </div>
          </div>
        </StyledSection>

        {/* TASK-120: Approval status */}
        <StyledSection>
          <StyledSectionHeader>Approval Status</StyledSectionHeader>
          <div style={{ padding: 16 }}>
            <CpqApprovalStatus
              status={approvalStatus}
              steps={approvalSteps}
              onSubmitForApproval={handleSubmitForApproval}
              canSubmit={lineItems.length > 0 && validationErrors.length === 0}
            />
          </div>
        </StyledSection>

        {/* Line items */}
        <StyledSection>
          <StyledSectionHeader>Line Items</StyledSectionHeader>
          {lineItemsError && (
            <div style={{ padding: '8px 16px' }}>
              <StyledValidationError>{lineItemsError.message}</StyledValidationError>
            </div>
          )}
          <StyledTableWrapper>
          <StyledTable>
            <thead>
              <tr>
                <StyledTh>Product / Service</StyledTh>
                <StyledTh>Type</StyledTh>
                <StyledTh>List Price</StyledTh>
                <StyledTh>Qty</StyledTh>
                <StyledTh>Discount %</StyledTh>
                <StyledTh>Net Total</StyledTh>
                <StyledTh></StyledTh>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const productNameError = findFieldError(validationErrors, 'productName', item.id);
                const listPriceError = findFieldError(validationErrors, 'listPrice', item.id);
                const quantityError = findFieldError(validationErrors, 'quantity', item.id);
                const discountError = findFieldError(validationErrors, 'discountPercent', item.id);

                return (
                <tr key={item.id}>
                  <StyledTd>
                    <CpqProductPicker
                      products={products}
                      value={item.selectedProduct}
                      onChange={(product) => {
                        const priceFormatted = (
                          product.listPriceAmountMicros / 1_000_000
                        ).toFixed(2);
                        updateLineItem(item.id, 'productName', product.name);
                        updateLineItem(item.id, 'listPrice', priceFormatted);
                        updateLineItem(item.id, 'sku', product.sku);
                        updateLineItem(
                          item.id,
                          'billingType',
                          product.isOneTime ? 'one_time' : 'recurring',
                        );
                        setLineItems((prev) =>
                          prev.map((li) =>
                            li.id === item.id
                              ? { ...li, selectedProduct: product }
                              : li,
                          ),
                        );
                        addAuditEntry({
                          userId: 'current',
                          userName: 'Current User',
                          eventType: 'line_item_edited',
                          description: `Selected product "${product.name}"`,
                          details: {
                            SKU: product.sku,
                            'List Price': `$${priceFormatted}`,
                          },
                        });
                        void recalcLineItem({
                          ...item,
                          productName: product.name,
                          listPrice: priceFormatted,
                        });
                      }}
                      placeholder="Search products..."
                    />
                    {productNameError && (
                      <StyledValidationError>{productNameError.message}</StyledValidationError>
                    )}
                  </StyledTd>
                  <StyledTd>
                    <StyledBillingToggle
                      onClick={() => {
                        const newType =
                          item.billingType === 'recurring'
                            ? 'one_time'
                            : 'recurring';
                        updateLineItem(item.id, 'billingType', newType);
                      }}
                      isRecurring={item.billingType === 'recurring'}
                    >
                      {item.billingType === 'recurring'
                        ? 'Recurring'
                        : 'One-Time'}
                    </StyledBillingToggle>
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.listPrice}
                      onChange={(e) => updateLineItem(item.id, 'listPrice', e.target.value)}
                      onBlur={() => recalcLineItem(item)}
                    />
                    {listPriceError && (
                      <StyledValidationError>{listPriceError.message}</StyledValidationError>
                    )}
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      onBlur={() => recalcLineItem(item)}
                    />
                    {quantityError && (
                      <StyledValidationError>{quantityError.message}</StyledValidationError>
                    )}
                  </StyledTd>
                  <StyledTd>
                    <CpqDiscountGuardrail
                      discountPercent={item.discountPercent}
                      onChange={(value) => updateLineItem(item.id, 'discountPercent', value)}
                      onBlur={() => recalcLineItem(item)}
                    />
                    {discountError && (
                      <StyledValidationError>{discountError.message}</StyledValidationError>
                    )}
                  </StyledTd>
                  <StyledTd>
                    {item.netTotal !== null
                      ? `$${parseFloat(item.netTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </StyledTd>
                  <StyledTd>
                    <StyledRemoveButton
                      onClick={() => handleRemoveLineItem(item.id)}
                      aria-label="Remove line item"
                    >
                      <IconX size={14} />
                    </StyledRemoveButton>
                  </StyledTd>
                </tr>
                );
              })}
            </tbody>
          </StyledTable>
          </StyledTableWrapper>

          <div style={{ padding: '8px 16px' }}>
            <StyledAddButton onClick={addLineItem}>
              + Add line item
            </StyledAddButton>
          </div>

          <StyledTotalsRow>
            {recurringSubtotal > 0 && (
              <StyledTotalItem>
                <StyledTotalLabel>Recurring</StyledTotalLabel>
                <StyledTotalValue>
                  ${recurringSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </StyledTotalValue>
              </StyledTotalItem>
            )}
            {oneTimeSubtotal > 0 && (
              <StyledTotalItem>
                <StyledTotalLabel>One-Time</StyledTotalLabel>
                <StyledTotalValue>
                  ${oneTimeSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </StyledTotalValue>
              </StyledTotalItem>
            )}
            <StyledTotalItem>
              <StyledTotalLabel>Subtotal</StyledTotalLabel>
              <StyledTotalValue>
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </StyledTotalValue>
            </StyledTotalItem>
            <StyledTotalItem>
              <StyledTotalLabel>Total (excl. tax)</StyledTotalLabel>
              <StyledTotalValue large>
                ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </StyledTotalValue>
            </StyledTotalItem>
          </StyledTotalsRow>
        </StyledSection>

        {/* TASK-119: PDF generation */}
        {lineItems.some((li) => li.netTotal !== null) && (
          <CpqQuotePdf
            quoteName={quoteName}
            quoteStatus={status}
            lineItems={lineItems}
            subtotal={subtotal}
          />
        )}

        {/* Pricing preview */}
        <StyledSection>
          <StyledSectionHeader>Pricing Preview</StyledSectionHeader>
          <div style={{ padding: 16 }}>
            <CpqPricingCalculator />
          </div>
        </StyledSection>

        {/* Activity trail — TASK-125 */}
        <StyledSection>
          <StyledSectionHeader>Activity Trail</StyledSectionHeader>
          <div style={{ padding: 16 }}>
            <CpqAuditTrail entries={auditEntries} />
          </div>
        </StyledSection>
        {/* TASK-129: Validation summary + submit */}
        {validationErrors.length > 0 && (
          <StyledValidationSummary>
            {validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''} — fix before submitting
          </StyledValidationSummary>
        )}

        <StyledSubmitButton onClick={handleSubmitQuote}>
          Submit Quote
        </StyledSubmitButton>
      </StyledContainer>
    </SubMenuTopBarContainer>
    <UnsavedChangesDialog
      isOpen={isBlocked}
      onDiscard={proceed}
      onCancel={cancel}
    />
    </>
  );
};
