import { FieldMetadataType } from 'twenty-shared/types';

// All CPQ object definitions — the single source of truth for metadata.
// Extracted from cpq-setup.service.ts to keep the service under 500 lines.

export const CPQ_OBJECTS = {
  // Upstream catalog (Epic 1)
  product: {
    nameSingular: 'product',
    namePlural: 'products',
    labelSingular: 'Product',
    labelPlural: 'Products',
    description: 'Sellable items in the product catalog',
    icon: 'IconBox',
  },
  priceBook: {
    nameSingular: 'priceBook',
    namePlural: 'priceBooks',
    labelSingular: 'Price Book',
    labelPlural: 'Price Books',
    description: 'Price lists for different customer segments (Standard, Partner, Academic)',
    icon: 'IconBook',
  },
  priceBookEntry: {
    nameSingular: 'priceBookEntry',
    namePlural: 'priceBookEntries',
    labelSingular: 'Price Book Entry',
    labelPlural: 'Price Book Entries',
    description: 'Links a product to a price book with a unit price',
    icon: 'IconCurrencyDollar',
  },
  discountSchedule: {
    nameSingular: 'discountSchedule',
    namePlural: 'discountSchedules',
    labelSingular: 'Discount Schedule',
    labelPlural: 'Discount Schedules',
    description: 'Tiered, volume, and term-based pricing rules',
    icon: 'IconPercentage',
  },

  // Quote lifecycle (Epic 2)
  quote: {
    nameSingular: 'quote',
    namePlural: 'quotes',
    labelSingular: 'Quote',
    labelPlural: 'Quotes',
    description: 'Sales quotes and proposals sent to customers',
    icon: 'IconFileText',
  },
  quoteLineItem: {
    nameSingular: 'quoteLineItem',
    namePlural: 'quoteLineItems',
    labelSingular: 'Quote Line Item',
    labelPlural: 'Quote Line Items',
    description: 'Individual products on a quote with pricing details',
    icon: 'IconList',
  },
  quoteLineGroup: {
    nameSingular: 'quoteLineGroup',
    namePlural: 'quoteLineGroups',
    labelSingular: 'Quote Line Group',
    labelPlural: 'Quote Line Groups',
    description: 'Sections organizing line items (Platform, Services, Add-Ons)',
    icon: 'IconLayoutList',
  },
  quoteSnapshot: {
    nameSingular: 'quoteSnapshot',
    namePlural: 'quoteSnapshots',
    labelSingular: 'Quote Snapshot',
    labelPlural: 'Quote Snapshots',
    description: 'Immutable version history of quote changes',
    icon: 'IconCamera',
  },

  // Approvals (Epic 4)
  approvalRule: {
    nameSingular: 'approvalRule',
    namePlural: 'approvalRules',
    labelSingular: 'Approval Rule',
    labelPlural: 'Approval Rules',
    description: 'Conditions that trigger approval requirements on quotes',
    icon: 'IconShieldCheck',
  },
  approvalRequest: {
    nameSingular: 'approvalRequest',
    namePlural: 'approvalRequests',
    labelSingular: 'Approval Request',
    labelPlural: 'Approval Requests',
    description: 'Individual approval actions on a quote',
    icon: 'IconChecklist',
  },

  // PDF Templates (Epic 5)
  quoteTemplate: {
    nameSingular: 'quoteTemplate',
    namePlural: 'quoteTemplates',
    labelSingular: 'Quote Template',
    labelPlural: 'Quote Templates',
    description: 'PDF template configuration (logo, colors, columns, terms)',
    icon: 'IconTemplate',
  },

  // Contracts (Epic 7-8)
  contract: {
    nameSingular: 'contract',
    namePlural: 'contracts',
    labelSingular: 'Contract',
    labelPlural: 'Contracts',
    description: 'Active customer agreements with subscription tracking',
    icon: 'IconContract',
  },
  contractSubscription: {
    nameSingular: 'contractSubscription',
    namePlural: 'contractSubscriptions',
    labelSingular: 'Subscription',
    labelPlural: 'Subscriptions',
    description: 'Per-product recurring entitlements within a contract',
    icon: 'IconRepeat',
  },
  contractAmendment: {
    nameSingular: 'contractAmendment',
    namePlural: 'contractAmendments',
    labelSingular: 'Amendment',
    labelPlural: 'Amendments',
    description: 'Immutable log of changes to a contract',
    icon: 'IconPencil',
  },

  // Invoicing (Epic 7)
  invoice: {
    nameSingular: 'invoice',
    namePlural: 'invoices',
    labelSingular: 'Invoice',
    labelPlural: 'Invoices',
    description: 'Billing records generated from contracted quotes',
    icon: 'IconReceipt',
  },
  invoiceLineItem: {
    nameSingular: 'invoiceLineItem',
    namePlural: 'invoiceLineItems',
    labelSingular: 'Invoice Line Item',
    labelPlural: 'Invoice Line Items',
    description: 'Individual line items on an invoice',
    icon: 'IconListNumbers',
  },
} as const;

