import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getFinancialSummary, computeHealthScore, prisma } from '@/lib/database'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { year, month } = await request.json()

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Valid year and month are required' },
        { status: 400 }
      )
    }

    // Calculate smart score based on financial data (shared formula — see computeHealthScore)
    const summary = await getFinancialSummary(userId, year, month)
    const { score, metrics } = computeHealthScore(summary)

    const smartScore = await prisma.smartScore.upsert({
      where: {
        userId_year_month: { userId, year, month }
      },
      update: {
        score,
        summary: `Financial health score for ${year}-${month.toString().padStart(2, '0')}`,
        metrics
      },
      create: {
        userId,
        year,
        month,
        score,
        summary: `Financial health score for ${year}-${month.toString().padStart(2, '0')}`,
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
