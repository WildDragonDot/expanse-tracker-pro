'use client'

import { useEffect, memo, useMemo } from 'react'

interface CategoryDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  category: string
  expenses: any[]
  totalAmount: number
  budgetAmount?: number
  payableBank?: string
  onEditExpense?: (expense: any) => void
  onDeleteExpense?: (id: string) => void
  onExpenseClick?: (expense: any) => void
}

function CategoryDetailsModal({
  isOpen,
  onClose,
  category,
  expenses,
  totalAmount,
  budgetAmount = 0,
  payableBank,
  onEditExpense,
  onDeleteExpense,
  onExpenseClick
}: CategoryDetailsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Sort expenses by date (most recent first) - memoized
  const sortedExpenses = useMemo(() => 
    [...expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ), [expenses]
  )

  // Calculate stats - memoized
  const stats = useMemo(() => ({
    averageAmount: expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0,
    highestAmount: expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0,
    lowestAmount: expenses.length > 0 ? Math.min(...expenses.map(e => e.amount)) : 0,
  }), [expenses, totalAmount])
  
  // Budget calculations - memoized
  const budgetStats = useMemo(() => {
    const remaining = budgetAmount - totalAmount
    const percentage = budgetAmount > 0 ? Math.round((totalAmount / budgetAmount) * 100) : 0
    const status = percentage > 100 ? 'over' : percentage >= 80 ? 'warning' : 'good'
    return { remaining, percentage, status }
  }, [budgetAmount, totalAmount])
  
  // Get category icon
  const getCategoryIcon = useMemo(() => (cat: string) => {
    const icons: Record<string, string> = {
      'Food': '🍔',
      'Transport': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Bills': '📄',
      'Health': '🏥',
      'Education': '📚',
      'Other': '📦'
    }
    return icons[cat] || '📦'
  }, [])

  if (!isOpen) return null

  const { averageAmount, highestAmount, lowestAmount } = stats
  const { remaining, percentage, status } = budgetStats

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Premium Modal */}
      <div
        className="glass-premium w-full sm:max-w-lg rounded-2xl sm:rounded-3xl max-h-[94vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex-shrink-0 px-4 py-3 sm:px-5 sm:py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="text-3xl sm:text-4xl">{getCategoryIcon(category)}</div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">{category}</h2>
                <p className="text-xs text-muted-foreground">{expenses.length} transactions</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 hover:rotate-90 border border-border/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Premium Budget Card */}
        <div className="relative flex-shrink-0 px-4 py-3 sm:px-5 sm:py-4">
          <div className={`relative rounded-2xl p-5 sm:p-6 glass-premium border overflow-hidden transition-all duration-300 ${
            status === 'good' ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent' :
            status === 'warning' ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent' :
            'border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent'
          }`}>
            {/* Animated background glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${
              status === 'good' ? 'bg-emerald-500' :
              status === 'warning' ? 'bg-amber-500' :
              'bg-rose-500'
            }`}></div>
            
            <div className="relative">
              {budgetAmount > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Spent Amount</p>
                      <p className="text-2xl sm:text-3xl font-black text-foreground">
                        ₹{totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        of ₹{budgetAmount.toLocaleString()} budget
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm border ${
                        status === 'good' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                        status === 'warning' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                        'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Slick Progress Bar */}
                  <div className="relative w-full h-1.5 bg-gradient-to-r from-secondary/30 via-secondary/50 to-secondary/30 rounded-full overflow-visible mb-2.5 sm:mb-3 shadow-inner">
                    {/* Background glow */}
                    <div className={`absolute inset-0 rounded-full blur-md opacity-30 ${
                      status === 'good' ? 'bg-emerald-500' :
                      status === 'warning' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}></div>
                    
                    {/* Progress fill */}
                    <div
                      className={`relative h-full transition-all duration-1000 ease-out rounded-full overflow-hidden ${
                        status === 'good' ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-600' :
                        status === 'warning' ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600' :
                        'bg-gradient-to-r from-rose-400 via-rose-500 to-red-600'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    >
                      {/* Animated shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
                      
                      {/* Top highlight */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>
                      
                      {/* Pulsing glow */}
                      <div className={`absolute inset-0 rounded-full animate-pulse ${
                        status === 'good' ? 'shadow-[0_0_12px_rgba(16,185,129,0.6)]' :
                        status === 'warning' ? 'shadow-[0_0_12px_rgba(245,158,11,0.6)]' :
                        'shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                      }`}></div>
                    </div>
                    
                    {/* Progress indicator dot */}
                    {percentage > 0 && (
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-1000 ease-out ${
                          status === 'good' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                          status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                          'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                        } border-2 border-white dark:border-gray-900`}
                        style={{ left: `calc(${Math.min(percentage, 100)}% - 6px)` }}
                      >
                        <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        remaining > 0 ? 'bg-emerald-500' : remaining < 0 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}></div>
                      <span className="text-muted-foreground">
                        {remaining > 0 ? 'Remaining' : remaining < 0 ? 'Over by' : 'Exact match'}:
                      </span>
                      <span className={`font-bold ${
                        remaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                        remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 
                        'text-amber-600 dark:text-amber-400'
                      }`}>
                        ₹{Math.abs(remaining).toLocaleString()}
                      </span>
                    </div>
                    <span className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg ${
                      status === 'over' ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10' :
                      status === 'warning' ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                      'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    }`}>
                      {status === 'over' ? '⚠️ Over budget' : status === 'warning' ? '⚡ Near limit' : '✓ On track'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xl sm:text-2xl font-black text-foreground mb-1">
                    ₹{totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total spent (no budget set)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex-shrink-0 px-4 py-3 sm:px-5 sm:py-4 pb-6 sm:pb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-0.5 sm:mb-1 uppercase tracking-wide">Average</p>
              <p className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400">₹{averageAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 bg-gradient-to-br from-rose-500/10 to-rose-600/10 border border-rose-500/20 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-0.5 sm:mb-1 uppercase tracking-wide">Highest</p>
              <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">₹{highestAmount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg sm:rounded-xl p-2.5 sm:p-3 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-0.5 sm:mb-1 uppercase tracking-wide">Lowest</p>
              <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">₹{lowestAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5 custom-scrollbar">
          {sortedExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-3 sm:mb-4 border border-border/50">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">No Expenses Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">No expenses found in this category</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-2.5 pb-3 sm:pb-4">
              {sortedExpenses.map((expense) => {
                const expenseDate = new Date(expense.date)
                const isToday = expenseDate.toDateString() === new Date().toDateString()
                const isYesterday = expenseDate.toDateString() === new Date(Date.now() - 86400000).toDateString()
                
                let dateLabel = expenseDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: expenseDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })
                
                if (isToday) dateLabel = 'Today'
                else if (isYesterday) dateLabel = 'Yesterday'

                return (
                  <div
                    key={expense.id}
                    onClick={() => onExpenseClick?.(expense)}
                    className="rounded-xl p-3 sm:p-4 glass-premium border border-border/20 hover:border-blue-500/30 hover:shadow-md transition-all duration-200 group cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate flex-1 min-w-0">
                            {expense.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">
                              ₹{expense.amount.toLocaleString()}
                            </span>
                            {(onEditExpense || onDeleteExpense) && (
                              <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                {onEditExpense && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onEditExpense(expense); }}
                                    className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all hover:scale-110"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                                {onDeleteExpense && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteExpense(expense.id); }}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all hover:scale-110"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {dateLabel}
                          </span>
                          
                          {expense.bank && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                {expense.bank}
                              </span>
                            </>
                          )}
                          
                          {expense.paymentMode && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {expense.paymentMode}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(CategoryDetailsModal)
