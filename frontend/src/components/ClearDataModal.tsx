'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface ClearDataModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ClearDataModal({ isOpen, onClose }: ClearDataModalProps) {
  const { addNotification } = useNotification()
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [clearing, setClearing] = useState(false)

  if (!isOpen) return null

  const handleClear = async () => {
    if (!password) {
      addNotification({
        type: 'error',
        title: 'Password Required',
        message: 'Please enter your password to confirm.',
        duration: 4000
      })
      return
    }

    if (!confirmed) {
      addNotification({
        type: 'error',
        title: 'Confirmation Required',
        message: 'Please check the confirmation box.',
        duration: 4000
      })
      return
    }

    setClearing(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please login first.',
          duration: 4000
        })
        return
      }

      const response = await apiFetch('/api/user/data/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmPassword: password })
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Data Cleared',
          message: 'All your data has been permanently deleted.',
          duration: 5000
        })
        
        onClose()
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to clear data')
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Clear Failed',
        message: error.message || 'Failed to clear data. Please try again.',
        duration: 4000
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="glass w-full sm:max-w-md rounded-xl sm:rounded-2xl border border-border shadow-premium-lg animate-scale-in">
        {/* Header */}
        <div className="glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Clear All Data</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Permanently delete everything</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100 mb-1">⚠️ WARNING: This action cannot be undone!</p>
              <p className="text-xs text-red-700 dark:text-red-300">All your expenses, incomes, categories, and settings will be permanently deleted.</p>
            </div>
          </div>

          {/* What will be deleted */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-foreground">What will be deleted:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Expenses', 'Incomes', 'Categories', 'Banks', 'Shopping Lists', 'Planning', 'Subscriptions', 'Settings'].map((item) => (
                <div key={item} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs sm:text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              Enter your password to confirm *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
              disabled={clearing}
            />
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-border text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              disabled={clearing}
            />
            <span className="text-xs sm:text-sm text-foreground flex-1">
              I understand that this action is <strong>permanent and irreversible</strong>. All my data will be lost forever.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={clearing}
              className="flex-1 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              disabled={clearing || !password || !confirmed}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {clearing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
