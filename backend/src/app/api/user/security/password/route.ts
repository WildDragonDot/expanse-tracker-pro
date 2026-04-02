import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { updateUserPassword } from '@/lib/database'
import { sendSecurityAlert } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export const PUT = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { currentPassword, newPassword } = await request.json()

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Update password
    try {
      await updateUserPassword(userId, currentPassword, newPassword)
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }
      throw error
    }

    // Send security alert
    try {
      await sendSecurityAlert(userId, {
        title: 'Password Changed',
        message: 'Your password was successfully changed. If this wasn\'t you, please contact support immediately.',
        severity: 'medium'
      })
    } catch (notifError) {
      console.error('Failed to send security alert:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error: any) {
    console.error('Password update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    )
  }
})
