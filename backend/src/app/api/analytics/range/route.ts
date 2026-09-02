import { NextRequest, NextResponse } from 'next/server'
import { getRangeSummary, prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'
import { getCurrentBillingPeriod } from '@/lib/billingCycle'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

// GET /api/analytics/range?range=month|quarter|ytd|cycle — real summary over a preset window,
// for the mobile Reports tab (which lets the user pick one of these periods).
export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'cycle'

    const fromParam = searchParams.get('from') || searchParams.get('startDate')
    const toParam = searchParams.get('to') || searchParams.get('endDate')

    const now = new Date()
    let startDate: Date
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (fromParam) {
      startDate = new Date(fromParam)
      startDate.setHours(0, 0, 0, 0)
      if (toParam) {
        endDate = new Date(toParam)
        endDate.setHours(23, 59, 59, 999)
      }
    } else if (range === 'quarter') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 89)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'ytd') {
      startDate = new Date(now.getFullYear(), 0, 1)
    } else {
      // 'cycle' or 'month' -> use user's configured billing cycle
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { billingCycleStartDay: true },
      })
      const billingDay = user?.billingCycleStartDay || 1
      const period = getCurrentBillingPeriod(billingDay, now)
      startDate = period.startDate
      endDate = period.endDate
    }

    const summary = await getRangeSummary(userId, startDate, endDate)
    return NextResponse.json({ ...summary, range, startDate, endDate })
  } catch (error: any) {
    console.error('Get range summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch range summary' },
      { status: 500 }
    )
  }
})
