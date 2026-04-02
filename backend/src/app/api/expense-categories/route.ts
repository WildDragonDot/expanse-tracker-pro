import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Bills', icon: '📄' },
  { name: 'Healthcare', icon: '🏥' },
  { name: 'Education', icon: '📚' },
  { name: 'Other', icon: '📁' },
]

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value

    if (!token || token.trim() === '') {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    let decoded: { userId: string }
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string }
    } catch (jwtError: any) {
      console.error('JWT verification failed:', jwtError.message)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const categories = await prisma.expenseCategory.findMany({
      where: { userId: decoded.userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    })

    // If no categories, create defaults
    if (categories.length === 0) {
      const defaultCategories = await Promise.all(
        DEFAULT_CATEGORIES.map(cat =>
          prisma.expenseCategory.create({
            data: {
              userId: decoded.userId,
              name: cat.name,
              icon: cat.icon,
              isDefault: true
            }
          })
        )
      )
      return NextResponse.json(defaultCategories)
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
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

    const category = await prisma.expenseCategory.create({
      data: {
        userId: decoded.userId,
        name: body.name,
        icon: body.icon || '📁',
        isDefault: false
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
    }
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
