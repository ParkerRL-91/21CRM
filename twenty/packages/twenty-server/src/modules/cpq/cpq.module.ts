import { Module } from '@nestjs/common';

import { CpqPricingService } from 'src/modules/cpq/services/cpq-pricing.service';
import { CpqRenewalService } from 'src/modules/cpq/services/cpq-renewal.service';
import { CpqContractService } from 'src/modules/cpq/services/cpq-contract.service';
import { CpqRiskService } from 'src/modules/cpq/services/cpq-risk.service';

@Module({
  providers: [
    CpqPricingService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
  ],
  exports: [
    CpqPricingService,
    CpqRenewalService,
    CpqContractService,
    CpqRiskService,
  ],
})
export class CpqModule {}
