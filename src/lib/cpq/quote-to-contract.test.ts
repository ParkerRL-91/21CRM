import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  quoteToContractPayload,
  calculateARRWaterfall,
  QuoteForConversion,
  ARRWaterfallInput,
} from './quote-to-contract';

// ============================================================================
// Quote to Contract conversion
// ============================================================================

describe('quoteToContractPayload', () => {
  const sampleQuote: QuoteForConversion = {
    id: 'quote-001',
    orgId: 'org-001',
    quoteNumber: 'Q-2026-0042',
    accountHubspotId: 'hs-company-123',
    accountName: 'Acme Corp',
    opportunityHubspotId: 'hs-deal-456',
    startDate: '2026-01-01',
    subscriptionTermMonths: 12,
    currencyCode: 'CAD',
    grandTotal: '120000.00',
    createdBy: 'user-001',
    lineItems: [
      {
        id: 'li-1',
        productId: 'prod-1',
        productName: 'Platform Pro',
        quantity: '1',
        netUnitPrice: '60000.00',
        netTotal: '60000.00',
        billingType: 'recurring',
        billingFrequency: 'annual',
        subscriptionTermMonths: 12,
      },
      {
        id: 'li-2',
        productId: 'prod-2',
        productName: 'Analytics Module',
        quantity: '5',
        netUnitPrice: '6000.00',
        netTotal: '30000.00',
        billingType: 'recurring',
        billingFrequency: 'annual',
        subscriptionTermMonths: 12,
      },
      {
        id: 'li-3',
        productId: 'prod-3',
        productName: 'Implementation',
        quantity: '1',
        netUnitPrice: '30000.00',
        netTotal: '30000.00',
        billingType: 'one_time',
      },
    ],
  };

  it('creates contract with correct metadata', () => {
    const result = quoteToContractPayload(sampleQuote);
    expect(result.orgId).toBe('org-001');
    expect(result.contractName).toContain('Acme Corp');
    expect(result.contractName).toContain('Q-2026-0042');
    expect(result.accountHubspotId).toBe('hs-company-123');
    expect(result.dealHubspotId).toBe('hs-deal-456');
    expect(result.quoteId).toBe('quote-001');
    expect(result.status).toBe('active');
    expect(result.currencyCode).toBe('CAD');
    expect(result.totalValue).toBe('120000.00');
  });

  it('calculates end date from start + term', () => {
    const result = quoteToContractPayload(sampleQuote);
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2027-01-01');
  });

  it('creates subscriptions for each line item', () => {
    const result = quoteToContractPayload(sampleQuote);
    expect(result.subscriptions).toHaveLength(3);
  });

  it('maps recurring items as renewable subscriptions', () => {
    const result = quoteToContractPayload(sampleQuote);
    const platform = result.subscriptions[0];
    expect(platform.productName).toBe('Platform Pro');
    expect(platform.chargeType).toBe('recurring');
    expect(platform.subscriptionType).toBe('renewable');
    expect(platform.annualValue).toBe('60000');
    expect(platform.status).toBe('active');
  });

  it('maps one-time items as one_time subscriptions', () => {
    const result = quoteToContractPayload(sampleQuote);
    const impl = result.subscriptions[2];
    expect(impl.productName).toBe('Implementation');
    expect(impl.chargeType).toBe('one_time');
    expect(impl.subscriptionType).toBe('one_time');
  });

  it('creates initial amendment record', () => {
    const result = quoteToContractPayload(sampleQuote);
    expect(result.initialAmendment.amendmentNumber).toBe(1);
    expect(result.initialAmendment.amendmentType).toBe('add_subscription');
    expect(result.initialAmendment.deltaValue).toBe('120000.00');
    expect(result.initialAmendment.effectiveDate).toBe('2026-01-01');
  });

  it('handles multi-year terms', () => {
    const multiYear = {
      ...sampleQuote,
      subscriptionTermMonths: 24,
      startDate: '2026-06-15',
    };
    const result = quoteToContractPayload(multiYear);
    expect(result.endDate).toBe('2028-06-15');
  });

  it('handles quote with no account name', () => {
    const noAccount = { ...sampleQuote, accountName: undefined };
    const result = quoteToContractPayload(noAccount);
    expect(result.contractName).toContain('Contract');
  });

  it('annualizes subscription value for non-12-month terms', () => {
    const shortTerm: QuoteForConversion = {
      ...sampleQuote,
      subscriptionTermMonths: 6,
      lineItems: [
        {
          id: 'li-1',
          productName: 'Platform',
          quantity: '1',
          netUnitPrice: '30000.00',
          netTotal: '30000.00',
          billingType: 'recurring',
          billingFrequency: 'annual',
          subscriptionTermMonths: 6,
        },
      ],
    };
    const result = quoteToContractPayload(shortTerm);
    // $30,000 for 6 months → annualized = 30000 * 12/6 = 60000
    expect(result.subscriptions[0].annualValue).toBe('60000');
  });
});

