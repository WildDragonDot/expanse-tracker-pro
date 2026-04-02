import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useNotification } from '@/contexts/NotificationContext'
import { loadWithMinimumTime } from '@/lib/loadingHelper'

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addNotification } = useNotification()

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      
      await loadWithMinimumTime(async () => {
        const data = await api.getSubscriptions()
        setSubscriptions(data)
      }, 1000)
    } catch (error: any) {
      console.error('Failed to fetch subscriptions:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to fetch subscriptions',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const detectSubscriptions = useCallback(async () => {
    try {
      const result = await api.detectSubscriptions()
      // Refresh the list in background without blocking UI
      fetchSubscriptions()
      addNotification({
        type: 'success',
        title: 'Subscriptions Detected',
        message: `Found ${result.detected} potential subscriptions from your expenses.`,
        duration: 4000
      })
      return result
    } catch (error: any) {
      console.error('Failed to detect subscriptions:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to detect subscriptions',
        duration: 4000
      })
      throw error
    }
  }, [fetchSubscriptions, addNotification])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  return {
    subscriptions,
    loading,
    detectSubscriptions,
    refetch: fetchSubscriptions,
  }
}