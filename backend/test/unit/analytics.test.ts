jest.mock('../../src/lib/database', () => ({
  __esModule: true,
  prisma: {
    expense: {
      findMany: jest.fn(),
    },
    income: {
      findMany: jest.fn(),
    },
  },
}))

const { prisma: mockPrisma } = jest.requireMock('../../src/lib/database') as {
  prisma: {
    expense: { findMany: jest.Mock }
    income: { findMany: jest.Mock }
  }
}

import { getDayStats, getMonthStats, getWeekStats, getYearStats } from '@/lib/analytics'

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds day stats grouped by category and bank', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      { amount: 200, category: 'Food', bank: 'SBI', date: new Date('2024-01-10T10:00:00.000Z') },
      { amount: 300, category: 'Food', bank: 'HDFC', date: new Date('2024-01-10T18:00:00.000Z') },
      { amount: 100, category: 'Travel', bank: 'SBI', date: new Date('2024-01-10T20:00:00.000Z') },
    ])

    const result = await getDayStats('user-1', new Date('2024-01-10T11:00:00.000Z'))

    expect(result).toMatchObject({
      total: 600,
      count: 3,
      byCategory: { Food: 500, Travel: 100 },
      byBank: { SBI: 300, HDFC: 300 },
    })
  })

  it('builds week and month aggregates with trends', async () => {
    mockPrisma.expense.findMany
      .mockResolvedValueOnce([
        { amount: 100, category: 'Food', bank: 'SBI', date: new Date('2024-01-07T10:00:00.000Z') },
        { amount: 250, category: 'Bills', bank: 'SBI', date: new Date('2024-01-09T10:00:00.000Z') },
      ])
      .mockResolvedValueOnce([
        { amount: 100, category: 'Food', bank: 'SBI', date: new Date('2024-01-03T10:00:00.000Z') },
        { amount: 300, category: 'Bills', bank: 'HDFC', date: new Date('2024-01-15T10:00:00.000Z') },
      ])
    mockPrisma.income.findMany.mockResolvedValue([{ amount: 1000 }, { amount: 500 }])

    const weekStats = await getWeekStats('user-1', new Date('2024-01-10T10:00:00.000Z'))
    const monthStats = await getMonthStats('user-1', 2024, 1)

    expect(weekStats).toMatchObject({
      total: 350,
      count: 2,
      byCategory: { Food: 100, Bills: 250 },
      dailyTrend: {
        '2024-01-07': 100,
        '2024-01-09': 250,
      },
    })

    expect(monthStats).toMatchObject({
      totalExpense: 400,
      totalIncome: 1500,
      savings: 1100,
      byCategory: { Food: 100, Bills: 300 },
      byBank: { SBI: 100, HDFC: 300 },
      dailyTrend: {
        '2024-01-03': 100,
        '2024-01-15': 300,
      },
    })
  })

  it('builds yearly monthly trend totals', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      { amount: 400, date: new Date('2024-01-05T10:00:00.000Z') },
      { amount: 600, date: new Date('2024-01-25T10:00:00.000Z') },
      { amount: 900, date: new Date('2024-03-10T10:00:00.000Z') },
    ])

    const result = await getYearStats('user-1', 2024)

    expect(result).toEqual({
      total: 1900,
      count: 3,
      monthlyTrend: {
        1: 1000,
        3: 900,
      },
    })
  })
})
