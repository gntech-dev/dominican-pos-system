// Placeholder API route for dashboard stats
// This endpoint is reserved for future implementation

import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Dashboard stats endpoint not yet implemented'
  }, { status: 501 })
}
