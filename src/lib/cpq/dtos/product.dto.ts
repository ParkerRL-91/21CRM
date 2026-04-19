import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const ProductType = z.enum([
  'subscription',
  'one_time',
  'professional_service',
]);

export const ChargeType = z.enum(['recurring', 'one_time', 'usage']);

export const BillingFrequency = z.enum([
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
]);

// ============================================================================
// Create product DTO
// ============================================================================

export const CreateProductDto = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be 255 characters or fewer'),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  productType: ProductType,
  family: z.string().max(100).optional(),
  chargeType: ChargeType.default('recurring'),
  defaultSubscriptionTermMonths: z
    .number()
    .int('Term must be a whole number of months')
    .positive('Term must be at least 1 month')
    .optional(),
  billingFrequency: BillingFrequency.optional(),
  defaultPrice: z.number().nonnegative('Price cannot be negative').optional(),
  hubspotProductId: z.string().optional(),
});

export type CreateProductDtoType = z.infer<typeof CreateProductDto>;

// ============================================================================
// Update product DTO
// ============================================================================

export const UpdateProductDto = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255)
    .optional(),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  family: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  defaultSubscriptionTermMonths: z
    .number()
    .int()
    .positive()
    .optional(),
  billingFrequency: BillingFrequency.optional(),
  defaultPrice: z.number().nonnegative().optional(),
});

export type UpdateProductDtoType = z.infer<typeof UpdateProductDto>;

// ============================================================================
// List products query DTO
// ============================================================================

export const ListProductsQueryDto = z.object({
  productType: ProductType.optional(),
  family: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, 'Limit cannot exceed 100')
    .default(50),
});

export type ListProductsQueryDtoType = z.infer<typeof ListProductsQueryDto>;
