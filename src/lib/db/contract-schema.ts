import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// Table 1: contracts
// Central contract record. One contract per accepted deal/quote.
// ============================================================================

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),

    // Identity
    contractNumber: varchar('contract_number', { length: 50 }).notNull(),
    contractName: varchar('contract_name', { length: 255 }).notNull(),

    // Relationships
    accountHubspotId: varchar('account_hubspot_id', { length: 50 }),
    accountName: varchar('account_name', { length: 255 }),
    dealHubspotId: varchar('deal_hubspot_id', { length: 50 }),
    quoteId: uuid('quote_id'),

    // Lifecycle
    status: varchar('status', { length: 30 })
      .notNull()
      .default('draft'),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),

    // Financial
    totalValue: numeric('total_value', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    currencyCode: varchar('currency_code', { length: 3 })
      .notNull()
      .default('CAD'),

    // Renewal tracking
    renewalStatus: varchar('renewal_status', { length: 30 }),
    renewalOpportunityHubspotId: varchar('renewal_opportunity_hubspot_id', {
      length: 50,
    }),
    renewalLeadDays: integer('renewal_lead_days').default(90),
    renewalPricingMethod: varchar('renewal_pricing_method', { length: 30 }),
    renewalUpliftPercentage: numeric('renewal_uplift_percentage', {
      precision: 5,
      scale: 2,
    }),

    // Ownership
    ownerHubspotId: varchar('owner_hubspot_id', { length: 50 }),
    ownerName: varchar('owner_name', { length: 255 }),

    // Cancellation
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledReason: text('cancelled_reason'),

    // Metadata
    notes: text('notes'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
  },
  (table) => [
    unique('contracts_org_number_unique').on(table.orgId, table.contractNumber),
    check(
      'contracts_dates_check',
      sql`${table.endDate} > ${table.startDate}`
    ),
    check(
      'contracts_status_check',
      sql`${table.status} IN ('draft', 'active', 'amended', 'pending_renewal', 'renewed', 'expired', 'cancelled')`
    ),
    check(
      'contracts_renewal_method_check',
      sql`${table.renewalPricingMethod} IS NULL OR ${table.renewalPricingMethod} IN ('same_price', 'current_list', 'uplift_percentage')`
    ),
    index('contracts_org_status_idx').on(table.orgId, table.status),
    index('contracts_org_status_enddate_idx').on(
      table.orgId,
      table.status,
      table.endDate
    ),
    index('contracts_org_account_idx').on(table.orgId, table.accountHubspotId),
    index('contracts_org_owner_idx').on(table.orgId, table.ownerHubspotId),
  ]
);

// ============================================================================
// Table 2: contract_subscriptions
// Individual subscription line items within a contract.
// ============================================================================

export const contractSubscriptions = pgTable(
  'contract_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id').notNull(),

    // Product reference
    productHubspotId: varchar('product_hubspot_id', { length: 50 }),
    productName: varchar('product_name', { length: 255 }).notNull(),
    lineItemHubspotId: varchar('line_item_hubspot_id', { length: 50 }),

    // Financial
    quantity: numeric('quantity', { precision: 12, scale: 2 })
      .notNull()
      .default('1'),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    discountPercentage: numeric('discount_percentage', {
      precision: 5,
      scale: 2,
    }).default('0'),
    annualValue: numeric('annual_value', { precision: 12, scale: 2 }).notNull(),
    billingFrequency: varchar('billing_frequency', { length: 20 })
      .notNull()
      .default('annual'),

    // Dates
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),

    // Lifecycle
    status: varchar('status', { length: 30 }).notNull().default('active'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledReason: text('cancelled_reason'),

    // Renewal pricing
    renewalPricingMethod: varchar('renewal_pricing_method', { length: 30 }),
    renewalUpliftPercentage: numeric('renewal_uplift_percentage', {
      precision: 5,
      scale: 2,
    }),

    // Type classification
    chargeType: varchar('charge_type', { length: 20 })
      .notNull()
      .default('recurring'),
    subscriptionType: varchar('subscription_type', { length: 20 })
      .notNull()
      .default('renewable'),

    // Metadata
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'subscriptions_dates_check',
      sql`${table.endDate} > ${table.startDate}`
    ),
    check(
      'subscriptions_status_check',
      sql`${table.status} IN ('active', 'pending', 'suspended', 'pending_amendment', 'pending_renewal', 'pending_cancellation', 'renewed', 'cancelled', 'expired')`
    ),
    check(
      'subscriptions_billing_check',
      sql`${table.billingFrequency} IN ('monthly', 'quarterly', 'semi_annual', 'annual')`
    ),
    check(
      'subscriptions_charge_type_check',
      sql`${table.chargeType} IN ('recurring', 'one_time', 'usage')`
    ),
    check(
      'subscriptions_sub_type_check',
      sql`${table.subscriptionType} IN ('renewable', 'evergreen', 'one_time')`
    ),
    check(
      'subscriptions_renewal_method_check',
      sql`${table.renewalPricingMethod} IS NULL OR ${table.renewalPricingMethod} IN ('same_price', 'current_list', 'uplift_percentage')`
    ),
    index('subscriptions_contract_idx').on(table.contractId),
    index('subscriptions_org_status_idx').on(table.orgId, table.status),
    index('subscriptions_org_product_idx').on(
      table.orgId,
      table.productHubspotId
    ),
  ]
);

