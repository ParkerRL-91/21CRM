import { describe, it, expect, vi } from 'vitest';
import {
  CpqSetupService,
  ObjectList,
  LineItemInput,
} from './cpq-setup';

// ============================================================================
// Fixtures
// ============================================================================

const sampleObjectList: ObjectList = {
  products: [
    {
      id: 'prod-1',
      name: 'Platform Pro',
      sku: 'PLT-PRO',
      defaultPrice: 60000,
      defaultSubscriptionTermMonths: 12,
      billingFrequency: 'annual',
      chargeType: 'recurring',
      productType: 'subscription',
    },
    {
      id: 'prod-2',
      name: 'Analytics Module',
      sku: 'ANL-001',
      defaultPrice: 6000,
      chargeType: 'recurring',
      productType: 'subscription',
    },
    {
      id: 'prod-3',
      name: 'Implementation',
      defaultPrice: 15000,
      chargeType: 'one_time',
      productType: 'professional_service',
    },
  ],
  priceBookEntries: [
    { productId: 'prod-1', unitPrice: 60000, currencyCode: 'CAD' },
    { productId: 'prod-2', unitPrice: 6000, currencyCode: 'CAD' },
    { productId: 'prod-3', unitPrice: 15000, currencyCode: 'CAD' },
  ],
};

function makeService(objectList: ObjectList = sampleObjectList): {
  service: CpqSetupService;
  lookupFn: ReturnType<typeof vi.fn>;
} {
  const lookupFn = vi.fn().mockResolvedValue(objectList);
  const service = new CpqSetupService(lookupFn);
  return { service, lookupFn };
}

// ============================================================================
// Core behaviour
// ============================================================================

describe('CpqSetupService.setupCpq', () => {
  it('resolves line items with correct product names and prices', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: 1 },
      { productId: 'prod-2', quantity: 5 },
    ]);

    expect(result.resolvedLineItems).toHaveLength(2);
    expect(result.resolvedLineItems[0].productName).toBe('Platform Pro');
    expect(result.resolvedLineItems[0].unitPrice).toBe('60000');
    expect(result.resolvedLineItems[1].productName).toBe('Analytics Module');
    expect(result.resolvedLineItems[1].quantity).toBe(5);
  });

  it('calculates correct net total per line item', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-2', quantity: 5 },
    ]);

    // 5 × $6000 = $30,000
    expect(result.resolvedLineItems[0].netTotal).toBe('30000');
  });

  it('calculates correct grand total across all line items', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: 1 },  // 60000
      { productId: 'prod-2', quantity: 5 },  // 30000
      { productId: 'prod-3', quantity: 1 },  // 15000
    ]);

    expect(result.grandTotal).toBe('105000');
  });

  it('applies discount percent correctly', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: 1, discountPercent: 10 },
    ]);

    // $60,000 × 0.90 = $54,000
    expect(result.resolvedLineItems[0].netUnitPrice).toBe('54000');
    expect(result.resolvedLineItems[0].netTotal).toBe('54000');
    expect(result.resolvedLineItems[0].discountPercent).toBe(10);
  });

  it('handles 100% discount — net price is zero', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: 1, discountPercent: 100 },
    ]);

    expect(result.resolvedLineItems[0].netUnitPrice).toBe('0');
    expect(result.resolvedLineItems[0].netTotal).toBe('0');
    expect(result.grandTotal).toBe('0');
  });

  it('handles 0% discount — no change to price', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: 1, discountPercent: 0 },
    ]);

    expect(result.resolvedLineItems[0].netUnitPrice).toBe('60000');
  });

  it('returns "Unknown Product" for unrecognised product ID', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-unknown', quantity: 1 },
    ]);

    expect(result.resolvedLineItems[0].productName).toBe('Unknown Product');
    expect(result.resolvedLineItems[0].unitPrice).toBe('0');
    expect(result.resolvedLineItems[0].netTotal).toBe('0');
  });

  it('returns empty results for empty line items array', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([]);

    expect(result.resolvedLineItems).toHaveLength(0);
    expect(result.grandTotal).toBe('0');
  });
});

// ============================================================================
// N+1 guard — the core purpose of this service
// ============================================================================

