import { NextRequest, NextResponse } from 'next/server'
import { getFinancialSummary, getBillOccurrences, prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const hasYear = searchParams.has('year')
    const hasMonth = searchParams.has('month')

    let summary: any
    if (hasYear && hasMonth) {
      const year = parseInt(searchParams.get('year')!)
      const month = parseInt(searchParams.get('month')!)
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'Invalid year or month' },
          { status: 400 }
        )
      }
      summary = await getFinancialSummary(userId, year, month)
    } else {
      // Use the active billing cycle for this specific user
      summary = await getFinancialSummary(userId)
    }

    // Extra fields below are additive (existing consumers of this endpoint keep working
    // unchanged) and power the mobile dashboard, which otherwise has nothing real to show.
    const [allTimeExpenses, allTimeIncomes, recentExpenses, recentIncomes, occurrences] = await Promise.all([
      prisma.expense.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.income.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.income.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 5 }),
      getBillOccurrences(userId),
    ])

    const totalBalance = (allTimeIncomes._sum.amount || 0) - (allTimeExpenses._sum.amount || 0)

    const recentTransactions = [
      ...recentExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        type: 'expense' as const,
        date: e.date.toISOString(),
        category: e.category,
        bank: e.bank,
        paymentMode: e.paymentMode,
        notes: e.notes || undefined,
      })),
      ...recentIncomes.map((i) => ({
        id: i.id,
        title: i.source,
        amount: i.amount,
        type: 'income' as const,
        date: i.date.toISOString(),
        category: 'Income',
        notes: i.notes || undefined,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    const upcomingOccurrences = occurrences.filter((o) => o.status === 'UPCOMING' || o.status === 'OVERDUE')
    const upcomingBillsTotal = upcomingOccurrences.reduce((sum, o) => sum + o.amount, 0)
    const nextUpcomingBill = upcomingOccurrences[0] || null

    return NextResponse.json({
      ...summary,
      totalBalance,
      recentTransactions,
      upcomingBillsTotal,
      upcomingBill: nextUpcomingBill,
    })
  } catch (error: any) {
    console.error('Get financial summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch financial summary' },
      { status: 500 }
    )
  }
})