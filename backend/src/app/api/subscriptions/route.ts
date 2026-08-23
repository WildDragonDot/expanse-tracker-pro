import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptions, createSubscription } from '@/lib/database'
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

// POST /api/subscriptions — create a new recurring bill rule (mobile "Add Bill" flow)
export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json()
    const { title, amount, category, frequency, nextDueDate } = body

    if (!title || !amount || !frequency || !nextDueDate) {
      return NextResponse.json(
        { error: 'title, amount, frequency and nextDueDate are required' },
        { status: 400 }
      )
    }

    const subscription = await createSubscription(userId, {
      title,
      amount: Number(amount),
      category: category || 'General',
      frequency,
      nextDueDate,
      reminderDays: body.reminderDays,
      isAutoDebit: body.isAutoDebit,
      isTrial: body.isTrial,
      trialEndDate: body.trialEndDate,
      notes: body.notes,
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error: any) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create recurring bill' },
      { status: 500 }
    )
  }
})