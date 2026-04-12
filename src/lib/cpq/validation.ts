import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const productTypeEnum = z.enum([
  'subscription',
  'one_time',
  'professional_service',
]);

export const chargeTypeEnum = z.enum(['recurring', 'one_time', 'usage']);

export const billingFrequencyEnum = z.enum([
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
]);

export const quoteStatusEnum = z.enum([
  'draft',
  'in_review',
  'approved',
  'denied',
  'presented',
  'accepted',
  'rejected',
  'expired',
  'contracted',
]);

export const quoteTypeEnum = z.enum(['new', 'amendment', 'renewal']);

export const discountScheduleTypeEnum = z.enum(['tiered', 'volume', 'term']);

export const discountUnitEnum = z.enum(['percent', 'amount', 'price']);

export const rejectionReasonEnum = z.enum([
  'price_too_high',
  'competitor_chosen',
  'budget_constraints',
  'timing',
  'other',
]);

export const acceptanceMethodEnum = z.enum(['verbal', 'email', 'po']);

export const invoiceStatusEnum = z.enum([
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
]);

// ============================================================================
// Product validation
// ============================================================================

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  productType: productTypeEnum,
  family: z.string().max(100).optional(),
  chargeType: chargeTypeEnum.default('recurring'),
  defaultSubscriptionTermMonths: z.number().int().positive().optional(),
  billingFrequency: billingFrequencyEnum.optional(),
  defaultPrice: z.number().nonnegative().optional(),
  hubspotProductId: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  family: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  defaultSubscriptionTermMonths: z.number().int().positive().optional(),
  billingFrequency: billingFrequencyEnum.optional(),
  defaultPrice: z.number().nonnegative().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const listProductsQuerySchema = z.object({
  productType: z.string().optional(),
  family: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// ============================================================================
// Price book validation
// ============================================================================

export const createPriceBookSchema = z.object({
  name: z.string().min(1).max(255),
  currencyCode: z.string().length(3).default('CAD'),
  description: z.string().optional(),
  isStandard: z.boolean().default(false),
});

export type CreatePriceBookInput = z.infer<typeof createPriceBookSchema>;

export const createPriceBookEntrySchema = z.object({
  productId: z.string().uuid(),
  unitPrice: z.number().nonnegative(),
  currencyCode: z.string().length(3).default('CAD'),
  effectiveDate: z.string().date().optional(),
  expirationDate: z.string().date().optional(),
});

export type CreatePriceBookEntryInput = z.infer<typeof createPriceBookEntrySchema>;

// ============================================================================
// Discount schedule validation
// ============================================================================

export const createDiscountScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  type: discountScheduleTypeEnum,
  discountUnit: discountUnitEnum.default('percent'),
  productId: z.string().uuid().optional(),
  productFamily: z.string().max(100).optional(),
});

export type CreateDiscountScheduleInput = z.infer<typeof createDiscountScheduleSchema>;

export const createDiscountTierSchema = z.object({
  lowerBound: z.number().nonnegative(),
  upperBound: z.number().positive().optional(),
  discountValue: z.number(),
  sortOrder: z.number().int().nonnegative(),
});

export type CreateDiscountTierInput = z.infer<typeof createDiscountTierSchema>;

// ============================================================================
// Quote validation
// ============================================================================

export const createQuoteSchema = z.object({
  opportunityHubspotId: z.string().optional(),
  accountHubspotId: z.string().optional(),
  accountName: z.string().optional(),
  type: quoteTypeEnum.default('new'),
  priceBookId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  subscriptionTermMonths: z.number().int().positive().default(12),
  startDate: z.string().date(),
  expirationDate: z.string().date().optional(),
  currencyCode: z.string().length(3).default('CAD'),
  paymentTerms: z.string().max(30).default('net_30'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const addQuoteLineItemSchema = z.object({
  productId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  quantity: z.number().positive().default(1),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().nonnegative().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type AddQuoteLineItemInput = z.infer<typeof addQuoteLineItemSchema>;

// ============================================================================
// Quote status transitions
// ============================================================================

const VALID_QUOTE_TRANSITIONS: Record<string, string[]> = {
  draft: ['in_review', 'expired'],
  in_review: ['approved', 'denied'],
  approved: ['presented', 'expired'],
  denied: ['draft'],
  presented: ['accepted', 'rejected', 'expired'],
  accepted: ['contracted'],
  rejected: [],
  expired: ['draft'],
  contracted: [],
};

export function isValidQuoteTransition(from: string, to: string): boolean {
  return VALID_QUOTE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================================
// Acceptance/rejection
// ============================================================================

export const acceptQuoteSchema = z.object({
  acceptanceMethod: acceptanceMethodEnum,
  acceptanceDate: z.string().date(),
  poNumber: z.string().max(100).optional(),
});

export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;

export const rejectQuoteSchema = z.object({
  rejectionReason: rejectionReasonEnum,
  rejectionNotes: z.string().optional(),
});

export type RejectQuoteInput = z.infer<typeof rejectQuoteSchema>;

// ============================================================================
// Approval validation
// ============================================================================

export const createApprovalRuleSchema = z.object({
  name: z.string().min(1).max(255),
  entityType: z.string().default('quote'),
  priority: z.number().int().positive(),
  conditions: z.record(z.string(), z.unknown()),
  approverUserId: z.string().uuid().optional(),
  approverRole: z.string().max(100).optional(),
  stepNumber: z.number().int().positive().default(1),
});

export type CreateApprovalRuleInput = z.infer<typeof createApprovalRuleSchema>;

// ============================================================================
// Pricing audit types
// ============================================================================

export const pricingAuditStepSchema = z.object({
  ruleName: z.string(),
  inputPrice: z.string(),
  outputPrice: z.string(),
  parameters: z.record(z.string(), z.string()).optional(),
  timestamp: z.string().datetime(),
});

export type PricingAuditStep = z.infer<typeof pricingAuditStepSchema>;