describe('CpqSetupService — N+1 prevention', () => {
  it('calls lookupFn exactly once regardless of how many line items there are', async () => {
    const { service, lookupFn } = makeService();

    const lineItems: LineItemInput[] = [
      { productId: 'prod-1', quantity: 1 },
      { productId: 'prod-2', quantity: 3 },
      { productId: 'prod-3', quantity: 2 },
      { productId: 'prod-1', quantity: 5 }, // duplicate product — still one lookup
    ];

    await service.setupCpq(lineItems);

    expect(lookupFn).toHaveBeenCalledTimes(1);
  });

  it('calls lookupFn exactly once even with a single line item', async () => {
    const { service, lookupFn } = makeService();

    await service.setupCpq([{ productId: 'prod-1', quantity: 1 }]);

    expect(lookupFn).toHaveBeenCalledTimes(1);
  });

  it('calls lookupFn exactly once for an empty line items array', async () => {
    const { service, lookupFn } = makeService();

    await service.setupCpq([]);

    expect(lookupFn).toHaveBeenCalledTimes(1);
  });

  it('calls lookupFn exactly once even with 100 line items', async () => {
    const { service, lookupFn } = makeService();

    const lineItems: LineItemInput[] = Array.from({ length: 100 }, (_, i) => ({
      productId: i % 3 === 0 ? 'prod-1' : i % 3 === 1 ? 'prod-2' : 'prod-3',
      quantity: i + 1,
    }));

    await service.setupCpq(lineItems);

    expect(lookupFn).toHaveBeenCalledTimes(1);
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('CpqSetupService — edge cases', () => {
  it('handles zero quantity — net total is zero', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: 0 },
    ]);

    expect(result.resolvedLineItems[0].netTotal).toBe('0');
    expect(result.grandTotal).toBe('0');
  });

  it('handles negative quantity — clamps to zero', async () => {
    const { service } = makeService();

    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: -5 },
    ]);

    expect(result.resolvedLineItems[0].quantity).toBe(0);
    expect(result.resolvedLineItems[0].netTotal).toBe('0');
  });

  it('handles product with no price book entry — falls back to defaultPrice', async () => {
    const objectListNoPBEntry: ObjectList = {
      products: [
        {
          id: 'prod-no-pbe',
          name: 'No PBE Product',
          defaultPrice: 9999,
          chargeType: 'recurring',
          productType: 'subscription',
        },
      ],
      priceBookEntries: [],
    };
    const { service } = makeService(objectListNoPBEntry);

    const result = await service.setupCpq([
      { productId: 'prod-no-pbe', quantity: 1 },
    ]);

    expect(result.resolvedLineItems[0].unitPrice).toBe('9999');
    expect(result.resolvedLineItems[0].netUnitPrice).toBe('9999');
  });

  it('handles product with no defaultPrice and no price book entry — unit price is 0', async () => {
    const objectListNoPrice: ObjectList = {
      products: [
        {
          id: 'prod-free',
          name: 'Free Product',
          chargeType: 'one_time',
          productType: 'one_time',
        },
      ],
      priceBookEntries: [],
    };
    const { service } = makeService(objectListNoPrice);

    const result = await service.setupCpq([
      { productId: 'prod-free', quantity: 10 },
    ]);

    expect(result.resolvedLineItems[0].unitPrice).toBe('0');
    expect(result.resolvedLineItems[0].netTotal).toBe('0');
  });

  it('handles lookupFn rejection — propagates the error', async () => {
    const failingLookup = vi
      .fn()
      .mockRejectedValue(new Error('DB connection failed'));
    const service = new CpqSetupService(failingLookup);

    await expect(
      service.setupCpq([{ productId: 'prod-1', quantity: 1 }])
    ).rejects.toThrow('DB connection failed');
  });

  it('handles large discount with decimal precision', async () => {
    const { service } = makeService();

    // 99.99% discount on $60,000 → $60,000 × 0.0001 = $6.00
    const result = await service.setupCpq([
      { productId: 'prod-1', quantity: 1, discountPercent: 99.99 },
    ]);

    expect(result.resolvedLineItems[0].netUnitPrice).toBe('6');
  });
});
