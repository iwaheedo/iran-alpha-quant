import { NextRequest, NextResponse } from 'next/server';

const API_SECRET = process.env.API_SECRET || '';

export function requireAuth(request: NextRequest): NextResponse | null {
  if (!API_SECRET) {
    return null; // No secret configured — skip auth (dev mode)
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // Auth passed
}
