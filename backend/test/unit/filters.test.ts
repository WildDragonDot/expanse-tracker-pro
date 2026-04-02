import { buildPrismaWhere } from '@/lib/filters'

describe('filters', () => {
  it('builds prisma where clauses from supplied filters', () => {
    expect(
      buildPrismaWhere('user-1', {
        category: 'Food',
        bank: 'SBI',
        paymentMode: 'UPI',
        tags: ['home', 'monthly'],
        search: 'milk',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2024-01-31T23:59:59.999Z'),
      })
    ).toEqual({
      userId: 'user-1',
      category: 'Food',
      bank: 'SBI',
      paymentMode: 'UPI',
      tags: { hasSome: ['home', 'monthly'] },
      date: {
        gte: new Date('2024-01-01T00:00:00.000Z'),
        lte: new Date('2024-01-31T23:59:59.999Z'),
      },
      OR: [
        { title: { contains: 'milk', mode: 'insensitive' } },
        { notes: { contains: 'milk', mode: 'insensitive' } },
      ],
    })
  })

  it('returns a minimal where object when no optional filters are provided', () => {
    expect(buildPrismaWhere('user-2', {})).toEqual({ userId: 'user-2' })
  })
})
