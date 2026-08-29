import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (request: NextRequest, { userId, params }: { userId: string; params?: { id?: string } }) => {
  try {
    const id = params?.id || new URL(request.url).pathname.replace(/\/+$/, '').split('/').pop()!

    const group = await prisma.splitGroup.findFirst({
      where: { id, userId },
      include: {
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Calculate Balances: For each member, total paid vs total share
    const balances: Record<string, number> = {}
    group.members.forEach((m) => {
      balances[m] = 0
    })

    group.expenses.forEach((expense) => {
      const payer = expense.paidBy
      const splitters = expense.splitBetween.length > 0 ? expense.splitBetween : group.members
      const share = expense.amount / splitters.length

      if (balances[payer] === undefined) balances[payer] = 0
      balances[payer] += expense.amount

      splitters.forEach((m) => {
        if (balances[m] === undefined) balances[m] = 0
        balances[m] -= share
      })
    })

    // Settle-up Debts: who owes whom
    const creditors: { member: string; amount: number }[] = []
    const debtors: { member: string; amount: number }[] = []

    Object.entries(balances).forEach(([member, balance]) => {
      const rounded = Math.round(balance * 100) / 100
      if (rounded > 0.01) {
        creditors.push({ member, amount: rounded })
      } else if (rounded < -0.01) {
        debtors.push({ member, amount: Math.abs(rounded) })
      }
    })

    const settlements: { from: string; to: string; amount: number }[] = []
    let cIdx = 0
    let dIdx = 0

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const cred = creditors[cIdx]
      const debt = debtors[dIdx]
      const minAmount = Math.min(cred.amount, debt.amount)

      if (minAmount > 0.01) {
        settlements.push({
          from: debt.member,
          to: cred.member,
          amount: Math.round(minAmount),
        })
      }

      cred.amount -= minAmount
      debt.amount -= minAmount

      if (cred.amount < 0.01) cIdx++
      if (debt.amount < 0.01) dIdx++
    }

    const totalSpend = group.expenses.reduce((sum, e) => sum + e.amount, 0)
    const yourBalance = Math.round((balances['You'] || 0))

    return NextResponse.json({
      group,
      totalSpend,
      balances,
      yourBalance,
      settlements,
    })
  } catch (error: any) {
    console.error('Get split group error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch group' }, { status: 500 })
  }
})

export const PATCH = withAuth(async (request: NextRequest, { userId, params }: { userId: string; params?: { id?: string } }) => {
  try {
    const id = params?.id || new URL(request.url).pathname.replace(/\/+$/, '').split('/').pop()!
    const body = await request.json()

    const { name, members, type, currency } = body

    const existing = await prisma.splitGroup.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const group = await prisma.splitGroup.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(members && Array.isArray(members) && { members }),
        ...(type && { type }),
        ...(currency && { currency }),
      },
    })

    return NextResponse.json(group)
  } catch (error: any) {
    console.error('Update split group error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update group' }, { status: 500 })
  }
})

export const DELETE = withAuth(async (request: NextRequest, { userId, params }: { userId: string; params?: { id?: string } }) => {
  try {
    const id = params?.id || new URL(request.url).pathname.replace(/\/+$/, '').split('/').pop()!

    const existing = await prisma.splitGroup.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    await prisma.splitGroup.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete split group error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete group' }, { status: 500 })
  }
})
