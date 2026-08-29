import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import { prisma } from '@/lib/database'

const DEFAULT_BANKS = [
  { name: 'HDFC', icon: '🏦' },
  { name: 'SBI', icon: '🏦' },
  { name: 'ICICI', icon: '🏦' },
  { name: 'Axis', icon: '🏦' },
  { name: 'Kotak', icon: '🏦' },
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

    const banks = await prisma.expenseBank.findMany({
      where: { userId: decoded.userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    })

    // If no banks, create defaults
    if (banks.length === 0) {
      const defaultBanks = await Promise.all(
        DEFAULT_BANKS.map(bank =>
          prisma.expenseBank.create({
            data: {
              userId: decoded.userId,
              name: bank.name,
              icon: bank.icon,
              isDefault: true
            }
          })
        )
      )
      return NextResponse.json(defaultBanks)
    }

    return NextResponse.json(banks)
  } catch (error) {
    console.error('Error fetching banks:', error)
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

    const bank = await prisma.expenseBank.create({
      data: {
        userId: decoded.userId,
        name: body.name,
        icon: body.icon || '🏦',
        isDefault: false
      }
    })

    return NextResponse.json(bank, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bank already exists' }, { status: 400 })
    }
    console.error('Error creating bank:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
