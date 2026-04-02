import { prisma } from './database'
import { getMonthStats } from './analytics'

export type Intent =
  | 'TOTAL_SPENT'
  | 'CATEGORY_SPENT'
  | 'BANK_SPENT'
  | 'COMPARE_PERIODS'
  | 'LIST_SUBSCRIPTIONS'
  | 'SCORE_SUMMARY'
  | 'ADVICE'
  | 'UNKNOWN'

interface ParsedQuery {
  intent: Intent
  timeRange?: { year: number; month: number }
  category?: string
  bank?: string
}

export function parseUserQuery(text: string): ParsedQuery {
  const lower = text.toLowerCase()

  if (lower.includes('total') || lower.includes('how much') || lower.includes('spent')) {
    if (lower.includes('food') || lower.includes('category')) {
      return { intent: 'CATEGORY_SPENT', category: extractCategory(lower) }
    }
    if (lower.includes('bank')) {
      return { intent: 'BANK_SPENT', bank: extractBank(lower) }
    }
    return { intent: 'TOTAL_SPENT', timeRange: extractTimeRange(lower) }
  }

  if (lower.includes('subscription') || lower.includes('emi')) {
    return { intent: 'LIST_SUBSCRIPTIONS' }
  }

  if (lower.includes('score') || lower.includes('smart')) {
    return { intent: 'SCORE_SUMMARY', timeRange: extractTimeRange(lower) }
  }

  if (lower.includes('compare') || lower.includes('last month')) {
    return { intent: 'COMPARE_PERIODS' }
  }

  if (lower.includes('advice') || lower.includes('suggest') || lower.includes('overspending')) {
    return { intent: 'ADVICE', timeRange: extractTimeRange(lower) }
  }

  return { intent: 'UNKNOWN' }
}

export async function resolveIntent(userId: string, query: ParsedQuery) {
  const now = new Date()
  const year = query.timeRange?.year || now.getFullYear()
  const month = query.timeRange?.month || now.getMonth() + 1

  switch (query.intent) {
    case 'TOTAL_SPENT': {
      const stats = await getMonthStats(userId, year, month)
      return {
        answerText: `You spent ₹${stats.totalExpense} in ${getMonthName(month)} ${year}.`,
        chartData: stats.byCategory,
      }
    }

    case 'CATEGORY_SPENT': {
      const stats = await getMonthStats(userId, year, month)
      const amount = stats.byCategory[query.category || ''] || 0
      return {
        answerText: `You spent ₹${amount} on ${query.category} this month.`,
      }
    }

    case 'LIST_SUBSCRIPTIONS': {
      const subs = await prisma.subscription.findMany({
        where: { userId, active: true },
      })
      const list = subs.map((s: any) => `${s.name}: ₹${s.amount}/${s.interval}`).join('\n')
      return {
        answerText: `Your active subscriptions:\n${list}`,
      }
    }

    case 'SCORE_SUMMARY': {
      const score = await prisma.smartScore.findUnique({
        where: { userId_year_month: { userId, year, month } },
      })
      if (!score) {
        return { answerText: 'No score available for this period.' }
      }
      return {
        answerText: `Your Smart Spending Score for ${getMonthName(month)}: ${score.score}/100\n${score.summary}`,
      }
    }

    case 'ADVICE': {
      const stats = await getMonthStats(userId, year, month)
      const suggestions = []
      if (stats.savings < 0) suggestions.push('Try to reduce discretionary spending.')
      if (stats.totalExpense > stats.totalIncome * 0.8) suggestions.push('Your expenses are high relative to income.')
      return {
        answerText: suggestions.length ? suggestions.join(' ') : "You're doing great!",
      }
    }

    default:
      return { answerText: "I didn't understand that. Try asking about spending, subscriptions, or your score." }
  }
}

function extractCategory(text: string): string {
  const categories = ['food', 'transport', 'entertainment', 'shopping', 'bills']
  for (const cat of categories) {
    if (text.includes(cat)) return cat.charAt(0).toUpperCase() + cat.slice(1)
  }
  return 'Food'
}

function extractBank(text: string): string {
  const banks = ['hdfc', 'axis', 'icici', 'sbi']
  for (const bank of banks) {
    if (text.includes(bank)) return bank.toUpperCase()
  }
  return 'HDFC'
}

function extractTimeRange(text: string): { year: number; month: number } {
  const now = new Date()
  if (text.includes('last month')) {
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return { year, month: lastMonth }
  }
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function getMonthName(month: number): string {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return names[month - 1]
}
