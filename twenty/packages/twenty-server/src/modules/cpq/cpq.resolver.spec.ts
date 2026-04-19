import { CpqResolver } from './cpq.resolver';

import type { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

const mockSetupService = {
  setupCpq: jest.fn(),
  teardownCpq: jest.fn(),
  getSetupStatus: jest.fn(),
};

const mockPricingService = {
  calculatePriceWaterfall: jest.fn(),
};

const mockContractService = {
  createFromQuote: jest.fn(),
};

const mockRenewalService = {
  runRenewalCheck: jest.fn(),
};

const mockRiskService = {
  assessRenewalRisk: jest.fn(),
};

const mockWorkspace = { id: 'ws-abc' } as WorkspaceEntity;

describe('CpqResolver', () => {
  let resolver: CpqResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new CpqResolver(
      mockSetupService as never,
      mockPricingService as never,
      mockContractService as never,
      mockRenewalService as never,
      mockRiskService as never,
    );
  });

  describe('setupCpq mutation', () => {
    it('should call setupService with workspace ID', async () => {
      mockSetupService.setupCpq.mockResolvedValue({
        objectsCreated: ['quote'],
        fieldsCreated: 10,
        relationsCreated: 3,
        skipped: [],
        errors: [],
      });

      const result = await resolver.setupCpq(mockWorkspace);

      expect(mockSetupService.setupCpq).toHaveBeenCalledWith('ws-abc');
      expect(result.objectsCreated).toEqual(['quote']);
    });
  });

  describe('teardownCpq mutation', () => {
    it('should call teardownService with workspace ID', async () => {
      mockSetupService.teardownCpq.mockResolvedValue({
        objectsRemoved: ['quote'],
        errors: [],
      });

      const result = await resolver.teardownCpq(mockWorkspace);

      expect(mockSetupService.teardownCpq).toHaveBeenCalledWith('ws-abc');
      expect(result.objectsRemoved).toEqual(['quote']);
    });
  });

  describe('cpqStatus query', () => {
    it('should return status for authenticated workspace', async () => {
      mockSetupService.getSetupStatus.mockResolvedValue({
        isSetUp: true,
        objectCount: 6,
        expectedCount: 6,
        foundObjects: ['quote', 'contract'],
        missingObjects: [],
        version: '1.0.0',
      });

      const result = await resolver.cpqStatus(mockWorkspace);

      expect(mockSetupService.getSetupStatus).toHaveBeenCalledWith('ws-abc');
      expect(result.isSetUp).toBe(true);
    });
  });

  describe('calculatePrice mutation', () => {
    it('should delegate to pricing service and return result', () => {
      mockPricingService.calculatePriceWaterfall.mockReturnValue({
        netUnitPrice: '90',
        netTotal: '900',
        listPrice: '100',
        auditSteps: [{ ruleName: 'base_price', inputPrice: '100', outputPrice: '100' }],
      });

      const result = resolver.calculatePrice({
        listPrice: '100',
        quantity: 10,
        manualDiscountPercent: 10,
      });

      expect(result.netUnitPrice).toBe('90');
      expect(result.netTotal).toBe('900');
      expect(result.auditSteps).toHaveLength(1);
    });
  });

  describe('assessRisk mutation', () => {
    it('should convert date strings and delegate to risk service', () => {
      mockRiskService.assessRenewalRisk.mockReturnValue({
        overallScore: 30,
        riskLevel: 'medium',
        signals: [],
        assessedAt: new Date('2026-04-12T00:00:00.000Z'),
      });

      const result = resolver.assessRisk({
        daysSinceLastStageChange: 15,
        dealCloseDate: '2026-06-01',
        contractEndDate: '2026-05-31',
        daysUntilExpiry: 49,
        inFinalStage: false,
        currentValue: 50000,
        proposedValue: 48000,
        daysSinceLastActivity: 5,
        hasPreviousChurn: false,
      });

      expect(mockRiskService.assessRenewalRisk).toHaveBeenCalledWith(
        expect.objectContaining({
          dealCloseDate: expect.any(Date),
          contractEndDate: expect.any(Date),
        }),
      );
      expect(result.riskLevel).toBe('medium');
      expect(result.assessedAt).toBe('2026-04-12T00:00:00.000Z');
    });
  });

  describe('convertQuoteToContract mutation', () => {
    it('should call createFromQuote with workspace and quote IDs', async () => {
      mockContractService.createFromQuote.mockResolvedValue('contract-xyz');

      const result = await resolver.convertQuoteToContract(mockWorkspace, 'quote-123');

      expect(mockContractService.createFromQuote).toHaveBeenCalledWith('ws-abc', 'quote-123');
      expect(result.contractId).toBe('contract-xyz');
    });
  });

  describe('runRenewalCheck mutation', () => {
    it('should trigger renewal check for authenticated workspace', async () => {
      mockRenewalService.runRenewalCheck.mockResolvedValue({
        contractsScanned: 5,
        renewalsCreated: 1,
        errors: [],
        status: 'completed',
      });

      const result = await resolver.runRenewalCheck(mockWorkspace);

      expect(mockRenewalService.runRenewalCheck).toHaveBeenCalledWith('ws-abc');
      expect(result.contractsScanned).toBe(5);
      expect(result.status).toBe('completed');
    });
  });
});
