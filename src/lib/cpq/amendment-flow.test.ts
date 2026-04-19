import { describe, it, expect } from 'vitest';
import {
  buildAmendmentQuote,
  generateInvoiceFromContract,
  ActiveSubscription,
} from './amendment-flow';

const baseSubscriptions: ActiveSubscription[] = [
  {
    id: 'sub-1',
    productName: 'Platform Pro',
    quantity: 1,
    unitPrice: '60000',
    annualValue: '60000',
    billingFrequency: 'annual',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
  {
    id: 'sub-2',
    productName: 'Analytics',
    quantity: 5,
    unitPrice: '6000',
    annualValue: '30000',
    billingFrequency: 'annual',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
];

describe('buildAmendmentQuote', () => {
  it('handles adding a new subscription', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'add',
          productName: 'API Access',
          newQuantity: 1,
          newUnitPrice: '30000',
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].type).toBe('new');
    expect(result.lineItems[0].productName).toBe('API Access');
    expect(result.lineItems[0].annualDelta).toBe('30000');
    // Prorated: ~184/365 × 30000 ≈ 15123.29
    expect(parseFloat(result.totalProratedDelta)).toBeGreaterThan(0);
    expect(parseFloat(result.totalProratedDelta)).toBeLessThan(30000);
  });

  it('handles quantity increase', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'modify_quantity',
          subscriptionId: 'sub-2',
          newQuantity: 10, // 5 → 10
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems[0].type).toBe('modified');
    expect(result.lineItems[0].oldQuantity).toBe(5);
    expect(result.lineItems[0].newQuantity).toBe(10);
    // Annual delta: (10-5) × 6000 = 30000
    expect(result.lineItems[0].annualDelta).toBe('30000');
    expect(parseFloat(result.totalProratedDelta)).toBeGreaterThan(0);
  });

  it('handles price change', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'modify_price',
          subscriptionId: 'sub-1',
          newUnitPrice: '72000', // 60000 → 72000
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems[0].oldUnitPrice).toBe('60000');
    expect(result.lineItems[0].newUnitPrice).toBe('72000');
    // Annual delta: (72000-60000) × 1 = 12000
    expect(result.lineItems[0].annualDelta).toBe('12000');
  });

  it('handles subscription removal', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'remove',
          subscriptionId: 'sub-2',
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems[0].type).toBe('removed');
    expect(result.lineItems[0].newQuantity).toBe(0);
    // Annual delta should be negative
    expect(parseFloat(result.lineItems[0].annualDelta)).toBeLessThan(0);
    expect(parseFloat(result.totalProratedDelta)).toBeLessThan(0);
  });

  it('handles multiple changes in one amendment', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        { type: 'modify_quantity', subscriptionId: 'sub-2', newQuantity: 10 },
        { type: 'add', productName: 'Support', newQuantity: 1, newUnitPrice: '12000' },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems).toHaveLength(2);
    // Total should be sum of both deltas
    expect(parseFloat(result.totalAnnualDelta)).toBe(42000); // 30000 + 12000
  });

  it('co-terminates new subscriptions to contract end date', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        { type: 'add', productName: 'New Module', newQuantity: 1, newUnitPrice: '10000' },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-10-01',
    });

    expect(result.lineItems[0].coTermEndDate).toBe('2027-01-01');
  });

  it('throws for unknown subscription ID', () => {
    expect(() =>
      buildAmendmentQuote({
        existingSubscriptions: baseSubscriptions,
        changes: [
          { type: 'modify_quantity', subscriptionId: 'nonexistent', newQuantity: 10 },
        ],
        contractStartDate: '2026-01-01',
        contractEndDate: '2027-01-01',
        effectiveDate: '2026-07-01',
      })
    ).toThrow('Subscription nonexistent not found');
  });
});

