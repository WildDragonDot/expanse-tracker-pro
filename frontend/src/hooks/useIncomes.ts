import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useNotification } from '@/contexts/NotificationContext'
import { useData } from '@/contexts/DataContext'
import { loadWithMinimumTime } from '@/lib/loadingHelper'

export function useIncomes() {
  const [incomes, setIncomes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotification()
  const { triggerRefresh } = useData()

  const fetchIncomes = useCallback(async (filters?: any) => {
    try {
      setLoading(true)
      
      await loadWithMinimumTime(async () => {
        const data = await api.getIncomes(filters)
        setIncomes(data)
      }, 1000)
    } catch (error: any) {
      console.error('Failed to fetch incomes:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to fetch incomes',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const addIncome = useCallback(async (income: any) => {
    try {
      const newIncome = await api.createIncome(income)
      // Optimistically update local state first (no page refresh)
      setIncomes(prev => [newIncome, ...prev])
      
      // Show notification immediately
      addNotification({
        type: 'success',
        title: 'Income Added',
        message: `₹${income.amount.toLocaleString()} income has been recorded.`,
        duration: 3000
      })
      
      // No need to trigger refresh - we already updated state optimistically
      
      return newIncome
    } catch (error: any) {
      console.error('Failed to add income:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add income',
        duration: 4000
      })
      throw error
    }
  }, [triggerRefresh, addNotification])

  const updateIncome = useCallback(async (income: any) => {
    try {
      const updatedIncome = await api.updateIncome(income.id, income)
      // Optimistically update local state
      setIncomes(prev => prev.map(i => i.id === income.id ? updatedIncome : i))
      
      addNotification({
        type: 'success',
        title: 'Income Updated',
        message: `Income has been successfully updated.`,
        duration: 3000
      })
      
      // No need to trigger refresh - we already updated state optimistically
      
      return updatedIncome
    } catch (error: any) {
      console.error('Failed to update income:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update income',
        duration: 4000
      })
      throw error
    }
  }, [triggerRefresh, addNotification])

  const deleteIncome = useCallback(async (id: string) => {
    try {
      await api.deleteIncome(id)
      // Optimistically update local state
      setIncomes(prev => prev.filter(i => i.id !== id))
      
      addNotification({
        type: 'success',
        title: 'Income Deleted',
        message: 'Income has been successfully deleted.',
        duration: 3000
      })
      
      // No need to trigger refresh - we already updated state optimistically
    } catch (error: any) {
      console.error('Failed to delete income:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to delete income',
        duration: 4000
      })
      throw error
    }
  }, [triggerRefresh, addNotification])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  return {
    incomes,
    loading,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch: fetchIncomes,
  }
}