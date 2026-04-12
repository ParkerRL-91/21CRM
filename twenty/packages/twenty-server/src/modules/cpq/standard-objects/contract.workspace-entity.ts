import { type CurrencyMetadata, FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type FieldTypeAndNameMetadata } from 'src/engine/workspace-manager/utils/get-ts-vector-column-expression.util';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type QuoteWorkspaceEntity } from 'src/modules/cpq/standard-objects/quote.workspace-entity';
import { type ContractSubscriptionWorkspaceEntity } from 'src/modules/cpq/standard-objects/contract-subscription.workspace-entity';
import { type ContractAmendmentWorkspaceEntity } from 'src/modules/cpq/standard-objects/contract-amendment.workspace-entity';

const NAME_FIELD_NAME = 'name';

export const SEARCH_FIELDS_FOR_CONTRACT: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
];

/**
 * Contract workspace entity for Twenty CRM.
 * Tracks active agreements with customers, their subscriptions,
 * amendments, and renewal lifecycle.
 */
export class ContractWorkspaceEntity extends BaseWorkspaceEntity {
  // Identity
  contractNumber: string;
  name: string;

  // Lifecycle
  status: string; // draft, active, amended, pending_renewal, renewed, expired, cancelled
  startDate: Date;
  endDate: Date;

  // Financial
  totalValue: CurrencyMetadata | null;

  // Renewal tracking
  renewalStatus: string | null; // null, pending, opportunity_created, quote_generated, renewed, churned
  renewalLeadDays: number | null;
  renewalPricingMethod: string | null; // same_price, current_list, uplift_percentage
  renewalUpliftPercentage: number | null;

  // Cancellation
  cancelledAt: Date | null;
  cancelledReason: string | null;

  // Metadata
  notes: string | null;
  position: number;
  searchVector: string;

  // Relations
  company: EntityRelation<CompanyWorkspaceEntity> | null;
  companyId: string | null;
  opportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  opportunityId: string | null;
  originQuote: EntityRelation<QuoteWorkspaceEntity> | null;
  originQuoteId: string | null;
  subscriptions: EntityRelation<ContractSubscriptionWorkspaceEntity[]>;
  amendments: EntityRelation<ContractAmendmentWorkspaceEntity[]>;
}
