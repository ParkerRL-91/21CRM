import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Logger,
  UseGuards,
  Param,
  Query,
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
import { CpqSettingsService } from 'src/modules/cpq/services/cpq-settings.service';
import { CpqProductCatalogService } from 'src/modules/cpq/services/cpq-product-catalog.service';
import { CpqPriceBookService } from 'src/modules/cpq/services/cpq-price-book.service';
import { CpqDiscountScheduleService } from 'src/modules/cpq/services/cpq-discount-schedule.service';
import { CpqApprovalRuleService } from 'src/modules/cpq/services/cpq-approval-rule.service';
import { CpqQuoteTemplateService } from 'src/modules/cpq/services/cpq-quote-template.service';
import { CpqTaxService } from 'src/modules/cpq/services/cpq-tax.service';
import { CpqBundleConfigurationService } from 'src/modules/cpq/services/cpq-bundle-configuration.service';
import { CpqIntegrationService } from 'src/modules/cpq/services/cpq-integration.service';
import { CpqExchangeRateService } from 'src/modules/cpq/services/cpq-exchange-rate.service';

import type { PricingInput } from 'src/modules/cpq/services/cpq-pricing.service';
import type { RiskAssessmentInput } from 'src/modules/cpq/services/cpq-risk.service';
import type { ProductSeedInput } from 'src/modules/cpq/services/cpq-setup.service';
import type { ProductListFilter } from 'src/modules/cpq/services/cpq-product-catalog.service';
import type { DiscountPreviewInput } from 'src/modules/cpq/services/cpq-discount-schedule.service';
import type { ApprovalVariableDto } from 'src/modules/cpq/services/cpq-approval-rule.service';
import type { TaxCalculationInput } from 'src/modules/cpq/services/cpq-tax.service';

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
    private readonly settingsService: CpqSettingsService,
    private readonly productCatalogService: CpqProductCatalogService,
    private readonly priceBookService: CpqPriceBookService,
    private readonly discountScheduleService: CpqDiscountScheduleService,
    private readonly approvalRuleService: CpqApprovalRuleService,
    private readonly quoteTemplateService: CpqQuoteTemplateService,
    private readonly taxService: CpqTaxService,
    private readonly bundleConfigurationService: CpqBundleConfigurationService,
    private readonly integrationService: CpqIntegrationService,
    private readonly exchangeRateService: CpqExchangeRateService,
  ) {}

  // ──────────────────────────────────────────────
  // Setup
  // ──────────────────────────────────────────────

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

  // POST /cpq/seed-catalog — create PriceConfiguration records from product list
  @Post('seed-catalog')
  async seedCatalog(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: { products: ProductSeedInput[] },
  ) {
    this.logger.log(`CPQ seed-catalog requested for workspace ${workspaceId}`);
    return this.setupService.seedProductCatalog(workspaceId, body.products);
  }

  // ──────────────────────────────────────────────
  // Legacy pricing / risk / renewal
  // ──────────────────────────────────────────────

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
        valid: this.contractService.isValidSubscriptionTransition(
          body.from,
          body.to,
        ),
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

  // ──────────────────────────────────────────────
  // TASK-116: Global CPQ Settings
  // ──────────────────────────────────────────────

  @Get('settings')
  async getSettings(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    return this.settingsService.getSettings(workspaceId);
  }

  @Patch('settings')
  async updateSettings(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.settingsService.updateSettings(workspaceId, body);
  }

  @Post('settings/reset')
  async resetSettings(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    return this.settingsService.resetSettings(workspaceId);
  }

  // ──────────────────────────────────────────────
  // TASK-117: Product Catalog
  // ──────────────────────────────────────────────

  @Get('products')
  async listProducts(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Query() filter: ProductListFilter,
  ) {
    return this.productCatalogService.listProducts(workspaceId, filter);
  }

  @Get('products/:id')
  async getProduct(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') productId: string,
  ) {
    return this.productCatalogService.getProduct(workspaceId, productId);
  }

  @Post('products')
  async createProduct(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.productCatalogService.createProduct(workspaceId, body as Parameters<typeof this.productCatalogService.createProduct>[1]);
  }

  @Patch('products/:id')
  async updateProduct(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') productId: string,
    @Body() body: object,
  ) {
    return this.productCatalogService.updateProduct(workspaceId, productId, body);
  }

  @Delete('products/:id')
  async deactivateProduct(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') productId: string,
  ) {
    return this.productCatalogService.deactivateProduct(workspaceId, productId);
  }

  @Post('products/validate-sku')
  async validateSku(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: { sku: string; excludeId?: string },
  ) {
    const error = await this.productCatalogService.validateSkuUnique(
      workspaceId,
      body.sku,
      body.excludeId,
    );
    return { valid: !error, error };
  }

  @Post('products/import')
  async importProducts(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: { items: object[]; dryRun?: boolean },
  ) {
    return this.productCatalogService.bulkImport(
      workspaceId,
      body.items as Parameters<typeof this.productCatalogService.bulkImport>[1],
      body.dryRun,
    );
  }

  // ──────────────────────────────────────────────
  // TASK-118: Price Books
  // ──────────────────────────────────────────────

  @Get('price-books')
  async listPriceBooks(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    return this.priceBookService.listPriceBooks(workspaceId);
  }

  @Get('price-books/:id')
  async getPriceBook(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') bookId: string,
  ) {
    return this.priceBookService.getPriceBook(workspaceId, bookId);
  }

  @Post('price-books')
  async createPriceBook(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.priceBookService.createPriceBook(workspaceId, body as Parameters<typeof this.priceBookService.createPriceBook>[1]);
  }

  @Patch('price-books/:id')
  async updatePriceBook(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') bookId: string,
    @Body() body: object,
  ) {
    return this.priceBookService.updatePriceBook(workspaceId, bookId, body);
  }

  @Get('price-books/:id/entries')
  async listEntries(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') bookId: string,
  ) {
    return this.priceBookService.listEntries(workspaceId, bookId);
  }

  @Post('price-books/:id/entries')
  async createEntry(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') bookId: string,
    @Body() body: object,
  ) {
    return this.priceBookService.createEntry(workspaceId, bookId, body as Parameters<typeof this.priceBookService.createEntry>[2]);
  }

  @Post('price-books/:id/entries/bulk')
  async bulkImportEntries(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') bookId: string,
    @Body() body: { rows: object[] },
  ) {
    return this.priceBookService.bulkImportEntries(workspaceId, bookId, body.rows as Parameters<typeof this.priceBookService.bulkImportEntries>[2]);
  }

  // ──────────────────────────────────────────────
  // TASK-119: Discount Schedules
  // ──────────────────────────────────────────────

  @Get('discount-schedules')
  async listDiscountSchedules(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ) {
    return this.discountScheduleService.listSchedules(workspaceId);
  }

  @Get('discount-schedules/:id')
  async getDiscountSchedule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') scheduleId: string,
  ) {
    return this.discountScheduleService.getSchedule(workspaceId, scheduleId);
  }

  @Post('discount-schedules')
  async createDiscountSchedule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.discountScheduleService.createSchedule(workspaceId, body as Parameters<typeof this.discountScheduleService.createSchedule>[1]);
  }

  @Patch('discount-schedules/:id')
  async updateDiscountSchedule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') scheduleId: string,
    @Body() body: object,
  ) {
    return this.discountScheduleService.updateSchedule(workspaceId, scheduleId, body);
  }

  @Post('discount-schedules/:id/preview')
  async previewDiscount(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') scheduleId: string,
    @Body() body: DiscountPreviewInput,
  ) {
    const schedule = await this.discountScheduleService.getSchedule(
      workspaceId,
      scheduleId,
    );
    if (!schedule) {
      return { error: `Schedule ${scheduleId} not found` };
    }
    return this.discountScheduleService.previewDiscount(body, schedule);
  }

  // ──────────────────────────────────────────────
  // TASK-121: Approval Rules
  // ──────────────────────────────────────────────

  @Get('approval-rules')
  async listApprovalRules(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ) {
    return this.approvalRuleService.listRules(workspaceId);
  }

  @Get('approval-rules/:id')
  async getApprovalRule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') ruleId: string,
  ) {
    return this.approvalRuleService.getRule(workspaceId, ruleId);
  }

  @Post('approval-rules')
  async createApprovalRule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.approvalRuleService.createRule(workspaceId, body as Parameters<typeof this.approvalRuleService.createRule>[1]);
  }

  @Patch('approval-rules/:id')
  async updateApprovalRule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') ruleId: string,
    @Body() body: object,
  ) {
    return this.approvalRuleService.updateRule(workspaceId, ruleId, body);
  }

  @Post('approval-rules/simulate')
  async simulateApproval(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: ApprovalVariableDto,
  ) {
    return this.approvalRuleService.simulateApproval(workspaceId, body);
  }

  // ──────────────────────────────────────────────
  // TASK-122: Quote Templates
  // ──────────────────────────────────────────────

  @Get('quote-templates')
  async listQuoteTemplates(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ) {
    return this.quoteTemplateService.listTemplates(workspaceId);
  }

  @Get('quote-templates/:id')
  async getQuoteTemplate(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') templateId: string,
  ) {
    return this.quoteTemplateService.getTemplate(workspaceId, templateId);
  }

  @Post('quote-templates')
  async createQuoteTemplate(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.quoteTemplateService.createTemplate(workspaceId, body as Parameters<typeof this.quoteTemplateService.createTemplate>[1]);
  }

  @Patch('quote-templates/:id')
  async updateQuoteTemplate(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') templateId: string,
    @Body() body: object,
  ) {
    return this.quoteTemplateService.updateTemplate(workspaceId, templateId, body);
  }

  @Post('quote-templates/:id/clone')
  async cloneQuoteTemplate(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') templateId: string,
    @Body() body: { newName: string },
  ) {
    return this.quoteTemplateService.cloneTemplate(
      workspaceId,
      templateId,
      body.newName,
    );
  }

  // ──────────────────────────────────────────────
  // TASK-123: Tax Configuration
  // ──────────────────────────────────────────────

  @Get('tax-rules')
  async listTaxRules(@AuthWorkspace() { id: workspaceId }: WorkspaceEntity) {
    return this.taxService.listRules(workspaceId);
  }

  @Post('tax-rules')
  async createTaxRule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.taxService.createRule(workspaceId, body as Parameters<typeof this.taxService.createRule>[1]);
  }

  @Patch('tax-rules/:id')
  async updateTaxRule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') ruleId: string,
    @Body() body: object,
  ) {
    return this.taxService.updateRule(workspaceId, ruleId, body);
  }

  @Delete('tax-rules/:id')
  async deleteTaxRule(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('id') ruleId: string,
  ) {
    await this.taxService.deleteRule(workspaceId, ruleId);
    return { deleted: true, id: ruleId };
  }

  @Post('tax/calculate')
  async calculateTax(
    @AuthWorkspace() _workspace: WorkspaceEntity,
    @Body() body: TaxCalculationInput,
  ) {
    return this.taxService.calculate(body);
  }

  // ──────────────────────────────────────────────
  // TASK-124: Bundle Configuration
  // ──────────────────────────────────────────────

  @Get('bundles/:productId/configuration')
  async getBundleConfiguration(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('productId') productId: string,
  ) {
    return this.bundleConfigurationService.getBundleConfiguration(
      workspaceId,
      productId,
    );
  }

  @Post('bundles/:productId/configuration')
  async saveBundleConfiguration(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('productId') productId: string,
    @Body() body: object,
  ) {
    return this.bundleConfigurationService.saveBundleConfiguration(
      workspaceId,
      productId,
      body as Parameters<typeof this.bundleConfigurationService.saveBundleConfiguration>[2],
    );
  }

  @Post('bundles/validate')
  async validateBundleConfiguration(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: { selectedSkus: string[]; quantityMap: Record<string, number> },
  ) {
    return this.bundleConfigurationService.validateConfiguration(
      workspaceId,
      body.selectedSkus,
      body.quantityMap,
    );
  }

  @Post('bundles/apply-selection-rules')
  async applySelectionRules(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: { newlySelectedSku: string; currentSkus: string[] },
  ) {
    return this.bundleConfigurationService.applySelectionRules(
      workspaceId,
      body.newlySelectedSku,
      body.currentSkus,
    );
  }

  // ──────────────────────────────────────────────
  // TASK-125: Integration Settings
  // ──────────────────────────────────────────────

  @Get('integrations/config')
  async getIntegrationConfig(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ) {
    return this.integrationService.getMaskedConfig(workspaceId);
  }

  @Patch('integrations/config')
  async updateIntegrationConfig(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    await this.integrationService.updateConfig(workspaceId, body as Parameters<typeof this.integrationService.updateConfig>[1]);
    return this.integrationService.getMaskedConfig(workspaceId);
  }

  @Get('integrations/status')
  async getIntegrationStatus(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ) {
    return this.integrationService.getStatusCards(workspaceId);
  }

  @Post('integrations/test/:provider')
  async testIntegrationConnection(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Param('provider') provider: 'docusign' | 'stripe' | 'chargebee' | 'taxjar' | 'avalara',
  ) {
    return this.integrationService.testConnection(workspaceId, provider);
  }

  @Get('integrations/webhook-log')
  async getWebhookLog(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Query('limit') limit?: string,
  ) {
    return this.integrationService.getWebhookLog(
      workspaceId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ──────────────────────────────────────────────
  // TASK-146: Exchange Rates
  // ──────────────────────────────────────────────

  @Get('exchange-rates')
  async listExchangeRates(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ) {
    return this.exchangeRateService.listActiveRates(workspaceId);
  }

  @Get('exchange-rates/history')
  async getExchangeRateHistory(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Query('baseCurrency') baseCurrency: string,
    @Query('targetCurrency') targetCurrency: string,
  ) {
    return this.exchangeRateService.getRateHistory(
      workspaceId,
      baseCurrency,
      targetCurrency,
    );
  }

  @Post('exchange-rates')
  async setExchangeRate(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: object,
  ) {
    return this.exchangeRateService.setRate(workspaceId, body as Parameters<typeof this.exchangeRateService.setRate>[1]);
  }

  @Post('exchange-rates/check-missing')
  async checkMissingRates(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body() body: { currencies: string[] },
  ) {
    const missing = await this.exchangeRateService.getMissingRateWarnings(
      workspaceId,
      body.currencies,
    );
    return { missing };
  }

  @Post('exchange-rates/convert')
  async convertAmount(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
    @Body()
    body: {
      amount: number;
      fromCurrency: string;
      toCurrency: string;
    },
  ) {
    return this.exchangeRateService.convertAmount(
      workspaceId,
      body.amount,
      body.fromCurrency,
      body.toCurrency,
    );
  }
}
