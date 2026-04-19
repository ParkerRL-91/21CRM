import { z } from 'zod';

// ============================================================================
// Create price book DTO
// ============================================================================

export const CreatePriceBookDto = z.object({
  name: z
    .string()
    .min(1, 'Price book name is required')
    .max(255, 'Price book name must be 255 characters or fewer'),
  currencyCode: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters (ISO 4217)')
    .default('CAD'),
  description: z.string().optional(),
  isStandard: z.boolean().default(false),
});

export type CreatePriceBookDtoType = z.infer<typeof CreatePriceBookDto>;

// ============================================================================
// Update price book DTO
// ============================================================================

export const UpdatePriceBookDto = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePriceBookDtoType = z.infer<typeof UpdatePriceBookDto>;

// ============================================================================
// Price book entry DTO
// ============================================================================

export const CreatePriceBookEntryDto = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  currencyCode: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .default('CAD'),
  effectiveDate: z.string().date('effectiveDate must be a valid ISO date').optional(),
  expirationDate: z
    .string()
    .date('expirationDate must be a valid ISO date')
    .optional(),
});

export type CreatePriceBookEntryDtoType = z.infer<typeof CreatePriceBookEntryDto>;

// ============================================================================
// Update price book entry DTO
// ============================================================================

export const UpdatePriceBookEntryDto = z.object({
  unitPrice: z.number().nonnegative().optional(),
  effectiveDate: z.string().date().optional(),
  expirationDate: z.string().date().optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePriceBookEntryDtoType = z.infer<typeof UpdatePriceBookEntryDto>;
