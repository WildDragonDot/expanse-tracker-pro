import { NextRequest, NextResponse } from 'next/server'
import { getFinancialSummary } from '@/lib/database'
import { withAuth } from '@/lib/auth'

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

    const summary = await getFinancialSummary(userId, year, month)
    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('Get financial summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch financial summary' },
      { status: 500 }
    )
  }
})