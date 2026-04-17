import { Module } from '@nestjs/common';

import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';

import { CpqController } from 'src/modules/cpq/cpq.controller';
import { CpqSetupService } from 'src/modules/cpq/services/cpq-setup.service';
import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqApprovalService } from 'src/modules/cpq/services/cpq-approval.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';
import { CpqPdfService } from 'src/modules/cpq/services/cpq-pdf.service';

// CPQ module — extends Twenty CRM with quote-to-cash functionality.
// Creates 16 native custom objects via metadata API (Product, PriceBook,
// Quote, Contract, Subscription, Amendment, Invoice, Approval, etc.).
// Business logic in services: pricing waterfall, approvals, renewals, risk.
@Module({
  imports: [ObjectMetadataModule, FieldMetadataModule],
  controllers: [CpqController],
  providers: [
    CpqSetupService,
    CpqPricingService,
    CpqApprovalService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
    CpqPdfService,
  ],
  exports: [
    CpqSetupService,
    CpqPricingService,
    CpqApprovalService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
    CpqPdfService,
  ],
})
export class CpqModule {}
