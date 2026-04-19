import { Module } from '@nestjs/common';

import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';

import { CpqController } from 'src/modules/cpq/cpq.controller';
import { CpqResolver } from 'src/modules/cpq/cpq.resolver';
import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';
import { CpqSettingsService } from 'src/modules/cpq/services/cpq-settings.service';
// Phase 1 services — admin configuration
import { CpqProductCatalogService } from 'src/modules/cpq/services/cpq-product-catalog.service';
import { CpqPriceBookService } from 'src/modules/cpq/services/cpq-price-book.service';
import { CpqDiscountScheduleService } from 'src/modules/cpq/services/cpq-discount-schedule.service';
import { CpqApprovalRuleService } from 'src/modules/cpq/services/cpq-approval-rule.service';
import { CpqQuoteTemplateService } from 'src/modules/cpq/services/cpq-quote-template.service';
import { CpqTaxService } from 'src/modules/cpq/services/cpq-tax.service';
import { CpqBundleConfigurationService } from 'src/modules/cpq/services/cpq-bundle-configuration.service';
import { CpqIntegrationService } from 'src/modules/cpq/services/cpq-integration.service';
import { CpqExchangeRateService } from 'src/modules/cpq/services/cpq-exchange-rate.service';

// CPQ module — extends Twenty CRM with quote-to-cash functionality.
// Uses Twenty's metadata API to create native custom objects (Quote,
// Contract, Subscription, etc.) that get automatic CRUD, GraphQL,
// record pages, navigation, and search.
// Custom business logic (pricing, renewals, risk) exposed via controller and resolver.
@Module({
  imports: [
    ObjectMetadataModule,
    FieldMetadataModule,
    TokenModule,
    WorkspaceCacheStorageModule,
  ],
  controllers: [CpqController],
  providers: [
    CpqResolver,
    CpqSetupService,
    CpqPricingService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
    CpqSettingsService,
    // Phase 1 — admin configuration services
    CpqProductCatalogService,
    CpqPriceBookService,
    CpqDiscountScheduleService,
    CpqApprovalRuleService,
    CpqQuoteTemplateService,
    CpqTaxService,
    CpqBundleConfigurationService,
    CpqIntegrationService,
    CpqExchangeRateService,
  ],
  exports: [
    CpqSetupService,
    CpqPricingService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
    CpqSettingsService,
    CpqProductCatalogService,
    CpqPriceBookService,
    CpqDiscountScheduleService,
    CpqApprovalRuleService,
    CpqQuoteTemplateService,
    CpqTaxService,
    CpqBundleConfigurationService,
    CpqIntegrationService,
    CpqExchangeRateService,
  ],
})
export class CpqModule {}
