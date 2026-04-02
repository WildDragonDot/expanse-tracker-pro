'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const { addNotification } = useNotification()
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    expenseAlerts: true,
    budgetWarnings: true,
    weeklyReports: false,
    monthlyReports: true,
    transactionUpdates: true,
    securityAlerts: true,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch settings when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await apiFetch('/api/user/notification-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please login to save settings.',
          duration: 4000
        })
        return
      }

      const response = await apiFetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Settings Saved',
          message: 'Your notification preferences have been updated.',
          duration: 4000
        })
        onClose()
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save notification settings. Please try again.',
        duration: 4000
      })
    } finally {
      setSaving(false)
    }
  }

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{ minHeight: '25px' }}
      className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-12 items-center rounded-full transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95 ${
        enabled 
          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 focus:ring-cyan-500/50 shadow-lg shadow-cyan-500/30' 
          : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400/50 shadow-inner'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          enabled ? 'translate-x-6 sm:translate-x-6 scale-110' : 'translate-x-1 scale-100'
        }`}
      />
    </button>
  )

  const notificationSections = [
    {
      title: 'General',
      items: [
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive notifications on your device' },
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Get updates via email' },
      ]
    },
    {
      title: 'Expense Tracking',
      items: [
        { key: 'expenseAlerts', label: 'Expense Alerts', description: 'Get notified when you add expenses' },
        { key: 'budgetWarnings', label: 'Budget Warnings', description: 'Alert when approaching budget limits' },
        { key: 'transactionUpdates', label: 'Transaction Updates', description: 'Updates on transaction status' },
      ]
    },
    {
      title: 'Reports',
      items: [
        { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly spending summaries' },
        { key: 'monthlyReports', label: 'Monthly Reports', description: 'Get detailed monthly reports' },
      ]
    },
    {
      title: 'Security',
      items: [
        { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security notifications' },
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="glass w-full sm:max-w-lg rounded-xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col border border-border shadow-premium-lg animate-scale-in">
        <div className="flex-shrink-0 glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM15 7h5l-5-5v5zM9 17H4l5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Notifications</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading settings...</p>
              </div>
            </div>
          ) : (
            <>
              {notificationSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 uppercase tracking-wide">{section.title}</h3>
                  <div className="space-y-2 sm:space-y-2.5">
                    {section.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3 py-2.5 px-3 sm:py-3 sm:px-3.5 rounded-lg sm:rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-foreground mb-0.5">{item.label}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{item.description}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <ToggleSwitch
                            enabled={settings[item.key as keyof typeof settings]}
                            onToggle={() => handleToggle(item.key as keyof typeof settings)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="flex space-x-3 pt-4 sm:pt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
