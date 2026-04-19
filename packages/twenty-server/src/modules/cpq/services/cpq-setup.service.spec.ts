import { CpqSetupService } from './cpq-setup.service';

// Mock ObjectMetadataService and FieldMetadataService
const mockObjectMetadataService = {
  findManyWithinWorkspace: jest.fn(),
  createOneObject: jest.fn(),
  deleteOneObject: jest.fn(),
};

const mockFieldMetadataService = {
  createOneField: jest.fn(),
};

describe('CpqSetupService', () => {
  let service: CpqSetupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CpqSetupService(
      mockObjectMetadataService as never,
      mockFieldMetadataService as never,
    );
  });

  describe('isCpqSetUp', () => {
    it('should return true when all 6 CPQ objects exist', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'quote' },
        { nameSingular: 'quoteLineItem' },
        { nameSingular: 'contract' },
        { nameSingular: 'contractSubscription' },
        { nameSingular: 'contractAmendment' },
        { nameSingular: 'priceConfiguration' },
        { nameSingular: 'company' }, // standard objects also present
      ]);

      const result = await service.isCpqSetUp('workspace-123');
      expect(result).toBe(true);
    });

    it('should return false when some CPQ objects are missing', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'quote' },
        { nameSingular: 'company' },
      ]);

      const result = await service.isCpqSetUp('workspace-123');
      expect(result).toBe(false);
    });

    it('should return false when workspace has no objects', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([]);
      const result = await service.isCpqSetUp('workspace-123');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockRejectedValue(new Error('DB error'));
      const result = await service.isCpqSetUp('workspace-123');
      expect(result).toBe(false);
    });
  });

  describe('setupCpq', () => {
    it('should create all objects when none exist', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'company', id: 'company-id' },
        { nameSingular: 'opportunity', id: 'opp-id' },
      ]);
      mockObjectMetadataService.createOneObject.mockResolvedValue({ id: 'new-obj-id' });
      mockFieldMetadataService.createOneField.mockResolvedValue({ id: 'new-field-id' });

      const result = await service.setupCpq('workspace-123');

      expect(result.objectsCreated).toHaveLength(6);
      expect(result.skipped).toHaveLength(0);
      expect(mockObjectMetadataService.createOneObject).toHaveBeenCalledTimes(6);
    });

    it('should skip objects that already exist', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'company', id: 'company-id' },
        { nameSingular: 'opportunity', id: 'opp-id' },
        { nameSingular: 'quote', id: 'existing-quote-id' },
        { nameSingular: 'contract', id: 'existing-contract-id' },
      ]);
      mockObjectMetadataService.createOneObject.mockResolvedValue({ id: 'new-obj-id' });
      mockFieldMetadataService.createOneField.mockResolvedValue({ id: 'new-field-id' });

      const result = await service.setupCpq('workspace-123');

      expect(result.skipped).toContain('quote');
      expect(result.skipped).toContain('contract');
      // Should only create the 4 missing objects, not all 6
      expect(mockObjectMetadataService.createOneObject).toHaveBeenCalledTimes(4);
    });

    it('should handle object creation errors gracefully', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([]);
      mockObjectMetadataService.createOneObject.mockRejectedValue(new Error('Creation failed'));
      mockFieldMetadataService.createOneField.mockResolvedValue({ id: 'field-id' });

      const result = await service.setupCpq('workspace-123');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to create object');
    });

    it('should create fields for each object', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([]);
      mockObjectMetadataService.createOneObject.mockResolvedValue({ id: 'obj-id' });
      mockFieldMetadataService.createOneField.mockResolvedValue({ id: 'field-id' });

      const result = await service.setupCpq('workspace-123');

      // Should create many fields (quote has ~14, contract has ~8, etc.)
      expect(result.fieldsCreated).toBeGreaterThan(30);
    });

    it('should create relations between objects', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'company', id: 'company-id' },
        { nameSingular: 'opportunity', id: 'opp-id' },
      ]);
      mockObjectMetadataService.createOneObject.mockResolvedValue({ id: 'obj-id' });
      mockFieldMetadataService.createOneField.mockResolvedValue({ id: 'field-id' });

      const result = await service.setupCpq('workspace-123');

      // 8 relations defined in CPQ_RELATIONS
      expect(result.relationsCreated).toBe(8);
    });

    it('should call findManyWithinWorkspace exactly once regardless of object count (no N+1)', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'company', id: 'company-id' },
        { nameSingular: 'opportunity', id: 'opp-id' },
      ]);
      mockObjectMetadataService.createOneObject.mockResolvedValue({ id: 'new-obj-id' });
      mockFieldMetadataService.createOneField.mockResolvedValue({ id: 'new-field-id' });

      await service.setupCpq('workspace-123');

      // All 6 CPQ object existence checks + company/opportunity lookup must use
      // the single up-front fetch, not individual DB calls per object
      expect(mockObjectMetadataService.findManyWithinWorkspace).toHaveBeenCalledTimes(1);
    });
  });

  describe('teardownCpq', () => {
    it('should remove CPQ objects in reverse dependency order', async () => {
      const callOrder: string[] = [];
      mockObjectMetadataService.findManyWithinWorkspace.mockImplementation(async () => [
        { nameSingular: 'contractAmendment', id: 'ca-id' },
        { nameSingular: 'contractSubscription', id: 'cs-id' },
        { nameSingular: 'quoteLineItem', id: 'qli-id' },
        { nameSingular: 'priceConfiguration', id: 'pc-id' },
        { nameSingular: 'contract', id: 'c-id' },
        { nameSingular: 'quote', id: 'q-id' },
      ]);
      mockObjectMetadataService.deleteOneObject.mockImplementation(async (input: { objectMetadataId: string }) => {
        callOrder.push(input.objectMetadataId);
      });

      const result = await service.teardownCpq('workspace-123');

      expect(result.objectsRemoved).toHaveLength(6);
      // Children removed before parents
      expect(result.objectsRemoved.indexOf('contractAmendment'))
        .toBeLessThan(result.objectsRemoved.indexOf('contract'));
      expect(result.objectsRemoved.indexOf('quoteLineItem'))
        .toBeLessThan(result.objectsRemoved.indexOf('quote'));
    });

    it('should skip objects that do not exist', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([]);

      const result = await service.teardownCpq('workspace-123');

      expect(result.objectsRemoved).toHaveLength(0);
      expect(mockObjectMetadataService.deleteOneObject).not.toHaveBeenCalled();
    });
  });

  describe('getSetupStatus', () => {
    it('should return complete status when all objects exist', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'quote' },
        { nameSingular: 'quoteLineItem' },
        { nameSingular: 'contract' },
        { nameSingular: 'contractSubscription' },
        { nameSingular: 'contractAmendment' },
        { nameSingular: 'priceConfiguration' },
      ]);

      const status = await service.getSetupStatus('workspace-123');

      expect(status.isSetUp).toBe(true);
      expect(status.objectCount).toBe(6);
      expect(status.expectedCount).toBe(6);
      expect(status.missingObjects).toHaveLength(0);
      expect(status.version).toBe('1.0.0');
    });

    it('should report missing objects', async () => {
      mockObjectMetadataService.findManyWithinWorkspace.mockResolvedValue([
        { nameSingular: 'quote' },
        { nameSingular: 'contract' },
      ]);

      const status = await service.getSetupStatus('workspace-123');

      expect(status.isSetUp).toBe(false);
      expect(status.objectCount).toBe(2);
      expect(status.missingObjects).toContain('quoteLineItem');
      expect(status.missingObjects).toContain('contractSubscription');
    });
  });
});
