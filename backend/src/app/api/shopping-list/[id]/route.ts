import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

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
    
    // Check if item exists and belongs to user
    const item = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const updatedItem = await prisma.shoppingList.update({
      where: { id: params.id },
      data: body
    })

    // If item is marked as completed, create an expense automatically
    if (body.completed && !item.completed && updatedItem.estimatedPrice) {
      try {
        const expenseData = {
          userId: decoded.userId,
          date: new Date(),
          title: `${updatedItem.name} (Shopping List)`,
          amount: Math.round(updatedItem.estimatedPrice * updatedItem.quantity),
          category: updatedItem.category || 'Shopping',
          bank: 'Cash',
          paymentMode: 'Cash',
          tags: ['Shopping List', updatedItem.category || 'Shopping'],
          notes: `Bought ${updatedItem.quantity} ${updatedItem.unit}${updatedItem.notes ? ` - ${updatedItem.notes}` : ''}`
        }

        console.log('Creating expense for shopping list item:', expenseData)

        const expense = await prisma.expense.create({
          data: expenseData
        })

        console.log('Expense created successfully:', expense.id)
      } catch (expenseError) {
        console.error('Error creating expense for shopping list item:', expenseError)
        // Don't fail the whole request if expense creation fails
      }
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating shopping item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    
    // Check if item exists and belongs to user
    const item = await prisma.shoppingList.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.shoppingList.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting shopping item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}