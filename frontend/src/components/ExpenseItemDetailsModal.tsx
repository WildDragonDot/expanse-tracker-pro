'use client'

interface ExpenseItemDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  expense: {
    id: string
    title: string
    amount: number
    date: string
    description?: string
    actualAmount?: number
    isCompleted?: boolean
    bank?: string
    paymentMode?: string
    categoryId?: string
    createdAt: string
  } | null
}

export default function ExpenseItemDetailsModal({ isOpen, onClose, expense }: ExpenseItemDetailsModalProps) {
  if (!isOpen || !expense) return null

  const isCompleted = expense.isCompleted
  const plannedAmount = expense.amount
  const actualAmount = expense.actualAmount || 0
  const difference = actualAmount - plannedAmount
  const percentageDiff = plannedAmount > 0 ? ((difference / plannedAmount) * 100) : 0
  const savedOrExtra = difference < 0 ? 'Saved' : 'Extra'

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="glass-premium w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Gradient Header */}
        <div className={`relative px-5 py-4 overflow-hidden ${
          isCompleted 
            ? 'bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600' 
            : 'bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600'
        }`}>
          {/* Animated Pattern Overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xl flex items-center justify-center shadow-lg border border-white/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  {isCompleted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {isCompleted ? 'Expense Details' : 'Planned Expense'}
                </h2>
                <p className="text-xs text-white/80">
                  {isCompleted ? 'Completed expense' : 'Not completed yet'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xl hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg text-white flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Expense Title */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-foreground">{expense.title}</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary/60">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dateLabel}
              </span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                isCompleted 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              }`}>
                {isCompleted ? '○ Completed' : '○ Pending'}
              </span>
            </div>
          </div>

          {/* Amount Cards */}
          {isCompleted ? (
            /* Amount Comparison Cards - For Completed Expenses */
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Planned Amount */}
              <div className="relative glass-premium rounded-xl p-3 border border-border/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                <div className="relative space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Planned</p>
                      <p className="text-[8px] text-muted-foreground">Budget</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    ₹{plannedAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actual Amount */}
              <div className="relative glass-premium rounded-xl p-3 border border-border/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                <div className="relative space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Actual</p>
                      <p className="text-[8px] text-muted-foreground">Spent</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{actualAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Planned Amount Card - For Pending Expenses */
            <div className="relative glass-premium rounded-xl p-5 border border-border/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Planned Amount</p>
                    <p className="text-[9px] text-muted-foreground">Budget estimate</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-1">
                    ₹{plannedAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Total planned expense</p>
                </div>
              </div>
            </div>
          )}

          {/* Difference Card - Only for completed expenses */}
          {isCompleted && (
            <div className={`relative glass-premium rounded-2xl p-5 sm:p-6 border overflow-hidden ${
              difference < 0 
                ? 'border-emerald-500/20' 
                : difference > 0
                ? 'border-red-500/20'
                : 'border-gray-500/20'
            }`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${
                difference < 0 ? 'from-emerald-500/5' : difference > 0 ? 'from-red-500/5' : 'from-gray-500/5'
              } to-transparent`}></div>
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl ${
                difference < 0 ? 'bg-emerald-500/20' : difference > 0 ? 'bg-red-500/20' : 'bg-gray-500/20'
              }`}></div>
              
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br shadow-xl flex items-center justify-center ${
                      difference < 0 
                        ? 'from-emerald-500 to-green-600' 
                        : difference > 0
                        ? 'from-red-500 to-rose-600'
                        : 'from-gray-500 to-slate-600'
                    }`}>
                      {difference < 0 ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      ) : difference > 0 ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`text-base font-bold uppercase tracking-wide ${
                        difference < 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : difference > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {difference === 0 ? 'Exact Match' : savedOrExtra}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {difference === 0 ? 'As planned' : 'Compared to plan'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl sm:text-4xl font-black ${
                      difference < 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : difference > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {difference < 0 ? '-' : difference > 0 ? '+' : ''}₹{Math.abs(difference).toLocaleString()}
                    </p>
                    <p className={`text-sm font-bold ${
                      difference < 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : difference > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {percentageDiff > 0 ? '+' : ''}{percentageDiff.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 shadow-lg ${
                      difference < 0 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                        : difference > 0
                        ? 'bg-gradient-to-r from-red-500 to-rose-600'
                        : 'bg-gradient-to-r from-gray-500 to-slate-600'
                    }`}
                    style={{ width: `${Math.min(Math.abs(percentageDiff), 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-2">
            {expense.description && (
              <div className="glass-premium rounded-lg p-3 border border-border/20">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-foreground mb-1 uppercase tracking-wide">Description</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{expense.description}</p>
                  </div>
                </div>
              </div>
            )}

            {(expense.bank || expense.paymentMode) && (
              <div className="glass-premium rounded-lg p-3 border border-border/20">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-foreground mb-1.5 uppercase tracking-wide">Payment Details</p>
                    <div className="space-y-1">
                      {expense.bank && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Bank</span>
                          <span className="text-xs font-semibold text-foreground">{expense.bank}</span>
                        </div>
                      )}
                      {expense.paymentMode && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Mode</span>
                          <span className="text-xs font-semibold text-foreground">{expense.paymentMode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-premium rounded-lg p-3 border border-border/20">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-foreground mb-1 uppercase tracking-wide">Expense Date</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {new Date(expense.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer with Close Button */}
        <div className="flex-shrink-0 p-4 border-t border-border/20">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
