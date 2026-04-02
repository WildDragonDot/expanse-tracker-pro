import { NextRequest, NextResponse } from 'next/server'
import { updateUdhar, deleteUdhar } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const PUT = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()!
    
    const data = await request.json()
    
    // Validate amount if provided
    if (data.total !== undefined && (typeof data.total !== 'number' || data.total <= 0)) {
      return NextResponse.json(
        { error: 'Total must be a positive number' },
        { status: 400 }
      )
    }

    if (data.remaining !== undefined && (typeof data.remaining !== 'number' || data.remaining < 0)) {
      return NextResponse.json(
        { error: 'Remaining must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate direction if provided
    if (data.direction !== undefined && !['given', 'taken'].includes(data.direction)) {
      return NextResponse.json(
        { error: 'Direction must be either "given" or "taken"' },
        { status: 400 }
      )
    }

    const udhar = await updateUdhar(id, userId, data)
    return NextResponse.json(udhar)
  } catch (error: any) {
    console.error('Update udhar error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Udhar not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update udhar' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()!
    
    await deleteUdhar(id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete udhar error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Udhar not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete udhar' },
      { status: 500 }
    )
  }
})