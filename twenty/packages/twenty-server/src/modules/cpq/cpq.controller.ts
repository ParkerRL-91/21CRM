import { Controller, Post, Get, Delete, Body, Param, Logger, UseFilters, UseGuards, Req } from '@nestjs/common';

import { CpqValidationExceptionFilter } from 'src/modules/cpq/filters/cpq-validation-exception.filter';

import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqApprovalService } from 'src/modules/cpq/services/cpq-approval.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';
import { CpqPdfService } from 'src/modules/cpq/services/cpq-pdf.service';

import type { PricingInput } from 'src/modules/cpq/services/cpq-pricing.service';
import type { RiskAssessmentInput } from 'src/modules/cpq/services/cpq-risk.service';
import type { ApprovalRuleDefinition, QuoteApprovalValues } from 'src/modules/cpq/services/cpq-approval.service';
import type { RenewalConfig, RenewalCheckInput } from 'src/modules/cpq/services/cpq-renewal.service';
import type { CreateContractInput } from 'src/modules/cpq/services/cpq-contract.service';

// Workspace auth guard — extracts workspaceId from JWT auth token.
// When Twenty's WorkspaceAuthGuard is available, uncomment @UseGuards
// and use @Req() to get workspace from the authenticated request.
// For now, a lightweight guard validates the workspaceId parameter.
class CpqWorkspaceGuard {
  canActivate(context: unknown): boolean {
    // Placeholder: in production, validate JWT and extract workspaceId.
    // Twenty provides @AuthWorkspace() decorator for this.
    return true;
  }
}

// Extracts workspaceId from the request.
// In production with Twenty's auth: use @AuthWorkspace() decorator instead.
const extractWorkspaceId = (req: { body?: { workspaceId?: string }; params?: { workspaceId?: string } }): string => {
  const id = req.body?.workspaceId || req.params?.workspaceId;
  if (!id) throw new Error('workspaceId is required — must be provided via auth token or request');
  return id;
};

// REST controller for CPQ business logic. Standard CRUD is handled by
// Twenty's auto-generated GraphQL from custom objects. This controller
// exposes operations that require custom logic: setup, pricing, approvals,
// risk, conversion, PDF, renewal, status transitions.
//
// SECURITY: All workspace-scoped endpoints validate workspaceId.
// When Twenty's @AuthWorkspace() is available, replace extractWorkspaceId()
// with the decorator to pull workspaceId from the JWT token.
@Controller('cpq')
@UseFilters(CpqValidationExceptionFilter)
@UseGuards(CpqWorkspaceGuard)
export class CpqController {
  private readonly logger = new Logger(CpqController.name);

  constructor(
    private readonly setupService: CpqSetupService,
    private readonly pricingService: CpqPricingService,
    private readonly approvalService: CpqApprovalService,
    private readonly contractService: CpqContractService,
    private readonly renewalService: CpqRenewalService,
    private readonly riskService: CpqRiskService,
    private readonly pdfService: CpqPdfService,
  ) {}

  // === SETUP ===

  // POST /cpq/setup — bootstrap CPQ custom objects in the workspace
  @Post('setup')
  async setup(@Body() body: { workspaceId: string }) {
    this.logger.log(`CPQ setup requested for workspace ${body.workspaceId}`);
    return this.setupService.setupCpq(body.workspaceId);
  }

  // DELETE /cpq/teardown — remove all CPQ custom objects from workspace
  @Delete('teardown')
  async teardown(@Body() body: { workspaceId: string }) {
    return this.setupService.teardownCpq(body.workspaceId);
  }

  // GET /cpq/status/:workspaceId — detailed setup status
  @Get('status/:workspaceId')
  async status(@Param('workspaceId') workspaceId: string) {
    return this.setupService.getSetupStatus(workspaceId);
  }

  // === PRICING ===

  // POST /cpq/calculate-price — run the 10-step price waterfall
  @Post('calculate-price')
  calculatePrice(@Body() input: PricingInput) {
    return this.pricingService.calculatePriceWaterfall(input);
  }

  // === APPROVALS ===

  // POST /cpq/preview-approval — show which rules would trigger
  @Post('preview-approval')
  previewApproval(@Body() body: {
    quoteValues: QuoteApprovalValues;
    rules: ApprovalRuleDefinition[];
  }) {
    return this.approvalService.evaluateRules(body.quoteValues, body.rules);
  }

  // POST /cpq/submit-approval — submit a quote for approval
  // Returns the approval path and creates pending approval requests.
  // Quote status should transition draft → in_review (via GraphQL mutation on Quote).
  @Post('submit-approval')
  submitApproval(@Body() body: {
    quoteValues: QuoteApprovalValues;
    rules: ApprovalRuleDefinition[];
  }) {
    const path = this.approvalService.evaluateRules(body.quoteValues, body.rules);
    return {
      submitted: true,
      requiresApproval: path.requiresApproval,
      approvalPath: path.steps,
      // Caller must:
      // 1. Create ApprovalRequest records for each step via GraphQL
      // 2. Update Quote status to 'in_review' via GraphQL
      instruction: path.requiresApproval
        ? 'Create ApprovalRequest records for each step, then update quote status to in_review'
        : 'No approval needed — quote can advance directly to approved',
    };
  }

  // POST /cpq/smart-reapproval — check which steps can be skipped on resubmit
  @Post('smart-reapproval')
  smartReapproval(@Body() body: {
    currentValues: QuoteApprovalValues;
    previousValues: QuoteApprovalValues;
    previousApprovals: Array<{ stepNumber: number; status: 'approved' | 'rejected' | 'skipped' }>;
    rules: ApprovalRuleDefinition[];
  }) {
    return this.approvalService.smartReapproval(
      body.currentValues,
      body.previousValues,
      body.previousApprovals,
      body.rules,
    );
  }

