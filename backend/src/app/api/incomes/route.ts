import { NextRequest, NextResponse } from 'next/server'
import { createIncome, getIncomes } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const incomes = await getIncomes(userId, filters)
    return NextResponse.json(incomes)
  } catch (error: any) {
    console.error('Get incomes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch incomes' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['date', 'source', 'amount']
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

    const income = await createIncome(userId, data)
    return NextResponse.json(income, { status: 201 })
  } catch (error: any) {
    console.error('Create income error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create income' },
      { status: 500 }
    )
  }
})