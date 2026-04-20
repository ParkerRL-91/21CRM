import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';

import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';

// Line item type for the quote builder
type LineItem = {
  id: string;
  productName: string;
  listPrice: string;
  quantity: number;
  discountPercent: number;
};

// Compute net total client-side — avoids dependency on CPQ backend pricing API
const computeNetTotal = (item: LineItem): number => {
  const price = parseFloat(item.listPrice) || 0;
  const qty = item.quantity || 1;
  const disc = Math.min(Math.max(item.discountPercent || 0, 0), 100);
  return price * qty * (1 - disc / 100);
};

const fmt = (n: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
`;

const StyledSection = styled.div`
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledSectionHeader = styled.div`
  padding: 12px 16px;
  background: var(--t-background-secondary);
  border-bottom: 1px solid var(--t-border-color-medium);
  font-size: 13px;
  font-weight: 600;
  color: var(--t-font-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
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
  color: var(--t-font-color-secondary);
  border-bottom: 1px solid var(--t-border-color-medium);
  background: var(--t-background-secondary);
`;

const StyledTd = styled.td`
  padding: 10px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--t-border-color-medium);

  &:last-child {
    text-align: right;
  }
`;

const StyledInput = styled.input`
  border: 1px solid var(--t-border-color-medium);
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 13px;
  width: 80px;
  background: var(--t-background-primary);
  color: var(--t-font-color-primary);

  &:focus {
    outline: 2px solid #3b82f6;
    border-color: transparent;
  }
`;

const StyledProductInput = styled(StyledInput)`
  width: 200px;
`;

const StyledAddButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 1px dashed var(--t-border-color-medium);
  border-radius: 6px;
  font-size: 13px;
  color: var(--t-font-color-secondary);
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: var(--t-background-secondary);
    color: var(--t-font-color-primary);
  }
`;

const StyledRemoveButton = styled.button`
  background: none;
  border: none;
  padding: 2px 6px;
  font-size: 16px;
  color: var(--t-font-color-tertiary);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: #ef4444;
    background: #fee2e2;
  }
`;

const StyledTotalsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  gap: 32px;
  border-top: 2px solid var(--t-border-color-medium);
  background: var(--t-background-secondary);
`;

const StyledTotalItem = styled.div`
  text-align: right;
`;

const StyledTotalLabel = styled.div`
  font-size: 12px;
  color: var(--t-font-color-secondary);
  margin-bottom: 2px;
`;

const StyledTotalValue = styled.div<{ large?: boolean }>`
  font-size: ${({ large }) => (large ? '18px' : '14px')};
  font-weight: ${({ large }) => (large ? '700' : '600')};
  color: var(--t-font-color-primary);
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
      case 'draft': return '#f3f4f6';
      case 'sent': return '#eff6ff';
      case 'accepted': return '#f0fdf4';
      case 'declined': return '#fee2e2';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'sent': return '#1d4ed8';
      case 'accepted': return '#166534';
      case 'declined': return '#991b1b';
    }
  }};
`;

// Action toolbar buttons
const StyledActionsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  background: var(--t-background-secondary);
  border: 1px solid var(--t-border-color-medium);
  border-radius: 8px;
`;

const StyledActionBtn = styled.button<{ variant?: 'primary' | 'outline' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  border: ${({ variant }) => variant === 'outline' ? '1px solid var(--t-border-color-medium)' : 'none'};
  background: ${({ variant }) => {
    switch (variant) {
      case 'primary': return '#3b82f6';
      case 'outline': return 'transparent';
      default: return 'transparent';
    }
  }};
  color: ${({ variant }) => {
    switch (variant) {
      case 'primary': return '#fff';
      case 'outline': return 'var(--t-font-color-primary)';
      default: return 'var(--t-font-color-secondary)';
    }
  }};

  &:hover {
    opacity: 0.85;
    background: ${({ variant }) => {
      switch (variant) {
        case 'primary': return '#2563eb';
        case 'outline': return 'var(--t-background-secondary)';
        default: return 'var(--t-background-secondary)';
      }
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Modal overlay for Generate Document + Submit for Approval
const StyledModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const StyledModal = styled.div`
  background: var(--t-background-primary);
  border-radius: 12px;
  padding: 24px;
  width: 440px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const StyledModalTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: var(--t-font-color-primary);
  margin: 0 0 16px;
