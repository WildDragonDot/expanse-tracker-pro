/**
 * User Registration API Route
 * 
 * Handles new user registration with validation and error handling.
 * Creates a new user account with hashed password and optional billing cycle configuration.
 * 
 * @route POST /api/auth/register
 * @access Public
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/database'

// Force dynamic rendering - authentication endpoint should not be cached
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/register
 * 
 * Register a new user account
 * 
 * @param request - Next.js request object containing user registration data
 * @returns JSON response with user data and JWT token or error message
 * 
 * Request Body:
 * - name: string (required) - User's full name
 * - email: string (required) - User's email address
 * - password: string (required) - User's password (min 6 characters)
 * - salary: number (optional) - User's monthly salary
 * - billingCycleStartDay: number (optional) - Day of month when billing cycle starts (1-31)
 * 
 * Response:
 * - 201: User created successfully with token
 * - 400: Validation error
 * - 409: User already exists
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { name, email, password, salary, billingCycleStartDay } = await request.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate billing cycle start day if provided (must be between 1-31)
    if (billingCycleStartDay !== undefined) {
      const day = parseInt(billingCycleStartDay)
      if (isNaN(day) || day < 1 || day > 31) {
        return NextResponse.json(
          { error: 'Billing cycle start day must be between 1 and 31' },
          { status: 400 }
        )
      }
    }

    // Create user in database (password will be hashed in createUser function)
    const result = await createUser({ 
      name, 
      email, 
      password, 
      salary,
      billingCycleStartDay: billingCycleStartDay ? parseInt(billingCycleStartDay) : 1
    })
    
    // Return success response with user data and JWT token
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Handle duplicate user error
    if (error.message === 'User already exists') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    // Handle other errors
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}