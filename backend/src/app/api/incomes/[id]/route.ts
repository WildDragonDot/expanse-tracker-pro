import { NextRequest, NextResponse } from 'next/server'
import { updateIncome, deleteIncome } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const PUT = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()!
    
    const data = await request.json()
    
    // Validate amount if provided
    if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    const income = await updateIncome(id, userId, data)
    return NextResponse.json(income)
  } catch (error: any) {
    console.error('Update income error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Income not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update income' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()!
    
    await deleteIncome(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete income error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Income not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete income' },
      { status: 500 }
    )
  }
})