import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getAuthUser } from '@/lib/auth'
import { getBillingPeriodForMonth } from '@/lib/billingCycle'

export const dynamic = 'force-dynamic'

// GET - Fetch all budgets for a specific month/year
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const budgets = await prisma.monthlyBudget.findMany({
      where: {
        userId: user.userId,
        month,
        year,
        isActive: true
      },
      orderBy: {
        category: 'asc'
      }
    })

    // Calculate spent amount for each budget using billing period
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { billingCycleStartDay: true }
    })
    const billingDay = userProfile?.billingCycleStartDay || 1

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
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

        return {
          ...budget,
          spent: spent._sum.amount || 0
        }
      })
    )

    return NextResponse.json(budgetsWithSpent)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

// POST - Create or update a budget
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, amount, month, year, payableBank } = body

    if (!category || amount === undefined || !month || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const budget = await prisma.monthlyBudget.upsert({
      where: {
        userId_category_month_year: {
          userId: user.userId,
          category,
          month,
          year
        }
      },
      update: {
        amount,
        payableBank: payableBank || null
      },
      create: {
        userId: user.userId,
        category,
        amount,
        month,
        year,
        payableBank: payableBank || null
      }
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Error creating/updating budget:', error)
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 })
  }
}

// DELETE - Delete a budget
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Budget ID required' }, { status: 400 })
    }

    await prisma.monthlyBudget.delete({
      where: {
        id,
        userId: user.userId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}
