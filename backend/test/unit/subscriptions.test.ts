jest.mock('../../src/lib/database', () => ({
  __esModule: true,
  prisma: {
    expense: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const { prisma: mockPrisma } = jest.requireMock('../../src/lib/database') as {
  prisma: {
    expense: {
      findMany: jest.Mock
      updateMany: jest.Mock
      findUnique: jest.Mock
      update: jest.Mock
    }
    subscription: {
      create: jest.Mock
      findMany: jest.Mock
      update: jest.Mock
    }
  }
}

import { detectSubscriptions, linkExpenseToSubscription } from '@/lib/subscriptions'

describe('subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('detects monthly recurring expenses and links their expense ids', async () => {
    mockPrisma.expense.findMany.mockResolvedValue([
      { id: 'e1', title: 'Netflix', amount: 499, date: new Date('2024-01-01T00:00:00.000Z') },
      { id: 'e2', title: 'Netflix', amount: 499, date: new Date('2024-01-31T00:00:00.000Z') },
      { id: 'e3', title: 'Netflix', amount: 499, date: new Date('2024-03-01T00:00:00.000Z') },
      { id: 'e4', title: 'Groceries', amount: 799, date: new Date('2024-01-10T00:00:00.000Z') },
    ])
    mockPrisma.subscription.create.mockResolvedValue({ id: 'sub-1' })
    mockPrisma.expense.updateMany.mockResolvedValue({ count: 3 })

    const subscriptions = await detectSubscriptions('user-1')

    expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        name: 'Netflix',
        amount: 499,
        interval: 'monthly',
        active: true,
        source: 'auto-detected',
        expenseIds: ['e1', 'e2', 'e3'],
      }),
    })
    expect(mockPrisma.expense.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['e1', 'e2', 'e3'] } },
      data: { isRecurring: true, subscriptionId: 'sub-1' },
    })
    expect(subscriptions).toEqual([{ id: 'sub-1' }])
  })

  it('links a matching expense to an existing subscription', async () => {
    mockPrisma.expense.findUnique.mockResolvedValue({
      id: 'expense-1',
      userId: 'user-1',
      title: 'Netflix Premium',
      amount: 510,
      date: new Date('2024-04-01T00:00:00.000Z'),
    })
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        name: 'Netflix',
        amount: 499,
        expenseIds: ['e1', 'e2'],
      },
    ])
    mockPrisma.expense.update.mockResolvedValue({})
    mockPrisma.subscription.update.mockResolvedValue({})

    await linkExpenseToSubscription('expense-1')

    expect(mockPrisma.expense.update).toHaveBeenCalledWith({
      where: { id: 'expense-1' },
      data: { isRecurring: true, subscriptionId: 'sub-1' },
    })
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        expenseIds: ['e1', 'e2', 'expense-1'],
        lastChargedAt: new Date('2024-04-01T00:00:00.000Z'),
      },
    })
  })

  it('does nothing when an expense cannot be found', async () => {
    mockPrisma.expense.findUnique.mockResolvedValue(null)

    await linkExpenseToSubscription('missing-expense')

    expect(mockPrisma.subscription.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.expense.update).not.toHaveBeenCalled()
  })
})
