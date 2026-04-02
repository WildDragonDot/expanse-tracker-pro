import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Get 2FA status
export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // For now, return that 2FA is not enabled
    // In production, you'd check the user's 2FA settings
    
    return NextResponse.json({
      enabled: false,
      methods: {
        authenticator: false,
        sms: false
      }
    })
  } catch (error: any) {
    console.error('Get 2FA status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch 2FA status' },
      { status: 500 }
    )
  }
})

// Enable 2FA
export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { method } = await request.json()

    if (!['authenticator', 'sms'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid 2FA method' },
        { status: 400 }
      )
    }

    // In production, you'd:
    // 1. Generate a secret for authenticator
    // 2. Send SMS code for SMS method
    // 3. Store the 2FA settings in database
    
    return NextResponse.json({
      success: true,
      message: '2FA setup initiated',
      // For authenticator, you'd return:
      // secret: 'base32secret',
      // qrCode: 'data:image/png;base64,...'
    })
  } catch (error: any) {
    console.error('Enable 2FA error:', error)
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    )
  }
})

// Disable 2FA
export const DELETE = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // In production, you'd remove 2FA settings from database
    
    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully'
    })
  } catch (error: any) {
    console.error('Disable 2FA error:', error)
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
})
