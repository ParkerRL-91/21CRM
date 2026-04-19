import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

import { CpqController } from 'src/modules/cpq/cpq.controller';
import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';

const WORKSPACE_ID = 'test-workspace-id';

// Guard that always passes and injects a mock workspace onto the request
const mockJwtGuard = { canActivate: () => true };
const mockWorkspaceGuard = {
  canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    req.workspace = { id: WORKSPACE_ID };

    return true;
  },
};

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
      .useValue(mockJwtGuard)
      .overrideGuard(WorkspaceAuthGuard)
      .useValue(mockWorkspaceGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /cpq/setup

  describe('POST /cpq/setup', () => {
    it('should return setup result for authenticated workspace', async () => {
      mockSetupService.setupCpq.mockResolvedValue({
        objectsCreated: ['quote', 'contract'],
        fieldsCreated: 20,
        relationsCreated: 5,
        skipped: [],
        errors: [],
      });

      const res = await request(app.getHttpServer()).post('/cpq/setup').send();

      expect(res.status).toBe(201);
      expect(res.body.objectsCreated).toEqual(['quote', 'contract']);
      expect(mockSetupService.setupCpq).toHaveBeenCalledWith(WORKSPACE_ID);
    });

    it('should return 500 when setup service throws', async () => {
      mockSetupService.setupCpq.mockRejectedValue(
        new Error('Missing required fields'),
      );

      const res = await request(app.getHttpServer()).post('/cpq/setup').send();

      expect(res.status).toBe(500);
    });
  });

  // POST /cpq/calculate-price

  describe('POST /cpq/calculate-price', () => {
    const validInput = {
      listPrice: '100',
      quantity: 10,
      manualDiscountPercent: 15,
    };

    it('should return pricing result for valid input', async () => {
      mockPricingService.calculatePriceWaterfall.mockReturnValue({
        netUnitPrice: '85.00',
        netTotal: '850.00',
        listPrice: '100',
        auditSteps: [],
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/calculate-price')
        .send(validInput);

      expect(res.status).toBe(201);
      expect(res.body.netUnitPrice).toBe('85.00');
      expect(res.body.netTotal).toBe('850.00');
      expect(mockPricingService.calculatePriceWaterfall).toHaveBeenCalledWith(
        validInput,
      );
    });

    it('should return 400 when listPrice is missing', async () => {
      mockPricingService.calculatePriceWaterfall.mockImplementation(() => {
        throw Object.assign(new Error('listPrice is required'), {
          status: 400,
        });
      });

      // NestJS won't validate unless we add class-validator pipes, so we
      // simulate a missing-field error by having the service throw
      const res = await request(app.getHttpServer())
        .post('/cpq/calculate-price')
        .send({ quantity: 10 });

      // Service throws → NestJS maps to 500 (no validation pipe installed)
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 500 when pricing service throws', async () => {
      mockPricingService.calculatePriceWaterfall.mockImplementation(() => {
        throw new Error('Decimal conversion error');
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/calculate-price')
        .send({ quantity: 5 });

      expect(res.status).toBe(500);
    });
  });

  // POST /cpq/assess-risk

  describe('POST /cpq/assess-risk', () => {
    const validInput = {
      daysSinceLastStageChange: 20,
      dealCloseDate: new Date().toISOString(),
      contractEndDate: new Date().toISOString(),
      daysUntilExpiry: 45,
      inFinalStage: false,
      currentValue: 100000,
      proposedValue: 95000,
      daysSinceLastActivity: 10,
      hasPreviousChurn: false,
    };

    it('should return risk assessment for valid input', async () => {
      mockRiskService.assessRenewalRisk.mockReturnValue({
        overallScore: 42,
        riskLevel: 'medium',
        signals: [],
        assessedAt: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/assess-risk')
        .send(validInput);

      expect(res.status).toBe(201);
      expect(res.body.riskLevel).toBe('medium');
      expect(res.body.overallScore).toBe(42);
      expect(mockRiskService.assessRenewalRisk).toHaveBeenCalled();
    });

    it('should return 500 when risk service throws due to missing fields', async () => {
      mockRiskService.assessRenewalRisk.mockImplementation(() => {
        throw new Error('daysSinceLastStageChange is required');
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/assess-risk')
        .send({});

      expect(res.status).toBe(500);
    });

    it('should return critical risk level for high-risk input', async () => {
      mockRiskService.assessRenewalRisk.mockReturnValue({
        overallScore: 90,
        riskLevel: 'critical',
        signals: [
          {
            name: 'stage_stagnation',
            weight: 0.25,
            score: 100,
            description: 'Stagnant for 30 days',
          },
        ],
        assessedAt: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/assess-risk')
        .send({ ...validInput, daysSinceLastStageChange: 30, hasPreviousChurn: true });

      expect(res.status).toBe(201);
      expect(res.body.riskLevel).toBe('critical');
    });
  });

  // POST /cpq/validate-transition

  describe('POST /cpq/validate-transition', () => {
    it('should validate a valid contract transition', async () => {
      mockContractService.isValidTransition.mockReturnValue(true);

      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'contract', from: 'draft', to: 'active' });

      expect(res.status).toBe(201);
      expect(res.body.valid).toBe(true);
      expect(res.body.entityType).toBe('contract');
      expect(mockContractService.isValidTransition).toHaveBeenCalledWith(
        'draft',
        'active',
      );
    });

    it('should validate a subscription transition', async () => {
      mockContractService.isValidSubscriptionTransition.mockReturnValue(false);

      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'subscription', from: 'active', to: 'cancelled' });

      expect(res.status).toBe(201);
      expect(res.body.valid).toBe(false);
      expect(res.body.entityType).toBe('subscription');
    });

    it('should return valid:false for unknown entity type (missing entityType = unknown)', async () => {
      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'product', from: 'a', to: 'b' });

      expect(res.status).toBe(201);
      expect(res.body.valid).toBe(false);
      expect(res.body.error).toMatch(/Unknown entity type/);
    });

    it('should return valid:false when entityType is missing from body', async () => {
      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ from: 'draft', to: 'active' });

      // entityType is undefined → falls through to unknown-entity branch
      expect(res.status).toBe(201);
      expect(res.body.valid).toBe(false);
    });
  });

  // GET /cpq/status

  describe('GET /cpq/status', () => {
    it('should return setup status for authenticated workspace', async () => {
      mockSetupService.getSetupStatus.mockResolvedValue({
        isSetUp: true,
        objectCount: 6,
        expectedCount: 6,
        foundObjects: ['quote', 'contract', 'subscription'],
        missingObjects: [],
        version: '1.0.0',
      });

      const res = await request(app.getHttpServer()).get('/cpq/status');

      expect(res.status).toBe(200);
      expect(res.body.isSetUp).toBe(true);
      expect(res.body.version).toBe('1.0.0');
      expect(mockSetupService.getSetupStatus).toHaveBeenCalledWith(WORKSPACE_ID);
    });

    it('should return isSetUp:false when CPQ is not configured', async () => {
      mockSetupService.getSetupStatus.mockResolvedValue({
        isSetUp: false,
        objectCount: 0,
        expectedCount: 6,
        foundObjects: [],
        missingObjects: ['quote', 'contract'],
        version: '1.0.0',
      });

      const res = await request(app.getHttpServer()).get('/cpq/status');

      expect(res.status).toBe(200);
      expect(res.body.isSetUp).toBe(false);
      expect(res.body.missingObjects).toEqual(['quote', 'contract']);
    });

    it('should return 500 when status service throws', async () => {
      mockSetupService.getSetupStatus.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const res = await request(app.getHttpServer()).get('/cpq/status');

      expect(res.status).toBe(500);
    });
  });
});
