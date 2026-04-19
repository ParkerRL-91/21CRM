import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Logger,
  UseGuards,
} from '@nestjs/common';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';

import type { PricingInput } from 'src/modules/cpq/services/cpq-pricing.service';
import type { RiskAssessmentInput } from 'src/modules/cpq/services/cpq-risk.service';

// REST controller exposing CPQ business logic as API endpoints.
// Standard CRUD is handled automatically by Twenty's GraphQL via custom objects.
// This controller exposes CPQ-specific operations beyond CRUD:
// setup/teardown, pricing, risk, transitions, renewal, proration.
@Controller('cpq')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class CpqController {
  private readonly logger = new Logger(CpqController.name);

  constructor(
    private readonly setupService: CpqSetupService,
    private readonly pricingService: CpqPricingService,
    private readonly contractService: CpqContractService,
    private readonly renewalService: CpqRenewalService,
    private readonly riskService: CpqRiskService,
  ) {}

  // POST /cpq/setup — bootstrap CPQ custom objects in the workspace
  @Post('setup')
  async setup(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    this.logger.log(`CPQ setup requested for workspace ${workspaceId}`);
    return this.setupService.setupCpq(workspaceId);
  }

  // DELETE /cpq/teardown — remove all CPQ custom objects from workspace
  @Delete('teardown')
  async teardown(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    this.logger.log(`CPQ teardown requested for workspace ${workspaceId}`);
    return this.setupService.teardownCpq(workspaceId);
  }

  // GET /cpq/status — detailed setup status for authenticated workspace
  @Get('status')
  async status(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    return this.setupService.getSetupStatus(workspaceId);
  }

  // POST /cpq/run-renewal-check — trigger the daily renewal scan
  @Post('run-renewal-check')
  async runRenewalCheck(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    return this.renewalService.runRenewalCheck(workspaceId);
  }

  // POST /cpq/calculate-price — run the 10-step price waterfall
  @Post('calculate-price')
  calculatePrice(
    @AuthWorkspace() _workspace: WorkspaceEntity,
    @Body() input: PricingInput,
  ) {
    return this.pricingService.calculatePriceWaterfall(input);
  }

  // POST /cpq/assess-risk — score renewal risk
  @Post('assess-risk')
  assessRisk(
    @AuthWorkspace() _workspace: WorkspaceEntity,
    @Body() input: RiskAssessmentInput,
  ) {
    return this.riskService.assessRenewalRisk(input);
  }

  // POST /cpq/validate-transition — check if a status transition is valid
  @Post('validate-transition')
  validateTransition(
    @AuthWorkspace() _workspace: WorkspaceEntity,
    @Body() body: { entityType: string; from: string; to: string },
  ) {
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
  prorate(
    @AuthWorkspace() _workspace: WorkspaceEntity,
    @Body()
    body: {
      annualValue: string;
      contractStartDate: string;
      contractEndDate: string;
      effectiveDate: string;
    },
  ) {
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
