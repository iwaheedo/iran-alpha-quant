import { NextResponse } from 'next/server';
import { isDbHealthy } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    db: isDbHealthy(),
    timestamp: new Date().toISOString(),
  });
}