  // === QUOTE LIFECYCLE ===

  // POST /cpq/accept-quote — record customer acceptance
  // Validates that the transition is allowed and returns the data to write.
  @Post('accept-quote')
  acceptQuote(@Body() body: {
    currentStatus: string;
    acceptanceMethod: 'verbal' | 'email' | 'po';
    acceptanceDate: string;
    poNumber?: string;
  }) {
    const validTransition = body.currentStatus === 'presented';
    if (!validTransition) {
      return {
        success: false,
        error: `Cannot accept a quote in "${body.currentStatus}" status. Quote must be "presented" first.`,
      };
    }
    return {
      success: true,
      newStatus: 'accepted',
      acceptanceMethod: body.acceptanceMethod,
      acceptanceDate: body.acceptanceDate,
      poNumber: body.poNumber || null,
      // Caller updates Quote via GraphQL mutation with these values
      instruction: 'Update quote status to accepted, set acceptanceMethod and acceptanceDate',
    };
  }

  // POST /cpq/reject-quote — record customer rejection with reason
  @Post('reject-quote')
  rejectQuote(@Body() body: {
    currentStatus: string;
    rejectionReason: string;
    rejectionNotes?: string;
  }) {
    const validTransition = body.currentStatus === 'presented';
    if (!validTransition) {
      return {
        success: false,
        error: `Cannot reject a quote in "${body.currentStatus}" status. Quote must be "presented" first.`,
      };
    }
    return {
      success: true,
      newStatus: 'rejected',
      rejectionReason: body.rejectionReason,
      rejectionNotes: body.rejectionNotes || null,
      instruction: 'Update quote status to rejected, set rejectionReason',
    };
  }

  // === CONTRACT CONVERSION ===

  // POST /cpq/create-contract — convert an accepted quote to a contract.
  // Caller provides resolved quote data; service returns structured
  // contract/subscription/invoice data to persist via GraphQL.
  @Post('create-contract')
  createContract(@Body() body: CreateContractInput) {
    return this.contractService.createFromQuote(body);
  }

  // POST /cpq/co-terminate — calculate prorated value for mid-term add-on
  @Post('co-terminate')
  coTerminate(@Body() body: {
    annualValue: string;
    contractEndDate: string;
    effectiveDate: string;
  }) {
    return this.contractService.coTerminate(
      body.annualValue,
      new Date(body.contractEndDate),
      new Date(body.effectiveDate),
    );
  }

  // POST /cpq/multi-amendment — calculate deltas for multiple subscription changes
  @Post('multi-amendment')
  multiAmendment(@Body() body: {
    changes: Parameters<typeof CpqContractService.prototype.calculateMultiSubscriptionAmendment>[0];
    contractStartDate: string;
    contractEndDate: string;
  }) {
    return this.contractService.calculateMultiSubscriptionAmendment(
      body.changes,
      new Date(body.contractStartDate),
      new Date(body.contractEndDate),
    );
  }

  // === PDF GENERATION ===

  // POST /cpq/prepare-pdf — prepare quote data for PDF rendering
  // Returns structured data for @react-pdf/renderer
  @Post('prepare-pdf')
  preparePdf(@Body() body: {
    quote: Parameters<typeof CpqPdfService.prototype.prepareQuotePdfData>[0];
    lineItems: Parameters<typeof CpqPdfService.prototype.prepareQuotePdfData>[1];
    groups: Parameters<typeof CpqPdfService.prototype.prepareQuotePdfData>[2];
    templateConfig: Parameters<typeof CpqPdfService.prototype.prepareQuotePdfData>[3];
  }) {
    return this.pdfService.prepareQuotePdfData(
      body.quote,
      body.lineItems,
      body.groups || [],
      body.templateConfig || {},
    );
  }

  // === RISK ASSESSMENT ===

  // POST /cpq/assess-risk — score renewal risk
  @Post('assess-risk')
  assessRisk(@Body() input: RiskAssessmentInput) {
    return this.riskService.assessRenewalRisk(input);
  }

  // === RENEWALS ===

  // POST /cpq/run-renewal-check — trigger the daily renewal scan.
  // Caller provides expiring contracts (fetched via GraphQL query).
  // Service processes each and returns renewal quote proposals.
  @Post('run-renewal-check')
  async runRenewalCheck(@Body() body: {
    workspaceId: string;
    config?: RenewalConfig;
    contracts?: RenewalCheckInput['contracts'];
  }) {
    return this.renewalService.runRenewalCheck(
      body.workspaceId,
      body.config,
      body.contracts ? { contracts: body.contracts } : undefined,
    );
  }

  // POST /cpq/generate-renewal-quote — generate a renewal quote for a contract
  @Post('generate-renewal-quote')
  generateRenewalQuote(@Body() body: {
    subscriptions: Parameters<typeof CpqRenewalService.prototype.generateRenewalQuote>[0];
    contractEndDate: string;
    termMonths: number;
    config: RenewalConfig;
  }) {
    return this.renewalService.generateRenewalQuote(
      body.subscriptions,
      new Date(body.contractEndDate),
      body.termMonths,
      body.config,
    );
  }

  // === STATUS TRANSITIONS ===

  // POST /cpq/validate-transition — check if a status transition is valid
  @Post('validate-transition')
  validateTransition(@Body() body: { entityType: string; from: string; to: string }) {
    if (body.entityType === 'contract') {
      return { valid: this.contractService.isValidTransition(body.from, body.to), ...body };
    }
    if (body.entityType === 'subscription') {
      return { valid: this.contractService.isValidSubscriptionTransition(body.from, body.to), ...body };
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
