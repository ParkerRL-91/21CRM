import { CpqController } from './cpq.controller';

import type { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

const mockSetupService = {
  setupCpq: jest.fn(),
  teardownCpq: jest.fn(),
  getSetupStatus: jest.fn(),
  isCpqSetUp: jest.fn(),
};

const mockPricingService = {
  calculatePriceWaterfall: jest.fn(),
};

const mockContractService = {
  isValidTransition: jest.fn(),
  isValidSubscriptionTransition: jest.fn(),
  calculateProratedValue: jest.fn(),
};

const mockRenewalService = {
  runRenewalCheck: jest.fn(),
};

const mockRiskService = {
  assessRenewalRisk: jest.fn(),
};

// Minimal workspace entity for tests — guards are not evaluated in unit tests
const mockWorkspace = { id: 'ws-123' } as WorkspaceEntity;

describe('CpqController', () => {
  let controller: CpqController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CpqController(
      mockSetupService as never,
      mockPricingService as never,
      mockContractService as never,
      mockRenewalService as never,
      mockRiskService as never,
    );
  });

  describe('POST /cpq/setup', () => {
    it('should call setupCpq with workspace ID from auth context', async () => {
      mockSetupService.setupCpq.mockResolvedValue({
        objectsCreated: ['quote', 'contract'],
        fieldsCreated: 20,
        relationsCreated: 5,
        skipped: [],
        errors: [],
      });

      const result = await controller.setup(mockWorkspace);

      expect(mockSetupService.setupCpq).toHaveBeenCalledWith('ws-123');
      expect(result.objectsCreated).toHaveLength(2);
    });
  });

  describe('DELETE /cpq/teardown', () => {
    it('should call teardownCpq with workspace ID from auth context', async () => {
      mockSetupService.teardownCpq.mockResolvedValue({
        objectsRemoved: ['quote', 'contract'],
        errors: [],
      });

      const result = await controller.teardown(mockWorkspace);

      expect(mockSetupService.teardownCpq).toHaveBeenCalledWith('ws-123');
      expect(result.objectsRemoved).toHaveLength(2);
    });
  });

  describe('GET /cpq/status', () => {
    it('should return detailed setup status for authenticated workspace', async () => {
      mockSetupService.getSetupStatus.mockResolvedValue({
        isSetUp: true,
        objectCount: 6,
        expectedCount: 6,
        foundObjects: ['quote', 'contract'],
        missingObjects: [],
        version: '1.0.0',
      });

      const result = await controller.status(mockWorkspace);

      expect(mockSetupService.getSetupStatus).toHaveBeenCalledWith('ws-123');
      expect(result.isSetUp).toBe(true);
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('POST /cpq/calculate-price', () => {
    it('should delegate to pricing service', () => {
      mockPricingService.calculatePriceWaterfall.mockReturnValue({
        netUnitPrice: '85',
        netTotal: '850',
        listPrice: '100',
        auditSteps: [],
      });

      const result = controller.calculatePrice(mockWorkspace, {
        listPrice: '100',
        quantity: 10,
        manualDiscountPercent: 15,
      });

      expect(result.netUnitPrice).toBe('85');
    });
  });

  describe('POST /cpq/assess-risk', () => {
    it('should delegate to risk service', () => {
      mockRiskService.assessRenewalRisk.mockReturnValue({
        overallScore: 42,
        riskLevel: 'medium',
        signals: [],
        assessedAt: new Date(),
      });

      const result = controller.assessRisk(mockWorkspace, {
        daysSinceLastStageChange: 20,
        dealCloseDate: new Date(),
        contractEndDate: new Date(),
        daysUntilExpiry: 45,
        inFinalStage: false,
        currentValue: 100000,
        proposedValue: 95000,
        daysSinceLastActivity: 10,
        hasPreviousChurn: false,
      });

      expect(result.riskLevel).toBe('medium');
    });
  });

  describe('POST /cpq/validate-transition', () => {
    it('should validate contract transitions', () => {
      mockContractService.isValidTransition.mockReturnValue(true);

      const result = controller.validateTransition(mockWorkspace, {
        entityType: 'contract',
        from: 'draft',
        to: 'active',
      });

      expect(result.valid).toBe(true);
    });

    it('should validate subscription transitions', () => {
      mockContractService.isValidSubscriptionTransition.mockReturnValue(false);

      const result = controller.validateTransition(mockWorkspace, {
        entityType: 'subscription',
        from: 'active',
        to: 'cancelled',
      });

      expect(result.valid).toBe(false);
    });

    it('should reject unknown entity types', () => {
      const result = controller.validateTransition(mockWorkspace, {
        entityType: 'unknown',
        from: 'a',
        to: 'b',
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('POST /cpq/prorate', () => {
    it('should delegate to contract service', () => {
      mockContractService.calculateProratedValue.mockReturnValue('60000');

      const result = controller.prorate(mockWorkspace, {
        annualValue: '120000',
        contractStartDate: '2026-01-01',
        contractEndDate: '2028-01-01',
        effectiveDate: '2027-01-01',
      });

      expect(result.proratedValue).toBe('60000');
    });
  });

  describe('POST /cpq/run-renewal-check', () => {
    it('should delegate to renewal service with workspace ID from auth context', async () => {
      mockRenewalService.runRenewalCheck.mockResolvedValue({
        contractsScanned: 10,
        renewalsCreated: 2,
        errors: [],
        status: 'completed',
      });

      const result = await controller.runRenewalCheck(mockWorkspace);

      expect(mockRenewalService.runRenewalCheck).toHaveBeenCalledWith('ws-123');
      expect(result.status).toBe('completed');
      expect(result.renewalsCreated).toBe(2);
    });
  });
});
