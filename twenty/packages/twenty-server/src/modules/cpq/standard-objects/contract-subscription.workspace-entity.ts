import { type CurrencyMetadata, FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type FieldTypeAndNameMetadata } from 'src/engine/workspace-manager/utils/get-ts-vector-column-expression.util';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ContractWorkspaceEntity } from 'src/modules/cpq/standard-objects/contract.workspace-entity';

const NAME_FIELD_NAME = 'productName';

export const SEARCH_FIELDS_FOR_CONTRACT_SUBSCRIPTION: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
];

/**
 * Contract subscription — per-product entitlement within a contract.
 * Tracks quantity, pricing, billing frequency, and lifecycle state.
 */
export class ContractSubscriptionWorkspaceEntity extends BaseWorkspaceEntity {
  productName: string;
  quantity: number;
  unitPrice: CurrencyMetadata;
  annualValue: CurrencyMetadata;
  discountPercentage: number | null;
  billingFrequency: string; // monthly, quarterly, semi_annual, annual

  startDate: Date;
  endDate: Date;

  status: string; // active, pending, suspended, pending_amendment, pending_renewal, pending_cancellation, renewed, cancelled, expired
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  cancelledReason: string | null;

  // Renewal pricing override
  renewalPricingMethod: string | null;
  renewalUpliftPercentage: number | null;

  // Type
  chargeType: string; // recurring, one_time, usage
  subscriptionType: string; // renewable, evergreen, one_time

  // Relations
  contract: EntityRelation<ContractWorkspaceEntity>;
  contractId: string;
}
