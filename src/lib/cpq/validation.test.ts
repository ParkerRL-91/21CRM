import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  updateProductSchema,
  createPriceBookSchema,
  createPriceBookEntrySchema,
  createDiscountScheduleSchema,
  createDiscountTierSchema,
  createQuoteSchema,
  addQuoteLineItemSchema,
  acceptQuoteSchema,
  rejectQuoteSchema,
  createApprovalRuleSchema,
  isValidQuoteTransition,
} from './validation';

// ============================================================================
// Product validation
// ============================================================================

describe('createProductSchema', () => {
  const validProduct = {
    name: 'Platform Pro',
    productType: 'subscription' as const,
    chargeType: 'recurring' as const,
    defaultSubscriptionTermMonths: 12,
    billingFrequency: 'annual' as const,
    defaultPrice: 60000,
  };

  it('accepts valid subscription product', () => {
    expect(createProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it('accepts one_time product without term', () => {
    expect(
      createProductSchema.safeParse({
        name: 'Implementation Fee',
        productType: 'one_time',
        chargeType: 'one_time',
        defaultPrice: 1900,
      }).success
    ).toBe(true);
  });

  it('accepts professional_service product', () => {
    expect(
      createProductSchema.safeParse({
        name: 'Training',
        productType: 'professional_service',
        chargeType: 'one_time',
      }).success
    ).toBe(true);
  });

  it('rejects invalid product type', () => {
    expect(
      createProductSchema.safeParse({ ...validProduct, productType: 'invalid' })
        .success
    ).toBe(false);
  });

  it('rejects empty name', () => {
    expect(
      createProductSchema.safeParse({ ...validProduct, name: '' }).success
    ).toBe(false);
  });

  it('rejects negative default price', () => {
    expect(
      createProductSchema.safeParse({ ...validProduct, defaultPrice: -100 })
        .success
    ).toBe(false);
  });
});

describe('updateProductSchema', () => {
  it('accepts partial update', () => {
    expect(
      updateProductSchema.safeParse({ name: 'Updated Name' }).success
    ).toBe(true);
  });

  it('accepts isActive toggle', () => {
    expect(
      updateProductSchema.safeParse({ isActive: false }).success
    ).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    expect(updateProductSchema.safeParse({}).success).toBe(true);
  });
});

// ============================================================================
// Price book validation
// ============================================================================

describe('createPriceBookSchema', () => {
  it('accepts valid price book', () => {
    expect(
      createPriceBookSchema.safeParse({
        name: 'Standard',
        currencyCode: 'CAD',
      }).success
    ).toBe(true);
  });

  it('defaults currency to CAD', () => {
    const result = createPriceBookSchema.safeParse({ name: 'Partner' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currencyCode).toBe('CAD');
  });

  it('rejects invalid currency code length', () => {
    expect(
      createPriceBookSchema.safeParse({ name: 'Test', currencyCode: 'US' })
        .success
    ).toBe(false);
  });
});

describe('createPriceBookEntrySchema', () => {
  it('accepts valid entry', () => {
    expect(
      createPriceBookEntrySchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        unitPrice: 60000,
      }).success
    ).toBe(true);
  });

  it('rejects negative price', () => {
    expect(
      createPriceBookEntrySchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        unitPrice: -100,
      }).success
    ).toBe(false);
  });

  it('rejects invalid UUID', () => {
    expect(
      createPriceBookEntrySchema.safeParse({
        productId: 'not-a-uuid',
        unitPrice: 100,
      }).success
    ).toBe(false);
  });
});

// ============================================================================
// Discount schedule validation
// ============================================================================

describe('createDiscountScheduleSchema', () => {
  it('accepts tiered schedule', () => {
    expect(
      createDiscountScheduleSchema.safeParse({
        name: 'Volume Pricing',
        type: 'tiered',
        discountUnit: 'price',
      }).success
    ).toBe(true);
  });

  it('accepts volume schedule', () => {
    expect(
      createDiscountScheduleSchema.safeParse({
        name: 'Bulk Discount',
        type: 'volume',
      }).success
    ).toBe(true);
  });

  it('accepts term schedule', () => {
    expect(
      createDiscountScheduleSchema.safeParse({
        name: 'Multi-Year',
        type: 'term',
        discountUnit: 'percent',
      }).success
    ).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(
      createDiscountScheduleSchema.safeParse({
        name: 'Test',
        type: 'invalid',
      }).success
    ).toBe(false);
  });
});

describe('createDiscountTierSchema', () => {
  it('accepts valid tier', () => {
    expect(
      createDiscountTierSchema.safeParse({
        lowerBound: 1,
        upperBound: 500,
        discountValue: 40,
        sortOrder: 1,
      }).success
    ).toBe(true);
  });

  it('accepts tier with no upper bound (unlimited)', () => {
    expect(
      createDiscountTierSchema.safeParse({
        lowerBound: 501,
        discountValue: 30,
        sortOrder: 2,
      }).success
    ).toBe(true);
  });

  it('rejects negative lower bound', () => {
    expect(
      createDiscountTierSchema.safeParse({
        lowerBound: -1,
        discountValue: 10,
        sortOrder: 1,
      }).success
    ).toBe(false);
  });
});

// ============================================================================
// Quote validation
// ============================================================================

