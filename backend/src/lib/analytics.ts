import { prisma } from './database'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from './dateUtils'

export async function getDayStats(userId: string, date: Date) {
  const start = startOfDay(date)
  const end = endOfDay(date)

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lte: end } },
  })

  const total = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
  const byCategory = groupBy(expenses, 'category')
  const byBank = groupBy(expenses, 'bank')

  return { total, count: expenses.length, byCategory, byBank, expenses }
}

export async function getWeekStats(userId: string, date: Date) {
  const start = startOfWeek(date)
  const end = endOfWeek(date)

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lte: end } },
  })

  const total = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
  const byCategory = groupBy(expenses, 'category')
  const dailyTrend = buildDailyTrend(expenses, start, end)

  return { total, count: expenses.length, byCategory, dailyTrend }
}

export async function getMonthStats(userId: string, year: number, month: number) {
  const start = startOfMonth(year, month)
  const end = endOfMonth(year, month)

  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.income.findMany({ where: { userId, date: { gte: start, lte: end } } }),
  ])

  const totalExpense = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum: number, i: any) => sum + i.amount, 0)
  const savings = totalIncome - totalExpense

  const byCategory = groupBy(expenses, 'category')
  const byBank = groupBy(expenses, 'bank')
  const dailyTrend = buildDailyTrend(expenses, start, end)

  return { totalExpense, totalIncome, savings, byCategory, byBank, dailyTrend }
}

export async function getYearStats(userId: string, year: number) {
  const start = startOfYear(year)
  const end = endOfYear(year)

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lte: end } },
  })

  const total = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
  const monthlyTrend = buildMonthlyTrend(expenses, year)

  return { total, count: expenses.length, monthlyTrend }
}

function groupBy(expenses: any[], key: string) {
  return expenses.reduce((acc, e) => {
    const val = e[key]
    acc[val] = (acc[val] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)
}

function buildDailyTrend(expenses: any[], start: Date, end: Date) {
  const days: Record<string, number> = {}
  expenses.forEach(e => {
    const day = e.date.toISOString().split('T')[0]
    days[day] = (days[day] || 0) + e.amount
  })
  return days
}

function buildMonthlyTrend(expenses: any[], year: number) {
  const months: Record<number, number> = {}
  expenses.forEach(e => {
    const month = e.date.getMonth() + 1
    months[month] = (months[month] || 0) + e.amount
  })
  return months
}
