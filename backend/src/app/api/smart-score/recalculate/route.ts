import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getFinancialSummary, prisma } from '@/lib/database'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { year, month } = await request.json()

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Valid year and month are required' },
        { status: 400 }
      )
    }

    // Calculate smart score based on financial data
    const summary = await getFinancialSummary(userId, year, month)
    
    let score = 0
    let metrics = {
      savingsRate: 0,
      expenseVariability: 0,
      budgetAdherence: 0,
      incomeStability: 0
    }

    if (summary.totalIncome > 0) {
      // Savings rate (40% weight)
      const savingsRate = (summary.savings / summary.totalIncome) * 100
      metrics.savingsRate = Math.max(0, Math.min(100, savingsRate))
      
      // Budget adherence (30% weight)
      metrics.budgetAdherence = summary.totalExpenses <= summary.totalIncome ? 100 : Math.max(0, Math.round((1 - (summary.totalExpenses - summary.totalIncome) / summary.totalIncome) * 100))
      
      // Income stability (20% weight)
      metrics.incomeStability = summary.incomeCount > 0 ? 85 : 0
      
      // Expense variability (10% weight)
      metrics.expenseVariability = summary.topCategories.length > 1 ? 75 : 50

      score = Math.round(
        (metrics.savingsRate * 0.4) +
        (metrics.budgetAdherence * 0.3) +
        (metrics.incomeStability * 0.2) +
        (metrics.expenseVariability * 0.1)
      )
    } else {
      metrics.budgetAdherence = summary.totalExpenses === 0 ? 100 : 20
      metrics.incomeStability = 0
      metrics.expenseVariability = 40
      score = summary.totalExpenses === 0 ? 50 : 25
    }

    score = Math.max(0, Math.min(100, score))

    const smartScore = await prisma.smartScore.upsert({
      where: {
        userId_year_month: { userId, year, month }
      },
      update: {
        score,
        summary: `Financial health score for ${year}-${month.toString().padStart(2, '0')}`,
        metrics
      },
      create: {
        userId,
        year,
        month,
        score,
        summary: `Financial health score for ${year}-${month.toString().padStart(2, '0')}`,
        metrics
      }
    })

    return NextResponse.json({ score: smartScore })
  } catch (error: any) {
    console.error('Recalculate smart score error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate smart score' },
      { status: 500 }
    )
  }
})
