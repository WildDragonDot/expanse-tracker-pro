import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useNotification } from '@/contexts/NotificationContext'
import { loadWithMinimumTime } from '@/lib/loadingHelper'

export function useExpenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotification()

  const fetchExpenses = useCallback(async (filters?: any) => {
    try {
      setLoading(true)
      
      await loadWithMinimumTime(async () => {
        const data = await api.getExpenses(filters)
        setExpenses(data)
      }, 800)
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to fetch expenses',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const addExpense = useCallback(async (expense: any) => {
    try {
      const newExpense = await api.createExpense(expense)
      
      // Optimistically update local state first (no page refresh)
      setExpenses(prev => [newExpense, ...prev])
      
      // Show notification immediately
      addNotification({
        type: 'success',
        title: 'Expense Added',
        message: `₹${expense.amount.toLocaleString()} expense has been recorded.`,
        duration: 2000
      })
      
      return newExpense
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add expense',
        duration: 4000
      })
      throw error
    }
  }, [addNotification])

  const updateExpense = useCallback(async (expense: any) => {
    try {
      const updatedExpense = await api.updateExpense(expense.id, expense)
      
      // Optimistically update local state
      setExpenses(prev => prev.map(e => e.id === expense.id ? updatedExpense : e))
      
      addNotification({
        type: 'success',
        title: 'Expense Updated',
        message: 'Expense has been successfully updated.',
        duration: 3000
      })
      
      return updatedExpense
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update expense',
        duration: 4000
      })
      throw error
    }
  }, [addNotification])

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await api.deleteExpense(id)
      
      // Optimistically update local state
      setExpenses(prev => prev.filter(e => e.id !== id))
      
      addNotification({
        type: 'success',
        title: 'Expense Deleted',
        message: 'Expense has been successfully deleted.',
        duration: 3000
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to delete expense',
        duration: 4000
      })
      throw error
    }
  }, [addNotification])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  }
}