// ============================================================================
// Table 3: contract_amendments
// Append-only log of all changes to a contract. Never mutated.
// ============================================================================

export const contractAmendments = pgTable(
  'contract_amendments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id').notNull(),

    // Amendment details
    amendmentNumber: integer('amendment_number').notNull(),
    amendmentType: varchar('amendment_type', { length: 30 }).notNull(),
    description: text('description').notNull(),

    // What changed
    subscriptionId: uuid('subscription_id').references(
      () => contractSubscriptions.id
    ),
    changes: jsonb('changes').notNull(),

    // Financial impact
    deltaValue: numeric('delta_value', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    effectiveDate: date('effective_date').notNull(),

    // Source
    dealHubspotId: varchar('deal_hubspot_id', { length: 50 }),
    quoteId: uuid('quote_id'),
    amendedBy: uuid('amended_by'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('amendments_contract_number_unique').on(
      table.contractId,
      table.amendmentNumber
    ),
    check(
      'amendments_type_check',
      sql`${table.amendmentType} IN ('add_subscription', 'remove_subscription', 'quantity_change', 'price_change', 'term_extension', 'early_renewal', 'cancellation', 'product_upgrade')`
    ),
    index('amendments_contract_idx').on(
      table.contractId,
      table.amendmentNumber
    ),
    index('amendments_org_date_idx').on(table.orgId, table.effectiveDate),
  ]
);

// ============================================================================
// Table 4: renewal_config
// System-level configuration for the renewal automation engine. One per org.
// ============================================================================

