import { NextRequest, NextResponse } from 'next/server'
import { createUdhar, getUdhars } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const udhars = await getUdhars(userId)
    return NextResponse.json(udhars)
  } catch (error: any) {
    console.error('Get udhars error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch udhars' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['person', 'total', 'direction']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate amount
    if (typeof data.total !== 'number' || data.total <= 0) {
      return NextResponse.json(
        { error: 'Total must be a positive number' },
        { status: 400 }
      )
    }

    // Validate direction
    if (!['given', 'taken'].includes(data.direction)) {
      return NextResponse.json(
        { error: 'Direction must be either "given" or "taken"' },
        { status: 400 }
      )
    }

    const udhar = await createUdhar(userId, data)
    return NextResponse.json(udhar, { status: 201 })
  } catch (error: any) {
    console.error('Create udhar error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create udhar' },
      { status: 500 }
    )
  }
})