// Field definitions per object
export const CPQ_FIELDS: Record<string, Array<{
  name: string;
  label: string;
  type: FieldMetadataType;
  description?: string;
  isRequired?: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string; color: string }>;
}>> = {
  // Product fields
  product: [
    { name: 'sku', label: 'SKU', type: FieldMetadataType.TEXT },
    {
      name: 'productType', label: 'Product Type', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Subscription', value: 'subscription', color: 'blue' },
        { label: 'One-Time', value: 'one_time', color: 'green' },
        { label: 'Professional Service', value: 'professional_service', color: 'purple' },
      ],
    },
    { name: 'family', label: 'Product Family', type: FieldMetadataType.TEXT },
    { name: 'isActive', label: 'Active', type: FieldMetadataType.BOOLEAN },
    { name: 'defaultSubscriptionTermMonths', label: 'Default Term (Months)', type: FieldMetadataType.NUMBER },
    {
      name: 'billingFrequency', label: 'Billing Frequency', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Monthly', value: 'monthly', color: 'blue' },
        { label: 'Quarterly', value: 'quarterly', color: 'green' },
        { label: 'Annual', value: 'annual', color: 'orange' },
      ],
    },
    {
      name: 'chargeType', label: 'Charge Type', type: FieldMetadataType.SELECT,
      defaultValue: "'recurring'",
      options: [
        { label: 'Recurring', value: 'recurring', color: 'blue' },
        { label: 'One-Time', value: 'one_time', color: 'green' },
        { label: 'Usage', value: 'usage', color: 'purple' },
      ],
    },
    { name: 'defaultPrice', label: 'Default Price', type: FieldMetadataType.CURRENCY },
    { name: 'description', label: 'Description', type: FieldMetadataType.RICH_TEXT },
  ],

  // Price book fields
  priceBook: [
    { name: 'isStandard', label: 'Standard Price Book', type: FieldMetadataType.BOOLEAN },
    { name: 'isActive', label: 'Active', type: FieldMetadataType.BOOLEAN },
    { name: 'currencyCode', label: 'Currency', type: FieldMetadataType.TEXT },
    { name: 'description', label: 'Description', type: FieldMetadataType.RICH_TEXT },
  ],

  // Price book entry fields
  priceBookEntry: [
    { name: 'unitPrice', label: 'Unit Price', type: FieldMetadataType.CURRENCY, isRequired: true },
    { name: 'currencyCode', label: 'Currency', type: FieldMetadataType.TEXT },
    { name: 'isActive', label: 'Active', type: FieldMetadataType.BOOLEAN },
    { name: 'effectiveDate', label: 'Effective Date', type: FieldMetadataType.DATE },
    { name: 'expirationDate', label: 'Expiration Date', type: FieldMetadataType.DATE },
  ],

  // Discount schedule fields
  discountSchedule: [
    {
      name: 'scheduleType', label: 'Pricing Type', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Tiered (Graduated)', value: 'tiered', color: 'blue' },
        { label: 'Volume (All-Units)', value: 'volume', color: 'green' },
        { label: 'Term-Based', value: 'term', color: 'purple' },
        { label: 'Block', value: 'block', color: 'orange' },
      ],
    },
    { name: 'tiers', label: 'Tier Configuration', type: FieldMetadataType.RAW_JSON },
    { name: 'productFamily', label: 'Product Family', type: FieldMetadataType.TEXT },
    { name: 'isActive', label: 'Active', type: FieldMetadataType.BOOLEAN },
  ],

  // Quote fields
  quote: [
    { name: 'quoteNumber', label: 'Quote Number', type: FieldMetadataType.TEXT, isRequired: true },
    {
      name: 'status', label: 'Status', type: FieldMetadataType.SELECT,
      defaultValue: "'draft'",
      options: [
        { label: 'Draft', value: 'draft', color: 'gray' },
        { label: 'In Review', value: 'in_review', color: 'blue' },
        { label: 'Approved', value: 'approved', color: 'green' },
        { label: 'Denied', value: 'denied', color: 'red' },
        { label: 'Presented', value: 'presented', color: 'purple' },
        { label: 'Accepted', value: 'accepted', color: 'green' },
        { label: 'Rejected', value: 'rejected', color: 'red' },
        { label: 'Expired', value: 'expired', color: 'gray' },
        { label: 'Contracted', value: 'contracted', color: 'green' },
      ],
    },
    {
      name: 'type', label: 'Type', type: FieldMetadataType.SELECT,
      defaultValue: "'new'",
      options: [
        { label: 'New Business', value: 'new', color: 'blue' },
        { label: 'Amendment', value: 'amendment', color: 'orange' },
        { label: 'Renewal', value: 'renewal', color: 'green' },
      ],
    },
    { name: 'versionNumber', label: 'Version', type: FieldMetadataType.NUMBER },
    { name: 'isPrimary', label: 'Primary Quote', type: FieldMetadataType.BOOLEAN },
    { name: 'subscriptionTermMonths', label: 'Term (Months)', type: FieldMetadataType.NUMBER },
    { name: 'startDate', label: 'Start Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'endDate', label: 'End Date', type: FieldMetadataType.DATE },
    { name: 'expirationDate', label: 'Expiration Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'subtotal', label: 'Subtotal', type: FieldMetadataType.CURRENCY },
    { name: 'discountTotal', label: 'Discount Total', type: FieldMetadataType.CURRENCY },
    { name: 'grandTotal', label: 'Grand Total', type: FieldMetadataType.CURRENCY },
    { name: 'paymentTerms', label: 'Payment Terms', type: FieldMetadataType.TEXT },
    {
      name: 'acceptanceMethod', label: 'Acceptance Method', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Verbal', value: 'verbal', color: 'blue' },
        { label: 'Email', value: 'email', color: 'green' },
        { label: 'Purchase Order', value: 'po', color: 'purple' },
      ],
    },
    {
      name: 'rejectionReason', label: 'Rejection Reason', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Price Too High', value: 'price_too_high', color: 'red' },
        { label: 'Competitor Chosen', value: 'competitor_chosen', color: 'orange' },
        { label: 'Budget Constraints', value: 'budget_constraints', color: 'yellow' },
        { label: 'Timing', value: 'timing', color: 'gray' },
        { label: 'Other', value: 'other', color: 'gray' },
      ],
    },
    { name: 'notes', label: 'Notes', type: FieldMetadataType.RICH_TEXT },
    { name: 'internalNotes', label: 'Internal Notes', type: FieldMetadataType.RICH_TEXT },
  ],

  // Quote line item fields
  quoteLineItem: [
    { name: 'productName', label: 'Product', type: FieldMetadataType.TEXT, isRequired: true },
    { name: 'productSku', label: 'SKU', type: FieldMetadataType.TEXT },
    { name: 'quantity', label: 'Quantity', type: FieldMetadataType.NUMBER, isRequired: true },
    // Price waterfall fields — snapshotted at line creation, never re-read from price book
    { name: 'listPrice', label: 'List Price', type: FieldMetadataType.CURRENCY, isRequired: true },
    { name: 'specialPrice', label: 'Special Price', type: FieldMetadataType.CURRENCY },
    { name: 'proratedPrice', label: 'Prorated Price', type: FieldMetadataType.CURRENCY },
    { name: 'netUnitPrice', label: 'Net Unit Price', type: FieldMetadataType.CURRENCY, isRequired: true },
    { name: 'netTotal', label: 'Net Total', type: FieldMetadataType.CURRENCY, isRequired: true },
    { name: 'discountPercent', label: 'Discount %', type: FieldMetadataType.NUMBER },
    { name: 'discountAmount', label: 'Discount Amount', type: FieldMetadataType.CURRENCY },
    {
      name: 'billingType', label: 'Billing Type', type: FieldMetadataType.SELECT,
      defaultValue: "'recurring'",
      options: [
        { label: 'Recurring', value: 'recurring', color: 'blue' },
        { label: 'One-Time', value: 'one_time', color: 'green' },
        { label: 'Usage', value: 'usage', color: 'purple' },
      ],
    },
    { name: 'sortOrder', label: 'Sort Order', type: FieldMetadataType.NUMBER },
    { name: 'pricingAudit', label: 'Pricing Audit', type: FieldMetadataType.RAW_JSON },
    { name: 'description', label: 'Description', type: FieldMetadataType.TEXT },
  ],

  // Quote line group fields
  quoteLineGroup: [
    { name: 'description', label: 'Description', type: FieldMetadataType.TEXT },
    { name: 'sortOrder', label: 'Sort Order', type: FieldMetadataType.NUMBER },
    { name: 'subtotal', label: 'Subtotal', type: FieldMetadataType.CURRENCY },
  ],

  // Quote snapshot fields
  quoteSnapshot: [
    { name: 'versionNumber', label: 'Version', type: FieldMetadataType.NUMBER, isRequired: true },
    { name: 'snapshotData', label: 'Snapshot Data', type: FieldMetadataType.RAW_JSON, isRequired: true },
  ],

  // Approval rule fields
  approvalRule: [
    { name: 'conditions', label: 'Conditions', type: FieldMetadataType.RAW_JSON, isRequired: true },
    { name: 'approverRole', label: 'Approver Role', type: FieldMetadataType.TEXT },
    { name: 'stepNumber', label: 'Step', type: FieldMetadataType.NUMBER },
    { name: 'isActive', label: 'Active', type: FieldMetadataType.BOOLEAN },
    { name: 'priority', label: 'Priority', type: FieldMetadataType.NUMBER },
  ],

  // Approval request fields
  approvalRequest: [
    {
      name: 'status', label: 'Status', type: FieldMetadataType.SELECT,
      defaultValue: "'pending'",
      options: [
        { label: 'Pending', value: 'pending', color: 'yellow' },
        { label: 'Approved', value: 'approved', color: 'green' },
        { label: 'Rejected', value: 'rejected', color: 'red' },
        { label: 'Skipped', value: 'skipped', color: 'gray' },
      ],
    },
    { name: 'stepNumber', label: 'Step', type: FieldMetadataType.NUMBER },
    { name: 'decidedAt', label: 'Decided At', type: FieldMetadataType.DATE_TIME },
    { name: 'comments', label: 'Comments', type: FieldMetadataType.RICH_TEXT },
    { name: 'previousApprovalData', label: 'Previous Data', type: FieldMetadataType.RAW_JSON },
  ],

  // Quote template fields
  quoteTemplate: [
    { name: 'isDefault', label: 'Default Template', type: FieldMetadataType.BOOLEAN },
    { name: 'config', label: 'Template Config', type: FieldMetadataType.RAW_JSON },
  ],

  // Contract fields
  contract: [
    { name: 'contractNumber', label: 'Contract Number', type: FieldMetadataType.TEXT, isRequired: true },
    {
      name: 'status', label: 'Status', type: FieldMetadataType.SELECT,
      defaultValue: "'draft'",
      options: [
        { label: 'Draft', value: 'draft', color: 'gray' },
        { label: 'Active', value: 'active', color: 'green' },
        { label: 'Amended', value: 'amended', color: 'purple' },
        { label: 'Pending Renewal', value: 'pending_renewal', color: 'yellow' },
        { label: 'Renewed', value: 'renewed', color: 'blue' },
        { label: 'Expired', value: 'expired', color: 'gray' },
        { label: 'Cancelled', value: 'cancelled', color: 'red' },
      ],
    },
    { name: 'startDate', label: 'Start Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'endDate', label: 'End Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'totalValue', label: 'Total Value', type: FieldMetadataType.CURRENCY },
    {
      name: 'renewalStatus', label: 'Renewal Status', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Pending', value: 'pending', color: 'yellow' },
        { label: 'Opportunity Created', value: 'opportunity_created', color: 'blue' },
        { label: 'Quote Generated', value: 'quote_generated', color: 'purple' },
        { label: 'Renewed', value: 'renewed', color: 'green' },
        { label: 'Churned', value: 'churned', color: 'red' },
      ],
    },
    {
      name: 'renewalPricingMethod', label: 'Renewal Pricing', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Same Price', value: 'same_price', color: 'blue' },
        { label: 'Current List Price', value: 'current_list', color: 'green' },
        { label: 'Uplift %', value: 'uplift_percentage', color: 'orange' },
      ],
    },
    { name: 'renewalUpliftPercentage', label: 'Uplift %', type: FieldMetadataType.NUMBER },
    { name: 'notes', label: 'Notes', type: FieldMetadataType.RICH_TEXT },
  ],

  // Contract subscription fields
  contractSubscription: [
    { name: 'productName', label: 'Product', type: FieldMetadataType.TEXT, isRequired: true },
    { name: 'quantity', label: 'Quantity', type: FieldMetadataType.NUMBER, isRequired: true },
    { name: 'unitPrice', label: 'Unit Price', type: FieldMetadataType.CURRENCY, isRequired: true },
    { name: 'annualValue', label: 'Annual Value', type: FieldMetadataType.CURRENCY },
    {
      name: 'billingFrequency', label: 'Billing Frequency', type: FieldMetadataType.SELECT,
      defaultValue: "'annual'",
      options: [
        { label: 'Monthly', value: 'monthly', color: 'blue' },
        { label: 'Quarterly', value: 'quarterly', color: 'green' },
        { label: 'Semi-Annual', value: 'semi_annual', color: 'purple' },
        { label: 'Annual', value: 'annual', color: 'orange' },
      ],
    },
    {
      name: 'status', label: 'Status', type: FieldMetadataType.SELECT,
      defaultValue: "'active'",
      options: [
        { label: 'Active', value: 'active', color: 'green' },
        { label: 'Pending', value: 'pending', color: 'yellow' },
        { label: 'Suspended', value: 'suspended', color: 'orange' },
        { label: 'Cancelled', value: 'cancelled', color: 'red' },
        { label: 'Expired', value: 'expired', color: 'gray' },
      ],
    },
    {
      name: 'chargeType', label: 'Charge Type', type: FieldMetadataType.SELECT,
      defaultValue: "'recurring'",
      options: [
        { label: 'Recurring', value: 'recurring', color: 'blue' },
        { label: 'One-Time', value: 'one_time', color: 'green' },
      ],
    },
    { name: 'startDate', label: 'Start Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'endDate', label: 'End Date', type: FieldMetadataType.DATE, isRequired: true },
  ],

  // Contract amendment fields
  contractAmendment: [
    { name: 'amendmentNumber', label: 'Amendment #', type: FieldMetadataType.NUMBER, isRequired: true },
    {
      name: 'amendmentType', label: 'Type', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Add Product', value: 'add_subscription', color: 'green' },
        { label: 'Remove Product', value: 'remove_subscription', color: 'red' },
        { label: 'Quantity Change', value: 'quantity_change', color: 'blue' },
        { label: 'Price Change', value: 'price_change', color: 'orange' },
        { label: 'Term Extension', value: 'term_extension', color: 'purple' },
        { label: 'Cancellation', value: 'cancellation', color: 'red' },
      ],
    },
    { name: 'description', label: 'Description', type: FieldMetadataType.TEXT, isRequired: true },
    { name: 'deltaValue', label: 'Value Change', type: FieldMetadataType.CURRENCY },
    { name: 'effectiveDate', label: 'Effective Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'changes', label: 'Change Details', type: FieldMetadataType.RAW_JSON },
  ],

  // Invoice fields
  invoice: [
    { name: 'invoiceNumber', label: 'Invoice Number', type: FieldMetadataType.TEXT, isRequired: true },
    {
      name: 'status', label: 'Status', type: FieldMetadataType.SELECT,
      defaultValue: "'draft'",
      options: [
        { label: 'Draft', value: 'draft', color: 'gray' },
        { label: 'Sent', value: 'sent', color: 'blue' },
        { label: 'Paid', value: 'paid', color: 'green' },
        { label: 'Overdue', value: 'overdue', color: 'red' },
        { label: 'Cancelled', value: 'cancelled', color: 'gray' },
      ],
    },
    { name: 'issueDate', label: 'Issue Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'dueDate', label: 'Due Date', type: FieldMetadataType.DATE, isRequired: true },
    { name: 'subtotal', label: 'Subtotal', type: FieldMetadataType.CURRENCY },
    { name: 'total', label: 'Total', type: FieldMetadataType.CURRENCY },
    { name: 'paymentTerms', label: 'Payment Terms', type: FieldMetadataType.TEXT },
    { name: 'notes', label: 'Notes', type: FieldMetadataType.RICH_TEXT },
  ],

  // Invoice line item fields
  invoiceLineItem: [
    { name: 'productName', label: 'Product', type: FieldMetadataType.TEXT, isRequired: true },
    { name: 'quantity', label: 'Quantity', type: FieldMetadataType.NUMBER, isRequired: true },
    { name: 'unitPrice', label: 'Unit Price', type: FieldMetadataType.CURRENCY, isRequired: true },
    { name: 'total', label: 'Total', type: FieldMetadataType.CURRENCY, isRequired: true },
    {
      name: 'billingType', label: 'Billing Type', type: FieldMetadataType.SELECT,
      options: [
        { label: 'Recurring', value: 'recurring', color: 'blue' },
        { label: 'One-Time', value: 'one_time', color: 'green' },
      ],
    },
    { name: 'billingPeriodStart', label: 'Period Start', type: FieldMetadataType.DATE },
    { name: 'billingPeriodEnd', label: 'Period End', type: FieldMetadataType.DATE },
    { name: 'sortOrder', label: 'Sort Order', type: FieldMetadataType.NUMBER },
  ],
};

// Relations between objects — source (many) → target (one)
export const CPQ_RELATIONS = [
  // Product catalog relations
  { source: 'priceBookEntry', sourceField: 'product', sourceLabel: 'Product',
    target: 'product', targetField: 'priceBookEntries', targetLabel: 'Price Book Entries', targetIcon: 'IconCurrencyDollar' },
  { source: 'priceBookEntry', sourceField: 'priceBook', sourceLabel: 'Price Book',
    target: 'priceBook', targetField: 'entries', targetLabel: 'Entries', targetIcon: 'IconCurrencyDollar' },
  { source: 'discountSchedule', sourceField: 'product', sourceLabel: 'Product',
    target: 'product', targetField: 'discountSchedules', targetLabel: 'Discount Schedules', targetIcon: 'IconPercentage' },

  // Quote → standard objects
  { source: 'quote', sourceField: 'company', sourceLabel: 'Company',
    target: 'company', targetField: 'quotes', targetLabel: 'Quotes', targetIcon: 'IconFileText' },
  { source: 'quote', sourceField: 'opportunity', sourceLabel: 'Opportunity',
    target: 'opportunity', targetField: 'quotes', targetLabel: 'Quotes', targetIcon: 'IconFileText' },
  { source: 'quote', sourceField: 'priceBook', sourceLabel: 'Price Book',
    target: 'priceBook', targetField: 'quotes', targetLabel: 'Quotes', targetIcon: 'IconFileText' },

  // Quote line items
  { source: 'quoteLineItem', sourceField: 'quote', sourceLabel: 'Quote',
    target: 'quote', targetField: 'lineItems', targetLabel: 'Line Items', targetIcon: 'IconList' },
  { source: 'quoteLineItem', sourceField: 'product', sourceLabel: 'Product',
    target: 'product', targetField: 'quoteLineItems', targetLabel: 'Quote Lines', targetIcon: 'IconList' },
  { source: 'quoteLineItem', sourceField: 'group', sourceLabel: 'Group',
    target: 'quoteLineGroup', targetField: 'lineItems', targetLabel: 'Line Items', targetIcon: 'IconList' },

  // Quote line groups
  { source: 'quoteLineGroup', sourceField: 'quote', sourceLabel: 'Quote',
    target: 'quote', targetField: 'lineGroups', targetLabel: 'Groups', targetIcon: 'IconLayoutList' },

  // Quote snapshots
  { source: 'quoteSnapshot', sourceField: 'quote', sourceLabel: 'Quote',
    target: 'quote', targetField: 'snapshots', targetLabel: 'Snapshots', targetIcon: 'IconCamera' },

  // Approvals
  { source: 'approvalRequest', sourceField: 'quote', sourceLabel: 'Quote',
    target: 'quote', targetField: 'approvalRequests', targetLabel: 'Approvals', targetIcon: 'IconChecklist' },
  { source: 'approvalRequest', sourceField: 'rule', sourceLabel: 'Rule',
    target: 'approvalRule', targetField: 'requests', targetLabel: 'Requests', targetIcon: 'IconChecklist' },

  // Contracts → standard objects + quotes
  { source: 'contract', sourceField: 'company', sourceLabel: 'Company',
    target: 'company', targetField: 'contracts', targetLabel: 'Contracts', targetIcon: 'IconContract' },
  { source: 'contract', sourceField: 'opportunity', sourceLabel: 'Opportunity',
    target: 'opportunity', targetField: 'contracts', targetLabel: 'Contracts', targetIcon: 'IconContract' },
  { source: 'contract', sourceField: 'originQuote', sourceLabel: 'Origin Quote',
    target: 'quote', targetField: 'contract', targetLabel: 'Contract', targetIcon: 'IconContract' },

  // Contract children
  { source: 'contractSubscription', sourceField: 'contract', sourceLabel: 'Contract',
    target: 'contract', targetField: 'subscriptions', targetLabel: 'Subscriptions', targetIcon: 'IconRepeat' },
  { source: 'contractAmendment', sourceField: 'contract', sourceLabel: 'Contract',
    target: 'contract', targetField: 'amendments', targetLabel: 'Amendments', targetIcon: 'IconPencil' },

  // Invoices
  { source: 'invoice', sourceField: 'contract', sourceLabel: 'Contract',
    target: 'contract', targetField: 'invoices', targetLabel: 'Invoices', targetIcon: 'IconReceipt' },
  { source: 'invoice', sourceField: 'quote', sourceLabel: 'Quote',
    target: 'quote', targetField: 'invoices', targetLabel: 'Invoices', targetIcon: 'IconReceipt' },
  { source: 'invoice', sourceField: 'company', sourceLabel: 'Company',
    target: 'company', targetField: 'invoices', targetLabel: 'Invoices', targetIcon: 'IconReceipt' },
  { source: 'invoiceLineItem', sourceField: 'invoice', sourceLabel: 'Invoice',
    target: 'invoice', targetField: 'lineItems', targetLabel: 'Line Items', targetIcon: 'IconListNumbers' },
];

// Count helpers for tests
export const CPQ_OBJECT_COUNT = Object.keys(CPQ_OBJECTS).length; // 16
export const CPQ_RELATION_COUNT = CPQ_RELATIONS.length; // 22
