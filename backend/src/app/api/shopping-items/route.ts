import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

// Force dynamic rendering - uses request headers
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const items = await prisma.shoppingItem.findMany({
      where: { userId: decoded.userId },
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching shopping items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()

    const { name, expectedPrice, categoryId, quantity, unit, notes } = body

    if (!name || !expectedPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const item = await prisma.shoppingItem.create({
      data: {
        name,
        expectedPrice: parseFloat(expectedPrice),
        categoryId: categoryId || null,
        quantity: quantity || 1,
        unit: unit || 'pcs',
        notes,
        userId: decoded.userId
      },
      include: {
        category: true
      }
    })

    // Update category real cost only (not expected cost - user sets that manually)
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

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating shopping item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
