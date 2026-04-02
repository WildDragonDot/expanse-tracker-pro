import { prisma } from './database'
import { startOfMonth, endOfMonth } from './dateUtils'

interface ScoreMetrics {
  savingsRate: number
  subscriptionRatio: number
  volatility: number
  debtLoad: number
  highRiskSpending: number
}

export async function calculateSmartScore(userId: string, year: number, month: number) {
  const start = startOfMonth(year, month)
  const end = endOfMonth(year, month)

  const [expenses, incomes, subscriptions, udhar, user] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.income.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.subscription.findMany({ where: { userId, active: true } }),
    prisma.udhar.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ])

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0) || user?.salary || 1
  const totalSubscriptions = subscriptions.reduce((sum, s) => sum + s.amount, 0)
  const totalDebt = udhar.filter(u => u.direction === 'taken').reduce((sum, u) => sum + u.remaining, 0)

  const highRiskCategories = ['Entertainment', 'Shopping', 'Dining']
  const highRiskSpending = expenses
    .filter(e => highRiskCategories.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0)

  const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100
  const subscriptionRatio = (totalSubscriptions / totalIncome) * 100
  const debtLoad = (totalDebt / totalIncome) * 100
  const highRiskRatio = (highRiskSpending / totalExpense) * 100

  const volatility = calculateVolatility(expenses)

  const metrics: ScoreMetrics = {
    savingsRate: Math.max(0, savingsRate),
    subscriptionRatio,
    volatility,
    debtLoad,
    highRiskSpending: highRiskRatio,
  }

  const score = computeScore(metrics)
  const summary = generateSummary(metrics, score)

  return { score, summary, metrics }
}

function computeScore(m: ScoreMetrics): number {
  const savingsScore = Math.min(100, m.savingsRate * 2)
  const subscriptionScore = Math.max(0, 100 - m.subscriptionRatio * 3)
  const volatilityScore = Math.max(0, 100 - m.volatility)
  const debtScore = Math.max(0, 100 - m.debtLoad * 2)
  const riskScore = Math.max(0, 100 - m.highRiskSpending * 2)

  const score = (
    savingsScore * 0.35 +
    subscriptionScore * 0.2 +
    volatilityScore * 0.15 +
    debtScore * 0.2 +
    riskScore * 0.1
  )

  return Math.round(Math.max(0, Math.min(100, score)))
}

function calculateVolatility(expenses: any[]): number {
  if (expenses.length < 2) return 0
  const amounts = expenses.map(e => e.amount)
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)
  return (stdDev / avg) * 100
}

function generateSummary(m: ScoreMetrics, score: number): string {
  const parts = []
  
  if (m.savingsRate > 20) parts.push(`Great savings rate: ${m.savingsRate.toFixed(1)}%`)
  else if (m.savingsRate < 10) parts.push(`Low savings: ${m.savingsRate.toFixed(1)}%`)
  
  if (m.subscriptionRatio > 20) parts.push(`High subscriptions: ${m.subscriptionRatio.toFixed(1)}% of income`)
  
  if (m.debtLoad > 30) parts.push(`Debt load: ${m.debtLoad.toFixed(1)}%`)
  
  if (m.highRiskSpending > 30) parts.push(`High discretionary spending`)

  if (parts.length === 0) parts.push('Balanced spending')

  return parts.join('. ')
}

export async function storeSmartScore(userId: string, year: number, month: number) {
  const { score, summary, metrics } = await calculateSmartScore(userId, year, month)

  return prisma.smartScore.upsert({
    where: { userId_year_month: { userId, year, month } },
    create: { userId, year, month, score, summary, metrics: metrics as any },
    update: { score, summary, metrics: metrics as any },
  })
}
