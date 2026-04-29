import { useEffect, useState } from 'react';
import { styled } from '@linaria/react';
import {
  IconFileText,
  IconListDetails,
  IconFileDescription,
  IconRefresh,
  IconChartBar,
  IconCurrencyDollar,
} from '@tabler/icons-react';

import { useCpqSetup } from '@/cpq/hooks/use-cpq-setup';
import {
  PHENOTIPS_CATALOG_UK,
  PHENOTIPS_CATALOG_US,
  formatListPrice,
  type CatalogEntry,
} from '@/cpq/constants/cpq-phenotips-catalog';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useDialogManager } from '@/ui/feedback/dialog-manager/hooks/useDialogManager';

type CpqSetupPageProps = {
  workspaceId: string;
};

// ── Styled primitives ────────────────────────────────────────────────────────

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  max-width: 860px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const StyledSection = styled.section`
  border: 1px solid var(--twenty-border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--twenty-background-primary, #fff);
  border-bottom: 1px solid var(--twenty-border-color, #e5e7eb);
`;

const StyledSectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: var(--twenty-font-color-primary, #111827);
  margin: 0;
`;

const StyledSectionBody = styled.div`
  padding: 20px;
  background: var(--twenty-background-primary, #fff);
`;

const StyledStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StyledBadge = styled.span<{ variant: 'success' | 'warning' | 'info' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ variant }) =>
    variant === 'success'
      ? 'rgba(16,185,129,0.1)'
      : variant === 'warning'
        ? 'rgba(245,158,11,0.1)'
        : 'rgba(59,130,246,0.1)'};
  color: ${({ variant }) =>
    variant === 'success'
      ? '#059669'
      : variant === 'warning'
        ? '#d97706'
        : '#2563eb'};
`;

const StyledMeta = styled.p`
  font-size: 13px;
  color: var(--twenty-font-color-secondary, #6b7280);
  margin: 0;
`;

const StyledButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const StyledButton = styled.button<{
  variant?: 'primary' | 'danger' | 'ghost';
}>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.15s;

  background: ${({ variant }) =>
    variant === 'danger'
      ? 'rgba(239,68,68,0.08)'
      : variant === 'ghost'
        ? 'transparent'
        : 'var(--twenty-color-blue, #3b82f6)'};
  color: ${({ variant }) =>
    variant === 'danger'
      ? '#dc2626'
      : variant === 'ghost'
        ? 'var(--twenty-font-color-primary, #111827)'
        : '#fff'};
  border-color: ${({ variant }) =>
    variant === 'danger'
      ? 'rgba(239,68,68,0.3)'
      : variant === 'ghost'
        ? 'var(--twenty-border-color, #e5e7eb)'
        : 'transparent'};

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const StyledError = styled.div`
  font-size: 13px;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px;
  padding: 10px 14px;
  margin-top: 12px;
`;

const StyledSuccess = styled.div`
  font-size: 13px;
  color: #059669;
  background: rgba(16, 185, 129, 0.06);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 6px;
  padding: 10px 14px;
  margin-top: 12px;
`;

const StyledObjectGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StyledObjectCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--twenty-border-color, #e5e7eb);
  border-radius: 6px;
`;

const StyledObjectIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--twenty-background-secondary, #f3f4f6);
  color: var(--twenty-font-color-secondary, #6b7280);
  flex-shrink: 0;
`;

const StyledObjectLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--twenty-font-color-primary, #111827);
`;

const StyledObjectDesc = styled.div`
  font-size: 11px;
  color: var(--twenty-font-color-secondary, #6b7280);
  margin-top: 2px;
`;

const StyledDivider = styled.hr`
  border: none;
  border-top: 1px solid var(--twenty-border-color, #e5e7eb);
  margin: 16px 0;
`;

// Catalog table
const StyledTabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const StyledTab = styled.button<{ active: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid
    ${({ active }) =>
      active
        ? 'var(--twenty-color-blue, #3b82f6)'
        : 'var(--twenty-border-color, #e5e7eb)'};
  background: ${({ active }) =>
    active ? 'rgba(59,130,246,0.08)' : 'transparent'};
  color: ${({ active }) =>
    active ? '#2563eb' : 'var(--twenty-font-color-primary, #111827)'};
`;

const StyledFilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const StyledFamilyChip = styled.button<{ active: boolean }>`
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid
    ${({ active }) =>
      active ? '#2563eb' : 'var(--twenty-border-color, #e5e7eb)'};
  background: ${({ active }) =>
    active ? 'rgba(59,130,246,0.1)' : 'transparent'};
  color: ${({ active }) =>
    active ? '#2563eb' : 'var(--twenty-font-color-secondary, #6b7280)'};
`;

const StyledTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const StyledTh = styled.th`
  text-align: left;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--twenty-font-color-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--twenty-border-color, #e5e7eb);
  background: var(--twenty-background-secondary, #f9fafb);
`;

const StyledTd = styled.td`
  padding: 8px 10px;
  border-bottom: 1px solid var(--twenty-border-color, #e5e7eb);
  color: var(--twenty-font-color-primary, #111827);
  vertical-align: middle;
`;

const StyledFamilyTag = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--twenty-background-secondary, #f3f4f6);
  color: var(--twenty-font-color-secondary, #6b7280);
`;

const StyledBillingType = styled.span<{ oneTime: boolean }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${({ oneTime }) =>
    oneTime ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)'};
  color: ${({ oneTime }) => (oneTime ? '#7c3aed' : '#059669')};
`;

const StyledSkuCell = styled.td`
  padding: 8px 10px;
  border-bottom: 1px solid var(--twenty-border-color, #e5e7eb);
  font-family: monospace;
  font-size: 11px;
  color: var(--twenty-font-color-secondary, #6b7280);
`;

const StyledSpinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--twenty-border-color, #e5e7eb);
  border-top-color: var(--twenty-color-blue, #3b82f6);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// ── Sub-components ───────────────────────────────────────────────────────────

const CPQ_OBJECTS_LIST = [
  {
    icon: IconFileText,
    label: 'Quotes',
    description: 'Proposals with pricing waterfall',
  },
  {
    icon: IconListDetails,
    label: 'Quote Line Items',
    description: 'Products with discount & tax',
  },
  {
    icon: IconFileDescription,
    label: 'Contracts',
    description: 'Active agreements & renewals',
  },
  {
    icon: IconRefresh,
    label: 'Subscriptions',
    description: 'Per-product entitlements',
  },
  {
    icon: IconChartBar,
    label: 'Amendments',
    description: 'Immutable change history',
  },
  {
    icon: IconCurrencyDollar,
    label: 'Price Configurations',
    description: 'Tiered & volume pricing rules',
  },
];

type ProductCatalogProps = {
  onSeed: (products: CatalogEntry[]) => Promise<void>;
  isSeeding: boolean;
  seedResult: { created: number; skipped: number; errors: string[] } | null;
};

const ProductCatalog = ({
  onSeed,
  isSeeding,
  seedResult,
}: ProductCatalogProps) => {
  const [region, setRegion] = useState<'US' | 'UK'>('US');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');

  const catalog = region === 'US' ? PHENOTIPS_CATALOG_US : PHENOTIPS_CATALOG_UK;
  const families = [
    'All',
    ...Array.from(new Set(catalog.map((p) => p.productFamily))),
  ];
  const filtered =
    selectedFamily === 'All'
      ? catalog
      : catalog.filter((p) => p.productFamily === selectedFamily);

  const handleSeedAll = () => {
    void onSeed(catalog);
  };

  const handleSeedFiltered = () => {
    void onSeed(filtered);
  };

  return (
    <div>
      <StyledTabRow>
        <StyledTab active={region === 'US'} onClick={() => setRegion('US')}>
          US / Canada (USD)
        </StyledTab>
        <StyledTab active={region === 'UK'} onClick={() => setRegion('UK')}>
          United Kingdom (GBP)
        </StyledTab>
      </StyledTabRow>

      <StyledFilterRow>
        {families.map((f) => (
          <StyledFamilyChip
            key={f}
            active={selectedFamily === f}
            onClick={() => setSelectedFamily(f)}
          >
            {f}
          </StyledFamilyChip>
        ))}
      </StyledFilterRow>

      <StyledTableWrapper>
      <StyledTable>
        <thead>
          <tr>
            <StyledTh>Product Name</StyledTh>
            <StyledTh>Family</StyledTh>
            <StyledTh>Billing</StyledTh>
            <StyledTh>List Price</StyledTh>
            <StyledTh>SKU</StyledTh>
          </tr>
        </thead>
        <tbody>
          {filtered.map((product) => (
            <tr key={product.sku}>
              <StyledTd>
                <div style={{ fontWeight: 500 }}>{product.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--twenty-font-color-secondary, #6b7280)',
                    marginTop: 2,
                  }}
                >
                  {product.displayDescription}
                </div>
              </StyledTd>
              <StyledTd>
                <StyledFamilyTag>{product.productFamily}</StyledFamilyTag>
              </StyledTd>
              <StyledTd>
                <StyledBillingType oneTime={product.isOneTime}>
                  {product.isOneTime ? 'One-Time' : 'Recurring'}
                </StyledBillingType>
              </StyledTd>
              <StyledTd>
                {formatListPrice(
                  product.listPriceAmountMicros,
                  product.listPriceCurrencyCode,
                )}
                {!product.isOneTime && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--twenty-font-color-secondary, #6b7280)',
                      marginLeft: 3,
                    }}
                  >
                    /yr
                  </span>
                )}
              </StyledTd>
              <StyledSkuCell>{product.sku}</StyledSkuCell>
            </tr>
          ))}
        </tbody>
      </StyledTable>
      </StyledTableWrapper>

      <StyledButtonRow>
        <StyledButton
          variant="primary"
          onClick={handleSeedAll}
          disabled={isSeeding}
        >
          {isSeeding ? (
            <>
              <StyledSpinner /> Importing {catalog.length} products…
            </>
          ) : (
            `Import All ${region} Products (${catalog.length})`
          )}
        </StyledButton>
        {selectedFamily !== 'All' && (
          <StyledButton
            variant="ghost"
            onClick={handleSeedFiltered}
            disabled={isSeeding}
          >
            Import {selectedFamily} Only ({filtered.length})
          </StyledButton>
        )}
      </StyledButtonRow>

      {seedResult && (
        <StyledSuccess>
          Import complete — {seedResult.created} created, {seedResult.skipped}{' '}
          already existed
          {seedResult.errors.length > 0 && (
            <div style={{ marginTop: 4, color: '#dc2626' }}>
              Errors: {seedResult.errors.join('; ')}
            </div>
          )}
        </StyledSuccess>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

// Full CPQ settings page. Shows when navigated to Settings > CPQ.
// Sections:
//   1. Setup Status — Enable / teardown, object count
//   2. Data Model — List of CPQ objects with descriptions
//   3. Product Catalog — PhenoTips pricing table with seed button
export const CpqSetupPage = ({ workspaceId }: CpqSetupPageProps) => {
  const {
    status,
    isLoading,
    isTearingDown,
    isSeeding,
    error,
    seedResult,
    checkStatus,
    runSetup,
    runTeardown,
    seedCatalog,
  } = useCpqSetup(workspaceId);

  const {
    enqueueSuccessSnackBar,
    enqueueErrorSnackBar,
    enqueueInfoSnackBar,
  } = useSnackBar();

  const { enqueueDialog } = useDialogManager();

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const handleSetup = async () => {
    try {
      const result = await runSetup();
      enqueueSuccessSnackBar({
        message: `CPQ enabled — ${result?.status?.objectCount ?? 6} objects created`,
      });
    } catch {
      enqueueErrorSnackBar({
        message: error ?? 'Failed to enable CPQ',
      });
    }
  };

  const handleTeardown = async () => {
    try {
      await runTeardown();
      enqueueSuccessSnackBar({ message: 'CPQ objects removed successfully' });
    } catch {
      enqueueErrorSnackBar({ message: error ?? 'Failed to remove CPQ objects' });
    }
  };

  const handleRequestSetup = () => {
    enqueueDialog({
      title: 'Enable CPQ',
      message:
        'This will create 6 new object types in your workspace: Quotes, Quote Line Items, Contracts, Subscriptions, Amendments, and Price Configurations.',
      buttons: [
        { title: 'Cancel', variant: 'secondary' },
        {
          title: 'Enable CPQ',
          variant: 'secondary',
          accent: 'blue' as any,
          onClick: () => void handleSetup(),
          role: 'confirm',
        },
      ],
    });
  };

  const handleRequestTeardown = () => {
    enqueueDialog({
      title: 'Remove CPQ Objects',
      message:
        'This will permanently delete all CPQ objects and their data. Existing quotes, contracts, and subscriptions will be lost. This action cannot be undone.',
      buttons: [
        { title: 'Cancel', variant: 'secondary' },
        {
          title: 'Remove CPQ',
          variant: 'secondary',
          accent: 'danger',
          onClick: () => void handleTeardown(),
          role: 'confirm',
        },
      ],
    });
  };

  const handleSeedCatalog = async (products: CatalogEntry[]) => {
    enqueueInfoSnackBar({ message: `Importing ${products.length} products...` });
    try {
      const result = await seedCatalog(products);
      enqueueSuccessSnackBar({
        message: `Import complete — ${result.created} created, ${result.skipped} skipped`,
      });
    } catch {
      enqueueErrorSnackBar({ message: error ?? 'Product import failed' });
    }
  };

  const isSetUp = status?.isSetUp ?? false;

  if (isLoading && status === null) {
    return (
      <StyledPage>
        <StyledMeta>Checking CPQ status…</StyledMeta>
      </StyledPage>
    );
  }

  return (
    <StyledPage>
      {/* ── Section 1: Setup Status ───────────────────────────────────── */}
      <StyledSection>
        <StyledSectionHeader>
          <StyledSectionTitle>Setup Status</StyledSectionTitle>
          {status && (
            <StyledBadge variant={isSetUp ? 'success' : 'warning'}>
              {isSetUp ? 'Enabled' : 'Not enabled'}
            </StyledBadge>
          )}
        </StyledSectionHeader>
        <StyledSectionBody>
          {status ? (
            <>
              <StyledStatusRow>
                <StyledMeta>
                  {isSetUp
                    ? `${status.objectCount}/${status.expectedCount} CPQ objects installed in this workspace.`
                    : `CPQ is not enabled. Enable it to add quoting, contracts, and subscriptions to your CRM.`}
                </StyledMeta>
              </StyledStatusRow>

              {!isSetUp && status.missingObjects.length > 0 && (
                <StyledMeta style={{ marginTop: 6 }}>
                  Missing: {status.missingObjects.join(', ')}
                </StyledMeta>
              )}

              <StyledButtonRow>
                {isSetUp ? (
                  <>
                    <StyledButton
                      variant="ghost"
                      onClick={() => void checkStatus()}
                      disabled={isLoading}
                    >
                      Refresh
                    </StyledButton>
                    <StyledButton
                      variant="danger"
                      onClick={handleRequestTeardown}
                      disabled={isTearingDown}
                    >
                      {isTearingDown ? (
                        <>
                          <StyledSpinner /> Removing CPQ objects…
                        </>
                      ) : (
                        'Remove CPQ'
                      )}
                    </StyledButton>
                  </>
                ) : (
                  <StyledButton
                    variant="primary"
                    onClick={handleRequestSetup}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <StyledSpinner /> Creating 6 CPQ objects…
                      </>
                    ) : (
                      'Enable CPQ'
                    )}
                  </StyledButton>
                )}
              </StyledButtonRow>
            </>
          ) : (
            <StyledMeta>Unable to reach CPQ service.</StyledMeta>
          )}

          {error && <StyledError>{error}</StyledError>}
        </StyledSectionBody>
      </StyledSection>

      {/* ── Section 2: Data Model ─────────────────────────────────────── */}
      <StyledSection>
        <StyledSectionHeader>
          <StyledSectionTitle>Data Model</StyledSectionTitle>
          <StyledMeta>6 custom objects</StyledMeta>
        </StyledSectionHeader>
        <StyledSectionBody>
          <StyledObjectGrid>
            {CPQ_OBJECTS_LIST.map((item) => (
              <StyledObjectCard key={item.label}>
                <StyledObjectIcon>
                  <item.icon size={16} />
                </StyledObjectIcon>
                <div>
                  <StyledObjectLabel>{item.label}</StyledObjectLabel>
                  <StyledObjectDesc>{item.description}</StyledObjectDesc>
                </div>
              </StyledObjectCard>
            ))}
          </StyledObjectGrid>

          <StyledDivider />

          <StyledMeta>
            All objects appear natively in the sidebar, record pages, command
            palette, and GraphQL API after setup. Relations to Companies and
            Opportunities are created automatically.
          </StyledMeta>
        </StyledSectionBody>
      </StyledSection>

      {/* ── Section 3: Product Catalog ────────────────────────────────── */}
      {isSetUp && (
        <StyledSection>
          <StyledSectionHeader>
            <StyledSectionTitle>Product Catalog</StyledSectionTitle>
            <StyledBadge variant="info">PhenoTips 2024 Pricing</StyledBadge>
          </StyledSectionHeader>
          <StyledSectionBody>
            <StyledMeta style={{ marginBottom: 16 }}>
              Import pre-configured products and pricing from the PhenoTips 2024
              pricing schedule. Each product creates a Price Configuration
              record. Existing products (matched by name + region) are skipped.
            </StyledMeta>
            <ProductCatalog
              onSeed={handleSeedCatalog}
              isSeeding={isSeeding}
              seedResult={seedResult}
            />
          </StyledSectionBody>
        </StyledSection>
      )}
    </StyledPage>
  );
};