describe('generateInvoiceFromContract', () => {
  it('generates invoice with correct line items', () => {
    const result = generateInvoiceFromContract({
      subscriptions: baseSubscriptions,
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-12-31',
    });

    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0].productName).toBe('Platform Pro');
    expect(result.lineItems[0].total).toBe('60000');
    expect(result.lineItems[1].productName).toBe('Analytics');
    expect(result.lineItems[1].total).toBe('30000');
  });

  it('calculates subtotal correctly', () => {
    const result = generateInvoiceFromContract({
      subscriptions: baseSubscriptions,
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-12-31',
    });

    expect(result.subtotal).toBe('90000');
    expect(result.total).toBe('90000');
  });

  it('handles empty subscriptions', () => {
    const result = generateInvoiceFromContract({
      subscriptions: [],
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-12-31',
    });

    expect(result.lineItems).toHaveLength(0);
    expect(result.subtotal).toBe('0');
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('buildAmendmentQuote — edge cases', () => {
  it('handles empty changes array — returns zero deltas', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems).toHaveLength(0);
    expect(result.totalProratedDelta).toBe('0');
    expect(result.totalAnnualDelta).toBe('0');
  });

  it('handles add change with zero unit price — zero delta', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'add',
          productName: 'Free Module',
          newQuantity: 1,
          newUnitPrice: '0',
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems[0].annualDelta).toBe('0');
    expect(result.totalProratedDelta).toBe('0');
  });

  it('handles add change with zero quantity — zero annual delta', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'add',
          productName: 'Placeholder',
          newQuantity: 0,
          newUnitPrice: '10000',
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems[0].annualDelta).toBe('0');
  });

  it('handles modify_quantity where new qty equals old qty — zero delta', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'modify_quantity',
          subscriptionId: 'sub-1',
          newQuantity: 1, // same as existing qty
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-07-01',
    });

    expect(result.lineItems[0].annualDelta).toBe('0');
    expect(result.totalProratedDelta).toBe('0');
  });

  it('handles effective date at contract start — full proration (100%)', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'add',
          productName: 'New Product',
          newQuantity: 1,
          newUnitPrice: '12000',
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2026-01-01', // effective at start
    });

    // Full term remaining — prorated value ~= annual value
    const prorated = parseFloat(result.totalProratedDelta);
    const annual = parseFloat(result.lineItems[0].annualDelta);
    expect(prorated).toBeCloseTo(annual, 0);
  });

  it('handles effective date at contract end — zero prorated delta', () => {
    const result = buildAmendmentQuote({
      existingSubscriptions: baseSubscriptions,
      changes: [
        {
          type: 'add',
          productName: 'Late Addition',
          newQuantity: 1,
          newUnitPrice: '12000',
        },
      ],
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-01-01',
      effectiveDate: '2027-01-01', // effective at exact end
    });

    expect(result.daysRemaining).toBe(0);
    expect(result.totalProratedDelta).toBe('0');
  });

  it('throws for remove on unknown subscription', () => {
    expect(() =>
      buildAmendmentQuote({
        existingSubscriptions: baseSubscriptions,
        changes: [{ type: 'remove', subscriptionId: 'sub-does-not-exist' }],
        contractStartDate: '2026-01-01',
        contractEndDate: '2027-01-01',
        effectiveDate: '2026-07-01',
      })
    ).toThrow('Subscription sub-does-not-exist not found');
  });
});

describe('generateInvoiceFromContract — edge cases', () => {
  it('handles subscription with quantity of 0 — zero line total', () => {
    const zeroQtySub: ActiveSubscription = {
      id: 'sub-zero',
      productName: 'Zero Qty Product',
      quantity: 0,
      unitPrice: '5000',
      annualValue: '0',
      billingFrequency: 'annual',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };
    const result = generateInvoiceFromContract({
      subscriptions: [zeroQtySub],
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-12-31',
    });

    expect(result.lineItems[0].total).toBe('0');
    expect(result.subtotal).toBe('0');
  });

  it('handles subscription with zero unit price — free line item', () => {
    const freeSub: ActiveSubscription = {
      id: 'sub-free',
      productName: 'Free Tier',
      quantity: 10,
      unitPrice: '0',
      annualValue: '0',
      billingFrequency: 'monthly',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };
    const result = generateInvoiceFromContract({
      subscriptions: [freeSub],
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-01-31',
    });

    expect(result.lineItems[0].total).toBe('0');
    expect(result.subtotal).toBe('0');
  });

  it('handles large number of subscriptions without loss of precision', () => {
    const subs: ActiveSubscription[] = Array.from({ length: 100 }, (_, i) => ({
      id: `sub-${i}`,
      productName: `Product ${i}`,
      quantity: 1,
      unitPrice: '999.99',
      annualValue: '999.99',
      billingFrequency: 'annual',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    }));

    const result = generateInvoiceFromContract({
      subscriptions: subs,
      billingPeriodStart: '2026-01-01',
      billingPeriodEnd: '2026-12-31',
    });

    // 100 × 999.99 = 99999.00
    expect(result.subtotal).toBe('99999');
  });
});
