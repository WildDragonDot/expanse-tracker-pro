import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/database'

// Force dynamic rendering - authentication endpoint
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, salary, billingCycleStartDay } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Basic password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate billing cycle start day if provided
    if (billingCycleStartDay !== undefined) {
      const day = parseInt(billingCycleStartDay)
      if (isNaN(day) || day < 1 || day > 31) {
        return NextResponse.json(
          { error: 'Billing cycle start day must be between 1 and 31' },
          { status: 400 }
        )
      }
    }

    const result = await createUser({ 
      name, 
      email, 
      password, 
      salary,
      billingCycleStartDay: billingCycleStartDay ? parseInt(billingCycleStartDay) : 1
    })
    
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    if (error.message === 'User already exists') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}