import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const PATCH = withAuth(async (request: NextRequest, { userId, params }: { userId: string; params?: { id?: string } }) => {
  try {
    const id = params?.id || new URL(request.url).pathname.replace(/\/+$/, '').split('/').pop()!
    const body = await request.json()

    const { name, targetAmount, currentAmount, targetDate, category, icon, color, isCompleted } = body

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const updatedCurrent = currentAmount !== undefined ? Math.round(Number(currentAmount)) : existing.currentAmount
    const updatedTarget = targetAmount !== undefined ? Math.round(Number(targetAmount)) : existing.targetAmount

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(targetAmount !== undefined && { targetAmount: updatedTarget }),
        ...(currentAmount !== undefined && { currentAmount: updatedCurrent }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        ...(category && { category }),
        ...(icon && { icon }),
        ...(color && { color }),
        isCompleted: isCompleted !== undefined ? isCompleted : updatedCurrent >= updatedTarget,
      },
    })

    return NextResponse.json(goal)
  } catch (error: any) {
    console.error('Update savings goal error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update goal' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (request: NextRequest, { userId, params }: { userId: string; params?: { id?: string } }) => {
  try {
    const id = params?.id || new URL(request.url).pathname.replace(/\/+$/, '').split('/').pop()!

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.savingsGoal.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete savings goal error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete goal' }, { status: 500 })
  }
})
