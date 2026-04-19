import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const QuoteStatus = z.enum([
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

export const QuoteType = z.enum(['new', 'amendment', 'renewal']);

export const AcceptanceMethod = z.enum(['verbal', 'email', 'po']);

export const RejectionReason = z.enum([
  'price_too_high',
  'competitor_chosen',
  'budget_constraints',
  'timing',
  'other',
]);

export type QuoteStatusType = z.infer<typeof QuoteStatus>;
export type QuoteTypeType = z.infer<typeof QuoteType>;

// ============================================================================
// Create quote DTO
// ============================================================================

export const CreateQuoteDto = z.object({
  opportunityHubspotId: z.string().optional(),
  accountHubspotId: z.string().optional(),
  accountName: z.string().optional(),
  type: QuoteType.default('new'),
  priceBookId: z.string().uuid('priceBookId must be a valid UUID').optional(),
  contractId: z.string().uuid('contractId must be a valid UUID').optional(),
  subscriptionTermMonths: z
    .number()
    .int('Term must be a whole number of months')
    .positive('Term must be at least 1 month')
    .default(12),
  startDate: z.string().date('startDate must be a valid ISO date'),
  expirationDate: z
    .string()
    .date('expirationDate must be a valid ISO date')
    .optional(),
  currencyCode: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .default('CAD'),
  paymentTerms: z.string().max(30).default('net_30'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type CreateQuoteDtoType = z.infer<typeof CreateQuoteDto>;

// ============================================================================
// Update quote DTO
// ============================================================================

export const UpdateQuoteDto = z.object({
  accountName: z.string().optional(),
  priceBookId: z.string().uuid().optional(),
  subscriptionTermMonths: z.number().int().positive().optional(),
  startDate: z.string().date().optional(),
  expirationDate: z.string().date().optional(),
  currencyCode: z.string().length(3).optional(),
  paymentTerms: z.string().max(30).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type UpdateQuoteDtoType = z.infer<typeof UpdateQuoteDto>;

// ============================================================================
// Add line item DTO
// ============================================================================

export const AddQuoteLineItemDto = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  groupId: z.string().uuid().optional(),
  quantity: z.number().positive('Quantity must be greater than zero').default(1),
  discountPercent: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional(),
  discountAmount: z.number().nonnegative('Discount amount cannot be negative').optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type AddQuoteLineItemDtoType = z.infer<typeof AddQuoteLineItemDto>;

// ============================================================================
// Update line item DTO
// ============================================================================

export const UpdateQuoteLineItemDto = z.object({
  quantity: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().nonnegative().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type UpdateQuoteLineItemDtoType = z.infer<typeof UpdateQuoteLineItemDto>;

// ============================================================================
// Quote status transition DTO
// ============================================================================

export const TransitionQuoteStatusDto = z.object({
  status: QuoteStatus,
  note: z.string().optional(),
});

export type TransitionQuoteStatusDtoType = z.infer<typeof TransitionQuoteStatusDto>;

// ============================================================================
// Accept / reject quote DTOs
// ============================================================================

export const AcceptQuoteDto = z.object({
  acceptanceMethod: AcceptanceMethod,
  acceptanceDate: z.string().date('acceptanceDate must be a valid ISO date'),
  poNumber: z.string().max(100).optional(),
});

export type AcceptQuoteDtoType = z.infer<typeof AcceptQuoteDto>;

export const RejectQuoteDto = z.object({
  rejectionReason: RejectionReason,
  rejectionNotes: z.string().optional(),
});

export type RejectQuoteDtoType = z.infer<typeof RejectQuoteDto>;
