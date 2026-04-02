'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface DataContextType {
  refreshTrigger: number
  triggerRefresh: () => void
  financialSummary: any
  refreshFinancialSummary: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [financialSummary, setFinancialSummary] = useState<any>(null)
  const { user, loading } = useAuth()

  const triggerRefresh = () => {
    // Debounce refresh to prevent multiple rapid refreshes
    setRefreshTrigger(prev => prev + 1)
  }

  const refreshFinancialSummary = async () => {
    // Only fetch data if user is authenticated
    if (!user) {
      setFinancialSummary(null)
      return
    }

    try {
      const summary = await api.getFinancialSummary()
      setFinancialSummary(summary)
    } catch (error) {
      setFinancialSummary(null)
    }
  }

  useEffect(() => {
    // Only refresh when auth loading is complete
    if (!loading && user) {
      // Debounce the refresh to prevent rapid consecutive calls
      const timeoutId = setTimeout(() => {
        refreshFinancialSummary()
      }, 300) // 300ms debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [refreshTrigger, user, loading])

  return (
    <DataContext.Provider value={{ 
      refreshTrigger, 
      triggerRefresh, 
      financialSummary, 
      refreshFinancialSummary 
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}