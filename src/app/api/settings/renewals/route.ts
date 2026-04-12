import { NextRequest, NextResponse } from 'next/server';
import { renewalConfigSchema } from '@/lib/contracts/validation';

export async function GET() {
  // TODO: Fetch renewal_config for current org
  return NextResponse.json({
    config: {
      defaultLeadDays: 90,
      defaultPricingMethod: 'same_price',
      defaultUpliftPercentage: 3.0,
      renewalDealPrefix: 'Renewal:',
      notifyOwnerOnCreation: true,
      notifyAdditionalUsers: [],
      jobEnabled: true,
      jobLastRunAt: null,
      jobLastResult: null,
    },
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = renewalConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // TODO: Update renewal_config for current org
  return NextResponse.json({ config: parsed.data });
}
