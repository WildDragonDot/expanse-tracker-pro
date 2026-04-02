'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useMemo, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import { 
  HeaderSkeleton, 
  BalanceCardSkeleton, 
  CardSkeleton, 
  QuickActionSkeleton 
} from '@/components/Skeleton'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncomes } from '@/hooks/useIncomes'
import { calculateFinancialHealthScore, getHealthScoreStatus } from '@/lib/healthScore'
import { InfoTooltip, TipTooltip } from '@/components/Tooltip'
import { useTheme } from '@/contexts/ThemeContext'
import { useData } from '@/contexts/DataContext'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  LazyAddExpenseModal,
  LazyAddIncomeModal,
  LazyReportsModal,
  LazyCategoryDetailsModal,
} from '@/components/LazyModals'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { 
  getCurrentBillingPeriod, 
  isDateInBillingPeriod,
  formatBillingPeriod,
  getPreviousBillingPeriod
} from '@/lib/billingCycle'
import { loadWithMinimumTime } from '@/lib/loadingHelper'
import { parseAppDate } from '@/lib/dateUtils'

function DashboardContent() {
  const { expenses, addExpense, loading: expensesLoading } = useExpenses()
  const { incomes, addIncome, loading: incomesLoading } = useIncomes()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const { financialSummary } = useData()

  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [userBillingDay, setUserBillingDay] = useState(1)
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({})

  // Fetch user's billing cycle and category budgets
  useEffect(() => {
    const fetchBillingCycle = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        const response = await apiFetch('/api/user/billing-cycle', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setUserBillingDay(data.billingCycleStartDay || 1)
        }
      } catch (error) {
        console.error('Error fetching billing cycle:', error)
      }
    }
    fetchBillingCycle()
  }, [])

  // Fetch category budgets for current billing period
  useEffect(() => {
    const fetchCategoryBudgets = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        // Use billing period instead of calendar month
        const currentPeriod = getCurrentBillingPeriod(userBillingDay)
        const month = currentPeriod.month
        const year = currentPeriod.year
        
        console.log('Fetching category budgets for billing period:', { month, year, billingDay: userBillingDay })
        
        const response = await apiFetch(`/api/monthly-budget?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const budgets = await response.json()
          console.log('Fetched budgets:', budgets)
          
          const budgetMap: Record<string, number> = {}
          budgets.forEach((budget: any) => {
            budgetMap[budget.category] = budget.amount
          })
          
          console.log('Budget map:', budgetMap)
          setCategoryBudgets(budgetMap)
        } else {
          console.error('Failed to fetch budgets:', response.status, await response.text())
        }
      } catch (error) {
        console.error('Error fetching category budgets:', error)
      }
    }
    fetchCategoryBudgets()
  }, [userBillingDay])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      callback: () => setShowExpenseModal(true),
      description: 'New Expense'
    },
    {
      key: 'i',
      ctrl: true,
      callback: () => setShowIncomeModal(true),
      description: 'New Income'
    },
    {
      key: 'Escape',
      callback: () => {
        setShowExpenseModal(false)
        setShowIncomeModal(false)
        setShowReportsModal(false)
        setShowCategoryModal(false)
      },
      description: 'Close Modal'
    }
  ])

  // Calculate financial metrics - always use local state for real-time updates
  const totalExpense = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
  const totalIncome = incomes.reduce((sum: number, i: any) => sum + i.amount, 0)
  const savings = totalIncome - totalExpense
  const smartScore = calculateFinancialHealthScore(expenses, incomes)
  const healthStatus = getHealthScoreStatus(smartScore)

  // Category breakdown - filtered by selected view (with billing cycle support)
  const { categoryData, filteredExpenses } = useMemo(() => {
    const now = new Date()
    const filtered = expenses.filter((e: any) => {
      const expenseDate = parseAppDate(e.date)
      
      if (view === 'day') {
        return expenseDate.toDateString() === now.toDateString()
      } else if (view === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        return expenseDate >= weekAgo && expenseDate <= now
      } else if (view === 'month') {
        // Use billing period instead of calendar month
        const period = getCurrentBillingPeriod(userBillingDay)
        return isDateInBillingPeriod(expenseDate, period)
      } else if (view === 'year') {
        return expenseDate.getFullYear() === now.getFullYear()
      }
      return true
    })
    
    const data = filtered.reduce((acc: any, e: any) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
    
    return { categoryData: data, filteredExpenses: filtered }
  }, [expenses, view, userBillingDay])

  // Get expenses for selected category
  const getCategoryExpenses = (category: string) => {
    return filteredExpenses.filter((e: any) => e.category === category)
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    setShowCategoryModal(true)
  }

  // Billing period trend data (last 6 periods)
  const monthlyTrends = useMemo(() => {
    const periods = []
    
    for (let i = 5; i >= 0; i--) {
      const refDate = new Date()
      refDate.setMonth(refDate.getMonth() - i)
      const period = getCurrentBillingPeriod(userBillingDay, refDate)
      
      const periodExpenses = expenses.filter((e: any) => {
        const expenseDate = parseAppDate(e.date)
        return isDateInBillingPeriod(expenseDate, period)
      }).reduce((sum: number, e: any) => sum + e.amount, 0)

      const periodIncomes = incomes.filter((i: any) => {
        const incomeDate = parseAppDate(i.date)
        return isDateInBillingPeriod(incomeDate, period)
      }).reduce((sum: number, i: any) => sum + i.amount, 0)

      // Format period label (e.g., "Nov 11" or just "Nov" for day 1)
      const periodLabel = userBillingDay === 1 
        ? period.startDate.toLocaleDateString('en-US', { month: 'short' })
        : formatBillingPeriod(period).split(' - ')[0] // Just show start date

      periods.push({
        month: periodLabel,
        expenses: periodExpenses,
        income: periodIncomes,
        savings: periodIncomes - periodExpenses
      })
    }
    return periods
  }, [expenses, incomes, userBillingDay])

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...expenses, ...incomes.map((i: any) => ({ ...i, type: 'income' }))]
      .sort((a, b) => {
        // Sort by timestamp first (most recently added), then by date
        const aTime = a.timestamp || new Date(a.createdAt || a.date).getTime()
        const bTime = b.timestamp || new Date(b.createdAt || b.date).getTime()
        return bTime - aTime
      })
      .slice(0, 8)
  }, [expenses, incomes])

  // Top categories
  const topCategories = useMemo(() => {
    return Object.entries(categoryData)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
  }, [categoryData])

  const handleAddExpense = async (expense: any) => {
    await addExpense(expense)
    setShowExpenseModal(false)
  }

  const handleAddIncome = async (income: any) => {
    await addIncome(income)
    setShowIncomeModal(false)
  }

  const handleOpenReports = () => {
    setShowReportsModal(true)
  }

  // Get unique categories for reports modal
  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))]

  // Chart component for category breakdown
  const CategoryChart = ({ data }: { data: [string, number][] }) => {
    const total = data.reduce((sum, [, amount]) => sum + amount, 0)
    const colors = ['from-violet-500 to-purple-600', 'from-indigo-500 to-blue-600', 'from-purple-500 to-violet-600', 'from-blue-500 to-indigo-600', 'from-slate-500 to-gray-600']
    
    return (
      <div className="space-y-3">
        {data.map(([category, amount], index) => {
          const percentage = total > 0 ? (amount / total) * 100 : 0
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{category}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <span className="currency-symbol-large text-foreground">₹</span>
                  <span>{amount.toLocaleString()}</span>
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${colors[index % colors.length]} transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {percentage.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Simple line chart for trends
  const TrendChart = ({ data }: { data: any[] }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses)))
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
            <span className="text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"></div>
            <span className="text-muted-foreground">Expenses</span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2 h-32">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center justify-end space-y-1">
              <div className="flex flex-col justify-end items-center space-y-1 h-24 w-full">
                <div 
                  className="w-3 bg-gradient-to-t from-emerald-500 to-teal-600 rounded-t-sm transition-all duration-1000"
                  style={{ height: `${maxValue > 0 ? (item.income / maxValue) * 100 : 0}%` }}
                />
                <div 
                  className="w-3 bg-gradient-to-t from-rose-500 to-pink-600 rounded-t-sm transition-all duration-1000"
                  style={{ height: `${maxValue > 0 ? (item.expenses / maxValue) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show loading state to prevent hydration issues
  if (expensesLoading || incomesLoading) {
    return (
      <>
        <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
          {/* Header Skeleton */}
          <HeaderSkeleton />

          {/* Main Content Skeleton */}
          <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-8 pb-safe relative z-10 space-y-4 md:space-y-6">
            {/* Balance Card Skeleton */}
            <BalanceCardSkeleton />

            {/* Top Metric Cards Skeleton */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </section>

            {/* Quick Actions Skeleton */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in">
              <QuickActionSkeleton />
              <QuickActionSkeleton />
              <QuickActionSkeleton />
              <QuickActionSkeleton />
            </section>

            {/* Analytics Section Skeleton */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-5 md:p-6 border border-border shadow-premium-sm animate-pulse">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-32 h-6 bg-muted/50 rounded animate-pulse"></div>
                  <div className="w-24 h-8 bg-muted/50 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="w-20 h-4 bg-muted/50 rounded animate-pulse"></div>
                        <div className="w-16 h-4 bg-muted/50 rounded animate-pulse"></div>
                      </div>
                      <div className="w-full h-2 bg-muted/30 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-5 md:p-6 border border-border shadow-premium-sm animate-pulse">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-28 h-6 bg-muted/50 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-muted/50 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                      <div className="w-10 h-10 bg-muted/50 rounded-lg animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-24 h-4 bg-muted/50 rounded mb-1 animate-pulse"></div>
                        <div className="w-32 h-3 bg-muted/50 rounded animate-pulse"></div>
                      </div>
                      <div className="w-16 h-4 bg-muted/50 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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
          <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 mt-0 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-white space-y-2">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs md:text-sm text-white/80 font-medium bg-white/10 px-2 py-1 rounded-full">
                        Dashboard
                      </span>
                      <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                      <span className="text-xs text-white/60">
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">Financial Overview</h1>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-white/80 max-w-md">
                  Track your spending, monitor your savings, and achieve your financial goals.
                </p>
              </div>

              {/* THEME TOGGLE */}
              <button
                onClick={toggleTheme}
                disabled={isTransitioning}
                aria-label="Toggle theme"
                className={`theme-toggle-btn flex-shrink-0 p-2 md:p-3 rounded-xl md:rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl ${
                  isTransitioning ? 'animate-theme-toggle' : ''
                } disabled:opacity-50`}
              >
                <div className="relative w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6">
                  <svg
                    className={`absolute inset-0 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white transition-all duration-300 ${
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
                    className={`absolute inset-0 w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white transition-all duration-300 ${
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
              <h1 className="text-base font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Balance: ₹{Math.abs(savings).toLocaleString()} • {expenses.length + incomes.length} transactions
              </p>
            </div>
            <button
              onClick={toggleTheme}
              disabled={isTransitioning}
              aria-label="Toggle theme"
              className={`w-9 h-9 rounded-xl glass border border-border transition-all hover:shadow-premium ${
                isTransitioning ? 'animate-theme-toggle' : ''
              } disabled:opacity-50 flex items-center justify-center`}
            >
              <div className="relative w-4 h-4">
                <svg
                  className={`absolute inset-0 w-4 h-4 text-foreground transition-all duration-300 ${
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
                  className={`absolute inset-0 w-4 h-4 text-foreground transition-all duration-300 ${
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

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-8 pb-safe relative z-10 space-y-4 md:space-y-6">
          {/* BALANCE CARD */}
          <section className="glass rounded-2xl md:rounded-3xl border border-border shadow-premium p-4 md:p-6 lg:p-8 animate-slide-in">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4">
                <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-transparent dark:to-transparent dark:bg-emerald-500/20 border border-emerald-200/50 dark:border-emerald-500/50">
                  <div className="relative">
                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-500 animate-pulse block" />
                    <span className="absolute inset-0 w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Current Balance
                  </span>
                </div>
                <div>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed">
                    {savings >= 0
                      ? 'Available funds for your spending and investments.'
                      : 'You are currently over your budget limit.'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 md:mt-2">
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${savings >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-muted-foreground">
                      {savings >= 0 ? 'Healthy financial status' : 'Budget exceeded'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-right">
                <div className="space-y-1 md:space-y-2">
                  <p
                    className={`text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight ${
                      savings >= 0
                        ? 'text-gradient-balance-positive'
                        : 'text-gradient-balance-negative'
                    }`}
                  >
                    <span className="text-lg md:text-2xl lg:text-3xl xl:text-4xl">₹</span>{Math.abs(savings).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-center lg:justify-end gap-1 md:gap-2">
                    <span className={`text-xs md:text-sm font-medium ${
                      savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {savings >= 0 ? 'Available' : 'Over budget'}
                    </span>
                    <svg className={`w-3 h-3 md:w-4 md:h-4 ${
                      savings >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={savings >= 0 ? "M7 11l5-5m0 0l5 5m-5-5v12" : "M17 13l-5 5m0 0l-5-5m5 5V6"} />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* TOP METRIC CARDS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* INCOME */}
            <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-6 border border-border shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 11l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-transparent dark:to-transparent dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-500/50">
                    Income
                  </span>
                  <InfoTooltip 
                    content="Total money earned from all sources including salary, freelance, investments, and other income streams."
                    position="left"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="metric-value-large text-gradient-success">
                  <span className="currency-symbol-large">₹</span>{totalIncome.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">This month</span>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+12.5%</span>
                </div>
              </div>
            </div>

            {/* EXPENSES */}
            <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-6 border border-border shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg
                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 13l-5 5m0 0l-5-5m5 5V6"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-pink-50 dark:from-transparent dark:to-transparent dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200/50 dark:border-rose-500/50">
                    Expenses
                  </span>
                  <InfoTooltip 
                    content="Total money spent across all categories including food, transport, shopping, bills, and other expenses."
                    position="left"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="metric-value-large text-gradient-danger">
                  <span className="currency-symbol-large">₹</span>{totalExpense.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">This month</span>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">-8.3%</span>
                </div>
              </div>
            </div>

            {/* SMART SCORE */}
            <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-6 border border-border shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1 group">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${healthStatus.bgClass}`}
                >
                  <svg
                    className="w-4 h-4 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${healthStatus.badgeClass}`}
                  >
                    Health Score
                  </span>
                  <InfoTooltip 
                    content="Comprehensive financial wellness score based on savings rate (40%), income stability (20%), expense tracking (20%), budget adherence (10%), and spending diversity (10%)."
                    position="left"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p
                  className={`metric-value-large ${healthStatus.metricClass}`}
                >
                  {smartScore}%
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Financial health</span>
                  <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                  <span className={`text-xs font-medium ${healthStatus.colorClass}`}>
                    {healthStatus.text}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* PREMIUM QUICK ACTIONS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in">
            {/* Add Expense Card */}
            <button
              onClick={() => setShowExpenseModal(true)}
              className="group relative w-full rounded-lg md:rounded-xl lg:rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-fuchsia-600 text-white p-2 md:p-3 lg:p-4 shadow-2xl hover:shadow-rose-500/25 hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/10 min-h-[80px] md:min-h-[100px] lg:min-h-[120px]"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-20 h-20 sm:w-32 sm:h-32 bg-white rounded-full -translate-x-10 -translate-y-10 sm:-translate-x-16 sm:-translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full translate-x-8 translate-y-8 sm:translate-x-12 sm:translate-y-12 group-hover:scale-125 transition-transform duration-700 delay-100"></div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/20">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 group-hover:translate-x-1 transition-transform duration-300">
                    Add Expense
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed group-hover:translate-x-1 transition-transform duration-300 delay-75">
                    Track your spending
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-4 flex items-center text-xs text-white/60">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full mr-2"></div>
                  Quick Action
                </div>
              </div>
            </button>

            {/* Add Income Card */}
            <button
              onClick={() => setShowIncomeModal(true)}
              className="group relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-emerald-500/25 hover:-translate-y-2 sm:hover:-translate-y-3 transition-all duration-500 overflow-hidden border border-white/10 min-h-[140px] sm:min-h-[160px]"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-18 h-18 sm:w-28 sm:h-28 bg-white rounded-full translate-x-9 -translate-y-9 sm:translate-x-14 sm:-translate-y-14 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-20 sm:h-20 bg-white rounded-full -translate-x-6 translate-y-6 sm:-translate-x-10 sm:translate-y-10 group-hover:scale-125 transition-transform duration-700 delay-150"></div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/20">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 group-hover:translate-x-1 transition-transform duration-300">
                    Add Income
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed group-hover:translate-x-1 transition-transform duration-300 delay-75">
                    Record earnings
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-4 flex items-center text-xs text-white/60">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full mr-2"></div>
                  Quick Action
                </div>
              </div>
            </button>

            {/* Reports Card */}
            <button
              onClick={handleOpenReports}
              className="group relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 text-white p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-violet-500/25 hover:-translate-y-2 sm:hover:-translate-y-3 transition-all duration-500 overflow-hidden border border-white/10 min-h-[140px] sm:min-h-[160px]"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-36 sm:h-36 bg-white rounded-full -translate-x-12 -translate-y-12 sm:-translate-x-18 sm:-translate-y-18 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-full translate-x-5 translate-y-5 sm:translate-x-8 sm:translate-y-8 group-hover:scale-150 transition-transform duration-700 delay-200"></div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/20">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 group-hover:translate-x-1 transition-transform duration-300">
                    Reports
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed group-hover:translate-x-1 transition-transform duration-300 delay-75">
                    Export & Email
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-4 flex items-center text-xs text-white/60">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full mr-2"></div>
                  Analytics
                </div>
              </div>
            </button>

            {/* Manage Udhar Card */}
            <a
              href="/udhar"
              className="group relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 text-white p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-amber-500/25 hover:-translate-y-2 sm:hover:-translate-y-3 transition-all duration-500 overflow-hidden border border-white/10 block min-h-[140px] sm:min-h-[160px]"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/2 w-20 h-20 sm:w-30 sm:h-30 bg-white rounded-full -translate-x-10 -translate-y-10 sm:-translate-x-15 sm:-translate-y-15 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-18 sm:h-18 bg-white rounded-full -translate-x-6 translate-y-6 sm:-translate-x-9 sm:translate-y-9 group-hover:scale-150 transition-transform duration-700 delay-100"></div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/20">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 transition-transform duration-300">
                    Manage Udhar
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed transition-transform duration-300 delay-75">
                    Track loans
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-4 flex items-center text-xs text-white/60 w-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full mr-2"></div>
                  Management
                </div>
              </div>
            </a>

            {/* Expense Planning Card */}
            <a
              href="/expense-planning"
              className="group relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-2 sm:hover:-translate-y-3 transition-all duration-500 overflow-hidden border border-white/10 block min-h-[140px] sm:min-h-[160px]"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full translate-x-8 -translate-y-8 sm:translate-x-12 sm:-translate-y-12 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-18 sm:h-18 bg-white rounded-full -translate-x-6 translate-y-6 sm:-translate-x-9 sm:translate-y-9 group-hover:scale-150 transition-transform duration-700 delay-100"></div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/20">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 transition-transform duration-300">
                    Plan Expenses
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed transition-transform duration-300 delay-75">
                    Budget upcoming costs
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-4 flex items-center text-xs text-white/60 w-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full mr-2"></div>
                  Planning
                </div>
              </div>
            </a>

            {/* Shopping List Card */}
            <a
              href="/shopping-list"
              className="group relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-green-500/25 hover:-translate-y-2 sm:hover:-translate-y-3 transition-all duration-500 overflow-hidden border border-white/10 block min-h-[140px] sm:min-h-[160px]"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-full -translate-x-10 -translate-y-10 sm:-translate-x-14 sm:-translate-y-14 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full translate-x-4 translate-y-4 sm:translate-x-6 sm:translate-y-6 group-hover:scale-150 transition-transform duration-700 delay-200"></div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/20">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 transition-transform duration-300">
                    Shopping List
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed transition-transform duration-300 delay-75">
                    Organize purchases
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-4 flex items-center text-xs text-white/60 w-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full mr-2"></div>
                  Shopping
                </div>
              </div>
            </a>

            {/* Monthly Budget Card */}
            <a
              href="/monthly-budget"
              className="group relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-pink-500 via-rose-600 to-red-600 text-white p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-pink-500/25 hover:-translate-y-2 sm:hover:-translate-y-3 transition-all duration-500 overflow-hidden border border-white/10 block min-h-[140px] sm:min-h-[160px]"
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-1/4 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full translate-x-12 -translate-y-12 sm:translate-x-16 sm:-translate-y-16 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-1/4 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full -translate-x-8 translate-y-8 sm:-translate-x-10 sm:translate-y-10 group-hover:scale-150 transition-transform duration-700 delay-150"></div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
                <div className="flex items-center justify-between w-full mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-white/20">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 transition-transform duration-300">
                    Monthly Budget
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed transition-transform duration-300 delay-75">
                    Track spending limits
                  </p>
                </div>
                
                <div className="mt-2 sm:mt-4 flex items-center text-xs text-white/60 w-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full mr-2"></div>
                  Budget
                </div>
              </div>
            </a>
          </section>

          {/* ANALYTICS + RECENT ACTIVITY */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CATEGORY BREAKDOWN */}
            <div className="glass rounded-2xl p-5 md:p-6 border border-border shadow-premium-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="heading-section">
                  Spending by Category
                </h2>
                <div className="flex items-center gap-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 px-1 py-1">
                  {(['day', 'week', 'month', 'year'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        view === v
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {Object.keys(categoryData).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(categoryData).map(
                    ([category, amount]: [string, any]) => {
                      // Get category budget if exists (monthly budget)
                      const monthlyBudget = categoryBudgets[category] || 0
                      
                      // Calculate adjusted budget based on view
                      let adjustedBudget = monthlyBudget
                      if (view === 'day') {
                        // Divide monthly budget by ~30 days
                        adjustedBudget = monthlyBudget / 30
                      } else if (view === 'week') {
                        // Divide monthly budget by ~4 weeks
                        adjustedBudget = monthlyBudget / 4
                      } else if (view === 'year') {
                        // Multiply monthly budget by 12 months
                        adjustedBudget = monthlyBudget * 12
                      }
                      // For 'month' view, use monthly budget as is
                      
                      // Calculate percentage against adjusted budget
                      const percentage = adjustedBudget > 0 
                        ? (amount / adjustedBudget) * 100 
                        : 0
                      
                      // Determine status color
                      const isOverBudget = percentage > 100
                      const isNearLimit = percentage > 80 && percentage <= 100
                      const barColor = isOverBudget 
                        ? 'from-red-500 via-rose-500 to-pink-600'
                        : isNearLimit
                        ? 'from-amber-500 via-orange-500 to-yellow-600'
                        : 'from-emerald-500 via-green-500 to-teal-600'
                      
                      return (
                        <button
                          key={category}
                          onClick={() => handleCategoryClick(category)}
                          className="w-full space-y-1 text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                                <span className="currency-symbol-large">₹</span>
                                <span>{amount.toLocaleString()}</span>
                              </span>
                              {adjustedBudget > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  / ₹{Math.round(adjustedBudget).toLocaleString()}
                                </span>
                              )}
                              <svg className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-2 rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 group-hover:shadow-lg`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            {adjustedBudget > 0 ? (
                              <>
                                <span className={`font-medium ${
                                  isOverBudget ? 'text-red-600 dark:text-red-400' :
                                  isNearLimit ? 'text-amber-600 dark:text-amber-400' :
                                  'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isOverBudget ? '⚠️ Over budget' : 
                                   isNearLimit ? '⚡ Near limit' : 
                                   '✓ On track'}
                                </span>
                                <span className="text-muted-foreground">
                                  {percentage.toFixed(1)}% of {view === 'day' ? 'daily' : view === 'week' ? 'weekly' : view === 'year' ? 'yearly' : 'monthly'} budget
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                No budget set
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    }
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto flex items-center justify-center mb-3">
                    <svg
                      className="w-7 h-7 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No expenses yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add your first expense to start seeing insights.
                  </p>
                </div>
              )}
            </div>

            {/* RECENT ACTIVITY */}
            <div className="glass rounded-2xl p-5 md:p-6 border border-border shadow-premium-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="heading-section">
                  Recent Activity
                </h2>
                <span className="text-xs text-muted-foreground">
                  Last {recentTransactions.length || 0} expenses
                </span>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      {/* Compact Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-200 ${
                          transaction.type === 'income' 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                            : 'bg-gradient-to-br from-rose-500 to-pink-600'
                        }`}>
                          <svg
                            className="w-3.5 h-3.5 md:w-4 md:h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d={transaction.type === 'income' 
                                ? "M7 11l5-5m0 0l5 5m-5-5v12" 
                                : "M17 13l-5 5m0 0l-5-5m5 5V6"
                              }
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top Row: Title and Date */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors pr-2">
                            {transaction.type === 'income' ? transaction.source : transaction.title}
                          </h3>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {transaction.createdAt
                              ? `${new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })} ${new Date(transaction.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}`
                              : `${new Date(transaction.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })} ${new Date(transaction.date).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}`
                            }
                          </span>
                        </div>

                        {/* Bottom Row: Category and Amount */}
                        <div className="flex items-center justify-between">
                          {/* Left: Category */}
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${
                              transaction.type === 'income'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                              {transaction.category}
                            </span>
                            
                            {/* Payment Method Icon - Hidden on mobile, shown on desktop */}
                            {!transaction.type && (
                              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                                {(transaction.paymentMode || 'Cash') === 'Cash' ? (
                                  <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                )}
                                <span>{transaction.paymentMode || 'Cash'}</span>
                              </div>
                            )}
                          </div>

                          {/* Right: Amount */}
                          <div className="text-right">
                            <p className={`font-bold text-sm md:text-base flex items-center justify-end gap-0.5 ${
                              transaction.type === 'income' 
                                ? 'text-emerald-500 dark:text-emerald-400' 
                                : 'text-red-500 dark:text-red-400'
                            }`}>
                              <span>{transaction.type === 'income' ? '+' : '-'}₹</span>
                              <span>{transaction.amount.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto flex items-center justify-center mb-3">
                    <svg
                      className="w-7 h-7 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No transactions yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your latest expenses will appear here.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* MODALS + BOTTOM NAV (MOBILE) */}
      <LazyAddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSave={handleAddExpense}
      />

      <LazyAddIncomeModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSave={handleAddIncome}
      />

      <LazyReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        expenses={expenses}
        incomes={incomes}
        categories={categories}
      />

      <LazyCategoryDetailsModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          setSelectedCategory(null)
        }}
        category={selectedCategory || ''}
        expenses={selectedCategory ? getCategoryExpenses(selectedCategory) : []}
        totalAmount={selectedCategory ? categoryData[selectedCategory] || 0 : 0}
      />

      <BottomNav />
    </>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
