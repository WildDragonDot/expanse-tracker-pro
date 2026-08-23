import { NextRequest, NextResponse } from 'next/server'
import { deleteSubscription } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

// DELETE /api/subscriptions/[id] — remove a recurring bill rule (and its occurrences)
export const DELETE = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()!
    await deleteSubscription(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete subscription error:', error)
    const status = error.message === 'Recurring bill not found' ? 404 : 500
    return NextResponse.json(
      { error: error.message || 'Failed to delete recurring bill' },
      { status }
    )
  }
})
