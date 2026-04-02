import { prisma } from './database'

interface ExpenseCluster {
  title: string
  amount: number
  expenseIds: string[]
  dates: Date[]
  avgInterval: number
}

export async function detectSubscriptions(userId: string) {
  const expenses = await prisma.expense.findMany({
    where: { userId, isRecurring: false },
    orderBy: { date: 'asc' },
  })

  const clusters = clusterExpenses(expenses)
  const subscriptions = []

  for (const cluster of clusters) {
    if (cluster.expenseIds.length >= 2 && cluster.avgInterval >= 25 && cluster.avgInterval <= 35) {
      const lastDate = cluster.dates[cluster.dates.length - 1]
      const nextDueDate = new Date(lastDate)
      nextDueDate.setDate(nextDueDate.getDate() + Math.round(cluster.avgInterval))

      const sub = await prisma.subscription.create({
        data: {
          userId,
          name: cluster.title,
          amount: cluster.amount,
          interval: 'monthly',
          nextDueDate,
          lastChargedAt: lastDate,
          active: true,
          source: 'auto-detected',
          expenseIds: cluster.expenseIds,
        },
      })

      await prisma.expense.updateMany({
        where: { id: { in: cluster.expenseIds } },
        data: { isRecurring: true, subscriptionId: sub.id },
      })

      subscriptions.push(sub)
    }
  }

  return subscriptions
}

function clusterExpenses(expenses: any[]): ExpenseCluster[] {
  const clusters: Record<string, ExpenseCluster> = {}

  expenses.forEach(e => {
    const key = `${e.title.toLowerCase()}_${e.amount}`
    if (!clusters[key]) {
      clusters[key] = { title: e.title, amount: e.amount, expenseIds: [], dates: [], avgInterval: 0 }
    }
    clusters[key].expenseIds.push(e.id)
    clusters[key].dates.push(e.date)
  })

  return Object.values(clusters).map(c => {
    if (c.dates.length > 1) {
      const intervals = []
      for (let i = 1; i < c.dates.length; i++) {
        const diff = (c.dates[i].getTime() - c.dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        intervals.push(diff)
      }
      c.avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    }
    return c
  })
}

export async function linkExpenseToSubscription(expenseId: string) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!expense) return

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: expense.userId, active: true },
  })

  for (const sub of subscriptions) {
    if (
      expense.title.toLowerCase().includes(sub.name.toLowerCase()) &&
      Math.abs(expense.amount - sub.amount) < sub.amount * 0.1
    ) {
      await prisma.expense.update({
        where: { id: expenseId },
        data: { isRecurring: true, subscriptionId: sub.id },
      })

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          expenseIds: [...sub.expenseIds, expenseId],
          lastChargedAt: expense.date,
        },
      })
      break
    }
  }
}
