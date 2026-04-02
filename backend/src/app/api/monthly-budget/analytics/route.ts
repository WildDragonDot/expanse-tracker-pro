import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getAuthUser } from '@/lib/auth'
import { getBillingPeriodForMonth } from '@/lib/billingCycle'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get all budgets for the month
    const budgets = await prisma.monthlyBudget.findMany({
      where: {
        userId: user.userId,
        month,
        year
      }
    })

    // Get user's billing cycle to calculate proper date ranges
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { billingCycleStartDay: true }
    })
    const billingDay = userProfile?.billingCycleStartDay || 1

    const period = getBillingPeriodForMonth(month, year, billingDay)

    // Get expenses grouped by category for the billing period
    const expenses = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: user.userId,
        date: {
          gte: period.startDate,
          lte: period.endDate
        }
      },
      _sum: {
        amount: true
      }
    })

    // Combine budget and actual spending
    const analytics = budgets.map(budget => {
      const spent = expenses.find(e => e.category === budget.category)?._sum.amount || 0
      const remaining = budget.amount - spent
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

      return {
        category: budget.category,
        budgeted: budget.amount,
        spent,
        remaining,
        percentage: Math.round(percentage),
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      }
    })

    // Calculate totals
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0)
    const totalSpent = expenses.reduce((sum, e) => sum + (e._sum.amount || 0), 0)

    return NextResponse.json({
      analytics,
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining: totalBudgeted - totalSpent,
        overallPercentage: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0
      }
    })
  } catch (error) {
    console.error('Error fetching budget analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
