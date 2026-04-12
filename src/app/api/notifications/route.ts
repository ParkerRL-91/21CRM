import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20');
  // TODO: Query notifications for current user, ordered by created_at DESC
  // Include unread count
  return NextResponse.json({ notifications: [], total: 0, unreadCount: 0 });
}
