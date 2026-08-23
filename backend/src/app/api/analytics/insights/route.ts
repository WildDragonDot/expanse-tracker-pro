import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsInsights } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

// GET /api/analytics/insights?months=6 — everything the mobile Analytics tab charts need,
// all derived from real Expense/Income/MonthlyBudget rows.
export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const months = Math.min(12, Math.max(1, parseInt(searchParams.get('months') || '6')))

    const insights = await getAnalyticsInsights(userId, months)
    return NextResponse.json(insights)
  } catch (error: any) {
    console.error('Get analytics insights error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics insights' },
      { status: 500 }
    )
  }
})
