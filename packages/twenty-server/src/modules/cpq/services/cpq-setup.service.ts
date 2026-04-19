import { Injectable, Logger } from '@nestjs/common';

import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import {
  type FieldMetadataDefaultValue,
  type FieldMetadataOptions,
  FieldMetadataType,
} from 'twenty-shared/types';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';

// CPQ object definitions — the single source of truth for all CPQ metadata
const CPQ_OBJECTS = {
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
  priceConfiguration: {
    nameSingular: 'priceConfiguration',
    namePlural: 'priceConfigurations',
    labelSingular: 'Price Configuration',
    labelPlural: 'Price Configurations',
    description: 'Tiered, volume, and term-based pricing rules',
    icon: 'IconCurrencyDollar',
  },
} as const;

// Field definitions per object — maps to Twenty's FieldMetadataType
// Fields beyond the basics (id, createdAt, updatedAt, deletedAt, name) which are auto-created
// IMPORTANT: SELECT field options MUST include position: number — Twenty validates with @IsNumber()
const CPQ_FIELDS: Record<
  string,
  Array<{
    name: string;
    label: string;
    type: FieldMetadataType;
    description?: string;
    isRequired?: boolean;
    defaultValue?: unknown;
    options?: Array<{
      label: string;
      value: string;
      color: string;
      position: number;
    }>;
  }>
