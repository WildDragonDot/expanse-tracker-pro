import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useNotification } from '@/contexts/NotificationContext'

export function useAnalytics() {
  const [summary, setSummary] = useState<any>(null)
  const [smartScore, setSmartScore] = useState<any>(null)
  const [loading, setLoading] = useState(false) // Start false to prevent flash
  const { addNotification } = useNotification()

  const fetchFinancialSummary = async (year?: number, month?: number) => {
    try {
      setLoading(true)
      const data = await api.getFinancialSummary(year, month)
      setSummary(data)
      return data
    } catch (error: any) {
      console.error('Failed to fetch financial summary:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to fetch financial summary',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSmartScore = async (year: number, month: number) => {
    try {
      const data = await api.getSmartScore(year, month)
      setSmartScore(data.score)
      return data.score
    } catch (error: any) {
      console.error('Failed to fetch smart score:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to fetch smart score',
        duration: 4000
      })
    }
  }

  const recalculateSmartScore = async (year: number, month: number) => {
    try {
      const result = await api.recalculateSmartScore(year, month)
      setSmartScore(result.score)
      addNotification({
        type: 'success',
        title: 'Smart Score Updated',
        message: `Your financial health score has been recalculated: ${result.score.score}%`,
        duration: 4000
      })
      return result.score
    } catch (error: any) {
      console.error('Failed to recalculate smart score:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to recalculate smart score',
        duration: 4000
      })
      throw error
    }
  }

  const generateMonthlyReport = async (year: number, month: number) => {
    try {
      const result = await api.generateMonthlyReport(year, month)
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Report Sent',
          message: 'Monthly financial report has been sent to your email.',
          duration: 4000
        })
      }
      return result
    } catch (error: any) {
      console.error('Failed to generate monthly report:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to generate monthly report',
        duration: 4000
      })
      throw error
    }
  }

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    fetchFinancialSummary(currentYear, currentMonth)
    fetchSmartScore(currentYear, currentMonth)
  }, [])

  return {
    summary,
    smartScore,
    loading,
    fetchFinancialSummary,
    fetchSmartScore,
    recalculateSmartScore,
    generateMonthlyReport,
    refetch: () => {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      fetchFinancialSummary(currentYear, currentMonth)
      fetchSmartScore(currentYear, currentMonth)
    }
  }
}