export const renewalConfig = pgTable('renewal_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().unique(),

  // Timing
  defaultLeadDays: integer('default_lead_days').notNull().default(90),
  leadDaysOptions: jsonb('lead_days_options')
    .notNull()
    .default([30, 60, 90, 120]),

  // Pricing defaults
  defaultPricingMethod: varchar('default_pricing_method', { length: 30 })
    .notNull()
    .default('same_price'),
  defaultUpliftPercentage: numeric('default_uplift_percentage', {
    precision: 5,
    scale: 2,
  }).default('3.00'),

  // Renewal opportunity settings
  renewalPipelineId: varchar('renewal_pipeline_id', { length: 50 }),
  renewalStageId: varchar('renewal_stage_id', { length: 50 }),
  renewalDealPrefix: varchar('renewal_deal_prefix', { length: 50 }).default(
    'Renewal:'
  ),

  // Notifications
  notifyOwnerOnCreation: boolean('notify_owner_on_creation')
    .notNull()
    .default(true),
  notifyAdditionalUsers: jsonb('notify_additional_users').default([]),

  // Job settings
  jobEnabled: boolean('job_enabled').notNull().default(true),
  jobLastRunAt: timestamp('job_last_run_at', { withTimezone: true }),
  jobLastResult: jsonb('job_last_result'),

  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// Table 5: contract_renewals
// Links a contract to its renewal opportunity and tracks renewal lifecycle.
// ============================================================================

export const contractRenewals = pgTable(
  'contract_renewals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => contracts.id),
    orgId: uuid('org_id').notNull(),

    // Renewal details
    renewalNumber: integer('renewal_number').notNull().default(1),

    // Opportunity link
    opportunityHubspotId: varchar('opportunity_hubspot_id', { length: 50 }),
    opportunityCreatedAt: timestamp('opportunity_created_at', {
      withTimezone: true,
    }),

    // Quote link
    renewalQuoteId: uuid('renewal_quote_id'),
    quoteGeneratedAt: timestamp('quote_generated_at', { withTimezone: true }),

    // Proposed renewal values
    proposedStartDate: date('proposed_start_date').notNull(),
    proposedEndDate: date('proposed_end_date').notNull(),
    proposedTermMonths: integer('proposed_term_months').notNull(),
    proposedTotalValue: numeric('proposed_total_value', {
      precision: 12,
      scale: 2,
    }),
    pricingMethodUsed: varchar('pricing_method_used', { length: 30 }).notNull(),

    // Line item detail
    proposedSubscriptions: jsonb('proposed_subscriptions').notNull().default([]),

    // Outcome
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    outcomeDate: date('outcome_date'),
    outcomeNotes: text('outcome_notes'),
    newContractId: uuid('new_contract_id').references(() => contracts.id),

    // Risk assessment
    riskScore: integer('risk_score'),
    riskLevel: varchar('risk_level', { length: 10 }),
    riskSignals: jsonb('risk_signals').default([]),
    riskAssessedAt: timestamp('risk_assessed_at', { withTimezone: true }),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('renewals_contract_number_unique').on(
      table.contractId,
      table.renewalNumber
    ),
    check(
      'renewals_status_check',
      sql`${table.status} IN ('pending', 'in_progress', 'won', 'lost', 'cancelled')`
    ),
    check(
      'renewals_pricing_method_check',
      sql`${table.pricingMethodUsed} IN ('same_price', 'current_list', 'uplift_percentage')`
    ),
    check(
      'renewals_risk_level_check',
      sql`${table.riskLevel} IS NULL OR ${table.riskLevel} IN ('low', 'medium', 'high', 'critical')`
    ),
    index('renewals_contract_idx').on(table.contractId),
    index('renewals_org_status_idx').on(table.orgId, table.status),
    index('renewals_org_start_date_idx').on(
      table.orgId,
      table.proposedStartDate
    ),
    index('renewals_opportunity_idx').on(table.opportunityHubspotId),
    index('renewals_org_outcome_date_idx').on(table.orgId, table.outcomeDate),
  ]
);

// ============================================================================
// Table 6: notifications
// In-app notification system for renewal alerts and other system events.
// ============================================================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').notNull(),
    userId: uuid('user_id').notNull(),

    // Content
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),

    // Links
    entityType: varchar('entity_type', { length: 50 }),
    entityId: varchar('entity_id', { length: 100 }),
    actionUrl: varchar('action_url', { length: 500 }),

    // State
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),

    // Metadata
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    index('notifications_user_unread_idx').on(
      table.userId,
      table.isRead,
      table.createdAt
    ),
    index('notifications_org_type_idx').on(
      table.orgId,
      table.type,
      table.createdAt
    ),
    index('notifications_expires_idx').on(table.expiresAt),
  ]
);

// ============================================================================
// Type exports
// ============================================================================

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;

export type ContractSubscription = typeof contractSubscriptions.$inferSelect;
export type NewContractSubscription = typeof contractSubscriptions.$inferInsert;

export type ContractAmendment = typeof contractAmendments.$inferSelect;
export type NewContractAmendment = typeof contractAmendments.$inferInsert;

export type RenewalConfig = typeof renewalConfig.$inferSelect;
export type NewRenewalConfig = typeof renewalConfig.$inferInsert;

export type ContractRenewal = typeof contractRenewals.$inferSelect;
export type NewContractRenewal = typeof contractRenewals.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
