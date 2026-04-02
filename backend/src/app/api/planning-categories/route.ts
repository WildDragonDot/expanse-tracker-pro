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
    
    const categories = await prisma.planningCategory.findMany({
      where: { userId: decoded.userId },
      include: {
        expenses: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Check and update expired categories
    const now = new Date()
    const updates = categories.map(async (category) => {
      if (category.expiryDate && new Date(category.expiryDate) < now && category.isActive) {
        return prisma.planningCategory.update({
          where: { id: category.id },
          data: { isActive: false }
        })
      }
      return category
    })

    await Promise.all(updates)

    // Fetch updated categories
    const updatedCategories = await prisma.planningCategory.findMany({
      where: { userId: decoded.userId },
      include: {
        expenses: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(updatedCategories)
  } catch (error) {
    console.error('Error fetching planning categories:', error)
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

    const { name, icon, color, expectedCost, type, startDate, endDate, expiryDate } = body

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Check if expiry date is in the past
    const isActive = expiryDate ? new Date(expiryDate) > new Date() : true

    const category = await prisma.planningCategory.create({
      data: {
        name,
        icon: icon || '📝',
        color: color || 'from-blue-500 to-cyan-600',
        expectedCost: expectedCost ? parseFloat(expectedCost) : 0,
        type: type || 'general',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive,
        userId: decoded.userId
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Error creating planning category:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
