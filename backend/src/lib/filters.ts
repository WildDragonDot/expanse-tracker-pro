import { Prisma } from '@prisma/client'

export interface ExpenseFilters {
  startDate?: Date
  endDate?: Date
  category?: string
  bank?: string
  paymentMode?: string
  tags?: string[]
  search?: string
}

export function buildPrismaWhere(userId: string, filters: ExpenseFilters): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = { userId }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) where.date.gte = filters.startDate
    if (filters.endDate) where.date.lte = filters.endDate
  }

  if (filters.category) where.category = filters.category
  if (filters.bank) where.bank = filters.bank
  if (filters.paymentMode) where.paymentMode = filters.paymentMode
  
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags }
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  return where
}
