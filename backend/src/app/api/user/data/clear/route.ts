import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { sendSecurityAlert } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export const DELETE = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { confirmPassword } = await request.json()

    if (!confirmPassword) {
      return NextResponse.json(
        { error: 'Password confirmation is required' },
        { status: 400 }
      )
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const bcrypt = require('bcryptjs')
    const isValid = await bcrypt.compare(confirmPassword, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Delete all user data (cascade will handle related records)
    // But we'll be explicit for clarity
    await prisma.$transaction([
      // Delete all expenses
      prisma.expense.deleteMany({ where: { userId } }),
      // Delete all incomes
      prisma.income.deleteMany({ where: { userId } }),
      // Delete all udhar
      prisma.udhar.deleteMany({ where: { userId } }),
      // Delete all subscriptions
      prisma.subscription.deleteMany({ where: { userId } }),
      // Delete all expense planning
      prisma.expensePlanning.deleteMany({ where: { userId } }),
      // Delete all planning categories
      prisma.planningCategory.deleteMany({ where: { userId } }),
      // Delete all shopping lists
      prisma.shoppingList.deleteMany({ where: { userId } }),
      // Delete all shopping items
      prisma.shoppingItem.deleteMany({ where: { userId } }),
      // Delete all shopping categories
      prisma.shoppingCategory.deleteMany({ where: { userId } }),
      // Delete all expense categories
      prisma.expenseCategory.deleteMany({ where: { userId } }),
      // Delete all expense banks
      prisma.expenseBank.deleteMany({ where: { userId } }),
      // Delete all smart scores
      prisma.smartScore.deleteMany({ where: { userId } }),
      // Delete all bank accounts and transactions
      prisma.bankTransaction.deleteMany({ 
        where: { 
          bankAccount: { userId } 
        } 
      }),
      prisma.bankAccount.deleteMany({ where: { userId } }),
    ])

    // Send security alert
    try {
      await sendSecurityAlert(userId, {
        title: 'All Data Cleared',
        message: 'All your financial data has been permanently deleted. If this wasn\'t you, please contact support immediately.',
        severity: 'high'
      })
    } catch (notifError) {
      console.error('Failed to send security alert:', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'All data has been cleared successfully',
      deletedRecords: {
        note: 'All expenses, incomes, categories, and related data have been permanently deleted'
      }
    })
  } catch (error: any) {
    console.error('Clear data error:', error)
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    )
  }
})
