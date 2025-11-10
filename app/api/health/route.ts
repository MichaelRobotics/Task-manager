import { NextRequest, NextResponse } from 'next/server';

// GET /api/health - Health check endpoint (public, no auth required)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      status: 'ok',
      service: 'task-manager',
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}


