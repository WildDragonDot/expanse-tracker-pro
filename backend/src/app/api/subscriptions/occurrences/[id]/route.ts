import { NextRequest, NextResponse } from 'next/server'
import { markOccurrencePaid, snoozeOccurrence } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

// PUT /api/subscriptions/occurrences/[id] — mark a bill occurrence as paid.
// Creates a real Expense entry and advances the recurring bill to its next cycle.
export const PUT = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()!

    const data = await request.json().catch(() => ({}))
    const result = await markOccurrencePaid(id, userId, data)

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Mark bill paid error:', error)
    const status = error.message === 'Bill occurrence not found' ? 404 : 400
    return NextResponse.json(
      { error: error.message || 'Failed to mark bill as paid' },
      { status }
    )
  }
})

// PATCH /api/subscriptions/occurrences/[id] — snooze a bill's reminder by N days
export const PATCH = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()!

    const { days } = await request.json().catch(() => ({ days: 3 }))
    const occurrence = await snoozeOccurrence(id, userId, Number(days) || 3)

    return NextResponse.json(occurrence)
  } catch (error: any) {
    console.error('Snooze bill error:', error)
    const status = error.message === 'Bill occurrence not found' ? 404 : 400
    return NextResponse.json(
      { error: error.message || 'Failed to snooze bill reminder' },
      { status }
    )
  }
})
