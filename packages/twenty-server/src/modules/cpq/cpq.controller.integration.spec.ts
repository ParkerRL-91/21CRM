import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

import { CpqController } from 'src/modules/cpq/cpq.controller';
import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

// Stub guards so we can test controller logic without auth infrastructure.
// AuthWorkspace decorator is satisfied by the REQUEST_WORKSPACE_ENTITY key
// injected by the WorkspaceAuthGuard stub below.
const mockWorkspace = { id: 'ws-test-123' };

const allowAllGuard = { canActivate: () => true };

// Interceptor that injects the mock workspace into the request so
// @AuthWorkspace() resolves correctly inside the controller.
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

// Injects the mock workspace onto `request.workspace` so that
// the @AuthWorkspace() decorator resolves correctly during tests.
@Injectable()
class InjectWorkspaceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();

    req.workspace = mockWorkspace;
    return next.handle();
  }
}

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
        InjectWorkspaceInterceptor,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(WorkspaceAuthGuard)
      .useValue(allowAllGuard)
      .compile();

    app = module.createNestApplication();
    const interceptor = module.get(InjectWorkspaceInterceptor);

    app.useGlobalInterceptors(interceptor);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /cpq/setup', () => {
    it('should return 201 and call setupCpq with workspace id', async () => {
      mockSetupService.setupCpq.mockResolvedValue({
        objectsCreated: ['quote', 'contract', 'subscription'],
        fieldsCreated: 24,
        relationsCreated: 6,
        skipped: [],
        errors: [],
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/setup')
        .expect(201);

      expect(mockSetupService.setupCpq).toHaveBeenCalledWith('ws-test-123');
      expect(res.body.objectsCreated).toHaveLength(3);
      expect(res.body.errors).toHaveLength(0);
    });
  });

  describe('DELETE /cpq/teardown', () => {
    it('should return 200 and call teardownCpq with workspace id', async () => {
      mockSetupService.teardownCpq.mockResolvedValue({
        objectsRemoved: ['quote', 'contract'],
        errors: [],
      });

      const res = await request(app.getHttpServer())
        .delete('/cpq/teardown')
        .expect(200);

      expect(mockSetupService.teardownCpq).toHaveBeenCalledWith('ws-test-123');
      expect(res.body.objectsRemoved).toHaveLength(2);
    });
  });

  describe('GET /cpq/status', () => {
    it('should return 200 with setup status', async () => {
      mockSetupService.getSetupStatus.mockResolvedValue({
        isSetUp: true,
        objectCount: 6,
        expectedCount: 6,
        foundObjects: ['quote', 'contract', 'subscription', 'lineItem', 'product', 'renewal'],
        missingObjects: [],
        version: '1.0.0',
      });

      const res = await request(app.getHttpServer())
        .get('/cpq/status')
        .expect(200);

      expect(mockSetupService.getSetupStatus).toHaveBeenCalledWith('ws-test-123');
      expect(res.body.isSetUp).toBe(true);
      expect(res.body.version).toBe('1.0.0');
    });
  });

  describe('POST /cpq/run-renewal-check', () => {
    it('should return 201 and trigger renewal check for the workspace', async () => {
      mockRenewalService.runRenewalCheck.mockResolvedValue({
        contractsScanned: 15,
        renewalsCreated: 3,
        errors: [],
        status: 'completed',
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/run-renewal-check')
        .expect(201);

      expect(mockRenewalService.runRenewalCheck).toHaveBeenCalledWith(
        'ws-test-123',
      );
      expect(res.body.status).toBe('completed');
      expect(res.body.renewalsCreated).toBe(3);
    });
  });

  describe('POST /cpq/calculate-price', () => {
    it('should return 201 with price waterfall result', async () => {
      mockPricingService.calculatePriceWaterfall.mockReturnValue({
        netUnitPrice: '85.00',
        netTotal: '850.00',
        listPrice: '100.00',
        auditSteps: [
          { step: 'list_price', value: '100.00' },
          { step: 'manual_discount', value: '85.00' },
        ],
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/calculate-price')
        .send({ listPrice: '100', quantity: 10, manualDiscountPercent: 15 })
        .expect(201);

      expect(res.body.netUnitPrice).toBe('85.00');
      expect(res.body.auditSteps).toHaveLength(2);
    });

    it('should pass the full pricing input to the service', async () => {
      mockPricingService.calculatePriceWaterfall.mockReturnValue({
        netUnitPrice: '90.00',
        netTotal: '9000.00',
        listPrice: '100.00',
        auditSteps: [],
      });

      const input = {
        listPrice: '100',
        quantity: 100,
        manualDiscountPercent: 10,
        volumeDiscountPercent: 0,
      };

      await request(app.getHttpServer())
        .post('/cpq/calculate-price')
        .send(input)
        .expect(201);

      expect(mockPricingService.calculatePriceWaterfall).toHaveBeenCalledWith(
        expect.objectContaining({
          listPrice: '100',
          quantity: 100,
          manualDiscountPercent: 10,
        }),
      );
    });
  });

  describe('POST /cpq/assess-risk', () => {
    const baseRiskInput = {
      daysSinceLastStageChange: 30,
      dealCloseDate: new Date('2026-06-01').toISOString(),
      contractEndDate: new Date('2026-05-01').toISOString(),
      daysUntilExpiry: 30,
      inFinalStage: false,
      currentValue: 80000,
      proposedValue: 72000,
      daysSinceLastActivity: 20,
      hasPreviousChurn: false,
    };

    it('should return 201 with risk assessment', async () => {
      mockRiskService.assessRenewalRisk.mockReturnValue({
        overallScore: 65,
        riskLevel: 'high',
        signals: [
          { signal: 'stale_stage', score: 20 },
          { signal: 'value_decrease', score: 15 },
        ],
        assessedAt: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/assess-risk')
        .send(baseRiskInput)
        .expect(201);

      expect(res.body.riskLevel).toBe('high');
      expect(res.body.overallScore).toBe(65);
      expect(res.body.signals).toHaveLength(2);
    });

    it('should return low risk for healthy deal', async () => {
      mockRiskService.assessRenewalRisk.mockReturnValue({
        overallScore: 10,
        riskLevel: 'low',
        signals: [],
        assessedAt: new Date().toISOString(),
      });

      const res = await request(app.getHttpServer())
        .post('/cpq/assess-risk')
        .send({ ...baseRiskInput, daysUntilExpiry: 90, daysSinceLastActivity: 2 })
        .expect(201);

      expect(res.body.riskLevel).toBe('low');
    });
  });

  describe('POST /cpq/validate-transition', () => {
    it('should return valid=true for a permitted contract transition', async () => {
      mockContractService.isValidTransition.mockReturnValue(true);

      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'contract', from: 'draft', to: 'active' })
        .expect(201);

      expect(res.body.valid).toBe(true);
      expect(res.body.entityType).toBe('contract');
    });

    it('should return valid=false for a forbidden contract transition', async () => {
      mockContractService.isValidTransition.mockReturnValue(false);

      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'contract', from: 'expired', to: 'draft' })
        .expect(201);

      expect(res.body.valid).toBe(false);
    });

    it('should validate subscription transitions', async () => {
      mockContractService.isValidSubscriptionTransition.mockReturnValue(true);

      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'subscription', from: 'active', to: 'paused' })
        .expect(201);

      expect(res.body.valid).toBe(true);
    });

    it('should return valid=false for unknown entity types', async () => {
      const res = await request(app.getHttpServer())
        .post('/cpq/validate-transition')
        .send({ entityType: 'deal', from: 'open', to: 'closed' })
        .expect(201);

      expect(res.body.valid).toBe(false);
      expect(res.body.error).toMatch(/unknown entity type/i);
    });
  });

  describe('POST /cpq/prorate', () => {
    it('should return 201 with prorated value', async () => {
      mockContractService.calculateProratedValue.mockReturnValue('60000.00');

      const res = await request(app.getHttpServer())
        .post('/cpq/prorate')
        .send({
          annualValue: '120000',
          contractStartDate: '2026-01-01',
          contractEndDate: '2028-01-01',
          effectiveDate: '2027-01-01',
        })
        .expect(201);

      expect(res.body.proratedValue).toBe('60000.00');
    });

    it('should pass parsed dates to the contract service', async () => {
      mockContractService.calculateProratedValue.mockReturnValue('30000.00');

      await request(app.getHttpServer())
        .post('/cpq/prorate')
        .send({
          annualValue: '120000',
          contractStartDate: '2026-01-01',
          contractEndDate: '2027-01-01',
          effectiveDate: '2026-07-01',
        })
        .expect(201);

      expect(mockContractService.calculateProratedValue).toHaveBeenCalledWith(
        '120000',
        new Date('2026-01-01'),
        new Date('2027-01-01'),
        new Date('2026-07-01'),
      );
    });
  });
});
