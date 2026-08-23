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

    // If unmarking as completed, remove the expense that was auto-logged for it
    if (body.completed === false && item.completed && item.expenseId) {
      try {
        await prisma.expense.delete({ where: { id: item.expenseId } })
      } catch (expenseError) {
        console.error('Error deleting expense for shopping list item:', expenseError)
      }
      body.expenseId = null
    }

    // If marking as completed, create a real expense using the actual price paid
    // (falls back to the estimate if the user didn't confirm a different actual price)
    if (body.completed && !item.completed) {
      const priceUsed = body.actualPrice ?? item.actualPrice ?? item.estimatedPrice
      if (priceUsed) {
        try {
          const expense = await prisma.expense.create({
            data: {
              userId: decoded.userId,
              date: new Date(),
              title: `${item.name} (Shopping List)`,
              amount: Math.round(priceUsed * item.quantity),
              category: item.category || 'Shopping',
              bank: 'Cash',
              paymentMode: 'Cash',
              tags: ['Shopping List', item.category || 'Shopping'],
              notes: `Bought ${item.quantity} ${item.unit}${item.notes ? ` - ${item.notes}` : ''}`
            }
          })
          body.expenseId = expense.id
        } catch (expenseError) {
          console.error('Error creating expense for shopping list item:', expenseError)
          // Don't fail the whole request if expense creation fails
        }
      }
    }

    const updatedItem = await prisma.shoppingList.update({
      where: { id: params.id },
      data: body
    })

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

    if (item.expenseId) {
      try {
        await prisma.expense.delete({ where: { id: item.expenseId } })
      } catch (expenseError) {
        console.error('Error deleting expense for shopping list item:', expenseError)
      }
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