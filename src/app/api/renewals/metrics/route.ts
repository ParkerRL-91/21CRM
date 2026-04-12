import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/renewals/metrics?period=Q2-2026
 * Returns renewal pipeline metrics: total renewable, renewed, churned,
 * at-risk, NRR, GRR, monthly trend data.
 */
export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period');

  // TODO: Query contract_renewals + contracts to compute:
  // - totalRenewableValue, totalRenewedValue, totalChurnedValue, totalAtRiskValue
  // - grossRenewalRate, netRevenueRetention, grossRevenueRetention
  // - Monthly trend (last 12 months)
  // Use calculateARRWaterfall() from quote-to-contract.ts for NRR calculation

  return NextResponse.json({
    metrics: {
      totalRenewableValue: 0,
      totalRenewedValue: 0,
      totalChurnedValue: 0,
      totalAtRiskValue: 0,
      pendingRenewalValue: 0,
      grossRenewalRate: 0,
      netRevenueRetention: 0,
      grossRevenueRetention: 0,
      totalRenewableContracts: 0,
      renewedContracts: 0,
      churnedContracts: 0,
      atRiskContracts: 0,
      pendingContracts: 0,
      monthlyTrend: [],
    },
  });
}
