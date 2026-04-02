import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const user = await getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // First check if user exists
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. Please log in again.' },
        { status: 404 }
      )
    }

    const data = await request.json()
    
    // Validate email format if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Validate salary if provided
    if (data.salary !== undefined && (typeof data.salary !== 'number' || data.salary < 0)) {
      return NextResponse.json(
        { error: 'Salary must be a non-negative number' },
        { status: 400 }
      )
    }

    const user = await updateUser(userId, data)
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Update user profile error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found. Please log in again.' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile' },
      { status: 500 }
    )
  }
})