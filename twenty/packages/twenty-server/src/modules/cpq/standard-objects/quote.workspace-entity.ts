import { type CurrencyMetadata, FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type FieldTypeAndNameMetadata } from 'src/engine/workspace-manager/utils/get-ts-vector-column-expression.util';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type QuoteLineItemWorkspaceEntity } from 'src/modules/cpq/standard-objects/quote-line-item.workspace-entity';
import { type ContractWorkspaceEntity } from 'src/modules/cpq/standard-objects/contract.workspace-entity';

const NAME_FIELD_NAME = 'name';

export const SEARCH_FIELDS_FOR_QUOTE: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
];

/**
 * Quote workspace entity for Twenty CRM.
 * The proposal sent to a customer — tracks status through the full
 * lifecycle: draft → in_review → approved → presented → accepted → contracted.
 */
export class QuoteWorkspaceEntity extends BaseWorkspaceEntity {
  // Identity
  quoteNumber: string;
  name: string;

  // Lifecycle
  status: string; // draft, in_review, approved, denied, presented, accepted, rejected, expired, contracted
  type: string; // new, amendment, renewal
  versionNumber: number;
  isPrimary: boolean;

  // Term
  subscriptionTermMonths: number;
  startDate: Date;
  endDate: Date | null;
  expirationDate: Date;

  // Financial
  subtotal: CurrencyMetadata | null;
  discountTotal: CurrencyMetadata | null;
  taxTotal: CurrencyMetadata | null;
  grandTotal: CurrencyMetadata | null;

  // Payment
  paymentTerms: string | null;

  // Acceptance / Rejection
  acceptanceMethod: string | null; // verbal, email, po
  acceptanceDate: Date | null;
  poNumber: string | null;
  rejectionReason: string | null; // price_too_high, competitor_chosen, budget_constraints, timing, other
  rejectionNotes: string | null;

  // Notes
  notes: string | null;
  internalNotes: string | null;

  // Metadata
  position: number;
  searchVector: string;

  // Relations
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  opportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  opportunityId: string | null;
  contract: EntityRelation<ContractWorkspaceEntity> | null;
  contractId: string | null;
  lineItems: EntityRelation<QuoteLineItemWorkspaceEntity[]>;
}