> = {
  quote: [
    {
      name: 'quoteNumber',
      label: 'Quote Number',
      type: FieldMetadataType.TEXT,
      isRequired: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: FieldMetadataType.SELECT,
      defaultValue: "'draft'",
      options: [
        { label: 'Draft', value: 'draft', color: 'gray', position: 0 },
        { label: 'In Review', value: 'in_review', color: 'blue', position: 1 },
        { label: 'Approved', value: 'approved', color: 'green', position: 2 },
        { label: 'Denied', value: 'denied', color: 'red', position: 3 },
        {
          label: 'Presented',
          value: 'presented',
          color: 'purple',
          position: 4,
        },
        {
          label: 'Accepted',
          value: 'accepted',
          color: 'turquoise',
          position: 5,
        },
        { label: 'Rejected', value: 'rejected', color: 'pink', position: 6 },
        { label: 'Expired', value: 'expired', color: 'yellow', position: 7 },
        { label: 'Contracted', value: 'contracted', color: 'sky', position: 8 },
      ],
    },
    {
      name: 'type',
      label: 'Type',
      type: FieldMetadataType.SELECT,
      defaultValue: "'new'",
      options: [
        { label: 'New Business', value: 'new', color: 'blue', position: 0 },
        {
          label: 'Amendment',
          value: 'amendment',
          color: 'orange',
          position: 1,
        },
        { label: 'Renewal', value: 'renewal', color: 'green', position: 2 },
      ],
    },
    {
      name: 'subscriptionTermMonths',
      label: 'Term (Months)',
      type: FieldMetadataType.NUMBER,
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: FieldMetadataType.DATE,
      isRequired: true,
    },
    { name: 'endDate', label: 'End Date', type: FieldMetadataType.DATE },
    {
      name: 'expirationDate',
      label: 'Expiration Date',
      type: FieldMetadataType.DATE,
      isRequired: true,
    },
    { name: 'subtotal', label: 'Subtotal', type: FieldMetadataType.CURRENCY },
    {
      name: 'discountTotal',
      label: 'Discount Total',
      type: FieldMetadataType.CURRENCY,
    },
    { name: 'taxTotal', label: 'Tax Total', type: FieldMetadataType.CURRENCY },
    {
      name: 'grandTotal',
      label: 'Grand Total',
      type: FieldMetadataType.CURRENCY,
    },
    {
      name: 'paymentTerms',
      label: 'Payment Terms',
      type: FieldMetadataType.TEXT,
    },
    { name: 'currency', label: 'Currency', type: FieldMetadataType.TEXT },
    {
      name: 'acceptanceMethod',
      label: 'Acceptance Method',
      type: FieldMetadataType.SELECT,
      options: [
        { label: 'Verbal', value: 'verbal', color: 'blue', position: 0 },
        { label: 'Email', value: 'email', color: 'green', position: 1 },
        { label: 'Purchase Order', value: 'po', color: 'purple', position: 2 },
        { label: 'DocuSign', value: 'docusign', color: 'sky', position: 3 },
      ],
    },
    {
      name: 'rejectionReason',
      label: 'Rejection Reason',
      type: FieldMetadataType.SELECT,
      options: [
        {
          label: 'Price Too High',
          value: 'price_too_high',
          color: 'red',
          position: 0,
        },
        {
          label: 'Competitor Chosen',
          value: 'competitor_chosen',
          color: 'orange',
          position: 1,
        },
        {
          label: 'Budget Constraints',
          value: 'budget_constraints',
          color: 'yellow',
          position: 2,
        },
        { label: 'Timing', value: 'timing', color: 'gray', position: 3 },
        { label: 'Other', value: 'other', color: 'gray', position: 4 },
      ],
    },
    { name: 'notes', label: 'Notes', type: FieldMetadataType.RICH_TEXT },
    {
      name: 'internalNotes',
      label: 'Internal Notes',
      type: FieldMetadataType.RICH_TEXT,
    },
  ],

  quoteLineItem: [
    {
      name: 'productName',
      label: 'Product',
      type: FieldMetadataType.TEXT,
      isRequired: true,
    },
    {
      name: 'productFamily',
      label: 'Product Family',
      type: FieldMetadataType.TEXT,
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: FieldMetadataType.NUMBER,
      isRequired: true,
    },
    {
      name: 'listPrice',
      label: 'List Price',
      type: FieldMetadataType.CURRENCY,
      isRequired: true,
    },
    {
      name: 'netUnitPrice',
      label: 'Net Unit Price',
      type: FieldMetadataType.CURRENCY,
      isRequired: true,
    },
    {
      name: 'netTotal',
      label: 'Net Total',
      type: FieldMetadataType.CURRENCY,
      isRequired: true,
    },
    {
      name: 'discountPercent',
      label: 'Discount %',
      type: FieldMetadataType.NUMBER,
    },
    {
      name: 'billingType',
      label: 'Billing Type',
      type: FieldMetadataType.SELECT,
      defaultValue: "'recurring'",
      options: [
        { label: 'Recurring', value: 'recurring', color: 'blue', position: 0 },
        { label: 'One-Time', value: 'one_time', color: 'green', position: 1 },
        { label: 'Usage', value: 'usage', color: 'purple', position: 2 },
      ],
    },
    { name: 'sortOrder', label: 'Sort Order', type: FieldMetadataType.NUMBER },
    {
      name: 'pricingAudit',
      label: 'Pricing Audit',
      type: FieldMetadataType.RAW_JSON,
    },
  ],

  contract: [
    {
      name: 'contractNumber',
      label: 'Contract Number',
      type: FieldMetadataType.TEXT,
      isRequired: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: FieldMetadataType.SELECT,
      defaultValue: "'draft'",
      options: [
        { label: 'Draft', value: 'draft', color: 'gray', position: 0 },
        { label: 'Active', value: 'active', color: 'green', position: 1 },
        { label: 'Amended', value: 'amended', color: 'purple', position: 2 },
        {
          label: 'Pending Renewal',
          value: 'pending_renewal',
          color: 'yellow',
          position: 3,
        },
        { label: 'Renewed', value: 'renewed', color: 'blue', position: 4 },
        { label: 'Expired', value: 'expired', color: 'orange', position: 5 },
        { label: 'Cancelled', value: 'cancelled', color: 'red', position: 6 },
      ],
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: FieldMetadataType.DATE,
      isRequired: true,
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: FieldMetadataType.DATE,
      isRequired: true,
    },
    { name: 'signedDate', label: 'Signed Date', type: FieldMetadataType.DATE },
    {
      name: 'totalValue',
      label: 'Total Value',
      type: FieldMetadataType.CURRENCY,
    },
    { name: 'autoRenew', label: 'Auto Renew', type: FieldMetadataType.BOOLEAN },
    {
      name: 'renewalStatus',
      label: 'Renewal Status',
      type: FieldMetadataType.SELECT,
      options: [
        { label: 'Pending', value: 'pending', color: 'yellow', position: 0 },
        {
          label: 'Opportunity Created',
          value: 'opportunity_created',
          color: 'blue',
          position: 1,
        },
        {
          label: 'Quote Generated',
          value: 'quote_generated',
          color: 'purple',
          position: 2,
        },
        { label: 'Renewed', value: 'renewed', color: 'green', position: 3 },
        { label: 'Churned', value: 'churned', color: 'red', position: 4 },
      ],
    },
    {
      name: 'renewalPricingMethod',
      label: 'Renewal Pricing',
      type: FieldMetadataType.SELECT,
      options: [
        {
          label: 'Same Price',
          value: 'same_price',
          color: 'blue',
          position: 0,
        },
        {
          label: 'Current List Price',
          value: 'current_list',
          color: 'green',
          position: 1,
        },
        {
          label: 'Uplift %',
          value: 'uplift_percentage',
          color: 'orange',
          position: 2,
        },
      ],
    },
    {
      name: 'renewalUpliftPercentage',
      label: 'Uplift %',
      type: FieldMetadataType.NUMBER,
    },
    { name: 'notes', label: 'Notes', type: FieldMetadataType.RICH_TEXT },
  ],

  contractSubscription: [
    {
      name: 'productName',
      label: 'Product',
      type: FieldMetadataType.TEXT,
      isRequired: true,
    },
    {
      name: 'productFamily',
      label: 'Product Family',
      type: FieldMetadataType.TEXT,
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: FieldMetadataType.NUMBER,
      isRequired: true,
    },
    {
      name: 'unitPrice',
      label: 'Unit Price',
      type: FieldMetadataType.CURRENCY,
      isRequired: true,
    },
    {
      name: 'annualValue',
      label: 'Annual Value',
      type: FieldMetadataType.CURRENCY,
    },
    { name: 'autoRenew', label: 'Auto Renew', type: FieldMetadataType.BOOLEAN },
    {
      name: 'billingFrequency',
      label: 'Billing Frequency',
      type: FieldMetadataType.SELECT,
      defaultValue: "'annual'",
      options: [
        { label: 'Monthly', value: 'monthly', color: 'blue', position: 0 },
        { label: 'Quarterly', value: 'quarterly', color: 'green', position: 1 },
        {
          label: 'Semi-Annual',
          value: 'semi_annual',
          color: 'purple',
          position: 2,
        },
        { label: 'Annual', value: 'annual', color: 'orange', position: 3 },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: FieldMetadataType.SELECT,
      defaultValue: "'active'",
      options: [
        { label: 'Active', value: 'active', color: 'green', position: 0 },
        { label: 'Pending', value: 'pending', color: 'yellow', position: 1 },
        {
          label: 'Suspended',
          value: 'suspended',
          color: 'orange',
          position: 2,
        },
        { label: 'Cancelled', value: 'cancelled', color: 'red', position: 3 },
        { label: 'Expired', value: 'expired', color: 'gray', position: 4 },
      ],
    },
    {
      name: 'chargeType',
      label: 'Charge Type',
      type: FieldMetadataType.SELECT,
      defaultValue: "'recurring'",
      options: [
        { label: 'Recurring', value: 'recurring', color: 'blue', position: 0 },
        { label: 'One-Time', value: 'one_time', color: 'green', position: 1 },
      ],
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: FieldMetadataType.DATE,
      isRequired: true,
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: FieldMetadataType.DATE,
      isRequired: true,
    },
  ],

  contractAmendment: [
    {
      name: 'amendmentNumber',
      label: 'Amendment #',
      type: FieldMetadataType.NUMBER,
      isRequired: true,
    },
    {
      name: 'amendmentType',
      label: 'Type',
      type: FieldMetadataType.SELECT,
      options: [
        {
          label: 'Add Product',
          value: 'add_subscription',
          color: 'green',
          position: 0,
        },
        {
          label: 'Remove Product',
          value: 'remove_subscription',
          color: 'red',
          position: 1,
        },
        {
          label: 'Quantity Change',
          value: 'quantity_change',
          color: 'blue',
          position: 2,
        },
        {
          label: 'Price Change',
          value: 'price_change',
          color: 'orange',
          position: 3,
        },
        {
          label: 'Term Extension',
          value: 'term_extension',
          color: 'purple',
          position: 4,
        },
        {
          label: 'Cancellation',
          value: 'cancellation',
          color: 'pink',
          position: 5,
        },
      ],
    },
    {
      name: 'description',
      label: 'Description',
      type: FieldMetadataType.TEXT,
      isRequired: true,
    },
    {
      name: 'deltaValue',
      label: 'Value Change',
      type: FieldMetadataType.CURRENCY,
    },
    {
      name: 'effectiveDate',
      label: 'Effective Date',
      type: FieldMetadataType.DATE,
      isRequired: true,
    },
    {
      name: 'changes',
      label: 'Change Details',
      type: FieldMetadataType.RAW_JSON,
    },
  ],

  priceConfiguration: [
    {
      name: 'configType',
      label: 'Pricing Type',
      type: FieldMetadataType.SELECT,
      options: [
        { label: 'Flat Rate', value: 'flat', color: 'gray', position: 0 },
        {
          label: 'Tiered (Graduated)',
          value: 'tiered',
          color: 'blue',
          position: 1,
        },
        {
          label: 'Volume (All-Units)',
          value: 'volume',
          color: 'green',
          position: 2,
        },
        { label: 'Term-Based', value: 'term', color: 'purple', position: 3 },
      ],
    },
    {
      name: 'listPrice',
      label: 'List Price',
      type: FieldMetadataType.CURRENCY,
    },
    {
      name: 'floorPrice',
      label: 'Floor Price',
      type: FieldMetadataType.CURRENCY,
    },
    {
      name: 'tiers',
      label: 'Tier Configuration',
      type: FieldMetadataType.RAW_JSON,
    },
    {
      name: 'productFamily',
      label: 'Product Family',
      type: FieldMetadataType.TEXT,
    },
    { name: 'sku', label: 'SKU / Product Code', type: FieldMetadataType.TEXT },
    { name: 'currency', label: 'Currency', type: FieldMetadataType.TEXT },
    { name: 'region', label: 'Region', type: FieldMetadataType.TEXT },
    { name: 'isActive', label: 'Active', type: FieldMetadataType.BOOLEAN },
    {
      name: 'effectiveDate',
      label: 'Effective Date',
      type: FieldMetadataType.DATE,
    },
  ],
};

// Relations between CPQ objects
// Format: { source, sourceField, target, targetField, type }
const CPQ_RELATIONS = [
  // Quote → Company (many-to-one)
  {
    source: 'quote',
    sourceField: 'company',
    sourceLabel: 'Company',
    target: 'company',
    targetField: 'quotes',
    targetLabel: 'Quotes',
    targetIcon: 'IconFileText',
  },
  // Quote → Opportunity (many-to-one)
  {
    source: 'quote',
    sourceField: 'opportunity',
    sourceLabel: 'Opportunity',
    target: 'opportunity',
    targetField: 'quotes',
    targetLabel: 'Quotes',
    targetIcon: 'IconFileText',
  },
  // QuoteLineItem → Quote (many-to-one)
  {
    source: 'quoteLineItem',
    sourceField: 'quote',
    sourceLabel: 'Quote',
    target: 'quote',
    targetField: 'lineItems',
    targetLabel: 'Line Items',
    targetIcon: 'IconList',
  },
  // Contract → Company (many-to-one)
  {
    source: 'contract',
    sourceField: 'company',
    sourceLabel: 'Company',
    target: 'company',
    targetField: 'contracts',
    targetLabel: 'Contracts',
    targetIcon: 'IconContract',
  },
  // Contract → Opportunity (many-to-one)
  {
    source: 'contract',
    sourceField: 'opportunity',
    sourceLabel: 'Opportunity',
    target: 'opportunity',
    targetField: 'contracts',
    targetLabel: 'Contracts',
    targetIcon: 'IconContract',
  },
  // Contract → Quote (many-to-one, origin quote)
  {
    source: 'contract',
    sourceField: 'originQuote',
    sourceLabel: 'Origin Quote',
    target: 'quote',
    targetField: 'contract',
    targetLabel: 'Contract',
    targetIcon: 'IconContract',
  },
  // ContractSubscription → Contract (many-to-one)
  {
    source: 'contractSubscription',
    sourceField: 'contract',
    sourceLabel: 'Contract',
    target: 'contract',
    targetField: 'subscriptions',
    targetLabel: 'Subscriptions',
    targetIcon: 'IconRepeat',
  },
  // ContractAmendment → Contract (many-to-one)
  {
    source: 'contractAmendment',
    sourceField: 'contract',
    sourceLabel: 'Contract',
    target: 'contract',
    targetField: 'amendments',
    targetLabel: 'Amendments',
    targetIcon: 'IconPencil',
  },
];

//
// CpqSetupService — bootstraps all CPQ custom objects, fields, and relations
// in a Twenty workspace via the metadata API.
// This creates native Twenty objects that get automatic:
// - Database tables in the workspace schema
// - GraphQL CRUD operations
// - Record index pages (table/kanban views)
// - Record detail pages
// - Sidebar navigation entries
// - Command palette entries
// - Search indexing
// - Field configuration in Settings > Data Model
// Idempotent — skips objects that already exist.

export type ProductSeedInput = {
  name: string;
  productFamily: string;
  configType: string;
  listPriceAmountMicros: number;
  listPriceCurrencyCode: string;
  region: string;
  currency: string;
  sku: string;
  isActive: boolean;
};

@Injectable()
export class CpqSetupService {
  private readonly logger = new Logger(CpqSetupService.name);

  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  // Check if CPQ objects are already set up in this workspace
  async isCpqSetUp(workspaceId: string): Promise<boolean> {
    try {
      const existingObjects =
        await this.objectMetadataService.findManyWithinWorkspace(workspaceId);
      const cpqObjectNames = Object.values(CPQ_OBJECTS).map(
        (o) => o.nameSingular,
      );
      const existingNames = existingObjects.map(
        (o: { nameSingular: string }) => o.nameSingular,
      );
      return cpqObjectNames.every((name) => existingNames.includes(name));
    } catch {
      return false;
    }
  }

  // Bootstrap all CPQ objects, fields, and relations
  async setupCpq(workspaceId: string): Promise<SetupResult> {
    this.logger.log(`Setting up CPQ objects for workspace ${workspaceId}`);

    const result: SetupResult = {
      objectsCreated: [],
      fieldsCreated: 0,
      relationsCreated: 0,
      skipped: [],
      errors: [],
    };

    // Track created object IDs for relation creation
    const objectIds: Record<string, string> = {};

    // Phase 1: Create objects
    for (const [key, def] of Object.entries(CPQ_OBJECTS)) {
      try {
        // Check if object already exists
        const existing = await this.findObjectByName(
          workspaceId,
          def.nameSingular,
        );
        if (existing) {
          objectIds[key] = existing.id;
          result.skipped.push(def.nameSingular);
          this.logger.log(
            `Object ${def.nameSingular} already exists, skipping`,
          );
          continue;
        }

        const created = await this.objectMetadataService.createOneObject({
          createObjectInput: { ...def },
          workspaceId,
        });
        objectIds[key] = created.id;
        result.objectsCreated.push(def.nameSingular);
        this.logger.log(`Created object: ${def.nameSingular} (${created.id})`);
      } catch (error) {
        const msg = `Failed to create object ${def.nameSingular}: ${error}`;
        this.logger.error(msg);
        result.errors.push(msg);
      }
    }

    // Also get standard object IDs for relations
    try {
      const companyObj = await this.findObjectByName(workspaceId, 'company');
      if (companyObj) objectIds['company'] = companyObj.id;
      const oppObj = await this.findObjectByName(workspaceId, 'opportunity');
      if (oppObj) objectIds['opportunity'] = oppObj.id;
    } catch (error) {
      this.logger.warn(
        `Could not find standard objects for relations: ${error}`,
      );
    }

    // Phase 2: Create fields
    for (const [objectKey, fields] of Object.entries(CPQ_FIELDS)) {
      const objectId = objectIds[objectKey];
      if (!objectId) continue;

      for (const field of fields) {
        try {
          await this.fieldMetadataService.createOneField({
            createFieldInput: {
              objectMetadataId: objectId,
              name: field.name,
              label: field.label,
              type: field.type,
              description: field.description,
              defaultValue:
                field.defaultValue as FieldMetadataDefaultValue<FieldMetadataType>,
              options: field.options as
                | FieldMetadataOptions<FieldMetadataType>
                | undefined,
            },
            workspaceId,
          });
          result.fieldsCreated++;
        } catch (error) {
          // Field might already exist — not a fatal error
          this.logger.warn(`Field ${objectKey}.${field.name}: ${error}`);
        }
      }
    }

    // Phase 3: Create relations
    for (const rel of CPQ_RELATIONS) {
      const sourceObjectId = objectIds[rel.source];
      const targetObjectId = objectIds[rel.target];
      if (!sourceObjectId || !targetObjectId) {
        this.logger.warn(
          `Skipping relation ${rel.source}.${rel.sourceField} — missing object ID`,
        );
        continue;
      }

      try {
        await this.fieldMetadataService.createOneField({
          createFieldInput: {
            objectMetadataId: sourceObjectId,
            name: rel.sourceField,
            label: rel.sourceLabel,
            type: FieldMetadataType.RELATION,
            relationCreationPayload: {
              type: RelationType.MANY_TO_ONE,
              targetObjectMetadataId: targetObjectId,
              targetFieldLabel: rel.targetLabel,
              targetFieldIcon: rel.targetIcon,
            },
          },
          workspaceId,
        });
        result.relationsCreated++;
        this.logger.log(
          `Created relation: ${rel.source}.${rel.sourceField} → ${rel.target}`,
        );
      } catch (error) {
        this.logger.warn(`Relation ${rel.source}.${rel.sourceField}: ${error}`);
      }
    }

    this.logger.log(
      `CPQ setup complete: ${result.objectsCreated.length} objects, ` +
        `${result.fieldsCreated} fields, ${result.relationsCreated} relations, ` +
        `${result.skipped.length} skipped, ${result.errors.length} errors`,
    );

    return result;
  }

  private async findObjectByName(
    workspaceId: string,
    name: string,
  ): Promise<{ id: string } | null> {
    try {
      const objects =
        await this.objectMetadataService.findManyWithinWorkspace(workspaceId);
      return (
        objects.find(
          (o: { nameSingular: string }) => o.nameSingular === name,
        ) ?? null
      );
    } catch {
      return null;
    }
  }

  // Remove all CPQ custom objects from a workspace.
  // Used for clean uninstall or reset during development.
  async teardownCpq(workspaceId: string): Promise<TeardownResult> {
    this.logger.log(`Tearing down CPQ objects for workspace ${workspaceId}`);

    const result: TeardownResult = {
      objectsRemoved: [],
      errors: [],
    };

    // Remove in reverse dependency order (children before parents)
    const removalOrder = [
      'contractAmendment',
      'contractSubscription',
      'quoteLineItem',
      'priceConfiguration',
      'contract',
      'quote',
    ];

    for (const objectName of removalOrder) {
      try {
        const existing = await this.findObjectByName(workspaceId, objectName);
        if (!existing) continue;

        await this.objectMetadataService.deleteOneObject({
          deleteObjectInput: { id: existing.id },
          workspaceId,
        });
        result.objectsRemoved.push(objectName);
        this.logger.log(`Removed object: ${objectName}`);
      } catch (error) {
        const message = `Failed to remove ${objectName}: ${error}`;
        this.logger.error(message);
        result.errors.push(message);
      }
    }

    return result;
  }

  // Seed PriceConfiguration records for a workspace.
  // Creates product/pricing records using the workspace data layer (TwentyORM).
  // Skips products that already exist (matched by name + region).
  async seedProductCatalog(
    workspaceId: string,
    products: ProductSeedInput[],
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    const result = { created: 0, skipped: 0, errors: [] as string[] };

    const authContext = buildSystemAuthContext(workspaceId);

    try {
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const repository = await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            'priceConfiguration',
            { shouldBypassPermissionChecks: true },
          );

          for (const product of products) {
            try {
              // Check if already exists by name + region
              const existing = await repository.findOne({
                where: {
                  name: product.name,
                  region: product.region,
                } as Record<string, unknown>,
              });

              if (existing) {
                result.skipped++;
                continue;
              }

              await repository.save({
                name: product.name,
                productFamily: product.productFamily,
                configType: product.configType,
                listPrice: {
                  amountMicros: BigInt(product.listPriceAmountMicros),
                  currencyCode: product.listPriceCurrencyCode,
                },
                currency: product.currency,
                region: product.region,
                sku: product.sku,
                isActive: product.isActive,
              } as Record<string, unknown>);

              result.created++;
            } catch (error) {
              const msg = `Failed to seed ${product.name}: ${error}`;
              this.logger.warn(msg);
              result.errors.push(msg);
            }
          }
        },
        authContext,
      );
    } catch (error) {
      result.errors.push(`Repository setup failed: ${error}`);
    }

    return result;
  }

  // Get current CPQ setup version and object count for a workspace.
  async getSetupStatus(workspaceId: string): Promise<SetupStatus> {
    const objects =
      await this.objectMetadataService.findManyWithinWorkspace(workspaceId);
    const cpqObjectNames: string[] = Object.values(CPQ_OBJECTS).map(
      (o) => o.nameSingular,
    );
    const foundObjects = objects
      .filter((o: { nameSingular: string }) =>
        cpqObjectNames.includes(o.nameSingular),
      )
      .map((o: { nameSingular: string }) => o.nameSingular);

    return {
      isSetUp: foundObjects.length === cpqObjectNames.length,
      objectCount: foundObjects.length,
      expectedCount: cpqObjectNames.length,
      foundObjects,
      missingObjects: cpqObjectNames.filter(
        (name) => !foundObjects.includes(name),
      ),
      version: '1.0.0',
    };
  }
}

export type SetupResult = {
  objectsCreated: string[];
  fieldsCreated: number;
  relationsCreated: number;
  skipped: string[];
  errors: string[];
};

export type TeardownResult = {
  objectsRemoved: string[];
  errors: string[];
};

export type SetupStatus = {
  isSetUp: boolean;
  objectCount: number;
  expectedCount: number;
  foundObjects: string[];
  missingObjects: string[];
  version: string;
};
