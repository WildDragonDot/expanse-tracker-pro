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

    const category = await prisma.shoppingCategory.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updated = await prisma.shoppingCategory.update({
      where: { id: params.id },
      data: body
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating shopping category:', error)
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

    const category = await prisma.shoppingCategory.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      },
      include: {
        items: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Delete all expenses associated with items in this category
    const expenseIds = category.items
      .filter(item => item.expenseId)
      .map(item => item.expenseId!)

    if (expenseIds.length > 0) {
      try {
        const deletedExpenses = await prisma.expense.deleteMany({
          where: {
            id: { in: expenseIds }
          }
        })
        console.log(`Deleted ${deletedExpenses.count} expenses associated with category ${category.name}`)
      } catch (expenseError) {
        console.error('Error deleting associated expenses:', expenseError)
      }
    }

    // Delete the category (items will be deleted automatically due to cascade)
    await prisma.shoppingCategory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'Category deleted successfully',
      deletedExpenses: expenseIds.length
    })
  } catch (error) {
    console.error('Error deleting shopping category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