describe('createQuoteSchema', () => {
  it('accepts valid new quote', () => {
    expect(
      createQuoteSchema.safeParse({
        startDate: '2026-01-01',
        subscriptionTermMonths: 12,
      }).success
    ).toBe(true);
  });

  it('accepts amendment quote with contract link', () => {
    expect(
      createQuoteSchema.safeParse({
        type: 'amendment',
        contractId: '550e8400-e29b-41d4-a716-446655440000',
        startDate: '2026-06-01',
      }).success
    ).toBe(true);
  });

  it('accepts renewal quote', () => {
    expect(
      createQuoteSchema.safeParse({
        type: 'renewal',
        startDate: '2027-01-01',
      }).success
    ).toBe(true);
  });

  it('defaults type to new', () => {
    const result = createQuoteSchema.safeParse({ startDate: '2026-01-01' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe('new');
  });

  it('defaults term to 12 months', () => {
    const result = createQuoteSchema.safeParse({ startDate: '2026-01-01' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.subscriptionTermMonths).toBe(12);
  });
});

describe('addQuoteLineItemSchema', () => {
  it('accepts valid line item', () => {
    expect(
      addQuoteLineItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 5,
      }).success
    ).toBe(true);
  });

  it('accepts line item with discount', () => {
    expect(
      addQuoteLineItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
        discountPercent: 15,
      }).success
    ).toBe(true);
  });

  it('rejects discount above 100%', () => {
    expect(
      addQuoteLineItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        discountPercent: 150,
      }).success
    ).toBe(false);
  });

  it('rejects zero quantity', () => {
    expect(
      addQuoteLineItemSchema.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
      }).success
    ).toBe(false);
  });
});

// ============================================================================
// Quote status transitions
// ============================================================================

describe('isValidQuoteTransition', () => {
  it('allows draft → in_review', () => {
    expect(isValidQuoteTransition('draft', 'in_review')).toBe(true);
  });

  it('allows in_review → approved', () => {
    expect(isValidQuoteTransition('in_review', 'approved')).toBe(true);
  });

  it('allows in_review → denied', () => {
    expect(isValidQuoteTransition('in_review', 'denied')).toBe(true);
  });

  it('allows denied → draft (revision)', () => {
    expect(isValidQuoteTransition('denied', 'draft')).toBe(true);
  });

  it('allows approved → presented', () => {
    expect(isValidQuoteTransition('approved', 'presented')).toBe(true);
  });

  it('allows presented → accepted', () => {
    expect(isValidQuoteTransition('presented', 'accepted')).toBe(true);
  });

  it('allows presented → rejected', () => {
    expect(isValidQuoteTransition('presented', 'rejected')).toBe(true);
  });

  it('allows accepted → contracted', () => {
    expect(isValidQuoteTransition('accepted', 'contracted')).toBe(true);
  });

  it('allows expired → draft (re-open)', () => {
    expect(isValidQuoteTransition('expired', 'draft')).toBe(true);
  });

  it('rejects draft → accepted (skipping steps)', () => {
    expect(isValidQuoteTransition('draft', 'accepted')).toBe(false);
  });

  it('rejects contracted → anything (terminal)', () => {
    expect(isValidQuoteTransition('contracted', 'draft')).toBe(false);
    expect(isValidQuoteTransition('contracted', 'active')).toBe(false);
  });

  it('rejects rejected → anything (terminal)', () => {
    expect(isValidQuoteTransition('rejected', 'draft')).toBe(false);
  });

  it('rejects unknown state', () => {
    expect(isValidQuoteTransition('unknown', 'draft')).toBe(false);
  });
});

// ============================================================================
// Acceptance/rejection
// ============================================================================

describe('acceptQuoteSchema', () => {
  it('accepts valid acceptance', () => {
    expect(
      acceptQuoteSchema.safeParse({
        acceptanceMethod: 'email',
        acceptanceDate: '2026-04-12',
      }).success
    ).toBe(true);
  });

  it('accepts with PO number', () => {
    expect(
      acceptQuoteSchema.safeParse({
        acceptanceMethod: 'po',
        acceptanceDate: '2026-04-12',
        poNumber: 'PO-2026-001',
      }).success
    ).toBe(true);
  });

  it('rejects invalid method', () => {
    expect(
      acceptQuoteSchema.safeParse({
        acceptanceMethod: 'carrier_pigeon',
        acceptanceDate: '2026-04-12',
      }).success
    ).toBe(false);
  });
});

describe('rejectQuoteSchema', () => {
  it('accepts valid rejection', () => {
    expect(
      rejectQuoteSchema.safeParse({
        rejectionReason: 'price_too_high',
      }).success
    ).toBe(true);
  });

  it('accepts with notes', () => {
    expect(
      rejectQuoteSchema.safeParse({
        rejectionReason: 'competitor_chosen',
        rejectionNotes: 'Went with Salesforce',
      }).success
    ).toBe(true);
  });

  it('rejects invalid reason', () => {
    expect(
      rejectQuoteSchema.safeParse({
        rejectionReason: 'invalid_reason',
      }).success
    ).toBe(false);
  });
});

// ============================================================================
// Approval rules
// ============================================================================

describe('createApprovalRuleSchema', () => {
  it('accepts valid rule', () => {
    expect(
      createApprovalRuleSchema.safeParse({
        name: 'Discount > 15%',
        priority: 1,
        conditions: { max_discount_percent: { operator: 'gt', value: 15 } },
        approverRole: 'sales_manager',
      }).success
    ).toBe(true);
  });

  it('accepts multi-step rule', () => {
    expect(
      createApprovalRuleSchema.safeParse({
        name: 'Discount > 25%',
        priority: 2,
        conditions: { max_discount_percent: { operator: 'gt', value: 25 } },
        approverRole: 'vp_sales',
        stepNumber: 2,
      }).success
    ).toBe(true);
  });

  it('rejects missing name', () => {
    expect(
      createApprovalRuleSchema.safeParse({
        priority: 1,
        conditions: {},
      }).success
    ).toBe(false);
  });
});
