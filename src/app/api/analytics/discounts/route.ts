import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/analytics/discounts
 * Discount analysis: avg/median discount %, distribution, outliers.
 */
export async function GET(req: NextRequest) {
  const groupBy = req.nextUrl.searchParams.get('groupBy') ?? 'product';
  // TODO: Query quote_line_items for discount analytics
  return NextResponse.json({
    metrics: {
      avgDiscountPercent: 0,
      medianDiscountPercent: 0,
      totalDiscountValue: 0,
      distribution: [],
      outliers: [],
    },
  });
}
