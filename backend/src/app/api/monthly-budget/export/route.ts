import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getAuthUser } from '@/lib/auth'
import { exportBudgetToPDF, sendBudgetEmail } from '@/lib/budgetExport'
import { getBillingPeriodForMonth } from '@/lib/billingCycle'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { month, year, type } = body // type: 'pdf' or 'email'

    // Get user details
    const userDetails = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true, name: true }
    })

    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { billingCycleStartDay: true }
    })
    const billingDay = userProfile?.billingCycleStartDay || 1
    const period = getBillingPeriodForMonth(month, year, billingDay)

    const [budgets, expenses] = await Promise.all([
      prisma.monthlyBudget.findMany({
        where: {
          userId: user.userId,
          month,
          year
        }
      }),
      prisma.expense.groupBy({
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
    ])

    const analytics = budgets.map((budget) => {
      const spent = expenses.find((expense) => expense.category === budget.category)?._sum.amount || 0
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

    const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0)
    const totalSpent = expenses.reduce((sum, expense) => sum + (expense._sum.amount || 0), 0)

    const analyticsData = {
      analytics,
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining: totalBudgeted - totalSpent,
        overallPercentage: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0
      }
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const summary = {
      ...analyticsData.summary,
      month: months[month - 1],
      year
    }

    if (type === 'email') {
      await sendBudgetEmail(
        analyticsData.analytics,
        summary,
        userDetails.email,
        userDetails.name
      )

      return NextResponse.json({
        success: true,
        message: 'Budget report sent to your email'
      })
    } else {
      // Generate PDF and return as download
      const doc = await exportBudgetToPDF(
        analyticsData.analytics,
        summary,
        userDetails.email
      )

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="budget-${months[month - 1]}-${year}.pdf"`
        }
      })
    }
  } catch (error) {
    console.error('Error exporting budget:', error)
    return NextResponse.json({ error: 'Failed to export budget' }, { status: 500 })
  }
}
