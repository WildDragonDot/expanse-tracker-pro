'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/contexts/NotificationContext'

interface BillingCycleModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BillingCycleModal({ isOpen, onClose }: BillingCycleModalProps) {
  const { user } = useAuth()
  const { addNotification } = useNotification()
  const [billingDay, setBillingDay] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      loadBillingCycle()
    }
  }, [isOpen, user])

  const loadBillingCycle = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/user/billing-cycle', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setBillingDay(data.billingCycleStartDay || 1)
      }
    } catch (error) {
      console.error('Error loading billing cycle:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/user/billing-cycle', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ billingCycleStartDay: billingDay })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Billing Cycle Updated',
          message: `Your billing cycle now starts on the ${billingDay}${getOrdinalSuffix(billingDay)} of each month`,
          duration: 4000
        })
        onClose()
      } else {
        throw new Error('Failed to update billing cycle')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update billing cycle. Please try again.',
        duration: 4000
      })
    } finally {
      setSaving(false)
    }
  }

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  const getExampleDates = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    const startDate = new Date(currentYear, currentMonth, billingDay)
    const endDate = new Date(currentYear, currentMonth + 1, billingDay - 1)
    
    return {
      start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (!isOpen) return null

  const examples = getExampleDates()

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="glass-premium rounded-2xl sm:rounded-3xl max-w-lg w-full border border-border/30 shadow-2xl animate-scale-in relative z-[101] max-h-[90vh] sm:max-h-[85vh] flex flex-col my-4 sm:my-8">
        {/* Header - Fixed */}
        <div className="relative overflow-hidden rounded-t-2xl sm:rounded-t-3xl flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="relative px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Billing Cycle</h2>
                  <p className="text-xs sm:text-sm text-white/80">Set your monthly cycle start day</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
              {/* Info Box */}
              <div className="glass-premium rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">What is this?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Set the day when your monthly billing cycle starts. This affects how monthly expenses, budgets, and analytics are calculated. For example, if your salary comes on the 11th, set it to 11.
                    </p>
                  </div>
                </div>
              </div>

              {/* Day Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">
                  Billing Cycle Start Day
                </label>
                
                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="31"
                    value={billingDay}
                    onChange={(e) => {
      const value = parseInt(e.target.value)
      if (!isNaN(value) && value >= 1 && value <= 31) {
        setBillingDay(value)
      }
    }}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  
                  {/* Day Display */}
                  <div className="flex items-center justify-center">
                    <div className="glass-premium rounded-2xl px-6 py-4 border border-primary/20 bg-primary/5">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">
                          {billingDay}
                          <span className="text-2xl">{getOrdinalSuffix(billingDay)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">of each month</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-2">
                  {[1, 5, 10, 15, 20, 25].map((day) => (
                    <button
                      key={day}
                      onClick={() => setBillingDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        billingDay === day
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-secondary hover:bg-secondary/80 text-foreground'
                      }`}
                    >
                      {day}{getOrdinalSuffix(day)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Example Period */}
              <div className="glass-premium rounded-xl p-4 border border-border/20">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Current Month Example:</p>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{examples.start}</p>
                    <p className="text-xs text-muted-foreground">Cycle Start</p>
                  </div>
                  
                  <div className="flex-shrink-0 px-4">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  
                  <div className="text-center flex-1">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{examples.end}</p>
                    <p className="text-xs text-muted-foreground">Cycle End</p>
                  </div>
                </div>
              </div>

              {/* Impact Notice */}
              <div className="glass-premium rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">This will affect:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Monthly expense calculations</li>
                      <li>• Budget tracking periods</li>
                      <li>• Analytics and reports</li>
                      <li>• Monthly summaries</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-secondary/30 rounded-b-2xl sm:rounded-b-3xl flex gap-2 sm:gap-3 flex-shrink-0 border-t border-border/10">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg sm:rounded-xl font-medium transition-all disabled:opacity-50 hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Saving...</span>
                <span className="sm:hidden">Save</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
