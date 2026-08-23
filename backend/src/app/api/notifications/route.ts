import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authUser.userId

    const notifications: Array<{
      id: string
      type: 'bill' | 'budget' | 'udhar' | 'report' | 'system' | 'tip'
      title: string
      message: string
      createdAt: string
      read: boolean
      priority: 'high' | 'medium' | 'low'
      actionScreen?: string
      actionParams?: any
      metadata?: any
    }> = []

    const now = new Date()
    const currentMonthNum = now.getMonth() + 1
    const currentYearNum = now.getFullYear()

    // 1. Check Subscriptions & Recurring Bills (Due within 7 days or overdue)
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, active: true },
    })

    for (const sub of subscriptions) {
      if (sub.nextDueDate) {
        const nextDate = new Date(sub.nextDueDate)
        const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          notifications.push({
            id: `bill-overdue-${sub.id}`,
            type: 'bill',
            title: `Bill Overdue: ${sub.name}`,
            message: `${sub.name} payment of ₹${sub.amount.toLocaleString()} was due ${Math.abs(diffDays)} days ago. Tap to mark paid.`,
            createdAt: sub.createdAt.toISOString(),
            read: false,
            priority: 'high',
            actionScreen: 'Subscriptions',
            metadata: { subscriptionId: sub.id, amount: sub.amount },
          })
        } else if (diffDays === 0) {
          notifications.push({
            id: `bill-today-${sub.id}`,
            type: 'bill',
            title: `Bill Due Today: ${sub.name}`,
            message: `${sub.name} payment of ₹${sub.amount.toLocaleString()} is scheduled for today.`,
            createdAt: now.toISOString(),
            read: false,
            priority: 'high',
            actionScreen: 'Subscriptions',
            metadata: { subscriptionId: sub.id, amount: sub.amount },
          })
        } else if (diffDays <= 7) {
          notifications.push({
            id: `bill-upcoming-${sub.id}`,
            type: 'bill',
            title: `Upcoming Payment: ${sub.name}`,
            message: `₹${sub.amount.toLocaleString()} due in ${diffDays} days (${nextDate.toLocaleDateString([], { day: 'numeric', month: 'short' })}).`,
            createdAt: sub.createdAt.toISOString(),
            read: false,
            priority: 'medium',
            actionScreen: 'Subscriptions',
            metadata: { subscriptionId: sub.id, amount: sub.amount },
          })
        }
      }
    }

    // 2. Check Monthly Budget Category Alerts
    const budgets = await prisma.monthlyBudget.findMany({
      where: { userId, month: currentMonthNum, year: currentYearNum },
    })

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const expensesThisMonth = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    const spentByCategory: Record<string, number> = {}
    for (const exp of expensesThisMonth) {
      spentByCategory[exp.category] = (spentByCategory[exp.category] || 0) + exp.amount
    }

    for (const b of budgets) {
      const spent = spentByCategory[b.category] || b.spent || 0
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0

      if (pct >= 100) {
        notifications.push({
          id: `budget-exceeded-${b.id}`,
          type: 'budget',
          title: `Budget Exceeded: ${b.category}`,
          message: `You've spent ₹${spent.toLocaleString()} (${Math.round(pct)}%) of your ₹${b.amount.toLocaleString()} ${b.category} budget.`,
          createdAt: now.toISOString(),
          read: false,
          priority: 'high',
          actionScreen: 'Budget',
        })
      } else if (pct >= 80) {
        notifications.push({
          id: `budget-warning-${b.id}`,
          type: 'budget',
          title: `Budget Warning: ${b.category}`,
          message: `You've reached ${Math.round(pct)}% (₹${spent.toLocaleString()} / ₹${b.amount.toLocaleString()}) of your budget.`,
          createdAt: now.toISOString(),
          read: false,
          priority: 'medium',
          actionScreen: 'Budget',
        })
      }
    }

    // 3. Check Pending Udhar / Debt Ledger
    const udharEntries = await prisma.udhar.findMany({
      where: { userId, remaining: { gt: 0 } },
    })

    for (const u of udharEntries) {
      if (u.dueDate) {
        const dueDate = new Date(u.dueDate)
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays <= 3) {
          const isLent = u.direction === 'given'
          notifications.push({
            id: `udhar-${u.id}`,
            type: 'udhar',
            title: isLent ? `Payment Due from ${u.person}` : `Payment Due to ${u.person}`,
            message: `${isLent ? 'Receive' : 'Pay'} ₹${u.remaining.toLocaleString()} ${diffDays <= 0 ? 'is overdue' : `due in ${diffDays} days`}.`,
            createdAt: u.createdAt.toISOString(),
            read: false,
            priority: diffDays <= 0 ? 'high' : 'medium',
            actionScreen: 'Udhar',
          })
        }
      }
    }

    // 4. Financial Tip / Welcome Notification
    if (notifications.length === 0) {
      notifications.push({
        id: 'system-welcome-tip',
        type: 'tip',
        title: 'All Systems Optimal 🎉',
        message: 'Your budgets and bills are under control! Keep tracking expenses daily for high financial health score.',
        createdAt: now.toISOString(),
        read: true,
        priority: 'low',
        actionScreen: 'AI Advisor',
      })
    }

    return NextResponse.json({
      success: true,
      unreadCount: notifications.filter((n) => !n.read).length,
      notifications,
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    )
  }
}
