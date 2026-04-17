import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';

type QuoteTemplateConfig = {
  logoUrl: string;
  primaryColor: string;
  companyName: string;
  companyAddress: string;
  footerText: string;
  termsText: string;
  showDiscountColumn: boolean;
  showSkuColumn: boolean;
  showDescriptionColumn: boolean;
};

type CpqTemplateEditorProps = {
  templateName: string;
  initialConfig: Partial<QuoteTemplateConfig>;
  onSave: (name: string, config: QuoteTemplateConfig) => void;
  onCancel: () => void;
};

const DEFAULT_CONFIG: QuoteTemplateConfig = {
  logoUrl: '',
  primaryColor: '#1a56db',
  companyName: '',
  companyAddress: '',
  footerText: '',
  termsText: '',
  showDiscountColumn: true,
  showSkuColumn: false,
  showDescriptionColumn: true,
};

const StyledContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 1200px;
`;

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledPanelTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const StyledFieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledInput = styled.input`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: 8px 12px;
  font-size: 14px;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.color.blue};
    border-color: transparent;
  }
`;

const StyledTextarea = styled.textarea`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: 8px 12px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.color.blue};
    border-color: transparent;
  }
`;

const StyledColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledColorInput = styled.input`
  width: 40px;
  height: 40px;
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  padding: 2px;
  cursor: pointer;
`;

const StyledColorHex = styled.span`
  font-size: 13px;
  font-family: monospace;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
`;

const StyledCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const StyledDivider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  margin: 4px 0;
`;

const StyledActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  grid-column: 1 / -1;
`;

const StyledButton = styled.button<{ variant?: 'primary' }>`
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.border.radius.sm};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ theme, variant }) =>
    variant === 'primary' ? 'transparent' : theme.border.color.medium};
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.color.blue : 'white'};
  color: ${({ variant }) => (variant === 'primary' ? 'white' : 'inherit')};

  &:hover {
    opacity: 0.9;
  }
`;

// Preview components
const StyledPreview = styled.div`
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  padding: 24px;
  background: white;
  font-size: 12px;
  min-height: 500px;
`;

const StyledPreviewHeader = styled.div<{ accentColor: string }>`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 3px solid ${({ accentColor }) => accentColor};
  margin-bottom: 16px;
`;

const StyledPreviewLogo = styled.div`
  width: 80px;
  height: 40px;
  background: ${({ theme }) => theme.border.color.light};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: ${({ theme }) => theme.font.color.tertiary};
`;

const StyledPreviewCompany = styled.div`
  text-align: right;
  font-size: 11px;
  color: ${({ theme }) => theme.font.color.secondary};
`;

const StyledPreviewTitle = styled.div<{ accentColor: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${({ accentColor }) => accentColor};
  margin-bottom: 12px;
`;

const StyledPreviewTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 11px;
`;

const StyledPreviewTh = styled.th<{ accentColor: string }>`
  text-align: left;
  padding: 6px 8px;
  background: ${({ accentColor }) => accentColor}15;
  color: ${({ accentColor }) => accentColor};
  font-weight: 600;
  font-size: 10px;
`;

const StyledPreviewTd = styled.td`
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
`;

const StyledPreviewFooter = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 10px;
  color: ${({ theme }) => theme.font.color.tertiary};
  text-align: center;
`;

const StyledPreviewTerms = styled.div`
  margin-top: 12px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 10px;
  color: ${({ theme }) => theme.font.color.secondary};
  white-space: pre-wrap;
`;

// Sample data for the preview
const SAMPLE_LINES = [
  { sku: 'PLAT-001', product: 'Platform Pro', desc: 'Annual subscription', qty: 1, price: '$60,000', discount: '15%', net: '$51,000' },
  { sku: 'ANA-001', product: 'Analytics Module', desc: '5 user seats', qty: 5, price: '$6,000', discount: '—', net: '$30,000' },
  { sku: 'IMP-001', product: 'Implementation', desc: 'Onboarding + config', qty: 1, price: '$15,000', discount: '—', net: '$15,000' },
];