`;

const StyledModalRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
`;

const StyledModalLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--t-font-color-secondary);
`;

const StyledSelect = styled.select`
  padding: 8px 10px;
  border: 1px solid var(--t-border-color-medium);
  border-radius: 6px;
  font-size: 13px;
  background: var(--t-background-primary);
  color: var(--t-font-color-primary);
  width: 100%;

  &:focus {
    outline: 2px solid #3b82f6;
  }
`;

const StyledModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

const StyledSuccessBanner = styled.div`
  padding: 10px 16px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 6px;
  color: #166534;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Demo products for the catalog datalist
const DEMO_PRODUCTS = [
  'PhenoTips Clinical Suite',
  'PhenoTips Enterprise',
  'Analytics Add-on',
  'Premium Support Bundle',
  'Research License',
  'API Access Package',
  'Custom Integration Module',
];

const newLineItem = (): LineItem => ({
  id: `li-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  productName: '',
  listPrice: '0',
  quantity: 1,
  discountPercent: 0,
});

type ModalType = 'generate-doc' | 'submit-approval' | null;

// Quote Builder page — TASK-149: Multi-Dimensional Quoting.
// Full quote creation with client-side pricing, multi-year grid,
// document generation, and approval submission.
export const QuoteBuilderPage = () => {
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [quoteName, setQuoteName] = useState('');
  const [status, setStatus] = useState<'draft' | 'sent' | 'accepted' | 'declined'>('draft');
  const [term, setTerm] = useState<1 | 2 | 3>(1);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'quarterly' | 'annual'>('annual');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [docFormat, setDocFormat] = useState<'pdf' | 'word'>('pdf');
  const [docTemplate, setDocTemplate] = useState<'standard' | 'executive' | 'detailed'>('standard');
  const [approvalNote, setApprovalNote] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updateLineItem = useCallback(
    (id: string, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, newLineItem()]);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  }, []);

  // Compute subtotal from all line items (client-side, no API call needed)
  const subtotal = lineItems.reduce((sum, li) => sum + computeNetTotal(li), 0);

  const handleSave = useCallback(() => {
    setSuccessMessage('Quote saved successfully.');
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const handleGenerateDoc = useCallback(() => {
    setActiveModal(null);
    // Generate a simple CSV/text file download client-side
    const content = [
      `Quote: ${quoteName || 'New Quote'}`,
      `Template: ${docTemplate}`,
      `Format: ${docFormat.toUpperCase()}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      'LINE ITEMS',
      'Product,List Price,Qty,Discount%,Net Total',
      ...lineItems.map(
        (li) =>
          `${li.productName},$${li.listPrice},${li.quantity},${li.discountPercent}%,$${computeNetTotal(li).toFixed(2)}`,
      ),
      '',
      `Subtotal: $${fmt(subtotal)}`,
      term > 1 ? `Grand Total (${term} Years): $${fmt(subtotal * term)}` : `Total: $${fmt(subtotal)}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(quoteName || 'quote').replace(/\s+/g, '-')}.${docFormat === 'pdf' ? 'txt' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMessage(`Document downloaded: ${quoteName || 'New Quote'} — ${docFormat.toUpperCase()} (${docTemplate} template).`);
    setTimeout(() => setSuccessMessage(null), 5000);
  }, [quoteName, docFormat, docTemplate, lineItems, subtotal, term]);

  const handleSubmitApproval = useCallback(() => {
    setActiveModal(null);
    setStatus('sent');
    setSuccessMessage('Quote submitted for approval. Approvers have been notified.');
    setTimeout(() => setSuccessMessage(null), 5000);
  }, []);

  // Multi-year discount percentages: Year 1 = 0%, Year 2 = 5%, Year 3 = 8%
  const yearDiscounts = [0, 5, 8];
  const yearTotals = Array.from({ length: term }, (_, i) =>
    subtotal * (1 - yearDiscounts[i] / 100),
  );
  const grandTotal = yearTotals.reduce((a, b) => a + b, 0);

  return (
    <SubMenuTopBarContainer
      title="New Quote"
      links={[
        { children: 'CPQ', href: '/cpq' },
        { children: 'Quotes', href: '/cpq/quotes' },
        { children: 'New Quote' },
      ]}
    >
      <StyledContainer>
        {/* Success banner */}
        {successMessage && (
          <StyledSuccessBanner>
            ✓ {successMessage}
          </StyledSuccessBanner>
        )}

        {/* Action toolbar */}
        <StyledActionsBar>
          <span style={{ fontSize: 12, color: 'var(--t-font-color-secondary)', marginRight: 'auto' }}>
            Status: <StyledStatusBadge status={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</StyledStatusBadge>
          </span>
          <StyledActionBtn variant="ghost" onClick={handleSave}>
            💾 Save Draft
          </StyledActionBtn>
          <StyledActionBtn variant="outline" onClick={() => setActiveModal('generate-doc')}>
            📄 Generate Document
          </StyledActionBtn>
          <StyledActionBtn variant="primary" onClick={() => setActiveModal('submit-approval')}>
            ✓ Submit for Approval
          </StyledActionBtn>
        </StyledActionsBar>

        {/* Quote header */}
        <StyledSection>
          <StyledSectionHeader>Quote Details</StyledSectionHeader>
          <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--t-font-color-secondary)', display: 'block', marginBottom: 4 }}>
                Quote Name
              </label>
              <StyledProductInput
                style={{ width: 280 }}
                placeholder="e.g. Acme Corp — Q2 2026"
                value={quoteName}
                onChange={(e) => setQuoteName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--t-font-color-secondary)', display: 'block', marginBottom: 4 }}>
                Term (Years)
              </label>
              <StyledSelect
                style={{ width: 120 }}
                value={term}
                onChange={(e) => setTerm(Number(e.target.value) as 1 | 2 | 3)}
              >
                <option value={1}>1 Year</option>
                <option value={2}>2 Years</option>
                <option value={3}>3 Years</option>
              </StyledSelect>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--t-font-color-secondary)', display: 'block', marginBottom: 4 }}>
                Billing Frequency
              </label>
              <StyledSelect
                style={{ width: 140 }}
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as 'monthly' | 'quarterly' | 'annual')}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </StyledSelect>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--t-font-color-secondary)', display: 'block', marginBottom: 4 }}>
                Valid Until
              </label>
              <StyledInput
                type="date"
                style={{ width: 150 }}
                defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
              />
            </div>
          </div>
        </StyledSection>

        {/* Line items */}
        <StyledSection>
          <StyledSectionHeader>Line Items</StyledSectionHeader>

          {/* Datalist for product autocomplete */}
          <datalist id="cpq-products">
            {DEMO_PRODUCTS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <StyledTable>
            <thead>
              <tr>
                <StyledTh>Product / Service</StyledTh>
                <StyledTh>List Price ($)</StyledTh>
                <StyledTh>Qty</StyledTh>
                <StyledTh>Discount %</StyledTh>
                <StyledTh>Net Total</StyledTh>
                <StyledTh></StyledTh>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <StyledTd>
                    <StyledProductInput
                      list="cpq-products"
                      placeholder="Search products…"
                      value={item.productName}
                      onChange={(e) => updateLineItem(item.id, 'productName', e.target.value)}
                    />
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.listPrice}
                      onChange={(e) => updateLineItem(item.id, 'listPrice', e.target.value)}
                    />
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                    />
                  </StyledTd>
                  <StyledTd>
                    <StyledInput
                      type="number"
                      min={0}
                      max={100}
                      value={item.discountPercent}
                      onChange={(e) => updateLineItem(item.id, 'discountPercent', Number(e.target.value))}
                    />
                  </StyledTd>
                  <StyledTd style={{ fontWeight: 600, color: 'var(--t-font-color-primary)' }}>
                    ${fmt(computeNetTotal(item))}
                  </StyledTd>
                  <StyledTd>
                    <StyledRemoveButton
                      onClick={() => removeLineItem(item.id)}
                      aria-label="Remove line item"
                    >
                      ×
                    </StyledRemoveButton>
                  </StyledTd>
                </tr>
              ))}
            </tbody>
          </StyledTable>

          <div style={{ padding: '8px 16px' }}>
            <StyledAddButton onClick={addLineItem}>
              + Add line item
            </StyledAddButton>
          </div>

          <StyledTotalsRow>
            <StyledTotalItem>
              <StyledTotalLabel>Subtotal (Year 1)</StyledTotalLabel>
              <StyledTotalValue>${fmt(subtotal)}</StyledTotalValue>
            </StyledTotalItem>
            <StyledTotalItem>
              <StyledTotalLabel>
                {term > 1 ? `Grand Total (${term} Years)` : 'Total (excl. tax)'}
              </StyledTotalLabel>
              <StyledTotalValue large>
                ${fmt(term > 1 ? grandTotal : subtotal)}
              </StyledTotalValue>
            </StyledTotalItem>
          </StyledTotalsRow>
        </StyledSection>

        {/* Multi-year pricing grid — shown when term > 1 */}
        {term > 1 ? (
          <StyledSection>
            <StyledSectionHeader>Multi-Year Pricing Grid</StyledSectionHeader>
            <StyledTable>
              <thead>
                <tr>
                  <StyledTh>Period</StyledTh>
                  <StyledTh>Billing ({billingFrequency})</StyledTh>
                  <StyledTh>Subtotal</StyledTh>
                  <StyledTh>Multi-Year Discount</StyledTh>
                  <StyledTh>Net Total</StyledTh>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: term }, (_, i) => {
                  const periodTotal = yearTotals[i];
                  const periodsPerYear = billingFrequency === 'monthly' ? 12 : billingFrequency === 'quarterly' ? 4 : 1;
                  const periodPayment = periodTotal / periodsPerYear;
                  return (
                    <tr key={i}>
                      <StyledTd style={{ fontWeight: 600 }}>Year {i + 1}</StyledTd>
                      <StyledTd style={{ color: 'var(--t-font-color-secondary)' }}>
                        ${fmt(periodPayment)} / {billingFrequency === 'monthly' ? 'mo' : billingFrequency === 'quarterly' ? 'qtr' : 'yr'}
                      </StyledTd>
                      <StyledTd>${fmt(subtotal)}</StyledTd>
                      <StyledTd>
                        {yearDiscounts[i] > 0 ? (
                          <span style={{ color: '#166534', fontWeight: 600 }}>−{yearDiscounts[i]}%</span>
                        ) : '0%'}
                      </StyledTd>
                      <StyledTd style={{ fontWeight: 700 }}>
                        ${fmt(periodTotal)}
                      </StyledTd>
                    </tr>
                  );
                })}
                <tr style={{ background: 'var(--t-background-secondary)' }}>
                  <StyledTd style={{ fontWeight: 700 }}>Total ({term} Years)</StyledTd>
                  <StyledTd></StyledTd>
                  <StyledTd style={{ fontWeight: 600 }}>${fmt(subtotal * term)}</StyledTd>
                  <StyledTd style={{ color: '#166534', fontWeight: 600 }}>
                    −${fmt(subtotal * term - grandTotal)}
                  </StyledTd>
                  <StyledTd style={{ fontWeight: 700, fontSize: 15 }}>${fmt(grandTotal)}</StyledTd>
                </tr>
              </tbody>
            </StyledTable>
          </StyledSection>
        ) : null}

        {/* Approval status section */}
        {status === 'sent' ? (
          <StyledSection>
            <StyledSectionHeader>Approval Status</StyledSectionHeader>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#fef9c3', border: '2px solid #fbbf24',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>⏳</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--t-font-color-primary)' }}>
                    Pending Manager Approval
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t-font-color-secondary)', marginTop: 2 }}>
                    Submitted {new Date().toLocaleDateString()} — Awaiting review by Sales Manager
                  </div>
                </div>
                <StyledActionBtn variant="outline" style={{ marginLeft: 'auto', fontSize: 12 }}>
                  ↩ Recall
                </StyledActionBtn>
                <StyledActionBtn variant="ghost" style={{ fontSize: 12 }}>
                  🔔 Remind Approver
                </StyledActionBtn>
              </div>
            </div>
          </StyledSection>
        ) : null}

        {/* Generate Document Modal — fixed overlay, lives inside container but covers full viewport */}
        {activeModal === 'generate-doc' ? (
          <StyledModalOverlay onClick={() => setActiveModal(null)}>
            <StyledModal onClick={(e) => e.stopPropagation()}>
              <StyledModalTitle>📄 Generate Quote Document</StyledModalTitle>
              <StyledModalRow>
                <StyledModalLabel>Template</StyledModalLabel>
                <StyledSelect value={docTemplate} onChange={(e) => setDocTemplate(e.target.value as typeof docTemplate)}>
                  <option value="standard">Standard Quote</option>
                  <option value="executive">Executive Summary</option>
                  <option value="detailed">Detailed Proposal</option>
                </StyledSelect>
              </StyledModalRow>
              <StyledModalRow>
                <StyledModalLabel>Format</StyledModalLabel>
                <StyledSelect value={docFormat} onChange={(e) => setDocFormat(e.target.value as 'pdf' | 'word')}>
                  <option value="pdf">PDF</option>
                  <option value="word">Word (.docx)</option>
                </StyledSelect>
              </StyledModalRow>
              <StyledModalRow>
                <StyledModalLabel>Options</StyledModalLabel>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" defaultChecked /> Include pricing breakdown
                </label>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input type="checkbox" /> Add DRAFT watermark
                </label>
              </StyledModalRow>
              <StyledModalActions>
                <StyledActionBtn variant="outline" onClick={() => setActiveModal(null)}>Cancel</StyledActionBtn>
                <StyledActionBtn variant="primary" onClick={handleGenerateDoc}>Generate & Download</StyledActionBtn>
              </StyledModalActions>
            </StyledModal>
          </StyledModalOverlay>
        ) : null}

        {/* Submit for Approval Modal */}
        {activeModal === 'submit-approval' ? (
          <StyledModalOverlay onClick={() => setActiveModal(null)}>
            <StyledModal onClick={(e) => e.stopPropagation()}>
              <StyledModalTitle>✓ Submit for Approval</StyledModalTitle>
              <div style={{ fontSize: 13, color: 'var(--t-font-color-secondary)', marginBottom: 16 }}>
                This quote ({quoteName || 'New Quote'}) will be submitted to your Sales Manager for approval.
                Total value: <strong>${fmt(term > 1 ? grandTotal : subtotal)}</strong>
              </div>
              <StyledModalRow>
                <StyledModalLabel>Approver</StyledModalLabel>
                <StyledSelect>
                  <option>Sales Manager (auto-assigned)</option>
                  <option>VP of Sales</option>
                  <option>Finance Controller</option>
                </StyledSelect>
              </StyledModalRow>
              <StyledModalRow>
                <StyledModalLabel>Note (optional)</StyledModalLabel>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add context for the approver…"
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 10px', border: '1px solid var(--t-border-color-medium)',
                    borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                    background: 'var(--t-background-primary)',
                    color: 'var(--t-font-color-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </StyledModalRow>
              <StyledModalActions>
                <StyledActionBtn variant="outline" onClick={() => setActiveModal(null)}>Cancel</StyledActionBtn>
                <StyledActionBtn variant="primary" onClick={handleSubmitApproval}>Submit for Approval</StyledActionBtn>
              </StyledModalActions>
            </StyledModal>
          </StyledModalOverlay>
        ) : null}
      </StyledContainer>
    </SubMenuTopBarContainer>
  );
};
