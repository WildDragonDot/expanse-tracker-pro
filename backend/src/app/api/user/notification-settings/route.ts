import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Default notification settings
const defaultSettings = {
  pushNotifications: true,
  emailNotifications: true,
  expenseAlerts: true,
  budgetWarnings: true,
  weeklyReports: false,
  monthlyReports: true,
  transactionUpdates: true,
  securityAlerts: true,
}

// GET notification settings
export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return stored settings or defaults
    const settings = user.notificationSettings || defaultSettings

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Get notification settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
})

// PUT/Update notification settings
export const PUT = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const settings = await request.json()

    // Validate settings structure
    const validKeys = [
      'pushNotifications',
      'emailNotifications',
      'expenseAlerts',
      'budgetWarnings',
      'weeklyReports',
      'monthlyReports',
      'transactionUpdates',
      'securityAlerts',
    ]

    const isValid = Object.keys(settings).every(key => validKeys.includes(key))
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    // Update user notification settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: settings },
      select: { notificationSettings: true }
    })

    return NextResponse.json({ 
      success: true,
      settings: updatedUser.notificationSettings 
    })
  } catch (error: any) {
    console.error('Update notification settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
})
