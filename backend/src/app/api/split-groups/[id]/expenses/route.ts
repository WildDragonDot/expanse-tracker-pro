import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId, params }: { userId: string; params?: { id?: string } }) => {
  try {
    const cleanPath = new URL(request.url).pathname.replace(/\/+$/, '')
    const segments = cleanPath.split('/')
    const groupId = params?.id || segments[segments.length - 2] // /api/split-groups/:id/expenses

    const group = await prisma.splitGroup.findFirst({
      where: { id: groupId, userId },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, amount, paidBy, splitBetween, splitType = 'EQUAL', date, notes } = body

    if (!title || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Title and valid amount are required' }, { status: 400 })
    }

    const payer = paidBy || 'You'
    const splitters = Array.isArray(splitBetween) && splitBetween.length > 0 ? splitBetween : group.members

    const expense = await prisma.splitExpense.create({
      data: {
        groupId,
        title: title.trim(),
        amount: Math.round(Number(amount)),
        paidBy: payer,
        splitBetween: splitters,
        splitType,
        date: date ? new Date(date) : new Date(),
        notes,
      },
    })

    // Update group timestamp
    await prisma.splitGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error: any) {
    console.error('Create split expense error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add group expense' }, { status: 500 })
  }
})
