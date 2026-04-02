'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  AdvancedExpenseFilters, 
  SortOptions, 
  FilterState,
  applyAdvancedFilters,
  applySorting,
  searchTransactions,
  saveFilterState,
  loadFilterState,
  clearFilterState
} from '@/lib/advancedFilters'

interface UseAdvancedFiltersProps {
  transactions: any[]
  persistState?: boolean
}

interface UseAdvancedFiltersReturn {
  filters: AdvancedExpenseFilters
  sort: SortOptions
  filteredTransactions: any[]
  resultCount: number
  totalCount: number
  setFilters: (filters: AdvancedExpenseFilters) => void
  setSort: (sort: SortOptions) => void
  clearAllFilters: () => void
  searchSuggestions: string[]
}

const defaultFilters: AdvancedExpenseFilters = {
  type: 'all'
}

const defaultSort: SortOptions = {
  field: 'date',
  direction: 'desc'
}

export function useAdvancedFilters({ 
  transactions, 
  persistState = true 
}: UseAdvancedFiltersProps): UseAdvancedFiltersReturn {
  const [filters, setFiltersState] = useState<AdvancedExpenseFilters>(defaultFilters)
  const [sort, setSortState] = useState<SortOptions>(defaultSort)

  // Load persisted state on mount
  useEffect(() => {
    if (persistState) {
      const savedState = loadFilterState()
      if (savedState) {
        setFiltersState(savedState.filters)
        setSortState(savedState.sort)
      }
    }
  }, [persistState])

  // Save state when filters or sort change
  useEffect(() => {
    if (persistState) {
      const state: FilterState = {
        filters,
        sort,
        resultCount: 0 // Will be updated by the filtered results
      }
      saveFilterState(state)
    }
  }, [filters, sort, persistState])

  // Generate search suggestions from transaction data
  const searchSuggestions = useMemo(() => {
    const suggestions = new Set<string>()
    
    transactions.forEach(transaction => {
      // Add titles
      if (transaction.title) {
        suggestions.add(transaction.title)
      }
      
      // Add categories
      if (transaction.category) {
        suggestions.add(transaction.category)
      }
      
      // Add banks
      if (transaction.bank) {
        suggestions.add(transaction.bank)
      }
      
      // Add tags
      if (transaction.tags && Array.isArray(transaction.tags)) {
        transaction.tags.forEach((tag: string) => suggestions.add(tag))
      }
      
      // Add notes (first few words)
      if (transaction.notes) {
        const words = transaction.notes.split(' ').slice(0, 3).join(' ')
        if (words.length > 2) {
          suggestions.add(words)
        }
      }
    })
    
    return Array.from(suggestions)
      .filter(s => s.length > 1)
      .sort()
      .slice(0, 50) // Limit suggestions
  }, [transactions])

  // Apply filters and sorting
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]
    
    // Apply search first (most selective)
    if (filters.search) {
      result = searchTransactions(result, filters.search)
    }
    
    // Apply other filters
    result = applyAdvancedFilters(result, filters)
    
    // Apply sorting
    result = applySorting(result, sort)
    
    return result
  }, [transactions, filters, sort])

  // Update filters with callback
  const setFilters = useCallback((newFilters: AdvancedExpenseFilters) => {
    setFiltersState(newFilters)
  }, [])

  // Update sort with callback
  const setSort = useCallback((newSort: SortOptions) => {
    setSortState(newSort)
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFiltersState(defaultFilters)
    setSortState(defaultSort)
    if (persistState) {
      clearFilterState()
    }
  }, [persistState])

  return {
    filters,
    sort,
    filteredTransactions,
    resultCount: filteredTransactions.length,
    totalCount: transactions.length,
    setFilters,
    setSort,
    clearAllFilters,
    searchSuggestions
  }
}