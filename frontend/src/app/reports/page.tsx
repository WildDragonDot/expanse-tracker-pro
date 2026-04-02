'use client'

import BottomNav from '@/components/BottomNav'
import { LazyReportsModal } from '@/components/LazyModals'
import { useTheme } from '@/contexts/ThemeContext'
import { HeaderSkeleton, CardSkeleton } from '@/components/Skeleton'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncomes } from '@/hooks/useIncomes'
import { InfoTooltip } from '@/components/Tooltip'
import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

function ReportsContent() {
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const { expenses, loading: expensesLoading } = useExpenses()
  const { incomes, loading: incomesLoading } = useIncomes()
  const [showReportsModal, setShowReportsModal] = useState(false)

  // Get unique categories for reports modal
  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))]

  const handleOpenReports = () => {
    setShowReportsModal(true)
  }

  if (expensesLoading || incomesLoading) {
    return (
      <>
        <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
          {/* Header Skeleton */}
          <HeaderSkeleton />

          {/* Content Skeleton */}
          <main className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-8">
            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>

            {/* Report Generator Skeleton */}
            <div className="glass rounded-2xl p-6 border border-border shadow-premium animate-pulse">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-muted/50 rounded-2xl mx-auto animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-48 h-6 bg-muted/50 rounded mx-auto animate-pulse"></div>
                  <div className="w-64 h-4 bg-muted/50 rounded mx-auto animate-pulse"></div>
                </div>
                <div className="w-40 h-12 bg-muted/50 rounded-2xl mx-auto animate-pulse"></div>
              </div>
            </div>

            {/* Features Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 border border-border shadow-premium text-center animate-pulse">
                  <div className="w-12 h-12 bg-muted/50 rounded-xl mx-auto mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-24 h-5 bg-muted/50 rounded mx-auto animate-pulse"></div>
                    <div className="w-32 h-4 bg-muted/50 rounded mx-auto animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
        <BottomNav />
      </>
    )
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs md:text-sm text-white/80 font-medium bg-white/10 px-2 py-1 rounded-full">
                        Analytics
                      </span>
                      <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                      <span className="text-xs text-white/60">
                        Export & Analyze
                      </span>
                    </div>
                    <h1 className="heading-page">
                      Financial Reports
                    </h1>
                  </div>
                </div>
                <p className="text-sm md:text-base text-white/80 max-w-md">
                  Generate detailed reports and export your financial data
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
              <h1 className="text-base font-bold text-foreground">Reports</h1>
              <p className="text-xs text-muted-foreground">
                Export & Analyze • {expenses.length + incomes.length} transactions
              </p>
            </div>
            <button
              onClick={handleOpenReports}
              className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 animate-slide-in">
            <div className="glass rounded-2xl p-6 border border-border shadow-premium">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">Total Income</span>
                  <InfoTooltip 
                    content="Sum of all income transactions recorded"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600"><span className="currency-symbol-large">₹</span>{incomes.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{incomes.length} transactions</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-border shadow-premium">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">Total Expenses</span>
                  <InfoTooltip 
                    content="Sum of all expense transactions recorded"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-600"><span className="currency-symbol-large">₹</span>{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{expenses.length} transactions</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-border shadow-premium">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">Net Savings</span>
                  <InfoTooltip 
                    content="Total income minus total expenses (positive = savings, negative = deficit)"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <p className="text-2xl font-bold text-violet-600"><span className="currency-symbol-large">₹</span>{(incomes.reduce((sum, i) => sum + i.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Available balance</p>
            </div>
          </div>

          {/* Report Generator */}
          <div className="glass rounded-2xl p-6 border border-border shadow-premium animate-slide-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Generate Financial Reports</h2>
              <p className="text-muted-foreground mb-6">Export your financial data with flexible filtering options</p>
              
              <button
                onClick={handleOpenReports}
                className="btn-premium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-1 px-8 py-4 text-lg font-semibold transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Open Report Generator
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in">
            <div className="glass rounded-2xl p-6 border border-border shadow-premium text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Excel Export</h3>
              <p className="text-sm text-muted-foreground">Export your data to Excel with detailed formatting and summaries</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-border shadow-premium text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Email Reports</h3>
              <p className="text-sm text-muted-foreground">Send detailed financial reports directly to your email</p>
            </div>

            <div className="glass rounded-2xl p-6 border border-border shadow-premium text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Flexible Filters</h3>
              <p className="text-sm text-muted-foreground">Filter by date range, category, and custom periods</p>
            </div>
          </div>
        </main>
      </div>

      <LazyReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        expenses={expenses}
        incomes={incomes}
        categories={categories}
      />

      <BottomNav />
    </>
  )
}

export default function Reports() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  )
}
