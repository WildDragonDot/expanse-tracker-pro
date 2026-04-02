import { NextRequest, NextResponse } from 'next/server'
import { createExpense, getExpenses } from '@/lib/database'
import { withAuth } from '@/lib/auth'
import { sendExpenseAlert } from '@/lib/notifications'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      category: searchParams.get('category') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const expenses = await getExpenses(userId, filters)
    return NextResponse.json(expenses)
  } catch (error: any) {
    console.error('Get expenses error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['date', 'title', 'amount', 'category', 'bank', 'paymentMode']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate amount
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Ensure tags is an array
    if (!Array.isArray(data.tags)) {
      data.tags = []
    }

    const expense = await createExpense(userId, data)
    
    // Send expense alert notification if enabled
    try {
      await sendExpenseAlert(userId, {
        title: data.title,
        amount: data.amount,
        category: data.category
      })
    } catch (notifError) {
      // Don't fail the request if notification fails
      console.error('Failed to send expense notification:', notifError)
    }
    
    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    console.error('Create expense error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
})