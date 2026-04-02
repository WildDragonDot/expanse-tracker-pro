jest.mock('../../src/lib/database', () => ({
  __esModule: true,
  prisma: {
    expense: { findMany: jest.fn() },
    income: { findMany: jest.fn() },
    subscription: { findMany: jest.fn() },
    udhar: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    smartScore: { upsert: jest.fn() },
  },
}))

const { prisma: mockPrisma } = jest.requireMock('../../src/lib/database') as {
  prisma: {
    expense: { findMany: jest.Mock }
    income: { findMany: jest.Mock }
    subscription: { findMany: jest.Mock }
    udhar: { findMany: jest.Mock }
    user: { findUnique: jest.Mock }
    smartScore: { upsert: jest.Mock }
  }
}

import { calculateSmartScore, storeSmartScore } from '@/lib/smartScore'

describe('smartScore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calculates metrics, score and a helpful summary', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      { amount: 200, category: 'Food' },
      { amount: 100, category: 'Entertainment' },
      { amount: 100, category: 'Shopping' },
    ])
    mockPrisma.income.findMany.mockResolvedValue([{ amount: 1000 }])
    mockPrisma.subscription.findMany.mockResolvedValue([{ amount: 250 }])
    mockPrisma.udhar.findMany.mockResolvedValue([{ direction: 'taken', remaining: 400 }])
    mockPrisma.user.findUnique.mockResolvedValue({ salary: 0 })

    const result = await calculateSmartScore('user-1', 2024, 1)

    expect(result.metrics).toMatchObject({
      savingsRate: 60,
      subscriptionRatio: 25,
      debtLoad: 40,
      highRiskSpending: 50,
    })
    expect(result.metrics.volatility).toBeGreaterThan(30)
    expect(result.score).toBeGreaterThan(40)
    expect(result.score).toBeLessThan(80)
    expect(result.summary).toContain('Great savings rate: 60.0%')
    expect(result.summary).toContain('High subscriptions: 25.0% of income')
    expect(result.summary).toContain('Debt load: 40.0%')
    expect(result.summary).toContain('High discretionary spending')
  })

  it('falls back to user salary when monthly income records are missing', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([{ amount: 500, category: 'Food' }])
    mockPrisma.income.findMany.mockResolvedValue([])
    mockPrisma.subscription.findMany.mockResolvedValue([])
    mockPrisma.udhar.findMany.mockResolvedValue([])
    mockPrisma.user.findUnique.mockResolvedValue({ salary: 2000 })

    const result = await calculateSmartScore('user-2', 2024, 1)

    expect(result.metrics.savingsRate).toBe(75)
    expect(result.summary).toContain('Great savings rate: 75.0%')
  })

  it('stores computed scores via prisma upsert', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([{ amount: 200, category: 'Bills' }])
    mockPrisma.income.findMany.mockResolvedValue([{ amount: 1000 }])
    mockPrisma.subscription.findMany.mockResolvedValue([])
    mockPrisma.udhar.findMany.mockResolvedValue([])
    mockPrisma.user.findUnique.mockResolvedValue({ salary: 0 })
    mockPrisma.smartScore.upsert.mockResolvedValue({ id: 'score-1' })

    const stored = await storeSmartScore('user-3', 2024, 2)

    expect(mockPrisma.smartScore.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_year_month: { userId: 'user-3', year: 2024, month: 2 } },
        create: expect.objectContaining({
          userId: 'user-3',
          year: 2024,
          month: 2,
          score: expect.any(Number),
          summary: expect.any(String),
        }),
        update: expect.objectContaining({
          score: expect.any(Number),
          summary: expect.any(String),
        }),
      })
    )
    expect(stored).toEqual({ id: 'score-1' })
  })
})
