export function detectSubscriptions(expenses: any[]) {
  const subscriptions: any[] = []
  const grouped: Record<string, any[]> = {}

  // Group by similar title and amount
  expenses.forEach(expense => {
    const key = `${expense.title.toLowerCase()}_${Math.floor(expense.amount / 100) * 100}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(expense)
  })

  // Detect recurring patterns
  Object.entries(grouped).forEach(([key, items]) => {
    if (items.length >= 2) {
      const dates = items.map(i => new Date(i.date)).sort((a, b) => a.getTime() - b.getTime())
      const intervals = []
      
      for (let i = 1; i < dates.length; i++) {
        const days = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        intervals.push(days)
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

      // If average interval is around 30 days (monthly), mark as subscription
      if (avgInterval >= 25 && avgInterval <= 35) {
        subscriptions.push({
          name: items[0].title,
          amount: items[0].amount,
          interval: 'monthly',
          expenseIds: items.map(i => i.id),
          lastChargedAt: dates[dates.length - 1],
          nextDueDate: new Date(dates[dates.length - 1].getTime() + avgInterval * 24 * 60 * 60 * 1000),
          active: true,
          source: 'auto-detected'
        })
      }
    }
  })

  return subscriptions
}
