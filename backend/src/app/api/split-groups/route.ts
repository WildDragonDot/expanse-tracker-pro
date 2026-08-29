import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const groups = await prisma.splitGroup.findMany({
      where: { userId },
      include: {
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const groupsWithStats = groups.map((g) => {
      const totalSpend = g.expenses.reduce((sum, e) => sum + e.amount, 0)
      return {
        ...g,
        totalSpend,
        expensesCount: g.expenses.length,
      }
    })

    return NextResponse.json({ groups: groupsWithStats })
  } catch (error: any) {
    console.error('Get split groups error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch split groups' }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json()
    const { name, type = 'trip', members, currency = 'INR' } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    const memberList: string[] = Array.isArray(members) && members.length > 0 ? members : ['You']
    if (!memberList.includes('You')) {
      memberList.unshift('You')
    }

    const group = await prisma.splitGroup.create({
      data: {
        userId,
        name: name.trim(),
        type,
        members: memberList,
        currency,
      },
      include: {
        expenses: true,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error: any) {
    console.error('Create split group error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create group' }, { status: 500 })
  }
})
