import { NextResponse } from 'next/server';

// GET /api/health — Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'The Food Forge',
        timestamp: new Date().toISOString(),
    });
}
