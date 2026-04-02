'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useMemo, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import EditExpenseModal from '@/components/EditExpenseModal'
import EditIncomeModal from '@/components/EditIncomeModal'
import {
  LazyAddExpenseModal,
  LazyAddIncomeModal,
  LazyReportsModal,
} from '@/components/LazyModals'
import AdvancedFilterPanel from '@/components/AdvancedFilterPanel'
import AdvancedSearchBar from '@/components/AdvancedSearchBar'
import ConfirmModal from '@/components/ConfirmModal'
import { 
  HeaderSkeleton, 
  CardSkeleton, 
  FilterSkeleton, 
  ListItemSkeleton 
} from '@/components/Skeleton'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncomes } from '@/hooks/useIncomes'
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters'
import { InfoTooltip } from '@/components/Tooltip'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotification } from '@/contexts/NotificationContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHint from '@/components/KeyboardShortcutsHint'
import ConfirmDialog from '@/components/ConfirmDialog'
import SuccessAnimation from '@/components/SuccessAnimation'
import EmptyState from '@/components/EmptyState'
import { getCurrentBillingPeriod } from '@/lib/billingCycle'
import ErrorState from '@/components/ErrorState'

function ExpensesContent() {
  const { expenses, addExpense, updateExpense, deleteExpense, loading } = useExpenses()
  const { incomes, addIncome, updateIncome, deleteIncome } = useIncomes()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const { addNotification } = useNotification()
  
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false)
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [editingIncome, setEditingIncome] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [userBillingDay, setUserBillingDay] = useState(1)

  // Fetch user's billing cycle
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

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      callback: () => setShowAddExpenseModal(true),
      description: 'New Expense'
    },
    {
      key: 'i',
      ctrl: true,
      callback: () => setShowAddIncomeModal(true),
      description: 'New Income'
    },
    {
      key: 'f',
      ctrl: true,
      callback: () => document.getElementById('search-input')?.focus(),
      description: 'Focus Search'
    },
    {
      key: 'Escape',
      callback: () => {
        setShowAddExpenseModal(false)
        setShowAddIncomeModal(false)
        setShowEditExpenseModal(false)
        setShowEditIncomeModal(false)
        setShowReportsModal(false)
      },
      description: 'Close Modal'
    }
  ])
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'expense' | 'income' } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Combine expenses and incomes for advanced filtering
  const allTransactions = useMemo(() => [
    ...expenses.map(expense => ({ ...expense, type: 'expense' })),
    ...incomes.map(income => ({ 
      ...income, 
      type: 'income',
      title: income.source || 'Income',
      category: income.source || 'Income',
      bank: 'Cash',
      tags: []
    }))
  ], [expenses, incomes])

  // Use advanced filtering hook
  const {
    filters,
    sort,
    filteredTransactions,
    resultCount,
    totalCount,
    setFilters,
    setSort,
    clearAllFilters,
    searchSuggestions
  } = useAdvancedFilters({ transactions: allTransactions })

  const handleAddExpense = async (expense: any) => {
    await addExpense(expense)
    setShowAddExpenseModal(false)
  }

  const handleAddIncome = async (income: any) => {
    await addIncome(income)
    setShowAddIncomeModal(false)
  }

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
    setShowEditExpenseModal(true)
  }

  const handleUpdateExpense = async (expense: any) => {
    await updateExpense(expense)
    setShowEditExpenseModal(false)
    setEditingExpense(null)
  }

  const handleEditIncome = (income: any) => {
    setEditingIncome(income)
    setShowEditIncomeModal(true)
  }

  const handleUpdateIncome = async (income: any) => {
    await updateIncome(income)
    setShowEditIncomeModal(false)
    setEditingIncome(null)
  }

  const handleDeleteIncome = (id: string) => {
    setDeleteTarget({ id, type: 'income' })
    setShowDeleteConfirm(true)
  }

  const handleDeleteExpense = (id: string) => {
    setDeleteTarget({ id, type: 'expense' })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      if (deleteTarget.type === 'income') {
        await deleteIncome(deleteTarget.id)
        addNotification({
          type: 'success',
          title: 'Income Deleted',
          message: 'The income has been successfully deleted.',
          duration: 3000
        })
      } else {
        await deleteExpense(deleteTarget.id)
        addNotification({
          type: 'success',
          title: 'Expense Deleted',
          message: 'The expense has been successfully deleted.',
          duration: 3000
        })
      }
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete the ${deleteTarget.type}. Please try again.`,
        duration: 4000
      })
    } finally {
      setDeleting(false)
    }
  }

  // Use filtered transactions from the advanced filtering hook
  const filteredAndSortedTransactions = filteredTransactions

  // Get unique values for filters
  const categories = ['All', ...Array.from(new Set([
    ...expenses.map(e => e.category),
    ...incomes.map(i => i.source || 'Income')
  ]))]
  const banks = ['All', ...Array.from(new Set([
    ...expenses.map(e => e.bank).filter(Boolean),
    'Cash' // Income transactions are always Cash since no paymentMode field
  ]))]
  
  // Statistics
  const stats = useMemo(() => {
    const expenseTransactions = filteredAndSortedTransactions.filter(t => t.type === 'expense')
    const incomeTransactions = filteredAndSortedTransactions.filter(t => t.type === 'income')
    
    const totalExpenses = expenseTransactions.reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = incomeTransactions.reduce((sum, i) => sum + i.amount, 0)
    const average = expenseTransactions.length > 0 ? totalExpenses / expenseTransactions.length : 0
    const highest = expenseTransactions.length > 0 ? Math.max(...expenseTransactions.map(e => e.amount)) : 0
    
    return { 
      total: totalExpenses, 
      totalIncome,
      average, 
      highest, 
      count: resultCount,
      expenseCount: expenseTransactions.length,
      incomeCount: incomeTransactions.length
    }
  }, [filteredAndSortedTransactions, resultCount])

  // Reports function
  const handleOpenReports = () => {
    setShowReportsModal(true)
  }

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
          {/* Header Skeleton */}
          <HeaderSkeleton />

          {/* Content Skeleton */}
          <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
            {/* Statistics Cards Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-slide-in">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>

            {/* Search and Controls Skeleton */}
            <div className="glass-premium rounded-2xl p-4 border border-border/20 shadow-premium animate-pulse">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="w-full h-10 bg-muted/50 rounded-2xl animate-pulse"></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-32 h-10 bg-muted/50 rounded-2xl animate-pulse"></div>
                  <div className="w-24 h-10 bg-muted/50 rounded-2xl animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Filters Skeleton */}
            <FilterSkeleton />

            {/* Expenses List Skeleton */}
            <div className="glass-premium rounded-2xl border border-border/20 shadow-premium overflow-hidden animate-pulse">
              <div className="divide-y divide-border/10">
                {Array.from({ length: 8 }).map((_, i) => (
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

  return (
    <>
      <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
        {/* Clean Mobile Header */}
        <header className="md:block hidden relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs md:text-sm text-white/80 font-medium bg-white/10 px-2 py-1 rounded-full">
                        Expenses
                      </span>
                      <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <span>{stats.count} transactions •</span>
                        <span className="currency-symbol-large text-white/80">₹</span>
                        <span>{stats.total.toLocaleString()} total</span>
                      </span>
                    </div>
                    <h1 className="heading-page">
                      Financial Tracker
                    </h1>
                  </div>
                </div>
                <p className="text-sm md:text-base text-white/80 max-w-md">
                  Track your expenses and income with advanced filtering and analytics
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
              <h1 className="text-base font-bold text-foreground">Expenses</h1>
              <p className="text-xs text-muted-foreground">
                {stats.count} transactions • ₹{stats.total.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
          {/* Mobile-Friendly Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-slide-in">
            {/* Total Spent */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-medium">Total</span>
                  <InfoTooltip 
                    content="Total amount spent across all expense transactions"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-red-600">
                  <span className="currency-symbol">₹</span>{stats.total.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>

            {/* Count */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">Count</span>
                  <InfoTooltip 
                    content="Total number of expense transactions recorded"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-blue-600">{stats.count}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>

            {/* Average */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded font-medium">Avg</span>
                  <InfoTooltip 
                    content="Average amount per expense transaction"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-amber-600">
                  <span className="currency-symbol">₹</span>{Math.round(stats.average).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Average</p>
              </div>
            </div>

            {/* Highest */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded font-medium">Peak</span>
                  <InfoTooltip 
                    content="Highest single expense transaction amount"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="metric-value text-rose-600">
                  <span className="currency-symbol">₹</span>{stats.highest.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Highest</p>
              </div>
            </div>
          </div>

          {/* Monthly Budget Card */}
          <a
            href="/monthly-budget"
            className="block glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group animate-slide-in"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                    Monthly Budget
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Set & track category-wise budgets
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-foreground group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          {/* Advanced Search Bar */}
          <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium animate-slide-in overflow-visible">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Advanced Search */}
              <div className="flex-1">
                <AdvancedSearchBar
                  value={filters.search || ''}
                  onChange={(value) => setFilters({ ...filters, search: value || undefined })}
                  suggestions={searchSuggestions}
                  onSuggestionSelect={(suggestion) => setFilters({ ...filters, search: suggestion })}
                />
              </div>
              
              {/* Action Buttons - Mobile Optimized */}
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:via-rose-700 hover:to-pink-700 text-white shadow-lg hover:shadow-red-500/25 sm:hover:-translate-y-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 border border-white/10 flex-1 sm:flex-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <div className="w-8 h-8 sm:w-4 sm:h-4 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <span className="text-[11px] sm:text-xs lg:text-sm whitespace-nowrap">Add<br className="sm:hidden" />Expense</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowAddIncomeModal(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-emerald-500/25 sm:hover:-translate-y-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 border border-white/10 flex-1 sm:flex-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <div className="w-8 h-8 sm:w-4 sm:h-4 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <span className="text-[11px] sm:text-xs lg:text-sm whitespace-nowrap">Add<br className="sm:hidden" />Income</span>
                  </div>
                </button>
                
                <button
                  onClick={handleOpenReports}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25 sm:hover:-translate-y-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 border border-white/10 flex-1 sm:flex-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <div className="w-8 h-8 sm:w-4 sm:h-4 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-[11px] sm:text-xs lg:text-sm">Reports</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Billing Period Filter */}
          {userBillingDay !== 1 && (
            <div className="glass-premium rounded-xl p-3 border border-border/20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-muted-foreground">Quick Filter:</span>
                </div>
                <button
                  onClick={() => {
                    const period = getCurrentBillingPeriod(userBillingDay)
                    setFilters({
                      ...filters,
                      startDate: period.startDate,
                      endDate: period.endDate
                    })
                    addNotification({
                      type: 'success',
                      title: 'Filter Applied',
                      message: 'Showing current billing period transactions',
                      duration: 3000
                    })
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Current Billing Period
                </button>
              </div>
            </div>
          )}

          {/* Advanced Filter Panel */}
          <AdvancedFilterPanel
            filters={filters}
            sort={sort}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            onClearAll={clearAllFilters}
            categories={categories}
            banks={banks}
            resultCount={resultCount}
            totalCount={totalCount}
          />

          {/* Responsive Transactions List - Card layout for mobile, enhanced for desktop */}
          <div className="glass-premium rounded-xl md:rounded-2xl border border-border/20 shadow-premium overflow-hidden animate-slide-in">
            {filteredAndSortedTransactions.length > 0 ? (
              <div className="divide-y divide-border/10">
                {filteredAndSortedTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="px-3 md:px-6 py-2.5 md:py-4 hover:bg-secondary/10 transition-all duration-200 group"
                    style={{ animationDelay: `${(index + 3) * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Compact Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-200 ${
                          transaction.type === 'income' 
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                            : 'bg-gradient-to-br from-rose-500 to-pink-600'
                        }`}>
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={
                              transaction.type === 'income' 
                                ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                                : "M19 14l-7 7m0 0l-7-7m7 7V3"
                            } />
                          </svg>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Top Row: Title and Date */}
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors pr-2">
                            {transaction.title}
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

                        {/* Bottom Row: Category, Amount, and Actions */}
                        <div className="flex items-center justify-between">
                          {/* Left: Category and Payment Method */}
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${
                              transaction.type === 'income' 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                              {transaction.category}
                            </span>
                            
                            {/* Payment Method Icon - Hidden on mobile, shown on desktop */}
                            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                              {(transaction.bank || 'Cash') === 'Cash' ? (
                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              )}
                              <span>{transaction.bank || 'Cash'}</span>
                            </div>

                            {/* Tags */}
                            {transaction.tags && transaction.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {transaction.tags.slice(0, 1).map((tag: string, i: number) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-1 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                    {tag}
                                  </span>
                                ))}
                                {transaction.tags.length > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{transaction.tags.length - 1}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: Amount and Actions */}
                          <div className="flex items-center gap-2">
                            {/* Amount */}
                            <div className="text-right">
                              <p className={`font-bold text-sm md:text-base flex items-center justify-end gap-0.5 ${
                                transaction.type === 'income' 
                                  ? 'text-emerald-500' 
                                  : 'text-red-500'
                              }`}>
                                <span className={transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}>
                                  {transaction.type === 'income' ? '+₹' : '₹'}
                                </span>
                                <span>{transaction.amount.toLocaleString()}</span>
                              </p>
                            </div>

                            {/* Actions - Show for both expenses and income */}
                            <div className="flex gap-0.5 opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => transaction.type === 'expense' ? handleEditExpense(transaction) : handleEditIncome(transaction)}
                                className="p-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-all duration-200 hover:scale-110"
                                title={`Edit ${transaction.type}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => transaction.type === 'expense' ? handleDeleteExpense(transaction.id) : handleDeleteIncome(transaction.id)}
                                className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200 hover:scale-110"
                                title={`Delete ${transaction.type}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h3 className="heading-card">
                    {resultCount < totalCount
                      ? 'No matching transactions found'
                      : 'No transactions yet'
                    }
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                    {resultCount < totalCount
                      ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                      : 'Start tracking your finances by adding your first expense or income.'
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 active:scale-95 px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-semibold group transition-all duration-200 rounded-xl inline-flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    {resultCount < totalCount
                      ? 'Add New Transaction'
                      : 'Add Your First Transaction'
                    }
                  </button>
                  {resultCount < totalCount && (
                    <button
                      onClick={clearAllFilters}
                      className="px-3 py-1.5 md:px-4 md:py-2 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-xl text-xs md:text-sm font-medium transition-all duration-200 active:scale-95"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Premium Floating Action Button - Mobile Only */}
      <button
        onClick={() => setShowAddExpenseModal(true)}
        className="hidden fixed bottom-28 right-3 w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl shadow-2xl hover:shadow-blue-500/25 items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40 group border border-white/10"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-300"></div>
          <svg className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>

      <LazyAddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSave={handleAddExpense}
      />

      <LazyAddIncomeModal
        isOpen={showAddIncomeModal}
        onClose={() => setShowAddIncomeModal(false)}
        onSave={handleAddIncome}
      />

      <EditExpenseModal
        isOpen={showEditExpenseModal}
        onClose={() => setShowEditExpenseModal(false)}
        onSave={handleUpdateExpense}
        expense={editingExpense}
      />

      <EditIncomeModal
        isOpen={showEditIncomeModal}
        onClose={() => setShowEditIncomeModal(false)}
        onSave={handleUpdateIncome}
        income={editingIncome}
      />

      <LazyReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        expenses={expenses}
        incomes={incomes}
        categories={categories}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type === 'income' ? 'Income' : 'Expense'}?`}
        message={`Are you sure you want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleting}
      />

      <BottomNav />
      <KeyboardShortcutsHint />
      
      {showSuccess && (
        <SuccessAnimation
          message={successMessage}
          onComplete={() => setShowSuccess(false)}
        />
      )}
    </>
  )
}

export default function Expenses() {
  return (
    <ProtectedRoute>
      <ExpensesContent />
    </ProtectedRoute>
  )
}
