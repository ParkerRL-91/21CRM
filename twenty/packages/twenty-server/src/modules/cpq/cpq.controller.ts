import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';

import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';

import type { PricingInput } from 'src/modules/cpq/services/cpq-pricing.service';
import type { RiskAssessmentInput } from 'src/modules/cpq/services/cpq-risk.service';

// REST controller exposing CPQ business logic as API endpoints.
// Standard CRUD (create/read/update/delete quotes, contracts, etc.)
// is handled automatically by Twenty's GraphQL layer via custom objects.
// This controller exposes CPQ-specific operations that go beyond CRUD:
// setup, pricing calculation, risk assessment, contract conversion.
@Controller('cpq')
export class CpqController {
  private readonly logger = new Logger(CpqController.name);

  constructor(
    private readonly setupService: CpqSetupService,
    private readonly pricingService: CpqPricingService,
    private readonly contractService: CpqContractService,
    private readonly riskService: CpqRiskService,
  ) {}

  // POST /cpq/setup — bootstrap CPQ custom objects in the workspace
  @Post('setup')
  async setup(@Body() body: { workspaceId: string }) {
    this.logger.log(`CPQ setup requested for workspace ${body.workspaceId}`);
    return this.setupService.setupCpq(body.workspaceId);
  }

  // GET /cpq/status/:workspaceId — check if CPQ is set up
  @Get('status/:workspaceId')
  async status(@Param('workspaceId') workspaceId: string) {
    const isSetUp = await this.setupService.isCpqSetUp(workspaceId);
    return { workspaceId, cpqEnabled: isSetUp };
  }

  // POST /cpq/calculate-price — run the 10-step price waterfall
  @Post('calculate-price')
  calculatePrice(@Body() input: PricingInput) {
    return this.pricingService.calculatePriceWaterfall(input);
  }

  // POST /cpq/assess-risk — score renewal risk
  @Post('assess-risk')
  assessRisk(@Body() input: RiskAssessmentInput) {
    return this.riskService.assessRenewalRisk(input);
  }

  // POST /cpq/validate-transition — check if a status transition is valid
  @Post('validate-transition')
  validateTransition(@Body() body: { entityType: string; from: string; to: string }) {
    if (body.entityType === 'contract') {
      return {
        valid: this.contractService.isValidTransition(body.from, body.to),
        entityType: body.entityType,
        from: body.from,
        to: body.to,
      };
    }
    if (body.entityType === 'subscription') {
      return {
        valid: this.contractService.isValidSubscriptionTransition(body.from, body.to),
        entityType: body.entityType,
        from: body.from,
        to: body.to,
      };
    }
    return { valid: false, error: `Unknown entity type: ${body.entityType}` };
  }

  // POST /cpq/prorate — calculate prorated value
  @Post('prorate')
  prorate(@Body() body: {
    annualValue: string;
    contractStartDate: string;
    contractEndDate: string;
    effectiveDate: string;
  }) {
    return {
      proratedValue: this.contractService.calculateProratedValue(
        body.annualValue,
        new Date(body.contractStartDate),
        new Date(body.contractEndDate),
        new Date(body.effectiveDate),
      ),
    };
  }
}
