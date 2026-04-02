import { Prisma } from '@prisma/client'

export interface AdvancedExpenseFilters {
  startDate?: Date
  endDate?: Date
  category?: string
  bank?: string
  paymentMode?: string
  tags?: string[]
  search?: string
  minAmount?: number
  maxAmount?: number
  hasReceipt?: boolean
  type?: 'expense' | 'income' | 'all'
}

export interface SortOptions {
  field: 'date' | 'amount' | 'title' | 'category' | 'bank'
  direction: 'asc' | 'desc'
}

export interface FilterState {
  filters: AdvancedExpenseFilters
  sort: SortOptions
  resultCount: number
}

// Fuzzy search implementation
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // Exact match
  if (textLower.includes(queryLower)) return true
  
  // Fuzzy matching - allow for typos and partial matches
  let queryIndex = 0
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }
  
  return queryIndex === queryLower.length
}

// Multi-field search with fuzzy matching
export function searchTransactions(transactions: any[], searchQuery: string): any[] {
  if (!searchQuery.trim()) return transactions
  
  const query = searchQuery.trim()
  
  return transactions.filter(transaction => {
    const searchFields = [
      transaction.title || '',
      transaction.category || '',
      transaction.bank || '',
      transaction.notes || '',
      ...(transaction.tags || [])
    ]
    
    return searchFields.some(field => fuzzyMatch(field, query))
  })
}

// Enhanced filtering with amount ranges and receipt filtering
export function applyAdvancedFilters(transactions: any[], filters: AdvancedExpenseFilters): any[] {
  return transactions.filter(transaction => {
    // Type filter
    if (filters.type && filters.type !== 'all') {
      if (filters.type !== transaction.type) return false
    }
    
    // Category filter
    if (filters.category && filters.category !== 'All' && transaction.category !== filters.category) {
      return false
    }
    
    // Bank filter
    if (filters.bank && filters.bank !== 'All' && transaction.bank !== filters.bank) {
      return false
    }
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      const transactionDate = new Date(transaction.date)
      if (filters.startDate && transactionDate < filters.startDate) return false
      if (filters.endDate && transactionDate > filters.endDate) return false
    }
    
    // Amount range filter
    if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
      return false
    }
    if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
      return false
    }
    
    // Receipt filter
    if (filters.hasReceipt !== undefined) {
      const hasReceipt = !!(transaction.receiptUrl || transaction.receipt)
      if (filters.hasReceipt !== hasReceipt) return false
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const transactionTags = transaction.tags || []
      const hasMatchingTag = filters.tags.some(tag => 
        transactionTags.some((tTag: string) => tTag.toLowerCase().includes(tag.toLowerCase()))
      )
      if (!hasMatchingTag) return false
    }
    
    // Search filter (applied separately for better performance)
    if (filters.search) {
      return searchTransactions([transaction], filters.search).length > 0
    }
    
    return true
  })
}

// Enhanced sorting with multiple options
export function applySorting(transactions: any[], sort: SortOptions): any[] {
  return [...transactions].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sort.field) {
      case 'amount':
        aValue = a.amount
        bValue = b.amount
        break
      case 'title':
        aValue = (a.title || '').toLowerCase()
        bValue = (b.title || '').toLowerCase()
        break
      case 'category':
        aValue = (a.category || '').toLowerCase()
        bValue = (b.category || '').toLowerCase()
        break
      case 'bank':
        aValue = (a.bank || '').toLowerCase()
        bValue = (b.bank || '').toLowerCase()
        break
      case 'date':
      default:
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
    }
    
    if (sort.direction === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  })
}

// Filter state persistence
export function saveFilterState(state: FilterState): void {
  try {
    localStorage.setItem('expenseFilters', JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save filter state:', error)
  }
}

export function loadFilterState(): FilterState | null {
  try {
    const saved = localStorage.getItem('expenseFilters')
    if (saved) {
      const parsed = JSON.parse(saved)
      // Convert date strings back to Date objects
      if (parsed.filters.startDate) {
        parsed.filters.startDate = new Date(parsed.filters.startDate)
      }
      if (parsed.filters.endDate) {
        parsed.filters.endDate = new Date(parsed.filters.endDate)
      }
      return parsed
    }
  } catch (error) {
    console.warn('Failed to load filter state:', error)
  }
  return null
}

export function clearFilterState(): void {
  try {
    localStorage.removeItem('expenseFilters')
  } catch (error) {
    console.warn('Failed to clear filter state:', error)
  }
}

// Get filter summary for display
export function getFilterSummary(filters: AdvancedExpenseFilters): string[] {
  const summary: string[] = []
  
  if (filters.search) {
    summary.push(`Search: "${filters.search}"`)
  }
  
  if (filters.category && filters.category !== 'All') {
    summary.push(`Category: ${filters.category}`)
  }
  
  if (filters.bank && filters.bank !== 'All') {
    summary.push(`Bank: ${filters.bank}`)
  }
  
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const min = filters.minAmount ?? 0
    const max = filters.maxAmount ?? '∞'
    summary.push(`Amount: ₹${min} - ₹${max}`)
  }
  
  if (filters.hasReceipt !== undefined) {
    summary.push(filters.hasReceipt ? 'With Receipt' : 'Without Receipt')
  }
  
  if (filters.tags && filters.tags.length > 0) {
    summary.push(`Tags: ${filters.tags.join(', ')}`)
  }
  
  if (filters.startDate || filters.endDate) {
    const start = filters.startDate?.toLocaleDateString() ?? 'Start'
    const end = filters.endDate?.toLocaleDateString() ?? 'End'
    summary.push(`Date: ${start} - ${end}`)
  }
  
  return summary
}

// Prisma query builder for server-side filtering
export function buildAdvancedPrismaWhere(userId: string, filters: AdvancedExpenseFilters): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = { userId }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) where.date.gte = filters.startDate
    if (filters.endDate) where.date.lte = filters.endDate
  }

  if (filters.category && filters.category !== 'All') {
    where.category = filters.category
  }
  
  if (filters.bank && filters.bank !== 'All') {
    where.bank = filters.bank
  }
  
  if (filters.paymentMode) {
    where.paymentMode = filters.paymentMode
  }
  
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {}
    if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount
    if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount
  }
  
  if (filters.hasReceipt !== undefined) {
    if (filters.hasReceipt) {
      where.receiptUrl = { not: null }
    } else {
      where.receiptUrl = null
    }
  }
  
  if (filters.tags && filters.tags.length > 0) {
    where.tags = { hasSome: filters.tags }
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { notes: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
      { bank: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  return where
}