import { NextResponse } from 'next/server';

// Lightweight ALB target health check; it confirms the app server is responding.
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
