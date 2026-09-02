import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getFinancialSummary, computeHealthScore, prisma } from '@/lib/database'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json().catch(() => ({}))
    const { year, month } = body || {}

    let summary: any
    let effectiveYear = year
    let effectiveMonth = month

    if (year && month) {
      if (month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'Valid year and month are required' },
          { status: 400 }
        )
      }
      summary = await getFinancialSummary(userId, year, month)
    } else {
      // Calculate on active billing cycle!
      summary = await getFinancialSummary(userId)
      effectiveYear = summary.billingPeriod.year
      effectiveMonth = summary.billingPeriod.month
    }

    // Calculate smart score based on financial data (shared formula — see computeHealthScore)
    const { score, metrics } = computeHealthScore(summary)

    const smartScore = await prisma.smartScore.upsert({
      where: {
        userId_year_month: { userId, year: effectiveYear, month: effectiveMonth }
      },
      update: {
        score,
        summary: `Financial health score for ${summary.billingPeriod.label}`,
        metrics
      },
      create: {
        userId,
        year: effectiveYear,
        month: effectiveMonth,
        score,
        summary: `Financial health score for ${summary.billingPeriod.label}`,
        metrics
      }
    })

    return NextResponse.json({ score: smartScore })
  } catch (error: any) {
    console.error('Recalculate smart score error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate smart score' },
      { status: 500 }
    )
  }
})
