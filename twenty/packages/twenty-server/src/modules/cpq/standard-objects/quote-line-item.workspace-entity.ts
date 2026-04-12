import { type CurrencyMetadata, FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type FieldTypeAndNameMetadata } from 'src/engine/workspace-manager/utils/get-ts-vector-column-expression.util';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type QuoteWorkspaceEntity } from 'src/modules/cpq/standard-objects/quote.workspace-entity';

const NAME_FIELD_NAME = 'productName';

export const SEARCH_FIELDS_FOR_QUOTE_LINE_ITEM: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
];

/**
 * Quote line item — individual product on a quote.
 * Stores the full price waterfall for auditability:
 * listPrice → specialPrice → proratedPrice → regularPrice → customerPrice → netUnitPrice → netTotal
 */
export class QuoteLineItemWorkspaceEntity extends BaseWorkspaceEntity {
  productName: string;
  productSku: string | null;
  quantity: number;

  // Price waterfall
  listPrice: CurrencyMetadata;
  specialPrice: CurrencyMetadata | null;
  proratedPrice: CurrencyMetadata | null;
  regularPrice: CurrencyMetadata | null;
  customerPrice: CurrencyMetadata | null;
  netUnitPrice: CurrencyMetadata;
  netTotal: CurrencyMetadata;

  // Discount
  discountPercent: number | null;
  discountAmount: CurrencyMetadata | null;

  // Subscription
  billingType: string; // recurring, one_time, usage
  billingFrequency: string | null; // monthly, quarterly, annual
  subscriptionTermMonths: number | null;

  // Audit
  pricingAudit: object | null; // JSONB array of pricing steps

  // Layout
  sortOrder: number;
  description: string | null;

  // Self-referential for bundles
  parentLineId: string | null;

  // Relations
  quote: EntityRelation<QuoteWorkspaceEntity>;
  quoteId: string;
}
