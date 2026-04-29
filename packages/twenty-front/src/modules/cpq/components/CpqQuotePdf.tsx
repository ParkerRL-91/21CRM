import { useCallback, useState } from 'react';
import { styled } from '@linaria/react';
import { IconDownload } from '@tabler/icons-react';

type QuoteLineItem = {
  productName: string;
  quantity: number;
  listPrice: string;
  discountPercent: number;
  netTotal: string | null;
  billingType?: 'recurring' | 'one_time';
};

type QuotePdfConfig = {
  companyName?: string;
  companyLogo?: string;
  brandColor?: string;
  terms?: string;
};

type CpqQuotePdfProps = {
  quoteName: string;
  quoteDate?: string;
  quoteStatus: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  config?: QuotePdfConfig;
};

const StyledPdfButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--twentyborder-color);
  background: var(--twentybackground-color-secondary);
  color: var(--twentyfont-color-primary);
  cursor: pointer;

  &:hover {
    background: var(--twentybackground-color-tertiary, #e5e7eb);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledPdfActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
`;

const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return '$0.00';
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

export const CpqQuotePdf = ({
  quoteName,
  quoteDate,
  quoteStatus,
  lineItems,
  subtotal,
  config,
}: CpqQuotePdfProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdfHtml = useCallback((): string => {
    const brandColor = config?.brandColor ?? '#3b82f6';
    const escapedQuoteName = (quoteName || 'Untitled Quote')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const escapedCompanyName = (config?.companyName ?? '21CRM')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html>
<head>
  <title>${escapedQuoteName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #111827; }
    .header { border-bottom: 3px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 24px; }
    .company { font-size: 20px; font-weight: 700; color: ${brandColor}; }
    .quote-title { font-size: 16px; font-weight: 600; margin-top: 8px; }
    .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { text-align: left; padding: 8px 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .total-row { border-top: 2px solid #111827; font-weight: 700; font-size: 16px; }
    .terms { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
    .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #f3f4f6; }
    .billing-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }
    .billing-recurring { background: rgba(16, 185, 129, 0.1); color: #059669; }
    .billing-one-time { background: rgba(139, 92, 246, 0.1); color: #7c3aed; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    ${config?.companyLogo ? `<img src="${config.companyLogo}" alt="" style="max-height:40px;margin-bottom:8px;" />` : ''}
    <div class="company">${escapedCompanyName}</div>
    <div class="quote-title">${escapedQuoteName}</div>
    <div class="meta">Date: ${quoteDate ?? new Date().toLocaleDateString()} | Status: <span class="status">${quoteStatus}</span></div>
  </div>
  <table>
    <thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>List Price</th><th>Discount</th><th style="text-align:right">Net Total</th></tr></thead>
    <tbody>
      ${lineItems
        .map((item) => {
          const billingLabel =
            item.billingType === 'one_time' ? 'One-Time' : 'Recurring';
          const billingClass =
            item.billingType === 'one_time'
              ? 'billing-one-time'
              : 'billing-recurring';
          return `<tr>
        <td>${(item.productName || '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td><span class="billing-badge ${billingClass}">${billingLabel}</span></td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.listPrice)}</td>
        <td>${item.discountPercent}%</td>
        <td style="text-align:right">${item.netTotal ? formatCurrency(item.netTotal) : '—'}</td>
      </tr>`;
        })
        .join('')}
    </tbody>
    <tfoot>
      <tr class="total-row"><td colspan="5">Total</td><td style="text-align:right">${formatCurrency(subtotal)}</td></tr>
    </tfoot>
  </table>
  ${config?.terms ? `<div class="terms"><strong>Terms &amp; Conditions</strong><br/>${config.terms.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}</div>` : ''}
</body>
</html>`;
  }, [quoteName, quoteDate, quoteStatus, lineItems, subtotal, config]);

  const handleGeneratePdf = useCallback(() => {
    setIsGenerating(true);
    const html = generatePdfHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setIsGenerating(false);
      }, 500);
    } else {
      setIsGenerating(false);
    }
  }, [generatePdfHtml]);

  return (
    <StyledPdfActions>
      <StyledPdfButton onClick={handleGeneratePdf} disabled={isGenerating}>
        <IconDownload size={16} />
        {isGenerating ? 'Generating...' : 'Generate PDF'}
      </StyledPdfButton>
    </StyledPdfActions>
  );
};
