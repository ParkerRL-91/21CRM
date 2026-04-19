import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const DiscountScheduleType = z.enum(['tiered', 'volume', 'term']);

export const DiscountUnit = z.enum(['percent', 'amount', 'price']);

export type DiscountScheduleTypeType = z.infer<typeof DiscountScheduleType>;
export type DiscountUnitType = z.infer<typeof DiscountUnit>;

// ============================================================================
// Create discount schedule DTO
// ============================================================================

export const CreateDiscountScheduleDto = z.object({
  name: z
    .string()
    .min(1, 'Discount schedule name is required')
    .max(255, 'Name must be 255 characters or fewer'),
  type: DiscountScheduleType,
  discountUnit: DiscountUnit.default('percent'),
  productId: z
    .string()
    .uuid('productId must be a valid UUID')
    .optional(),
  productFamily: z.string().max(100).optional(),
});

export type CreateDiscountScheduleDtoType = z.infer<typeof CreateDiscountScheduleDto>;

// ============================================================================
// Update discount schedule DTO
// ============================================================================

export const UpdateDiscountScheduleDto = z.object({
  name: z.string().min(1).max(255).optional(),
  discountUnit: DiscountUnit.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDiscountScheduleDtoType = z.infer<typeof UpdateDiscountScheduleDto>;

// ============================================================================
// Discount tier DTO
// ============================================================================

export const CreateDiscountTierDto = z.object({
  lowerBound: z
    .number()
    .nonnegative('Lower bound cannot be negative'),
  upperBound: z
    .number()
    .positive('Upper bound must be greater than zero')
    .optional(),
  discountValue: z.number(),
  sortOrder: z.number().int().nonnegative('Sort order cannot be negative'),
});

export type CreateDiscountTierDtoType = z.infer<typeof CreateDiscountTierDto>;

// ============================================================================
// Update discount tier DTO
// ============================================================================

export const UpdateDiscountTierDto = z.object({
  lowerBound: z.number().nonnegative().optional(),
  upperBound: z.number().positive().optional(),
  discountValue: z.number().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type UpdateDiscountTierDtoType = z.infer<typeof UpdateDiscountTierDto>;
