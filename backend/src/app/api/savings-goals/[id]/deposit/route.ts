import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (request: NextRequest, { userId, params }: { userId: string; params?: { id?: string } }) => {
  try {
    const cleanPath = new URL(request.url).pathname.replace(/\/+$/, '')
    const segments = cleanPath.split('/')
    const id = params?.id || segments[segments.length - 2] // /api/savings-goals/:id/deposit

    const body = await request.json()
    const { amount, action = 'deposit' } = body // 'deposit' | 'withdraw'

    const delta = Math.round(Number(amount))
    if (isNaN(delta) || delta <= 0) {
      return NextResponse.json({ error: 'Valid positive amount is required' }, { status: 400 })
    }

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const newCurrent = action === 'withdraw' ? Math.max(0, existing.currentAmount - delta) : existing.currentAmount + delta
    const isCompleted = newCurrent >= existing.targetAmount

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: newCurrent,
        isCompleted,
      },
    })

    return NextResponse.json({
      success: true,
      goal,
      message: action === 'withdraw' ? `Withdrew ₹${delta.toLocaleString()}` : `Deposited ₹${delta.toLocaleString()} to ${goal.name}!`,
    })
  } catch (error: any) {
    console.error('Goal deposit error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update goal funds' }, { status: 500 })
  }
})
