import { NextRequest, NextResponse } from 'next/server'
import { detectSubscriptions } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const subscriptions = await detectSubscriptions(userId)
    return NextResponse.json({ 
      detected: subscriptions.length,
      subscriptions 
    })
  } catch (error: any) {
    console.error('Detect subscriptions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to detect subscriptions' },
      { status: 500 }
    )
  }
})