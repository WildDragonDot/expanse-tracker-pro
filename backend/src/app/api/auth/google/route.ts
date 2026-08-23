/**
 * Google Sign-In API Route
 *
 * Verifies a Google ID token (issued by the mobile app's native Google Sign-In
 * flow) directly with Google, then finds-or-creates the matching user account
 * and issues the same kind of JWT the password login/register routes issue.
 *
 * @route POST /api/auth/google
 * @access Public
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateGoogleUser } from '@/lib/database'

// Force dynamic rendering - authentication endpoint should not be cached
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/google
 *
 * Request Body:
 * - idToken: string (required) - Google ID token from GoogleSignin.signIn()
 *
 * Response:
 * - 200: Authenticated (existing or newly linked account) with token
 * - 400: Missing idToken
 * - 401: Google token invalid/expired/not issued for this app
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
    }

    const result = await authenticateGoogleUser(idToken)
    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Google sign-in error:', error)

    const message = error?.message || 'Google sign-in failed'
    const isAuthError = /Invalid|expired|not issued|not verified/i.test(message)

    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 500 })
  }
}
