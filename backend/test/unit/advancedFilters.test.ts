import {
  applyAdvancedFilters,
  applySorting,
  buildAdvancedPrismaWhere,
  clearFilterState,
  fuzzyMatch,
  getFilterSummary,
  loadFilterState,
  saveFilterState,
  searchTransactions,
} from '@/lib/advancedFilters'

type MockTransaction = {
  id: string
  title: string
  category: string
  bank: string
  notes?: string
  tags?: string[]
  amount: number
  date: Date
  type: 'expense' | 'income'
  receiptUrl?: string | null
}

const transactions: MockTransaction[] = [
  {
    id: '1',
    title: 'Groceries',
    category: 'Food',
    bank: 'SBI',
    notes: 'Weekly vegetables',
    tags: ['home', 'fresh'],
    amount: 1200,
    date: new Date('2024-01-10T10:00:00.000Z'),
    type: 'expense',
    receiptUrl: 'https://example.com/receipt-1.jpg',
  },
  {
    id: '2',
    title: 'Salary Credit',
    category: 'Income',
    bank: 'HDFC',
    notes: 'January salary',
    tags: ['salary'],
    amount: 55000,
    date: new Date('2024-01-05T10:00:00.000Z'),
    type: 'income',
    receiptUrl: null,
  },
  {
    id: '3',
    title: 'Movie Night',
    category: 'Entertainment',
    bank: 'SBI',
    notes: 'Weekend plan',
    tags: ['fun'],
    amount: 800,
    date: new Date('2024-01-15T18:00:00.000Z'),
    type: 'expense',
    receiptUrl: null,
  },
]

describe('advancedFilters', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
  })

  it('matches direct and fuzzy search queries', () => {
    expect(fuzzyMatch('Groceries', 'cer')).toBe(true)
    expect(fuzzyMatch('Groceries', 'grcs')).toBe(true)
    expect(fuzzyMatch('Groceries', 'taxi')).toBe(false)
    expect(fuzzyMatch('Anything', '')).toBe(true)
  })

  it('searches across title, notes, bank and tags', () => {
    expect(searchTransactions(transactions, 'salary')).toEqual([transactions[1]])
    expect(searchTransactions(transactions, 'weekend')).toEqual([transactions[2]])
    expect(searchTransactions(transactions, 'sbi')).toEqual([transactions[0], transactions[2]])
    expect(searchTransactions(transactions, ' fresh ')).toEqual([transactions[0]])
  })

  it('applies multiple filters together', () => {
    const result = applyAdvancedFilters(transactions, {
      type: 'expense',
      category: 'Food',
      bank: 'SBI',
      minAmount: 1000,
      maxAmount: 1500,
      hasReceipt: true,
      tags: ['hom'],
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: new Date('2024-01-31T23:59:59.999Z'),
      search: 'vegetable',
    })

    expect(result).toEqual([transactions[0]])
  })

  it('sorts without mutating the original array', () => {
    const originalIds = transactions.map((transaction) => transaction.id)

    const byAmount = applySorting(transactions, {
      field: 'amount',
      direction: 'asc',
    })
    const byTitle = applySorting(transactions, {
      field: 'title',
      direction: 'desc',
    })

    expect(byAmount.map((transaction) => transaction.id)).toEqual(['3', '1', '2'])
    expect(byTitle.map((transaction) => transaction.id)).toEqual(['2', '3', '1'])
    expect(transactions.map((transaction) => transaction.id)).toEqual(originalIds)
    expect(byAmount).not.toBe(transactions)
  })

  it('persists filter state in localStorage', () => {
    const state = {
      filters: {
        category: 'Food',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T23:59:59.999Z'),
      },
      sort: { field: 'date' as const, direction: 'desc' as const },
      resultCount: 1,
    }

    saveFilterState(state)

    const loaded = loadFilterState()

    expect(loaded).not.toBeNull()
    expect(loaded?.filters.category).toBe('Food')
    expect(loaded?.filters.startDate).toEqual(new Date('2024-01-01T00:00:00.000Z'))
    expect(loaded?.filters.endDate).toEqual(new Date('2024-01-31T23:59:59.999Z'))

    clearFilterState()
    expect(loadFilterState()).toBeNull()
  })

  it('returns readable filter summary labels', () => {
    expect(
      getFilterSummary({
        search: 'milk',
        category: 'Food',
        bank: 'SBI',
        minAmount: 100,
        maxAmount: 500,
        hasReceipt: true,
        tags: ['monthly'],
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T00:00:00.000Z'),
      })
    ).toEqual(
      expect.arrayContaining([
        'Search: "milk"',
        'Category: Food',
        'Bank: SBI',
        'Amount: ₹100 - ₹500',
        'With Receipt',
        'Tags: monthly',
      ])
    )
  })

  it('builds prisma where clause from advanced filters', () => {
    expect(
      buildAdvancedPrismaWhere('user-1', {
        category: 'Food',
        bank: 'SBI',
        paymentMode: 'UPI',
        minAmount: 100,
        maxAmount: 500,
        hasReceipt: true,
        tags: ['monthly', 'home'],
        search: 'veg',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T23:59:59.999Z'),
      })
    ).toEqual({
      userId: 'user-1',
      category: 'Food',
      bank: 'SBI',
      paymentMode: 'UPI',
      date: {
        gte: new Date('2024-01-01T00:00:00.000Z'),
        lte: new Date('2024-01-31T23:59:59.999Z'),
      },
      amount: {
        gte: 100,
        lte: 500,
      },
      receiptUrl: { not: null },
      tags: { hasSome: ['monthly', 'home'] },
      OR: [
        { title: { contains: 'veg', mode: 'insensitive' } },
        { notes: { contains: 'veg', mode: 'insensitive' } },
        { category: { contains: 'veg', mode: 'insensitive' } },
        { bank: { contains: 'veg', mode: 'insensitive' } },
      ],
    })
  })
})
