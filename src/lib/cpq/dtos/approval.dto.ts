import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const ApprovalStatus = z.enum([
  'pending',
  'approved',
  'denied',
  'escalated',
]);

export type ApprovalStatusType = z.infer<typeof ApprovalStatus>;

// ============================================================================
// Approval rule condition DTO
//
// Conditions are a map of field name to an operator + value pair.
// Example: { max_discount_percent: { operator: 'gt', value: 15 } }
// ============================================================================

export const ApprovalConditionOperator = z.enum([
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
]);

export const ApprovalConditionValueDto = z.object({
  operator: ApprovalConditionOperator,
  value: z.union([
    z.number(),
    z.string(),
    z.boolean(),
    z.array(z.union([z.number(), z.string()])),
  ]),
});

export const ApprovalConditionsDto = z.record(
  z.string(),
  ApprovalConditionValueDto
);

export type ApprovalConditionsDtoType = z.infer<typeof ApprovalConditionsDto>;

// ============================================================================
// Create approval rule DTO
// ============================================================================

export const CreateApprovalRuleDto = z.object({
  name: z
    .string()
    .min(1, 'Rule name is required')
    .max(255, 'Rule name must be 255 characters or fewer'),
  entityType: z.string().default('quote'),
  priority: z
    .number()
    .int('Priority must be a whole number')
    .positive('Priority must be at least 1'),
  conditions: ApprovalConditionsDto,
  approverUserId: z
    .string()
    .uuid('approverUserId must be a valid UUID')
    .optional(),
  approverRole: z.string().max(100).optional(),
  stepNumber: z
    .number()
    .int('Step number must be a whole number')
    .positive('Step number must be at least 1')
    .default(1),
});

export type CreateApprovalRuleDtoType = z.infer<typeof CreateApprovalRuleDto>;

// ============================================================================
// Update approval rule DTO
// ============================================================================

export const UpdateApprovalRuleDto = z.object({
  name: z.string().min(1).max(255).optional(),
  priority: z.number().int().positive().optional(),
  conditions: ApprovalConditionsDto.optional(),
  approverUserId: z.string().uuid().optional(),
  approverRole: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateApprovalRuleDtoType = z.infer<typeof UpdateApprovalRuleDto>;

// ============================================================================
// Submit approval request DTO
// ============================================================================

export const SubmitApprovalRequestDto = z.object({
  quoteId: z.string().uuid('quoteId must be a valid UUID'),
  requestedById: z.string().uuid('requestedById must be a valid UUID'),
  notes: z.string().optional(),
});

export type SubmitApprovalRequestDtoType = z.infer<typeof SubmitApprovalRequestDto>;

// ============================================================================
// Approve / deny DTO
// ============================================================================

export const ApprovalDecisionDto = z.object({
  status: z.enum(['approved', 'denied']),
  comment: z.string().optional(),
});

export type ApprovalDecisionDtoType = z.infer<typeof ApprovalDecisionDto>;
