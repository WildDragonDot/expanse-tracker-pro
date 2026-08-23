import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'
import { calculateSmartScore } from '@/lib/smartScore'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month' },
        { status: 400 }
      )
    }

    // Always compute real-time score dynamically from current user data
    const { score, summary, metrics } = await calculateSmartScore(userId, year, month)

    // Save to database cache
    const saved = await prisma.smartScore.upsert({
      where: {
        userId_year_month: { userId, year, month },
      },
      create: {
        userId,
        year,
        month,
        score,
        summary,
        metrics: metrics as any,
      },
      update: {
        score,
        summary,
        metrics: metrics as any,
      },
    })

    return NextResponse.json({ score: saved })
  } catch (error: any) {
    console.error('Get smart score error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch smart score' },
      { status: 500 }
    )
  }
})
