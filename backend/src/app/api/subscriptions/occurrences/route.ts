import { NextRequest, NextResponse } from 'next/server'
import { getBillOccurrences } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

// GET /api/subscriptions/occurrences — real, live timeline of upcoming/paid/snoozed bills
export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const occurrences = await getBillOccurrences(userId)
    return NextResponse.json(occurrences)
  } catch (error: any) {
    console.error('Get bill occurrences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bill occurrences' },
      { status: 500 }
    )
  }
})
