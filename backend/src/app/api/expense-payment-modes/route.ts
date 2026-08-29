import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

const DEFAULT_PAYMENT_MODES = [
  { name: 'Cash', icon: '💵' },
  { name: 'UPI', icon: '📱' },
  { name: 'Net Banking', icon: '🏦' },
  { name: 'Udhar / Credit', icon: '🤝' },
  { name: 'Debit / Credit Card', icon: '💳' },
  { name: 'Wallet', icon: '👛' },
]

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value

    if (!token || token.trim() === '') {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

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

    const modes = await prisma.expensePaymentMode.findMany({
      where: { userId: decoded.userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    })

    // If no payment modes seeded yet, create default modes
    if (modes.length === 0) {
      const defaultModes = await Promise.all(
        DEFAULT_PAYMENT_MODES.map(mode =>
          prisma.expensePaymentMode.create({
            data: {
              userId: decoded.userId,
              name: mode.name,
              icon: mode.icon,
              isDefault: true
            }
          })
        )
      )
      return NextResponse.json(defaultModes)
    }

    return NextResponse.json(modes)
  } catch (error) {
    console.error('Error fetching payment modes:', error)
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Payment mode name is required' }, { status: 400 })
    }

    const mode = await prisma.expensePaymentMode.create({
      data: {
        userId: decoded.userId,
        name: body.name.trim(),
        icon: body.icon || '💳',
        isDefault: false
      }
    })

    return NextResponse.json(mode, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Payment mode already exists' }, { status: 400 })
    }
    console.error('Error creating payment mode:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
