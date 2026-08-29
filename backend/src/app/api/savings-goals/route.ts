import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

    return NextResponse.json({
      goals,
      stats: {
        totalGoals: goals.length,
        completedGoals: goals.filter((g) => g.isCompleted || g.currentAmount >= g.targetAmount).length,
        totalTarget,
        totalSaved,
        overallProgress,
      },
    })
  } catch (error: any) {
    console.error('Get savings goals error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch savings goals' }, { status: 500 })
  }
})

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const body = await request.json()
    const { name, targetAmount, currentAmount, targetDate, category, icon, color } = body

    if (!name || !targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      return NextResponse.json({ error: 'Valid goal name and target amount are required' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name: name.trim(),
        targetAmount: Math.round(Number(targetAmount)),
        currentAmount: currentAmount ? Math.round(Number(currentAmount)) : 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        category: category || 'General',
        icon: icon || '🎯',
        color: color || '#10B981',
        isCompleted: currentAmount && Number(currentAmount) >= Number(targetAmount),
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error: any) {
    console.error('Create savings goal error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create savings goal' }, { status: 500 })
  }
})
