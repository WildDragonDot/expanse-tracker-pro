import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getAuthUser } from '@/lib/auth'
import { getCurrentBillingPeriod, getBillingPeriodForMonth } from '@/lib/billingCycle'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '12')
    const specificMonth = parseInt(searchParams.get('month') || '0')
    const specificYear = parseInt(searchParams.get('year') || '0')

    // Get user's billing cycle
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { billingCycleStartDay: true }
    })
    const billingDay = userProfile?.billingCycleStartDay || 1

    // Get current billing period
    const currentPeriod = getCurrentBillingPeriod(billingDay)

    let whereClause: any = {
      userId: user.userId,
      isActive: true
    }

    if (category) {
      whereClause.category = category
    }

    // If specific month/year requested, get only that month
    if (specificMonth > 0 && specificYear > 0) {
      whereClause.month = specificMonth
      whereClause.year = specificYear
    } else {
      // Get all months before current month
      whereClause.OR = [
        { year: { lt: currentPeriod.year } },
        {
          year: currentPeriod.year,
          month: { lt: currentPeriod.month }
        }
      ]
    }

    // Get all budgets for past months
    const budgets = await prisma.monthlyBudget.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { category: 'asc' }
      ],
      take: specificMonth > 0 ? undefined : limit * 10 // Allow more budgets for grouping
    })

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        // Calculate billing period dates for this budget's month/year
        const period = getBillingPeriodForMonth(budget.month, budget.year, billingDay)
        
        const spent = await prisma.expense.aggregate({
          where: {
            userId: user.userId,
            category: budget.category,
            date: {
              gte: period.startDate,
              lte: period.endDate
            }
          },
          _sum: {
            amount: true
          }
        })

        const spentAmount = spent._sum.amount || 0
        const remaining = budget.amount - spentAmount
        const percentage = budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0
        const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'

        return {
          id: budget.id,
          category: budget.category,
          month: budget.month,
          year: budget.year,
          budgetedAmount: budget.amount,
          spentAmount,
          remainingAmount: remaining,
          percentage,
          status,
          createdAt: budget.createdAt
        }
      })
    )

    // Group by month-year
    const grouped = budgetsWithSpent.reduce((acc: any, item) => {
      const key = `${item.month}-${item.year}`
      if (!acc[key]) {
        acc[key] = {
          month: item.month,
          year: item.year,
          categories: []
        }
      }
      acc[key].categories.push(item)
      return acc
    }, {})

    // Convert to array and limit if not specific month
    let result = Object.values(grouped)
    if (specificMonth === 0) {
      result = result.slice(0, limit)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching budget history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
