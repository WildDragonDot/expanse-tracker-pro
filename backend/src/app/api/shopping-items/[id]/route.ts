import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

// Force dynamic rendering - uses request headers
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()

    const item = await prisma.shoppingItem.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Handle expense creation/deletion based on isBought status
    let expenseCreated = false
    let expenseDeleted = false
    
    // If unmarking as bought, delete the associated expense
    if (body.isBought === false && item.expenseId) {
      try {
        await prisma.expense.delete({
          where: { id: item.expenseId }
        })
        console.log('Deleted expense:', item.expenseId)
        expenseDeleted = true
        body.expenseId = null // Clear the expense ID
      } catch (expenseError) {
        console.error('Error deleting expense:', expenseError)
      }
    }
    
    // If marking as bought, handle expense creation/update
    if (body.isBought && body.actualPrice) {
      try {
        // If there's an existing expense, delete it first
        if (item.expenseId) {
          try {
            await prisma.expense.delete({
              where: { id: item.expenseId }
            })
            console.log('Deleted old expense:', item.expenseId)
          } catch (deleteError) {
            console.error('Error deleting old expense:', deleteError)
          }
        }

        // Create new expense
        const category = item.categoryId 
          ? await prisma.shoppingCategory.findUnique({ where: { id: item.categoryId } })
          : null

        const expenseData = {
          userId: decoded.userId,
          date: new Date(),
          title: `${item.name} (Shopping)`,
          amount: Math.round(body.actualPrice * item.quantity),
          category: 'Shopping',
          bank: 'Cash',
          paymentMode: 'Cash',
          tags: category ? [category.name, 'Shopping'] : ['Shopping'],
          notes: `Bought ${item.quantity} ${item.unit} at ₹${body.actualPrice} each${category ? ` from ${category.name}` : ''}`
        }

        console.log('Creating expense for shopping item:', expenseData)

        const expense = await prisma.expense.create({
          data: expenseData
        })

        console.log('Expense created successfully:', expense.id)
        body.expenseId = expense.id // Store the expense ID
        expenseCreated = true
      } catch (expenseError) {
        console.error('Error creating expense for shopping item:', expenseError)
        // Don't fail the whole request if expense creation fails
      }
    }

    const updated = await prisma.shoppingItem.update({
      where: { id: params.id },
      data: body
    })

    // Update category real cost only (not expected cost - user sets that manually)
    if (item.categoryId) {
      const allItems = await prisma.shoppingItem.findMany({
        where: { categoryId: item.categoryId }
      })
      
      // Only update realCost (actual spending), not expectedCost (user's budget)
      const totalReal = allItems
        .filter(i => i.isBought && i.actualPrice)
        .reduce((sum, i) => sum + (i.actualPrice! * i.quantity), 0)
      
      await prisma.shoppingCategory.update({
        where: { id: item.categoryId },
        data: { realCost: totalReal }
      })
    }

    return NextResponse.json({ ...updated, expenseCreated })
  } catch (error) {
    console.error('Error updating shopping item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const item = await prisma.shoppingItem.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const categoryId = item.categoryId

    // Delete associated expense if exists
    if (item.expenseId) {
      try {
        await prisma.expense.delete({
          where: { id: item.expenseId }
        })
        console.log('Deleted associated expense:', item.expenseId)
      } catch (expenseError) {
        console.error('Error deleting associated expense:', expenseError)
      }
    }

    await prisma.shoppingItem.delete({
      where: { id: params.id }
    })

    // Update category real cost after deletion (not expected cost - user sets that manually)
    if (categoryId) {
      const allItems = await prisma.shoppingItem.findMany({
        where: { categoryId: categoryId }
      })
      
      // Only update realCost (actual spending), not expectedCost (user's budget)
      const totalReal = allItems
        .filter(i => i.isBought && i.actualPrice)
        .reduce((sum, i) => sum + (i.actualPrice! * i.quantity), 0)
      
      await prisma.shoppingCategory.update({
        where: { id: categoryId },
        data: { realCost: totalReal }
      })
    }

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting shopping item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
