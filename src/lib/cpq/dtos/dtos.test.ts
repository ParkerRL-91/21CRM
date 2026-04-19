import { describe, it, expect } from 'vitest';
import {
  CreateProductDto,
  UpdateProductDto,
  ListProductsQueryDto,
  CreatePriceBookDto,
  CreatePriceBookEntryDto,
  UpdatePriceBookEntryDto,
  CreateDiscountScheduleDto,
  CreateDiscountTierDto,
  CreateQuoteDto,
  UpdateQuoteDto,
  AddQuoteLineItemDto,
  AcceptQuoteDto,
  RejectQuoteDto,
  TransitionQuoteStatusDto,
  CreateApprovalRuleDto,
  SubmitApprovalRequestDto,
  ApprovalDecisionDto,
} from './index';

// ============================================================================
// Product DTOs
// ============================================================================

describe('CreateProductDto', () => {
  it('accepts a valid subscription product', () => {
    const result = CreateProductDto.safeParse({
      name: 'Platform Pro',
      productType: 'subscription',
      chargeType: 'recurring',
      defaultSubscriptionTermMonths: 12,
      billingFrequency: 'annual',
      defaultPrice: 60000,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a one-time product without term or frequency', () => {
    const result = CreateProductDto.safeParse({
      name: 'Implementation Fee',
      productType: 'one_time',
      chargeType: 'one_time',
      defaultPrice: 15000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty product name', () => {
    const result = CreateProductDto.safeParse({
      name: '',
      productType: 'subscription',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid productType', () => {
    const result = CreateProductDto.safeParse({
      name: 'Widget',
      productType: 'hardware', // not a valid enum value
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative default price', () => {
    const result = CreateProductDto.safeParse({
      name: 'Platform',
      productType: 'subscription',
      defaultPrice: -500,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero subscription term', () => {
    const result = CreateProductDto.safeParse({
      name: 'Platform',
      productType: 'subscription',
      defaultSubscriptionTermMonths: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer subscription term', () => {
    const result = CreateProductDto.safeParse({
      name: 'Platform',
      productType: 'subscription',
      defaultSubscriptionTermMonths: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('defaults chargeType to recurring', () => {
    const result = CreateProductDto.safeParse({
      name: 'Platform',
      productType: 'subscription',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chargeType).toBe('recurring');
    }
  });

  it('accepts optional fields omitted', () => {
    const result = CreateProductDto.safeParse({
      name: 'Minimal Product',
      productType: 'one_time',
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateProductDto', () => {
  it('accepts empty object (no changes)', () => {
    expect(UpdateProductDto.safeParse({}).success).toBe(true);
  });

  it('accepts isActive: false', () => {
    expect(UpdateProductDto.safeParse({ isActive: false }).success).toBe(true);
  });

  it('accepts name-only update', () => {
    expect(UpdateProductDto.safeParse({ name: 'New Name' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(UpdateProductDto.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('ListProductsQueryDto', () => {
  it('defaults page to 1 and limit to 50', () => {
    const result = ListProductsQueryDto.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit above 100', () => {
    const result = ListProductsQueryDto.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it('coerces string page/limit to numbers', () => {
    const result = ListProductsQueryDto.safeParse({ page: '2', limit: '25' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(25);
    }
  });
});

// ============================================================================
// Price book DTOs
// ============================================================================

describe('CreatePriceBookDto', () => {
  it('accepts valid price book', () => {
    expect(
      CreatePriceBookDto.safeParse({ name: 'Standard 2026', currencyCode: 'CAD' })
        .success
    ).toBe(true);
  });

  it('defaults currencyCode to CAD', () => {
    const result = CreatePriceBookDto.safeParse({ name: 'Standard' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currencyCode).toBe('CAD');
  });

  it('rejects 2-character currency code', () => {
    expect(
      CreatePriceBookDto.safeParse({ name: 'Test', currencyCode: 'CA' }).success
    ).toBe(false);
  });

  it('rejects 4-character currency code', () => {
    expect(
      CreatePriceBookDto.safeParse({ name: 'Test', currencyCode: 'CADD' }).success
    ).toBe(false);
  });

  it('rejects empty name', () => {
    expect(CreatePriceBookDto.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('CreatePriceBookEntryDto', () => {
  it('accepts valid entry', () => {
    expect(
      CreatePriceBookEntryDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        unitPrice: 60000,
      }).success
    ).toBe(true);
  });

  it('accepts zero unit price (free product)', () => {
    expect(
      CreatePriceBookEntryDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        unitPrice: 0,
      }).success
    ).toBe(true);
  });

  it('rejects negative unit price', () => {
    expect(
      CreatePriceBookEntryDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        unitPrice: -100,
      }).success
    ).toBe(false);
  });

  it('rejects non-UUID productId', () => {
    expect(
      CreatePriceBookEntryDto.safeParse({
        productId: 'not-a-uuid',
        unitPrice: 100,
      }).success
    ).toBe(false);
  });

  it('accepts effectiveDate and expirationDate', () => {
    expect(
      CreatePriceBookEntryDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        unitPrice: 5000,
        effectiveDate: '2026-01-01',
        expirationDate: '2026-12-31',
      }).success
    ).toBe(true);
  });
});

describe('UpdatePriceBookEntryDto', () => {
  it('accepts empty object', () => {
    expect(UpdatePriceBookEntryDto.safeParse({}).success).toBe(true);
  });

  it('rejects negative unit price', () => {
    expect(UpdatePriceBookEntryDto.safeParse({ unitPrice: -1 }).success).toBe(
      false
    );
  });
});

// ============================================================================
// Discount DTOs
// ============================================================================

describe('CreateDiscountScheduleDto', () => {
  it('accepts tiered schedule', () => {
    expect(
      CreateDiscountScheduleDto.safeParse({ name: 'Volume Tiers', type: 'tiered' })
        .success
    ).toBe(true);
  });

  it('accepts volume schedule with product scoping', () => {
    expect(
      CreateDiscountScheduleDto.safeParse({
        name: 'Product Volume',
        type: 'volume',
        productId: '550e8400-e29b-41d4-a716-446655440000',
      }).success
    ).toBe(true);
  });

  it('accepts term schedule', () => {
    expect(
      CreateDiscountScheduleDto.safeParse({
        name: 'Multi-Year',
        type: 'term',
        discountUnit: 'percent',
      }).success
    ).toBe(true);
  });

  it('defaults discountUnit to percent', () => {
    const result = CreateDiscountScheduleDto.safeParse({
      name: 'Test',
      type: 'tiered',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discountUnit).toBe('percent');
  });

  it('rejects empty name', () => {
    expect(
      CreateDiscountScheduleDto.safeParse({ name: '', type: 'tiered' }).success
    ).toBe(false);
  });

  it('rejects invalid type', () => {
    expect(
      CreateDiscountScheduleDto.safeParse({ name: 'Test', type: 'flat' }).success
    ).toBe(false);
  });

  it('rejects invalid productId (non-UUID)', () => {
    expect(
      CreateDiscountScheduleDto.safeParse({
        name: 'Test',
        type: 'tiered',
        productId: 'not-a-uuid',
      }).success
    ).toBe(false);
  });
});

describe('CreateDiscountTierDto', () => {
  it('accepts valid tier with upper bound', () => {
    expect(
      CreateDiscountTierDto.safeParse({
        lowerBound: 1,
        upperBound: 500,
        discountValue: 40,
        sortOrder: 1,
      }).success
    ).toBe(true);
  });

  it('accepts unlimited tier (no upper bound)', () => {
    expect(
      CreateDiscountTierDto.safeParse({
        lowerBound: 501,
        discountValue: 25,
        sortOrder: 2,
      }).success
    ).toBe(true);
  });

  it('rejects negative lower bound', () => {
    expect(
      CreateDiscountTierDto.safeParse({
        lowerBound: -1,
        discountValue: 10,
        sortOrder: 0,
      }).success
    ).toBe(false);
  });

  it('accepts discountValue of 0 (free tier)', () => {
    expect(
      CreateDiscountTierDto.safeParse({
        lowerBound: 1,
        discountValue: 0,
        sortOrder: 0,
      }).success
    ).toBe(true);
  });

  it('accepts negative discountValue (e.g. price reduction)', () => {
    expect(
      CreateDiscountTierDto.safeParse({
        lowerBound: 1,
        discountValue: -5,
        sortOrder: 0,
      }).success
    ).toBe(true);
  });

  it('rejects non-integer sort order', () => {
    expect(
      CreateDiscountTierDto.safeParse({
        lowerBound: 1,
        discountValue: 10,
        sortOrder: 1.5,
      }).success
    ).toBe(false);
  });
});

// ============================================================================
// Quote DTOs
// ============================================================================

describe('CreateQuoteDto', () => {
  it('accepts minimal valid quote', () => {
    expect(
      CreateQuoteDto.safeParse({ startDate: '2026-01-01' }).success
    ).toBe(true);
  });

  it('defaults type to new and term to 12', () => {
    const result = CreateQuoteDto.safeParse({ startDate: '2026-01-01' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('new');
      expect(result.data.subscriptionTermMonths).toBe(12);
    }
  });

  it('accepts amendment quote with contractId', () => {
    expect(
      CreateQuoteDto.safeParse({
        type: 'amendment',
        contractId: '550e8400-e29b-41d4-a716-446655440000',
        startDate: '2026-06-01',
      }).success
    ).toBe(true);
  });

  it('rejects non-UUID contractId', () => {
    expect(
      CreateQuoteDto.safeParse({
        startDate: '2026-01-01',
        contractId: 'not-a-uuid',
      }).success
    ).toBe(false);
  });

  it('rejects invalid startDate format', () => {
    expect(
      CreateQuoteDto.safeParse({ startDate: '01/01/2026' }).success
    ).toBe(false);
  });

  it('rejects zero subscription term', () => {
    expect(
      CreateQuoteDto.safeParse({
        startDate: '2026-01-01',
        subscriptionTermMonths: 0,
      }).success
    ).toBe(false);
  });

  it('rejects invalid quote type', () => {
    expect(
      CreateQuoteDto.safeParse({ startDate: '2026-01-01', type: 'upgrade' })
        .success
    ).toBe(false);
  });

  it('defaults currencyCode to CAD', () => {
    const result = CreateQuoteDto.safeParse({ startDate: '2026-01-01' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currencyCode).toBe('CAD');
  });
});

describe('UpdateQuoteDto', () => {
  it('accepts empty object', () => {
    expect(UpdateQuoteDto.safeParse({}).success).toBe(true);
  });

  it('rejects invalid currency code', () => {
    expect(UpdateQuoteDto.safeParse({ currencyCode: 'US' }).success).toBe(false);
  });
});

describe('AddQuoteLineItemDto', () => {
  it('accepts valid line item', () => {
    expect(
      AddQuoteLineItemDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 5,
      }).success
    ).toBe(true);
  });

  it('accepts line item with 15% discount', () => {
    expect(
      AddQuoteLineItemDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
        discountPercent: 15,
      }).success
    ).toBe(true);
  });

  it('rejects discount above 100%', () => {
    expect(
      AddQuoteLineItemDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        discountPercent: 150,
      }).success
    ).toBe(false);
  });

  it('rejects negative discount percent', () => {
    expect(
      AddQuoteLineItemDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        discountPercent: -5,
      }).success
    ).toBe(false);
  });

  it('rejects zero quantity', () => {
    expect(
      AddQuoteLineItemDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
      }).success
    ).toBe(false);
  });

  it('rejects negative quantity', () => {
    expect(
      AddQuoteLineItemDto.safeParse({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: -3,
      }).success
    ).toBe(false);
  });

  it('rejects non-UUID productId', () => {
    expect(
      AddQuoteLineItemDto.safeParse({
        productId: 'prod-123',
        quantity: 1,
      }).success
    ).toBe(false);
  });

  it('defaults quantity to 1', () => {
    const result = AddQuoteLineItemDto.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe(1);
  });
});

describe('AcceptQuoteDto', () => {
  it('accepts valid email acceptance', () => {
    expect(
      AcceptQuoteDto.safeParse({
        acceptanceMethod: 'email',
        acceptanceDate: '2026-04-15',
      }).success
    ).toBe(true);
  });

  it('accepts po with PO number', () => {
    expect(
      AcceptQuoteDto.safeParse({
        acceptanceMethod: 'po',
        acceptanceDate: '2026-04-15',
        poNumber: 'PO-2026-0042',
      }).success
    ).toBe(true);
  });

  it('rejects invalid acceptance method', () => {
    expect(
      AcceptQuoteDto.safeParse({
        acceptanceMethod: 'fax',
        acceptanceDate: '2026-04-15',
      }).success
    ).toBe(false);
  });

  it('rejects invalid date format', () => {
    expect(
      AcceptQuoteDto.safeParse({
        acceptanceMethod: 'email',
        acceptanceDate: 'April 15, 2026',
      }).success
    ).toBe(false);
  });
});

describe('RejectQuoteDto', () => {
  it('accepts valid rejection', () => {
    expect(
      RejectQuoteDto.safeParse({ rejectionReason: 'price_too_high' }).success
    ).toBe(true);
  });

  it('accepts rejection with notes', () => {
    expect(
      RejectQuoteDto.safeParse({
        rejectionReason: 'competitor_chosen',
        rejectionNotes: 'Customer chose Salesforce',
      }).success
    ).toBe(true);
  });

  it('rejects invalid reason', () => {
    expect(
      RejectQuoteDto.safeParse({ rejectionReason: 'changed_mind' }).success
    ).toBe(false);
  });
});

describe('TransitionQuoteStatusDto', () => {
  it('accepts valid status with optional note', () => {
    expect(
      TransitionQuoteStatusDto.safeParse({
        status: 'in_review',
        note: 'Submitting for approval',
      }).success
    ).toBe(true);
  });

  it('accepts status without note', () => {
    expect(
      TransitionQuoteStatusDto.safeParse({ status: 'approved' }).success
    ).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(
      TransitionQuoteStatusDto.safeParse({ status: 'active' }).success
    ).toBe(false);
  });
});

// ============================================================================
// Approval DTOs
// ============================================================================

describe('CreateApprovalRuleDto', () => {
  it('accepts valid rule with role approver', () => {
    expect(
      CreateApprovalRuleDto.safeParse({
        name: 'Discount > 15%',
        priority: 1,
        conditions: { max_discount_percent: { operator: 'gt', value: 15 } },
        approverRole: 'sales_manager',
      }).success
    ).toBe(true);
  });

  it('accepts valid rule with user approver', () => {
    expect(
      CreateApprovalRuleDto.safeParse({
        name: 'Large Deal',
        priority: 2,
        conditions: { deal_value: { operator: 'gte', value: 500000 } },
        approverUserId: '550e8400-e29b-41d4-a716-446655440000',
        stepNumber: 1,
      }).success
    ).toBe(true);
  });

  it('rejects invalid approverUserId (non-UUID)', () => {
    expect(
      CreateApprovalRuleDto.safeParse({
        name: 'Test',
        priority: 1,
        conditions: {},
        approverUserId: 'not-a-uuid',
      }).success
    ).toBe(false);
  });

  it('rejects missing name', () => {
    expect(
      CreateApprovalRuleDto.safeParse({ priority: 1, conditions: {} }).success
    ).toBe(false);
  });

  it('rejects zero priority', () => {
    expect(
      CreateApprovalRuleDto.safeParse({
        name: 'Test',
        priority: 0,
        conditions: {},
      }).success
    ).toBe(false);
  });

  it('rejects non-integer priority', () => {
    expect(
      CreateApprovalRuleDto.safeParse({
        name: 'Test',
        priority: 1.5,
        conditions: {},
      }).success
    ).toBe(false);
  });

  it('defaults stepNumber to 1', () => {
    const result = CreateApprovalRuleDto.safeParse({
      name: 'Test',
      priority: 1,
      conditions: {},
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stepNumber).toBe(1);
  });

  it('accepts conditions with array value (in operator)', () => {
    expect(
      CreateApprovalRuleDto.safeParse({
        name: 'Category Rule',
        priority: 1,
        conditions: {
          product_family: { operator: 'in', value: ['enterprise', 'professional'] },
        },
      }).success
    ).toBe(true);
  });
});

describe('SubmitApprovalRequestDto', () => {
  it('accepts valid submission', () => {
    expect(
      SubmitApprovalRequestDto.safeParse({
        quoteId: '550e8400-e29b-41d4-a716-446655440000',
        requestedById: '550e8400-e29b-41d4-a716-446655440001',
      }).success
    ).toBe(true);
  });

  it('rejects non-UUID quoteId', () => {
    expect(
      SubmitApprovalRequestDto.safeParse({
        quoteId: 'q-123',
        requestedById: '550e8400-e29b-41d4-a716-446655440001',
      }).success
    ).toBe(false);
  });

  it('rejects missing requestedById', () => {
    expect(
      SubmitApprovalRequestDto.safeParse({
        quoteId: '550e8400-e29b-41d4-a716-446655440000',
      }).success
    ).toBe(false);
  });
});

describe('ApprovalDecisionDto', () => {
  it('accepts approved decision', () => {
    expect(
      ApprovalDecisionDto.safeParse({ status: 'approved' }).success
    ).toBe(true);
  });

  it('accepts denied decision with comment', () => {
    expect(
      ApprovalDecisionDto.safeParse({
        status: 'denied',
        comment: 'Discount exceeds policy',
      }).success
    ).toBe(true);
  });

  it('rejects pending as a decision status', () => {
    expect(
      ApprovalDecisionDto.safeParse({ status: 'pending' }).success
    ).toBe(false);
  });
});
