'use client'

import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotification } from '@/contexts/NotificationContext'
import { InfoTooltip, TipTooltip } from '@/components/Tooltip'
import ProtectedRoute from '@/components/ProtectedRoute'

function SubscriptionsContent() {
  const { subscriptions, detectSubscriptions, loading } = useSubscriptions()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const { addNotification } = useNotification()
  const [detecting, setDetecting] = useState(false)

  const handleDetect = async () => {
    setDetecting(true)
    try {
      await detectSubscriptions()
      addNotification({
        type: 'success',
        title: 'Detection Complete',
        message: 'Successfully analyzed your expenses for recurring subscriptions.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Detection Failed',
        message: 'Failed to detect subscriptions. Please try again.',
        duration: 4000
      })
    } finally {
      setDetecting(false)
    }
  }

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0)
  const totalYearly = totalMonthly * 12

  // Calculate stats
  const stats = {
    total: totalMonthly,
    count: subscriptions.length,
    yearly: totalYearly,
    average: subscriptions.length > 0 ? totalMonthly / subscriptions.length : 0
  }

  return (
    <>
      <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
        {/* Desktop Header */}
        <header className="md:block hidden relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex items-center justify-between gap-4">
              <div className="text-white space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs md:text-sm text-white/80 font-medium bg-white/10 px-2 py-1 rounded-full">
                        Recurring
                      </span>
                      <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                      <span className="text-xs text-white/60">
                        {subscriptions.length} active
                      </span>
                    </div>
                    <h1 className="heading-page">
                      Subscriptions
                    </h1>
                  </div>
                </div>
                <p className="text-sm md:text-base text-white/80 max-w-md">
                  Track and manage all your recurring payments and subscriptions
                </p>
              </div>

              <button
                onClick={toggleTheme}
                disabled={isTransitioning}
                aria-label="Toggle theme"
                className={`theme-toggle-btn flex-shrink-0 p-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isTransitioning ? 'animate-theme-toggle' : ''
                } disabled:opacity-50`}
              >
                <div className="relative w-6 h-6">
                  <svg
                    className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${
                      theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <svg
                    className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${
                      theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Simple Header */}
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-foreground">Subscriptions</h1>
              <p className="text-xs text-muted-foreground">
                {subscriptions.length} active • ₹{stats.total.toLocaleString()}/month
              </p>
            </div>
            <button
              onClick={handleDetect}
              disabled={detecting || loading}
              className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md disabled:opacity-50"
            >
              {detecting ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-8">
          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in">
            <div className="glass-premium rounded-2xl p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg">₹</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-medium">
                    Total
                  </span>
                  <InfoTooltip 
                    content="Total monthly subscription costs"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-emerald-600 flex items-center gap-1">
                  <span className="currency-symbol-xl text-emerald-700">₹</span>
                  <span>{stats.total.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted-foreground">Monthly Spending</p>
              </div>
            </div>

            <div className="glass-premium rounded-2xl p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
                    Count
                  </span>
                  <InfoTooltip 
                    content="Number of active recurring subscriptions detected"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-blue-600">
                  {stats.count}
                </p>
                <p className="text-xs text-muted-foreground">Active Subscriptions</p>
              </div>
            </div>

            <div className="glass-premium rounded-2xl p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded font-medium">
                    Avg
                  </span>
                  <InfoTooltip 
                    content="Average cost per subscription per month"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-amber-600 flex items-center gap-1">
                  <span className="currency-symbol-xl text-amber-700">₹</span>
                  <span>{Math.round(stats.average).toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted-foreground">Average Cost</p>
              </div>
            </div>

            <div className="glass-premium rounded-2xl p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded font-medium">
                    Yearly
                  </span>
                  <InfoTooltip 
                    content="Total annual cost of all subscriptions (monthly × 12)"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-violet-600 flex items-center gap-1">
                  <span className="currency-symbol-xl text-violet-700">₹</span>
                  <span>{stats.yearly.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted-foreground">Annual Cost</p>
              </div>
            </div>
          </div>

          {/* Premium Action Card */}
          <div className="glass-premium rounded-2xl p-6 border border-border/20 shadow-premium animate-slide-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base md:text-lg font-bold text-foreground">Smart Detection</h3>
                    <TipTooltip 
                      content="AI analyzes your expense patterns to identify recurring subscriptions. Looks for similar amounts, regular intervals, and matching merchant names."
                      iconSize="w-3.5 h-3.5"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Automatically find recurring payments in your expenses</p>
                </div>
              </div>
              <button
                onClick={handleDetect}
                disabled={detecting || loading}
                className="btn-premium bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-premium hover:shadow-premium-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 group px-6 py-3"
              >
                {detecting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-semibold">Detecting...</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Detect Now</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Premium Subscriptions List */}
          <div className="glass-premium rounded-2xl border border-border/20 shadow-premium overflow-hidden animate-slide-in">
            {subscriptions.length > 0 ? (
              <>
                <div className="p-6 border-b border-border/20 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-foreground">Active Subscriptions</h2>
                      <p className="text-xs md:text-sm text-muted-foreground">Manage your recurring payments</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Monthly</p>
                      <p className="text-xl font-bold text-violet-600 flex items-center gap-1">
                        <span className="currency-symbol-large">₹</span>
                        <span>{stats.total.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-border/20">
                  {subscriptions.map((sub, index) => (
                    <div
                      key={sub.id}
                      className="p-6 hover:bg-secondary/10 transition-all duration-200 animate-slide-in group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-all duration-200">
                            {sub.name.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            {/* Left: Title and Meta */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                                {sub.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full">
                                  {sub.interval}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Next: {new Date(sub.nextDueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              
                              {/* Detection Info */}
                              <div className="flex items-center gap-1 mt-1">
                                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs text-muted-foreground">
                                  {sub.expenseIds?.length || 0} transactions detected
                                </span>
                              </div>
                            </div>

                            {/* Right: Amount and Actions */}
                            <div className="flex items-center gap-3 ml-4">
                              {/* Amount */}
                              <div className="text-right">
                                <p className="font-bold text-lg text-violet-600 flex items-center gap-1">
                                  <span className="currency-symbol-large">₹</span>
                                  <span>{sub.amount.toLocaleString()}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  per {sub.interval}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    if (confirm(`Remove ${sub.name} subscription?`)) {
                                      // Handle delete - you'll need to implement this in the hook
                                    }
                                  }}
                                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                                  title="Remove subscription"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-12 text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No Subscriptions Found</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Start by adding some recurring expenses, then use our smart detection to automatically identify your subscriptions.
                </p>
                <button
                  onClick={handleDetect}
                  disabled={detecting || loading}
                  className="btn-premium bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-premium hover:shadow-premium-lg px-8 py-3 font-semibold"
                >
                  {detecting ? 'Detecting...' : 'Detect Subscriptions'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  )
}

export default function Subscriptions() {
  return (
    <ProtectedRoute>
      <SubscriptionsContent />
    </ProtectedRoute>
  )
}
