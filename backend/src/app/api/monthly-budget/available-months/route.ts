import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const excludeMonth = parseInt(searchParams.get('excludeMonth') || '0')
    const excludeYear = parseInt(searchParams.get('excludeYear') || '0')

    // Get all months with budgets for this user
    const budgets = await prisma.monthlyBudget.findMany({
      where: {
        userId: user.userId,
        isActive: true
      },
      select: {
        month: true,
        year: true,
        category: true
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    // Group by month/year and count budgets
    const monthsMap = new Map()
    budgets.forEach((budget) => {
      const key = `${budget.month}-${budget.year}`
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { 
          month: budget.month, 
          year: budget.year, 
          count: 0 
        })
      }
      monthsMap.get(key).count++
    })

    // Convert to array and filter out current month if specified
    const monthsArray = Array.from(monthsMap.values())
      .filter(m => !(m.month === excludeMonth && m.year === excludeYear))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    return NextResponse.json(monthsArray)
  } catch (error) {
    console.error('Error fetching available months:', error)
    return NextResponse.json({ error: 'Failed to fetch available months' }, { status: 500 })
  }
}