// Template editor with live PDF preview.
// Left panel: form fields for template config.
// Right panel: live preview showing how the PDF will look.
export const CpqTemplateEditor = ({
  templateName,
  initialConfig,
  onSave,
  onCancel,
}: CpqTemplateEditorProps) => {
  const [name, setName] = useState(templateName);
  const [config, setConfig] = useState<QuoteTemplateConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const updateConfig = useCallback(
    <TKey extends keyof QuoteTemplateConfig>(field: TKey, value: QuoteTemplateConfig[TKey]) => {
      setConfig((previous) => ({ ...previous, [field]: value }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSave(name, config);
  }, [name, config, onSave]);

  return (
    <>
      <StyledContainer>
        {/* Left: Config form */}
        <StyledPanel>
          <StyledPanelTitle>Template Settings</StyledPanelTitle>

          <StyledFieldGroup>
            <StyledLabel htmlFor="tpl-name">Template Name</StyledLabel>
            <StyledInput
              id="tpl-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Standard, Enterprise, Partner"
            />
          </StyledFieldGroup>

          <StyledDivider />

          <StyledFieldGroup>
            <StyledLabel htmlFor="tpl-logo">Logo URL</StyledLabel>
            <StyledInput
              id="tpl-logo"
              value={config.logoUrl}
              onChange={(event) => updateConfig('logoUrl', event.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </StyledFieldGroup>

          <StyledFieldGroup>
            <StyledLabel>Brand Color</StyledLabel>
            <StyledColorRow>
              <StyledColorInput
                type="color"
                value={config.primaryColor}
                onChange={(event) => updateConfig('primaryColor', event.target.value)}
                aria-label="Brand color"
              />
              <StyledColorHex>{config.primaryColor}</StyledColorHex>
            </StyledColorRow>
          </StyledFieldGroup>

          <StyledDivider />

          <StyledFieldGroup>
            <StyledLabel htmlFor="tpl-company">Company Name</StyledLabel>
            <StyledInput
              id="tpl-company"
              value={config.companyName}
              onChange={(event) => updateConfig('companyName', event.target.value)}
              placeholder="Acme Corp"
            />
          </StyledFieldGroup>

          <StyledFieldGroup>
            <StyledLabel htmlFor="tpl-address">Company Address</StyledLabel>
            <StyledTextarea
              id="tpl-address"
              value={config.companyAddress}
              onChange={(event) => updateConfig('companyAddress', event.target.value)}
              placeholder="123 Main St&#10;Toronto, ON M5V 1A1&#10;Canada"
              rows={3}
            />
          </StyledFieldGroup>

          <StyledDivider />

          <StyledFieldGroup>
            <StyledLabel>Line Item Columns</StyledLabel>
            <StyledToggleRow>
              <StyledCheckbox
                type="checkbox"
                checked={config.showSkuColumn}
                onChange={(event) => updateConfig('showSkuColumn', event.target.checked)}
              />
              Show SKU column
            </StyledToggleRow>
            <StyledToggleRow>
              <StyledCheckbox
                type="checkbox"
                checked={config.showDescriptionColumn}
                onChange={(event) => updateConfig('showDescriptionColumn', event.target.checked)}
              />
              Show Description column
            </StyledToggleRow>
            <StyledToggleRow>
              <StyledCheckbox
                type="checkbox"
                checked={config.showDiscountColumn}
                onChange={(event) => updateConfig('showDiscountColumn', event.target.checked)}
              />
              Show Discount column
            </StyledToggleRow>
          </StyledFieldGroup>

          <StyledDivider />

          <StyledFieldGroup>
            <StyledLabel htmlFor="tpl-terms">Terms &amp; Conditions</StyledLabel>
            <StyledTextarea
              id="tpl-terms"
              value={config.termsText}
              onChange={(event) => updateConfig('termsText', event.target.value)}
              placeholder="Payment due within 30 days of invoice date.&#10;Prices valid for 30 days from quote date.&#10;Subject to standard service agreement."
              rows={4}
            />
          </StyledFieldGroup>

          <StyledFieldGroup>
            <StyledLabel htmlFor="tpl-footer">Footer Text</StyledLabel>
            <StyledInput
              id="tpl-footer"
              value={config.footerText}
              onChange={(event) => updateConfig('footerText', event.target.value)}
              placeholder="Thank you for your business"
            />
          </StyledFieldGroup>
        </StyledPanel>

        {/* Right: Live preview */}
        <StyledPanel>
          <StyledPanelTitle>Live Preview</StyledPanelTitle>

          <StyledPreview>
            <StyledPreviewHeader accentColor={config.primaryColor}>
              <div>
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    style={{ maxHeight: 40, maxWidth: 120 }}
                  />
                ) : (
                  <StyledPreviewLogo>LOGO</StyledPreviewLogo>
                )}
              </div>
              <StyledPreviewCompany>
                {config.companyName && <strong>{config.companyName}</strong>}
                {config.companyAddress && (
                  <div style={{ whiteSpace: 'pre-line', marginTop: 4 }}>
                    {config.companyAddress}
                  </div>
                )}
              </StyledPreviewCompany>
            </StyledPreviewHeader>

            <StyledPreviewTitle accentColor={config.primaryColor}>
              QUOTE Q-2026-0042
            </StyledPreviewTitle>

            <div style={{ fontSize: 11, marginBottom: 12 }}>
              <div><strong>Customer:</strong> Acme Corp</div>
              <div><strong>Date:</strong> Apr 12, 2026</div>
              <div><strong>Valid Until:</strong> May 12, 2026</div>
              <div><strong>Term:</strong> 12 months</div>
            </div>

            <StyledPreviewTable>
              <thead>
                <tr>
                  {config.showSkuColumn && (
                    <StyledPreviewTh accentColor={config.primaryColor}>SKU</StyledPreviewTh>
                  )}
                  <StyledPreviewTh accentColor={config.primaryColor}>Product</StyledPreviewTh>
                  {config.showDescriptionColumn && (
                    <StyledPreviewTh accentColor={config.primaryColor}>Description</StyledPreviewTh>
                  )}
                  <StyledPreviewTh accentColor={config.primaryColor}>Qty</StyledPreviewTh>
                  <StyledPreviewTh accentColor={config.primaryColor}>Price</StyledPreviewTh>
                  {config.showDiscountColumn && (
                    <StyledPreviewTh accentColor={config.primaryColor}>Discount</StyledPreviewTh>
                  )}
                  <StyledPreviewTh accentColor={config.primaryColor}>Net</StyledPreviewTh>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_LINES.map((line) => (
                  <tr key={line.sku}>
                    {config.showSkuColumn && <StyledPreviewTd>{line.sku}</StyledPreviewTd>}
                    <StyledPreviewTd>{line.product}</StyledPreviewTd>
                    {config.showDescriptionColumn && <StyledPreviewTd>{line.desc}</StyledPreviewTd>}
                    <StyledPreviewTd>{line.qty}</StyledPreviewTd>
                    <StyledPreviewTd>{line.price}</StyledPreviewTd>
                    {config.showDiscountColumn && <StyledPreviewTd>{line.discount}</StyledPreviewTd>}
                    <StyledPreviewTd>{line.net}</StyledPreviewTd>
                  </tr>
                ))}
              </tbody>
            </StyledPreviewTable>

            <div style={{ textAlign: 'right', fontSize: 12, marginTop: 8 }}>
              <div>Subtotal: $96,000</div>
              {config.showDiscountColumn && <div>Discount: -$9,000</div>}
              <div style={{ fontSize: 14, fontWeight: 700, color: config.primaryColor }}>
                Grand Total: $96,000
              </div>
            </div>

            {config.termsText && (
              <StyledPreviewTerms>
                <strong>Terms &amp; Conditions</strong>
                <div style={{ marginTop: 4 }}>{config.termsText}</div>
              </StyledPreviewTerms>
            )}

            {config.footerText && (
              <StyledPreviewFooter>{config.footerText}</StyledPreviewFooter>
            )}
          </StyledPreview>
        </StyledPanel>

        <StyledActions>
          <StyledButton onClick={onCancel}>Cancel</StyledButton>
          <StyledButton variant="primary" onClick={handleSave}>
            Save Template
          </StyledButton>
        </StyledActions>
      </StyledContainer>
    </>
  );
};
