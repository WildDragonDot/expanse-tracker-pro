import { NextRequest, NextResponse } from 'next/server'
import { generateMonthlyReport } from '@/lib/database'
import { withAuth } from '@/lib/auth'

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

    const result = await generateMonthlyReport(userId, year, month)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Generate monthly report error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate monthly report' },
      { status: 500 }
    )
  }
})