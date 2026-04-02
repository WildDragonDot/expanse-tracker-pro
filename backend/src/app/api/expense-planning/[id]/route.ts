import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'
import { parseAppDate } from '@/lib/dateUtils'

// Force dynamic rendering - uses request headers
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    
    // Check if expense exists and belongs to user
    const expense = await prisma.expensePlanning.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Build update data object with only allowed fields
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount)
    if (body.date !== undefined) updateData.date = parseAppDate(body.date)
    if (body.description !== undefined) updateData.description = body.description
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.actualAmount !== undefined) updateData.actualAmount = body.actualAmount ? parseFloat(body.actualAmount) : null
    if (body.isCompleted !== undefined) updateData.isCompleted = Boolean(body.isCompleted)

    const updatedExpense = await prisma.expensePlanning.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true
      }
    })

    // Update category real cost for both old and new categories
    const categoriesToUpdate = new Set<string>()
    if (expense.categoryId) categoriesToUpdate.add(expense.categoryId)
    if (updatedExpense.categoryId) categoriesToUpdate.add(updatedExpense.categoryId)

    for (const categoryId of categoriesToUpdate) {
      const allExpenses = await prisma.expensePlanning.findMany({
        where: { categoryId: categoryId }
      })
      const totalRealCost = allExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await prisma.planningCategory.update({
        where: { id: categoryId },
        data: { realCost: totalRealCost }
      })
    }

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Check if expense exists and belongs to user
    const expense = await prisma.expensePlanning.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const categoryId = expense.categoryId

    await prisma.expensePlanning.delete({
      where: { id: params.id }
    })

    // Update category real cost after deletion
    if (categoryId) {
      const allExpenses = await prisma.expensePlanning.findMany({
        where: { categoryId: categoryId }
      })
      const totalRealCost = allExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      await prisma.planningCategory.update({
        where: { id: categoryId },
        data: { realCost: totalRealCost }
      })
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
