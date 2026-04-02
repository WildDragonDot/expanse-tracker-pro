import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
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

    const score = await prisma.smartScore.findUnique({
      where: { 
        userId_year_month: { userId, year, month } 
      },
    })

    return NextResponse.json({ score })
  } catch (error: any) {
    console.error('Get smart score error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch smart score' },
      { status: 500 }
    )
  }
})
