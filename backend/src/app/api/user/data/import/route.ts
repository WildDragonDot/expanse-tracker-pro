import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json()
    const { data, mode = 'merge' } = body // mode: 'merge' or 'replace'

    if (!data || !data.data) {
      return NextResponse.json(
        { error: 'Invalid import data format' },
        { status: 400 }
      )
    }

    const importData = data.data

    // If replace mode, delete existing data first
    if (mode === 'replace') {
      await prisma.$transaction([
        prisma.expense.deleteMany({ where: { userId } }),
        prisma.income.deleteMany({ where: { userId } }),
        prisma.udhar.deleteMany({ where: { userId } }),
        prisma.subscription.deleteMany({ where: { userId } }),
        prisma.expensePlanning.deleteMany({ where: { userId } }),
        prisma.planningCategory.deleteMany({ where: { userId } }),
        prisma.shoppingItem.deleteMany({ where: { userId } }),
        prisma.shoppingCategory.deleteMany({ where: { userId } }),
        prisma.shoppingList.deleteMany({ where: { userId } }),
        prisma.expenseCategory.deleteMany({ where: { userId } }),
        prisma.expenseBank.deleteMany({ where: { userId } }),
      ])
    }

    // Import data (excluding IDs to avoid conflicts)
    const results = {
      expenses: 0,
      incomes: 0,
      categories: 0,
      banks: 0,
      other: 0
    }

    // Import expenses
    if (importData.expenses?.length > 0) {
      for (const expense of importData.expenses) {
        const { id, userId: _, ...expenseData } = expense
        await prisma.expense.create({
          data: { ...expenseData, userId }
        })
        results.expenses++
      }
    }

    // Import incomes
    if (importData.incomes?.length > 0) {
      for (const income of importData.incomes) {
        const { id, userId: _, ...incomeData } = income
        await prisma.income.create({
          data: { ...incomeData, userId }
        })
        results.incomes++
      }
    }

    // Import categories
    if (importData.expenseCategories?.length > 0) {
      for (const category of importData.expenseCategories) {
        const { id, userId: _, ...categoryData } = category
        await prisma.expenseCategory.upsert({
          where: { 
            userId_name: { userId, name: categoryData.name }
          },
          update: categoryData,
          create: { ...categoryData, userId }
        })
        results.categories++
      }
    }

    // Import banks
    if (importData.expenseBanks?.length > 0) {
      for (const bank of importData.expenseBanks) {
        const { id, userId: _, ...bankData } = bank
        await prisma.expenseBank.upsert({
          where: { 
            userId_name: { userId, name: bankData.name }
          },
          update: bankData,
          create: { ...bankData, userId }
        })
        results.banks++
      }
    }

    // Import other data types
    if (importData.udhar?.length > 0) {
      for (const item of importData.udhar) {
        const { id, userId: _, ...itemData } = item
        await prisma.udhar.create({
          data: { ...itemData, userId }
        })
        results.other++
      }
    }

    if (importData.subscriptions?.length > 0) {
      for (const item of importData.subscriptions) {
        const { id, userId: _, ...itemData } = item
        await prisma.subscription.create({
          data: { ...itemData, userId }
        })
        results.other++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      results
    })
  } catch (error: any) {
    console.error('Data import error:', error)
    return NextResponse.json(
      { error: 'Failed to import data', details: error.message },
      { status: 500 }
    )
  }
})
