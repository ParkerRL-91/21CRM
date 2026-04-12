import { NextRequest, NextResponse } from 'next/server';
import { createPriceBookSchema } from '@/lib/cpq/validation';

export async function GET() {
  // TODO: Query price_books table via Drizzle
  return NextResponse.json({ priceBooks: [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createPriceBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // TODO: Insert into price_books table
  return NextResponse.json({ priceBook: { id: 'new', ...parsed.data } }, { status: 201 });
}
