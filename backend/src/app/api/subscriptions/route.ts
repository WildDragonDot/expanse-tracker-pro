import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptions } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const subscriptions = await getSubscriptions(userId)
    return NextResponse.json(subscriptions)
  } catch (error: any) {
    console.error('Get subscriptions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
})