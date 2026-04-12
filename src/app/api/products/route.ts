import { NextRequest, NextResponse } from 'next/server';
import { createProductSchema, listProductsQuerySchema } from '@/lib/cpq/validation';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const query = listProductsQuerySchema.safeParse(params);
  if (!query.success) {
    return NextResponse.json({ error: query.error.flatten() }, { status: 400 });
  }
  // TODO: Wire to database query with Drizzle
  return NextResponse.json({ products: [], total: 0, query: query.data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // TODO: Insert into products table via Drizzle
  return NextResponse.json({ product: { id: 'new', ...parsed.data } }, { status: 201 });
}
