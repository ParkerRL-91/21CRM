import { NextRequest, NextResponse } from 'next/server';
import { createContractSchema, listContractsQuerySchema } from '@/lib/contracts/validation';
import { generateContractNumber } from '@/lib/contracts/service';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const query = listContractsQuerySchema.safeParse(params);
  if (!query.success) {
    return NextResponse.json({ error: query.error.flatten() }, { status: 400 });
  }
  // TODO: Query contracts table with Drizzle, compute days_until_expiration
  return NextResponse.json({ contracts: [], total: 0, query: query.data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const contractNumber = generateContractNumber(1); // TODO: DB sequence
  // TODO: Insert contract + subscriptions in transaction
  return NextResponse.json(
    { contract: { id: 'new', contractNumber, ...parsed.data } },
    { status: 201 }
  );
}
