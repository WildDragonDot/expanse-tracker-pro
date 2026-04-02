import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Get active sessions
export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // For now, return mock data
    // In production, you'd store sessions in Redis or database
    const sessions = [
      {
        id: '1',
        device: 'Current Device',
        location: 'Unknown',
        lastActive: 'Now',
        current: true,
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
      }
    ]

    return NextResponse.json({ sessions })
  } catch (error: any) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
})

// Revoke a session
export const DELETE = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // In production, you'd delete the session from Redis/database
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully'
    })
  } catch (error: any) {
    console.error('Revoke session error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
})
