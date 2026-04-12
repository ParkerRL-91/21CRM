import { z } from 'zod';

// ============================================================================
// JSONB shape validators — ensures JSONB columns have consistent structure
// ============================================================================

/** Shape of a single proposed subscription line in contract_renewals.proposed_subscriptions */
export const ProposedSubscriptionLineSchema = z.object({
  subscriptionId: z.string().uuid(),
  productHubspotId: z.string().optional(),
  productName: z.string(),
  quantity: z.number().positive(),
  oldUnitPrice: z.string(), // Decimal as string for precision
  newUnitPrice: z.string(),
  oldAnnualValue: z.string(),
  newAnnualValue: z.string(),
  pricingMethod: z.enum(['same_price', 'current_list', 'uplift_percentage']),
  billingFrequency: z.string(),
});

export type ProposedSubscriptionLine = z.infer<
  typeof ProposedSubscriptionLineSchema
>;

/** Shape of the changes field in contract_amendments.changes */
export const AmendmentChangesSchema = z.object({
  field: z.string(),
  oldValue: z.union([z.string(), z.number(), z.null()]),
  newValue: z.union([z.string(), z.number(), z.null()]),
});

export type AmendmentChanges = z.infer<typeof AmendmentChangesSchema>;

/** Shape of risk signals in contract_renewals.risk_signals */
export const RiskSignalSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(1),
  score: z.number().int().min(0).max(100),
  description: z.string(),
  detectedAt: z.string().datetime(),
});

export type RiskSignal = z.infer<typeof RiskSignalSchema>;

// ============================================================================
// Contract CRUD validation schemas
// ============================================================================

export const contractStatusEnum = z.enum([
  'draft',
  'active',
  'amended',
  'pending_renewal',
  'renewed',
  'expired',
  'cancelled',
]);

export const subscriptionStatusEnum = z.enum([
  'active',
  'pending',
  'suspended',
  'pending_amendment',
  'pending_renewal',
  'pending_cancellation',
  'renewed',
  'cancelled',
  'expired',
]);

export const pricingMethodEnum = z.enum([
  'same_price',
  'current_list',
  'uplift_percentage',
]);

export const billingFrequencyEnum = z.enum([
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
]);

export const chargeTypeEnum = z.enum(['recurring', 'one_time', 'usage']);

export const subscriptionTypeEnum = z.enum([
  'renewable',
  'evergreen',
  'one_time',
]);

// --- Create contract ---

const subscriptionInputSchema = z.object({
  productHubspotId: z.string().optional(),
  productName: z.string().min(1).max(255),
  lineItemHubspotId: z.string().optional(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative(),
  annualValue: z.number().nonnegative(),
  billingFrequency: billingFrequencyEnum.default('annual'),
  startDate: z.string().date(),
  endDate: z.string().date(),
  chargeType: chargeTypeEnum.default('recurring'),
  subscriptionType: subscriptionTypeEnum.default('renewable'),
  renewalPricingMethod: pricingMethodEnum.optional(),
  renewalUpliftPercentage: z.number().min(0).max(100).optional(),
});

export const createContractSchema = z.object({
  contractName: z.string().min(1).max(255),
  accountHubspotId: z.string().optional(),
  accountName: z.string().optional(),
  dealHubspotId: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  totalValue: z.number().nonnegative(),
  currencyCode: z.string().length(3).default('CAD'),
  ownerHubspotId: z.string().optional(),
  ownerName: z.string().optional(),
  renewalPricingMethod: pricingMethodEnum.optional(),
  renewalUpliftPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  subscriptions: z.array(subscriptionInputSchema).optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;

// --- Create from deal ---

export const createFromDealSchema = z.object({
  dealHubspotId: z.string().min(1),
  startDate: z.string().date().optional(),
  termMonths: z.number().int().positive().optional(),
});

export type CreateFromDealInput = z.infer<typeof createFromDealSchema>;

// --- Update contract ---

export const updateContractSchema = z.object({
  contractName: z.string().min(1).max(255).optional(),
  status: contractStatusEnum.optional(),
  ownerHubspotId: z.string().optional(),
  ownerName: z.string().optional(),
  renewalPricingMethod: pricingMethodEnum.optional(),
  renewalUpliftPercentage: z.number().min(0).max(100).optional(),
  renewalLeadDays: z.number().int().min(7).max(365).optional(),
  notes: z.string().optional(),
});

export type UpdateContractInput = z.infer<typeof updateContractSchema>;

// --- List contracts query ---

export const listContractsQuerySchema = z.object({
  status: z.string().optional(), // comma-separated statuses
  accountHubspotId: z.string().optional(),
  ownerHubspotId: z.string().optional(),
  expiringWithinDays: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  sortBy: z.string().default('end_date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;

// --- Add subscription ---

export const addSubscriptionSchema = subscriptionInputSchema;
export type AddSubscriptionInput = z.infer<typeof addSubscriptionSchema>;

// --- Modify subscription ---

export const modifySubscriptionSchema = z.object({
  quantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  effectiveDate: z.string().date(),
  notes: z.string().optional(),
});

export type ModifySubscriptionInput = z.infer<typeof modifySubscriptionSchema>;

// --- Renewal config ---

export const renewalConfigSchema = z
  .object({
    defaultLeadDays: z.number().int().min(7).max(365),
    defaultPricingMethod: pricingMethodEnum,
    defaultUpliftPercentage: z.number().min(0).max(100).optional(),
    renewalPipelineId: z.string().optional(),
    renewalStageId: z.string().optional(),
    renewalDealPrefix: z.string().max(50).default('Renewal:'),
    notifyOwnerOnCreation: z.boolean().default(true),
    notifyAdditionalUsers: z.array(z.string().uuid()).default([]),
    jobEnabled: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.defaultPricingMethod !== 'uplift_percentage' ||
      (data.defaultUpliftPercentage !== undefined &&
        data.defaultUpliftPercentage > 0),
    {
      message:
        'Uplift percentage required when pricing method is uplift_percentage',
    }
  );

export type RenewalConfigInput = z.infer<typeof renewalConfigSchema>;

// ============================================================================
// Status transition validation
// ============================================================================

const VALID_CONTRACT_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['amended', 'pending_renewal', 'expired', 'cancelled'],
  amended: ['active'],
  pending_renewal: ['renewed', 'expired', 'cancelled'],
};

export function isValidContractTransition(
  from: string,
  to: string
): boolean {
  return VALID_CONTRACT_TRANSITIONS[from]?.includes(to) ?? false;
}

const VALID_SUBSCRIPTION_TRANSITIONS: Record<string, string[]> = {
  pending: ['active'],
  active: ['pending_amendment', 'pending_cancellation', 'suspended', 'expired'],
  suspended: ['active'],
  pending_amendment: ['active'],
  pending_cancellation: ['cancelled'],
};

export function isValidSubscriptionTransition(
  from: string,
  to: string
): boolean {
  return VALID_SUBSCRIPTION_TRANSITIONS[from]?.includes(to) ?? false;
}
