import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        salary: true,
        currency: true,
        notificationSettings: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch all related data
    const [
      expenses,
      incomes,
      udhar,
      subscriptions,
      expensePlanning,
      planningCategories,
      shoppingList,
      shoppingCategories,
      shoppingItems,
      expenseCategories,
      expenseBanks,
      smartScores
    ] = await Promise.all([
      prisma.expense.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId } }),
      prisma.udhar.findMany({ where: { userId } }),
      prisma.subscription.findMany({ where: { userId } }),
      prisma.expensePlanning.findMany({ where: { userId } }),
      prisma.planningCategory.findMany({ where: { userId } }),
      prisma.shoppingList.findMany({ where: { userId } }),
      prisma.shoppingCategory.findMany({ where: { userId } }),
      prisma.shoppingItem.findMany({ where: { userId } }),
      prisma.expenseCategory.findMany({ where: { userId } }),
      prisma.expenseBank.findMany({ where: { userId } }),
      prisma.smartScore.findMany({ where: { userId } })
    ])

    // Compile all data
    const exportData = {
      exportDate: new Date().toISOString(),
      user,
      statistics: {
        totalExpenses: expenses.length,
        totalIncomes: incomes.length,
        totalUdhar: udhar.length,
        totalSubscriptions: subscriptions.length,
        totalPlanningCategories: planningCategories.length,
        totalShoppingItems: shoppingItems.length,
      },
      data: {
        expenses,
        incomes,
        udhar,
        subscriptions,
        expensePlanning,
        planningCategories,
        shoppingList,
        shoppingCategories,
        shoppingItems,
        expenseCategories,
        expenseBanks,
        smartScores
      }
    }

    // Create filename
    const filename = `expense-tracker-export-${user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
})
