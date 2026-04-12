import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/analytics/quotes
 * Quote activity metrics: created, sent, accepted, rejected by period and rep.
 */
export async function GET(req: NextRequest) {
  const dateFrom = req.nextUrl.searchParams.get('dateFrom');
  const dateTo = req.nextUrl.searchParams.get('dateTo');
  const repId = req.nextUrl.searchParams.get('repId');

  // TODO: Query quotes table with date/rep filters
  return NextResponse.json({
    metrics: {
      created: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      conversionRate: 0,
      avgDealSize: 0,
      avgDiscountPercent: 0,
      avgCycleDays: 0,
    },
  });
}
