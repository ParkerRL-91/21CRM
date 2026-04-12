import { NextRequest, NextResponse } from 'next/server';
import { createQuoteSchema } from '@/lib/cpq/validation';
import { generateQuoteNumber } from '@/lib/contracts/service';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  // TODO: Query quotes table with filters (status, account, type, rep)
  return NextResponse.json({ quotes: [], total: 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const quoteNumber = generateQuoteNumber(1); // TODO: use DB sequence
  // TODO: Insert quote with auto-generated number, default expiration (30 days)
  return NextResponse.json(
    { quote: { id: 'new', quoteNumber, ...parsed.data } },
    { status: 201 }
  );
}
