import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';

import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

import { CpqController } from './cpq.controller';
import { CpqSetupService } from './services/cpq-setup.service';
import { CpqPricingService } from './services/cpq-pricing.service';
import { CpqContractService } from './services/cpq-contract.service';
import { CpqRenewalService } from './services/cpq-renewal.service';
import { CpqRiskService } from './services/cpq-risk.service';

const MOCK_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001';

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

// Guard overrides — bypass JWT and workspace auth in test context
const mockGuard = { canActivate: () => true };

describe('CpqController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CpqController],
      providers: [
        { provide: CpqSetupService, useValue: mockSetupService },
        { provide: CpqPricingService, useValue: mockPricingService },
        { provide: CpqContractService, useValue: mockContractService },
        { provide: CpqRenewalService, useValue: mockRenewalService },
        { provide: CpqRiskService, useValue: mockRiskService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(WorkspaceAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = module.createNestApplication();

    // Inject workspace into every request so @AuthWorkspace() resolves correctly
    app.use((req: { workspace: { id: string } }, _res: unknown, next: () => void) => {
      req.workspace = { id: MOCK_WORKSPACE_ID };
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // POST /cpq/setup
  // -------------------------------------------------------------------------
  describe('POST /cpq/setup', () => {
    it('should return setup result with HTTP 201', async () => {
      const setupResult = {
        objectsCreated: ['cpq_quote', 'cpq_contract', 'cpq_line_item'],
        fieldsCreated: 42,
        relationsCreated: 8,
        skipped: [],
        errors: [],
      };
      mockSetupService.setupCpq.mockResolvedValue(setupResult);

      const response = await supertest(app.getHttpServer())
        .post('/cpq/setup')
        .expect(201);

      expect(response.body.objectsCreated).toHaveLength(3);
      expect(response.body.fieldsCreated).toBe(42);
      expect(mockSetupService.setupCpq).toHaveBeenCalledWith(MOCK_WORKSPACE_ID);
    });

    it('should propagate service errors as 500', async () => {
      mockSetupService.setupCpq.mockRejectedValue(new Error('DB unavailable'));

      await supertest(app.getHttpServer())
        .post('/cpq/setup')
        .expect(500);
    });
  });

  // -------------------------------------------------------------------------
  // POST /cpq/calculate-price
  // -------------------------------------------------------------------------
  describe('POST /cpq/calculate-price', () => {
    const validPricingInput = {
      listPrice: '1000',
      quantity: 10,
      currency: 'USD',
    };

    it('should return 10-step price waterfall result with HTTP 201', async () => {
      const waterfallResult = {
        netUnitPrice: '850',
        totalPrice: '8500',
        currency: 'USD',
        auditTrail: [
          { step: 'base_price', priceIn: '1000', priceOut: '1000' },
          { step: 'manual_discount', priceIn: '1000', priceOut: '850' },
          { step: 'floor_price', priceIn: '850', priceOut: '850' },
          { step: 'currency_conversion', priceIn: '850', priceOut: '850' },
          { step: 'rounding', priceIn: '850', priceOut: '850' },
          { step: 'total', priceIn: '850', priceOut: '8500' },
        ],
      };
      mockPricingService.calculatePriceWaterfall.mockReturnValue(waterfallResult);

      const response = await supertest(app.getHttpServer())
        .post('/cpq/calculate-price')
        .send(validPricingInput)
        .expect(201);

      expect(response.body.netUnitPrice).toBe('850');
      expect(response.body.totalPrice).toBe('8500');
      expect(response.body.auditTrail).toHaveLength(6);
      expect(mockPricingService.calculatePriceWaterfall).toHaveBeenCalledWith(
        validPricingInput,
      );
    });

    it('should return result even with minimal required fields', async () => {
      mockPricingService.calculatePriceWaterfall.mockReturnValue({
        netUnitPrice: '500',
        totalPrice: '500',
        currency: 'USD',
        auditTrail: [{ step: 'base_price', priceIn: '500', priceOut: '500' }],
      });

      const response = await supertest(app.getHttpServer())
        .post('/cpq/calculate-price')
        .send({ listPrice: '500', quantity: 1 })
        .expect(201);

      expect(response.body.netUnitPrice).toBe('500');
    });
  });

  // -------------------------------------------------------------------------
  // POST /cpq/assess-risk
  // -------------------------------------------------------------------------
  describe('POST /cpq/assess-risk', () => {
    const validRiskInput = {
      daysSinceLastStageChange: 20,
      dealCloseDate: new Date('2026-05-01').toISOString(),
      contractEndDate: new Date('2026-04-30').toISOString(),
      daysUntilExpiry: 11,
      inFinalStage: false,
      currentValue: '50000',
      proposedValue: '45000',
      daysSinceLastActivity: 25,
      hasPreviousChurn: false,
    };

    it('should return risk score object with HTTP 201', async () => {
      const riskResult = {
        overallScore: 65,
        riskLevel: 'high',
        signals: [
          { name: 'stage_stagnation', weight: 0.25, score: 50, description: 'Deal stagnant for 20 days' },
          { name: 'close_date_slippage', weight: 0.20, score: 100, description: 'Close date past contract end' },
          { name: 'value_decrease', weight: 0.15, score: 40, description: 'Value decreased 10%' },
        ],
        assessedAt: new Date().toISOString(),
      };
      mockRiskService.assessRenewalRisk.mockReturnValue(riskResult);

      const response = await supertest(app.getHttpServer())
        .post('/cpq/assess-risk')
        .send(validRiskInput)
        .expect(201);

      expect(response.body.overallScore).toBe(65);
      expect(response.body.riskLevel).toBe('high');
      expect(response.body.signals).toHaveLength(3);
      expect(mockRiskService.assessRenewalRisk).toHaveBeenCalledWith(validRiskInput);
    });

    it('should return low risk for healthy deal', async () => {
      mockRiskService.assessRenewalRisk.mockReturnValue({
        overallScore: 5,
        riskLevel: 'low',
        signals: [],
        assessedAt: new Date().toISOString(),
      });

      const response = await supertest(app.getHttpServer())
        .post('/cpq/assess-risk')
        .send({
          daysSinceLastStageChange: 2,
          dealCloseDate: new Date('2026-06-01').toISOString(),
          contractEndDate: new Date('2026-06-15').toISOString(),
          daysUntilExpiry: 57,
          inFinalStage: true,
          currentValue: '50000',
          proposedValue: '55000',
          daysSinceLastActivity: 1,
          hasPreviousChurn: false,
        })
        .expect(201);

      expect(response.body.riskLevel).toBe('low');
      expect(response.body.signals).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // POST /cpq/validate-transition
  // -------------------------------------------------------------------------
  describe('POST /cpq/validate-transition', () => {
    it('should validate a contract status transition as valid', async () => {
      mockContractService.isValidTransition.mockReturnValue(true);

      const response = await supertest(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'contract', from: 'draft', to: 'active' })
        .expect(201);

      expect(response.body.valid).toBe(true);
      expect(response.body.entityType).toBe('contract');
      expect(response.body.from).toBe('draft');
      expect(response.body.to).toBe('active');
    });

    it('should validate a contract status transition as invalid', async () => {
      mockContractService.isValidTransition.mockReturnValue(false);

      const response = await supertest(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'contract', from: 'expired', to: 'draft' })
        .expect(201);

      expect(response.body.valid).toBe(false);
    });

    it('should validate a subscription transition', async () => {
      mockContractService.isValidSubscriptionTransition.mockReturnValue(true);

      const response = await supertest(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'subscription', from: 'trial', to: 'active' })
        .expect(201);

      expect(response.body.valid).toBe(true);
      expect(mockContractService.isValidSubscriptionTransition).toHaveBeenCalledWith(
        'trial',
        'active',
      );
    });

    it('should return invalid for unknown entity type', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'unknown_type', from: 'a', to: 'b' })
        .expect(201);

      expect(response.body.valid).toBe(false);
      expect(response.body.error).toMatch(/Unknown entity type/);
    });
  });

  // -------------------------------------------------------------------------
  // GET /cpq/status
  // -------------------------------------------------------------------------
  describe('GET /cpq/status', () => {
    it('should return setup status with HTTP 200', async () => {
      const statusResult = {
        isSetUp: true,
        objectCount: 6,
        expectedCount: 6,
        foundObjects: [
          'cpq_quote',
          'cpq_contract',
          'cpq_line_item',
          'cpq_price_book',
          'cpq_price_book_entry',
          'cpq_discount_schedule',
        ],
        missingObjects: [],
        version: '1.0.0',
      };
      mockSetupService.getSetupStatus.mockResolvedValue(statusResult);

      const response = await supertest(app.getHttpServer())
        .get('/cpq/status')
        .expect(200);

      expect(response.body.isSetUp).toBe(true);
      expect(response.body.objectCount).toBe(6);
      expect(response.body.version).toBe('1.0.0');
      expect(mockSetupService.getSetupStatus).toHaveBeenCalledWith(MOCK_WORKSPACE_ID);
    });

    it('should return not-set-up status when CPQ objects are missing', async () => {
      mockSetupService.getSetupStatus.mockResolvedValue({
        isSetUp: false,
        objectCount: 2,
        expectedCount: 6,
        foundObjects: ['cpq_quote', 'cpq_contract'],
        missingObjects: ['cpq_line_item', 'cpq_price_book', 'cpq_price_book_entry', 'cpq_discount_schedule'],
        version: '1.0.0',
      });

      const response = await supertest(app.getHttpServer())
        .get('/cpq/status')
        .expect(200);

      expect(response.body.isSetUp).toBe(false);
      expect(response.body.missingObjects).toHaveLength(4);
    });
  });
});
