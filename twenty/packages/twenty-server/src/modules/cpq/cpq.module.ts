import { Module } from '@nestjs/common';

import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';

import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';

// CPQ module — creates native Twenty custom objects for quote-to-cash.
// Objects are bootstrapped via CpqSetupService using Twenty's metadata API,
// which auto-generates tables, GraphQL, record pages, navigation, and search.
// Business logic (pricing, renewals, risk) lives in dedicated services.
@Module({
  imports: [ObjectMetadataModule, FieldMetadataModule],
  providers: [
    CpqSetupService,
    CpqPricingService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
  ],
  exports: [
    CpqSetupService,
    CpqPricingService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
  ],
})
export class CpqModule {}
