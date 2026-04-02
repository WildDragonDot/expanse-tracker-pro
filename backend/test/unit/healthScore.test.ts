import { calculateFinancialHealthScore, getHealthScoreStatus } from '@/lib/healthScore'

describe('healthScore', () => {
  it('returns fallback scores for empty and income-less datasets', () => {
    expect(calculateFinancialHealthScore([], [])).toBe(25)
    expect(calculateFinancialHealthScore([{ amount: 100, category: 'Food' }], [])).toBe(10)
  })

  it('rewards balanced finances with a high score', () => {
    const incomes = Array.from({ length: 12 }, (_, index) => ({
      amount: 50_000,
      month: index + 1,
    }))

    const expenses = [
      { amount: 8_000, category: 'Food' },
      { amount: 5_000, category: 'Transport' },
      { amount: 7_000, category: 'Bills' },
      { amount: 4_000, category: 'Healthcare' },
      { amount: 3_000, category: 'Education' },
      { amount: 2_000, category: 'Entertainment' },
    ]

    const score = calculateFinancialHealthScore(expenses, incomes)

    expect(score).toBeGreaterThanOrEqual(80)
    expect(getHealthScoreStatus(score).text).toBe('Excellent')
  })

  it('flags poor financial health with a low status band', () => {
    const score = calculateFinancialHealthScore(
      [
        { amount: 45_000, category: 'Shopping' },
        { amount: 25_000, category: 'Entertainment' },
        { amount: 20_000, category: 'Bills' },
      ],
      [{ amount: 50_000 }]
    )

    expect(score).toBeLessThan(30)
    expect(getHealthScoreStatus(score).text).toBe('Needs Attention')
  })
})
