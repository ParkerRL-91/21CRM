import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/subscriptions/metrics
 * Returns subscription portfolio metrics: total active, ARR, MRR,
 * ARR by product, expiring subscriptions, NRR.
 */
export async function GET() {
  // TODO: Query contract_subscriptions to compute:
  // - Total active count, total ARR, total MRR
  // - ARR by product (group by product_name)
  // - Expiring in 30/60/90 days
  // - Net revenue retention rate
  return NextResponse.json({
    metrics: {
      totalActive: 0,
      totalARR: 0,
      totalMRR: 0,
      arrByProduct: [],
      expiringIn30: 0,
      expiringIn60: 0,
      expiringIn90: 0,
      netRevenueRetention: 0,
    },
  });
}
