import { type CurrencyMetadata, FieldMetadataType } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type FieldTypeAndNameMetadata } from 'src/engine/workspace-manager/utils/get-ts-vector-column-expression.util';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ContractWorkspaceEntity } from 'src/modules/cpq/standard-objects/contract.workspace-entity';
import { type ContractSubscriptionWorkspaceEntity } from 'src/modules/cpq/standard-objects/contract-subscription.workspace-entity';

const NAME_FIELD_NAME = 'description';

export const SEARCH_FIELDS_FOR_CONTRACT_AMENDMENT: FieldTypeAndNameMetadata[] = [
  { name: NAME_FIELD_NAME, type: FieldMetadataType.TEXT },
];

/**
 * Contract amendment — immutable log of changes to a contract.
 * One row per change (add product, change qty, change price, etc.)
 */
export class ContractAmendmentWorkspaceEntity extends BaseWorkspaceEntity {
  amendmentNumber: number;
  amendmentType: string; // add_subscription, remove_subscription, quantity_change, price_change, term_extension, early_renewal, cancellation, product_upgrade
  description: string;

  changes: object; // JSONB: { field, oldValue, newValue }
  deltaValue: CurrencyMetadata;
  effectiveDate: Date;

  // Relations
  contract: EntityRelation<ContractWorkspaceEntity>;
  contractId: string;
  subscription: EntityRelation<ContractSubscriptionWorkspaceEntity> | null;
  subscriptionId: string | null;
}
