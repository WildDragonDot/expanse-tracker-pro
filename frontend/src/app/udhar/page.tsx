'use client'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import AddUdharModal from '@/components/AddUdharModal'
import { HeaderSkeleton, CardSkeleton, ListItemSkeleton } from '@/components/Skeleton'
import { useUdhar } from '@/hooks/useUdhar'
import { useTheme } from '@/contexts/ThemeContext'
import { InfoTooltip } from '@/components/Tooltip'
import ProtectedRoute from '@/components/ProtectedRoute'

function UdharContent() {
  const { udhars, addUdhar, deleteUdhar, loading } = useUdhar()
  const [showModal, setShowModal] = useState(false)
  const { theme, toggleTheme, isTransitioning } = useTheme()

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
          {/* Header Skeleton */}
          <HeaderSkeleton />

          {/* Content Skeleton */}
          <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>

            {/* Action Button Skeleton */}
            <div className="flex justify-center">
              <div className="w-40 h-12 bg-muted/50 rounded-2xl animate-pulse"></div>
            </div>

            {/* Udhar List Skeleton */}
            <div className="glass rounded-2xl border border-border shadow-premium overflow-hidden animate-pulse">
              <div className="p-4 border-b border-border">
                <div className="w-32 h-6 bg-muted/50 rounded animate-pulse"></div>
              </div>
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <ListItemSkeleton key={i} />
                ))}
              </div>
            </div>
          </main>
        </div>
        <BottomNav />
      </>
    )
  }

  const handleAddUdhar = async (udhar: any) => {
    try {
      await addUdhar(udhar)
      setShowModal(false)
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to add udhar:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this loan?')) {
      try {
        await deleteUdhar(id)
      } catch (error) {
        // Error handling is done in the hook
        console.error('Failed to delete udhar:', error)
      }
    }
  }

  const totalGiven = udhars.filter(u => u.direction === 'given').reduce((sum, u) => sum + u.remaining, 0)
  const totalTaken = udhars.filter(u => u.direction === 'taken').reduce((sum, u) => sum + u.remaining, 0)
  const netBalance = totalGiven - totalTaken

  return (
    <>
      <div className="min-h-screen bg-background text-foreground pt-16 pb-24 md:pt-6 md:pb-12 md:pl-64 lg:pl-72">
        {/* Desktop Header Banner */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  IOU Tracker
                </span>
                <span className="text-xs text-white/80">
                  {udhars.length} loans • Net: ₹{Math.abs(netBalance).toLocaleString()} {netBalance >= 0 ? 'receivable' : 'payable'}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Udhar & Loan Tracker</h1>
              <p className="text-sm text-white/80 max-w-lg">
                Keep track of money lent to friends and borrowed from others with settlement logs.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-amber-700 font-bold text-sm shadow-lg hover:bg-white/90 hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Record</span>
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 md:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-2xl p-4 border border-border shadow-lg animate-slide-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Money Given</p>
                    <InfoTooltip 
                      content="Total amount you have lent to others"
                      iconSize="w-2.5 h-2.5"
                    />
                  </div>
                  <p className="metric-value text-emerald-600 dark:text-emerald-400"><span className="currency-symbol">₹</span>{totalGiven.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 border border-border shadow-lg animate-slide-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Money Taken</p>
                    <InfoTooltip 
                      content="Total amount you have borrowed from others"
                      iconSize="w-2.5 h-2.5"
                    />
                  </div>
                  <p className="metric-value text-red-500 dark:text-red-400"><span className="currency-symbol">₹</span>{totalTaken.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 border border-border shadow-lg animate-slide-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  netBalance >= 0 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-orange-500 to-orange-600'
                }`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-muted-foreground">Net Balance</p>
                    <InfoTooltip 
                      content={netBalance >= 0 ? "You are owed this amount (Money Given - Money Taken)" : "You owe this amount (Money Taken - Money Given)"}
                      iconSize="w-2.5 h-2.5"
                    />
                  </div>
                  <p className={`metric-value ${
                    netBalance >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-orange-500 dark:text-orange-400'
                  }`}>
                    <span className="currency-symbol">₹</span>{Math.abs(netBalance).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowModal(true)}
              className="btn-premium w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg flex items-center justify-center gap-2 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Loan</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          {/* Loans List */}
          <div className="glass rounded-2xl border border-border shadow-lg overflow-hidden">
            {udhars.length > 0 ? (
              <div className="divide-y divide-border">
                {udhars.map((udhar, index) => (
                  <div
                    key={udhar.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                          udhar.direction === 'given' 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                            : 'bg-gradient-to-br from-red-500 to-red-600'
                        }`}>
                          {udhar.person.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{udhar.person}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              udhar.direction === 'given' 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                              {udhar.direction === 'given' ? 'Given' : 'Taken'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{udhar.reason}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Total: <span className="currency-symbol">₹</span>{udhar.total.toLocaleString()}</span>
                            <span>•</span>
                            <span>Created: {new Date(udhar.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className={`metric-value ${
                            udhar.direction === 'given' 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            <span className="currency-symbol">₹</span>{udhar.remaining.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(udhar.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center py-16">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="heading-card mb-2">No loans recorded</p>
                <p className="text-muted-foreground text-sm mb-6">
                  Start tracking by adding your first loan
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 active:scale-95 px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 rounded-xl inline-flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Loan
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Floating Action Button - Mobile Only */}
        <button
          onClick={() => setShowModal(true)}
          className="hidden fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-full shadow-xl items-center justify-center hover:scale-110 transition-transform z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <AddUdharModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleAddUdhar}
      />

      <BottomNav />
    </>
  )
}

export default function Udhar() {
  return (
    <ProtectedRoute>
      <UdharContent />
    </ProtectedRoute>
  )
}