// ============================================================================
// ARR Waterfall
// ============================================================================

describe('calculateARRWaterfall', () => {
  it('calculates basic waterfall correctly', () => {
    const input: ARRWaterfallInput = {
      beginningARR: new Decimal(1000000),
      newARR: new Decimal(200000),
      expansionARR: new Decimal(50000),
      contractionARR: new Decimal(20000),
      churnARR: new Decimal(80000),
    };
    const result = calculateARRWaterfall(input);

    expect(result.beginningARR).toBe('1000000');
    expect(result.newARR).toBe('200000');
    expect(result.expansionARR).toBe('50000');
    expect(result.contractionARR).toBe('20000');
    expect(result.churnARR).toBe('80000');
    // 1000000 + 200000 + 50000 - 20000 - 80000 = 1150000
    expect(result.endingARR).toBe('1150000');
    expect(result.netChange).toBe('150000');
  });

  it('calculates net retention rate', () => {
    const input: ARRWaterfallInput = {
      beginningARR: new Decimal(1000000),
      newARR: new Decimal(0), // new doesn't count in NRR
      expansionARR: new Decimal(120000),
      contractionARR: new Decimal(30000),
      churnARR: new Decimal(50000),
    };
    const result = calculateARRWaterfall(input);
    // NRR = (1000000 + 120000 - 30000 - 50000) / 1000000 * 100 = 104.0%
    expect(result.netRetentionRate).toBe('104');
  });

  it('handles zero beginning ARR', () => {
    const input: ARRWaterfallInput = {
      beginningARR: new Decimal(0),
      newARR: new Decimal(100000),
      expansionARR: new Decimal(0),
      contractionARR: new Decimal(0),
      churnARR: new Decimal(0),
    };
    const result = calculateARRWaterfall(input);
    expect(result.endingARR).toBe('100000');
    expect(result.netRetentionRate).toBe('0');
  });

  it('handles net negative (more churn than growth)', () => {
    const input: ARRWaterfallInput = {
      beginningARR: new Decimal(500000),
      newARR: new Decimal(0),
      expansionARR: new Decimal(10000),
      contractionARR: new Decimal(50000),
      churnARR: new Decimal(100000),
    };
    const result = calculateARRWaterfall(input);
    // NRR = (500000 + 10000 - 50000 - 100000) / 500000 * 100 = 72%
    expect(result.netRetentionRate).toBe('72');
    expect(result.endingARR).toBe('360000');
    expect(result.netChange).toBe('-140000');
  });

  it('handles decimal values with precision', () => {
    const input: ARRWaterfallInput = {
      beginningARR: new Decimal('999999.99'),
      newARR: new Decimal('123456.78'),
      expansionARR: new Decimal('11111.11'),
      contractionARR: new Decimal('22222.22'),
      churnARR: new Decimal('33333.33'),
    };
    const result = calculateARRWaterfall(input);
    // 999999.99 + 123456.78 + 11111.11 - 22222.22 - 33333.33 = 1079012.33
    expect(result.endingARR).toBe('1079012.33');
  });
});
