import { Injectable, Logger } from '@nestjs/common';

import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { FieldMetadataType } from 'twenty-shared/types';

import {
  CPQ_OBJECTS,
  CPQ_FIELDS,
  CPQ_RELATIONS,
} from 'src/modules/cpq/constants/cpq-metadata.constants';

// Bootstraps all CPQ custom objects, fields, and relations in a Twenty
// workspace via the metadata API. Idempotent — skips existing objects.
// Creates 16 objects, 80+ fields, and 22 relations.
@Injectable()
export class CpqSetupService {
  private readonly logger = new Logger(CpqSetupService.name);

  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
  ) {}

  // Check if CPQ is fully set up in this workspace
  async isCpqSetUp(workspaceId: string): Promise<boolean> {
    const status = await this.getSetupStatus(workspaceId);
    return status.isSetUp;
  }

  // Bootstrap all CPQ objects, fields, and relations
  async setupCpq(workspaceId: string): Promise<SetupResult> {
    this.logger.log(`Setting up CPQ for workspace ${workspaceId}`);

    const result: SetupResult = {
      objectsCreated: [],
      fieldsCreated: 0,
      relationsCreated: 0,
      skipped: [],
      errors: [],
    };

    // Cache: fetch all workspace objects once (not N+1)
    const existingObjects = await this.objectMetadataService
      .findManyWithinWorkspace(workspaceId);
    const existingByName = new Map(
      existingObjects.map((o: { nameSingular: string; id: string }) => [o.nameSingular, o.id]),
    );

    const objectIds: Record<string, string> = {};

    // Phase 1: Create objects
    for (const [key, definition] of Object.entries(CPQ_OBJECTS)) {
      const existingId = existingByName.get(definition.nameSingular);
      if (existingId) {
        objectIds[key] = existingId;
        result.skipped.push(definition.nameSingular);
        continue;
      }

      try {
        const created = await this.objectMetadataService.createOneObject(
          { createObjectInput: { ...definition }, workspaceId },
        );
        objectIds[key] = created.id;
        result.objectsCreated.push(definition.nameSingular);
        this.logger.log(`Created: ${definition.nameSingular}`);
      } catch (error) {
        result.errors.push(`Object ${definition.nameSingular}: ${error}`);
        this.logger.error(`Failed: ${definition.nameSingular}: ${error}`);
      }
    }

    // Copy standard object IDs for relations
    for (const standardName of ['company', 'opportunity']) {
      const standardId = existingByName.get(standardName);
      if (standardId) objectIds[standardName] = standardId;
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
              defaultValue: field.defaultValue,
              options: field.options,
            },
            workspaceId,
          });
          result.fieldsCreated++;
        } catch (error) {
          // Field may already exist — not fatal
          this.logger.warn(`Field ${objectKey}.${field.name}: ${error}`);
        }
      }
    }

    // Phase 3: Create relations
    for (const relation of CPQ_RELATIONS) {
      const sourceId = objectIds[relation.source];
      const targetId = objectIds[relation.target];
      if (!sourceId || !targetId) {
        this.logger.warn(`Skipping relation ${relation.source}.${relation.sourceField}`);
        continue;
      }

      try {
        await this.fieldMetadataService.createOneField({
          createFieldInput: {
            objectMetadataId: sourceId,
            name: relation.sourceField,
            label: relation.sourceLabel,
            type: FieldMetadataType.RELATION,
            relationCreationPayload: {
              type: 'MANY_TO_ONE',
              targetObjectMetadataId: targetId,
              targetFieldLabel: relation.targetLabel,
              targetFieldIcon: relation.targetIcon,
            },
          },
          workspaceId,
        });
        result.relationsCreated++;
      } catch (error) {
        this.logger.warn(`Relation ${relation.source}.${relation.sourceField}: ${error}`);
      }
    }

    this.logger.log(
      `CPQ setup: ${result.objectsCreated.length} created, ` +
      `${result.skipped.length} skipped, ${result.fieldsCreated} fields, ` +
      `${result.relationsCreated} relations, ${result.errors.length} errors`,
    );

    return result;
  }

  // Remove all CPQ objects (reverse dependency order)
  async teardownCpq(workspaceId: string): Promise<TeardownResult> {
    this.logger.log(`Tearing down CPQ for workspace ${workspaceId}`);

    const result: TeardownResult = { objectsRemoved: [], errors: [] };
    const existingObjects = await this.objectMetadataService
      .findManyWithinWorkspace(workspaceId);
    const existingByName = new Map(
      existingObjects.map((o: { nameSingular: string; id: string }) => [o.nameSingular, o.id]),
    );

    // Remove children before parents
    const removalOrder = [
      'invoiceLineItem', 'invoice',
      'contractAmendment', 'contractSubscription',
      'approvalRequest', 'approvalRule',
      'quoteSnapshot', 'quoteLineItem', 'quoteLineGroup',
      'quoteTemplate',
      'priceBookEntry', 'discountSchedule',
      'contract', 'quote',
      'priceBook', 'product',
    ];

    for (const objectName of removalOrder) {
      const objectId = existingByName.get(objectName);
      if (!objectId) continue;

      try {
        await this.objectMetadataService.deleteOneObject(
          { objectMetadataId: objectId },
          workspaceId,
        );
        result.objectsRemoved.push(objectName);
      } catch (error) {
        result.errors.push(`${objectName}: ${error}`);
      }
    }

    return result;
  }

  // Detailed setup status
  async getSetupStatus(workspaceId: string): Promise<SetupStatus> {
    const existingObjects = await this.objectMetadataService
      .findManyWithinWorkspace(workspaceId);
    const cpqNames = Object.values(CPQ_OBJECTS).map((o) => o.nameSingular);
    const existingNames = existingObjects
      .map((o: { nameSingular: string }) => o.nameSingular);
    const found = cpqNames.filter((name) => existingNames.includes(name));

    return {
      isSetUp: found.length === cpqNames.length,
      objectCount: found.length,
      expectedCount: cpqNames.length,
      foundObjects: found,
      missingObjects: cpqNames.filter((name) => !found.includes(name)),
      version: '2.0.0',
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
