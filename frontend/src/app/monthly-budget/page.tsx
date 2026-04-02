'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useNotification } from '@/contexts/NotificationContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHint from '@/components/KeyboardShortcutsHint'
import ConfirmDialog from '@/components/ConfirmDialog'
import SuccessAnimation from '@/components/SuccessAnimation'
import EmptyState from '@/components/EmptyState'
import { MonthlyBudgetSkeleton } from '@/components/Skeleton'
import { LazyCategoryDetailsModal } from '@/components/LazyModals'
import { 
  getCurrentBillingPeriod, 
  formatBillingPeriod,
  getDaysRemainingInPeriod,
  getBillingPeriodProgress,
  type BillingPeriod
} from '@/lib/billingCycle'
import { loadWithMinimumTime } from '@/lib/loadingHelper'

interface Budget {
  id: string
  category: string
  amount: number
  spent: number
  month: number
  year: number
  payableBank?: string
}

interface Analytics {
  category: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  status: 'good' | 'warning' | 'over'
}

interface Category {
  id: string
  name: string
  icon: string
}

function MonthlyBudgetContent() {
  const { addNotification } = useNotification()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [analytics, setAnalytics] = useState<Analytics[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<number | null>(null)
  const [selectedHistoryYear, setSelectedHistoryYear] = useState<number | null>(null)
  const [availableHistoryMonths, setAvailableHistoryMonths] = useState<{month: number, year: number}[]>([])
  const [userBillingDay, setUserBillingDay] = useState(1)
  const [currentPeriod, setCurrentPeriod] = useState<BillingPeriod | null>(null)
  const [summary, setSummary] = useState({
    totalBudgeted: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  // Initialize with null to prevent race conditions
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    payableBank: ''
  })
  const [banks, setBanks] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<{month: number, year: number, count: number}[]>([])
  const [copyingBudgets, setCopyingBudgets] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'b',
      ctrl: true,
      callback: () => setShowAddModal(true),
      description: 'Add Budget'
    },
    {
      key: 'h',
      ctrl: true,
      callback: () => {
        fetchHistory()
        setShowHistoryModal(true)
      },
      description: 'View History'
    },
    {
      key: 'Escape',
      callback: () => {
        setShowAddModal(false)
        setShowHistoryModal(false)
        setShowCategoryModal(false)
      },
      description: 'Close Modal'
    }
  ])

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

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
          const billingDay = data.billingCycleStartDay || 1
          setUserBillingDay(billingDay)
          const currentPeriod = getCurrentBillingPeriod(billingDay)
          setCurrentPeriod(currentPeriod)
          
          // Set selected month/year to current billing period
          setSelectedMonth(currentPeriod.month)
          setSelectedYear(currentPeriod.year)
        }
      } catch (error) {
        console.error('Error fetching billing cycle:', error)
      }
    }
    fetchBillingCycle()
  }, [])

  useEffect(() => {
    // Fetch initial data in parallel
    Promise.all([
      fetchCategories(),
      fetchBanks()
    ])
  }, [])

  const fetchBanks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/expense-banks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setBanks(data.map((b: any) => b.name))
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
    }
  }

  useEffect(() => {
    if (userBillingDay && selectedMonth && selectedYear) {
      // Show loading state while fetching
      setLoading(true)
      // Fetch budget data in parallel with minimum loading time
      loadWithMinimumTime(async () => {
        await Promise.all([
          fetchBudgets(),
          fetchAnalytics(),
          fetchExpenses()
        ])
      }, 1000)
    }
  }, [selectedMonth, selectedYear, userBillingDay])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/expense-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/monthly-budget?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/monthly-budget/analytics?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/monthly-budget/history?limit=12', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
        
        // Extract available months for selection
        const months = data.map((period: any) => ({
          month: period.month,
          year: period.year
        }))
        setAvailableHistoryMonths(months)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const fetchHistoryForMonth = async (month: number, year: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/monthly-budget/history?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Error fetching history for month:', error)
    }
  }

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setShowCategoryModal(true)
  }

  const getCategoryExpenses = (category: string) => {
    if (!currentPeriod) return []
    return expenses.filter((e: any) => {
      const expenseDate = new Date(e.date)
      return e.category === category && 
             expenseDate >= currentPeriod.startDate && 
             expenseDate <= currentPeriod.endDate
    })
  }

  const getCategoryTotal = (category: string) => {
    return getCategoryExpenses(category).reduce((sum, e) => sum + e.amount, 0)
  }

  const handleSaveBudget = async () => {
    if (!formData.category || !formData.amount) {
      addNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill in all fields'
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/monthly-budget', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: formData.category,
          amount: parseInt(formData.amount),
          month: selectedMonth,
          year: selectedYear,
          payableBank: formData.payableBank || null
        })
      })

      if (response.ok) {
        const newBudget = await response.json()
        
        // Optimistic update for budgets
        setBudgets(prev => {
          const existing = prev.find(b => b.category === formData.category)
          if (existing) {
            return prev.map(b => b.category === formData.category ? newBudget : b)
          }
          return [...prev, newBudget]
        })
        
        // Optimistic update for analytics (this drives the UI display)
        setAnalytics(prev => {
          const categoryExpenses = getCategoryExpenses(formData.category)
          const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0)
          const budgeted = parseInt(formData.amount)
          const remaining = budgeted - spent
          const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0
          const status: 'good' | 'warning' | 'over' = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
          
          const newAnalyticsItem: Analytics = {
            category: formData.category,
            spent,
            budgeted,
            remaining,
            percentage,
            status
          }
          
          const existing = prev.find(item => item.category === formData.category)
          if (existing) {
            return prev.map(item => item.category === formData.category ? newAnalyticsItem : item)
          }
          return [...prev, newAnalyticsItem]
        })
        
        setSuccessMessage(`Budget for ${formData.category} has been set!`)
        setShowSuccess(true)
        setFormData({ category: '', amount: '', payableBank: '' })
        setEditingBudget(null)
        
        // Refresh analytics in background to ensure server consistency
        fetchAnalytics()
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save budget'
      })
    }
  }

  const handleExport = async (type: 'pdf' | 'email') => {
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/monthly-budget/export', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          type
        })
      })

      if (response.ok) {
        if (type === 'pdf') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `budget-${months[(selectedMonth || new Date().getMonth() + 1) - 1]}-${selectedYear || new Date().getFullYear()}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          
          addNotification({
            type: 'success',
            title: 'PDF Downloaded',
            message: 'Budget report has been downloaded'
          })
        } else {
          addNotification({
            type: 'success',
            title: 'Email Sent',
            message: 'Budget report has been sent to your email'
          })
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export budget report'
      })
    } finally {
      setExporting(false)
    }
  }

  // Fetch available months with budgets for copying
  const fetchAvailableMonths = async () => {
    try {
      const token = localStorage.getItem('token')
      const currentMonth = selectedMonth || new Date().getMonth() + 1
      const currentYear = selectedYear || new Date().getFullYear()
      
      const response = await apiFetch(`/api/monthly-budget/available-months?excludeMonth=${currentMonth}&excludeYear=${currentYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const monthsArray = await response.json()
        setAvailableMonths(monthsArray)
      } else {
        console.error('Failed to fetch available months:', response.status)
        setAvailableMonths([])
      }
    } catch (error) {
      console.error('Error fetching available months:', error)
      setAvailableMonths([])
    }
  }

  // Copy budgets from a previous month
  const copyBudgetsFromMonth = async (fromMonth: number, fromYear: number) => {
    setCopyingBudgets(true)
    try {
      const token = localStorage.getItem('token')
      
      // Fetch budgets from the selected month
      const response = await apiFetch(`/api/monthly-budget?month=${fromMonth}&year=${fromYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const sourceBudgets = await response.json()
        
        if (sourceBudgets.length === 0) {
          addNotification({
            type: 'warning',
            title: 'No Budgets Found',
            message: `No budgets found for ${months[fromMonth - 1]} ${fromYear}`
          })
          return
        }

        // Create budgets for current month
        let successCount = 0
        let skipCount = 0
        
        for (const sourceBudget of sourceBudgets) {
          // Check if budget already exists for this category in current month
          const existingBudget = budgets.find(b => b.category === sourceBudget.category)
          
          if (!existingBudget) {
            const createResponse = await apiFetch('/api/monthly-budget', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                category: sourceBudget.category,
                amount: sourceBudget.amount,
                month: selectedMonth,
                year: selectedYear,
                payableBank: sourceBudget.payableBank || null
              })
            })
            
            if (createResponse.ok) {
              successCount++
            }
          } else {
            skipCount++
          }
        }

        // Refresh data
        await Promise.all([
          fetchBudgets(),
          fetchAnalytics()
        ])

        // Show success message
        let message = `Copied ${successCount} budgets from ${months[fromMonth - 1]} ${fromYear}`
        if (skipCount > 0) {
          message += `. Skipped ${skipCount} existing budgets.`
        }

        addNotification({
          type: 'success',
          title: 'Budgets Copied',
          message
        })

        setShowCopyModal(false)
      }
    } catch (error) {
      console.error('Error copying budgets:', error)
      addNotification({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy budgets from previous month'
      })
    } finally {
      setCopyingBudgets(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'from-emerald-500 to-green-600'
      case 'warning': return 'from-amber-500 to-orange-600'
      case 'over': return 'from-rose-500 to-red-600'
      default: return 'from-blue-500 to-indigo-600'
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    return category?.icon || '📁'
  }

  if (loading) {
    return (
      <>
        <MonthlyBudgetSkeleton />
        <BottomNav />
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
        {/* Desktop Header */}
        <header className="md:block hidden relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-red-600" />
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
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs md:text-sm text-white/80 font-medium bg-white/10 px-2 py-1 rounded-full">
                        Budget
                      </span>
                      <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <span>Monthly tracking</span>
                      </span>
                    </div>
                    <h1 className="heading-page">Monthly Budget</h1>
                  </div>
                </div>
                <p className="text-sm md:text-base text-white/80 max-w-md">
                  Set category-wise budgets and track your spending limits
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                  title="Add Budget"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    fetchAvailableMonths()
                    setShowCopyModal(true)
                  }}
                  className="p-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                  title="Copy from Previous Month"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

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
                      className={`absolute inset-0 w-6 h-6 text-white transition-all duration-500 ${
                        theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
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
                      className={`absolute inset-0 w-6 h-6 text-white transition-all duration-500 ${
                        theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
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
          </div>
        </header>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-lg shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 to-rose-500/30 rounded-lg"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground">Monthly Budget</h1>
                <p className="text-xs text-muted-foreground">
                  {months[(selectedMonth || new Date().getMonth() + 1) - 1]} {selectedYear || new Date().getFullYear()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="relative w-9 h-9 bg-gradient-to-br from-pink-500 via-rose-600 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity"></div>
              <svg className="w-4 h-4 relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">

          {/* Month/Year Selector & Actions */}
          <div className="relative glass-premium rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <select
                    value={selectedMonth || new Date().getMonth() + 1}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border/50 text-foreground font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-secondary/80 cursor-pointer shadow-sm"
                  >
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={selectedYear || new Date().getFullYear()}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-3 rounded-xl bg-secondary border border-border/50 text-foreground font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-secondary/80 cursor-pointer shadow-sm"
                >
                  {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    fetchHistory()
                    setShowHistoryModal(true)
                  }}
                  className="relative flex-1 sm:flex-none px-4 py-3 rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary border border-border/50 font-semibold text-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-md hover:shadow-lg overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline relative z-10">History</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting || analytics.length === 0}
                  className="relative flex-1 sm:flex-none px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50 overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span className="hidden sm:inline relative z-10">PDF</span>
                </button>
                <button
                  onClick={() => handleExport('email')}
                  disabled={exporting || analytics.length === 0}
                  className="relative flex-1 sm:flex-none px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline relative z-10">Email</span>
                </button>
              </div>
            </div>
          </div>

          {/* Billing Period Info Card */}
          {currentPeriod && (
            <div className="relative glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">Current Billing Period</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{formatBillingPeriod(currentPeriod)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{getDaysRemainingInPeriod(userBillingDay)}</p>
                    <p className="text-xs text-muted-foreground">days left</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Period Progress</span>
                    <span className="font-semibold text-foreground">{Math.round(getBillingPeriodProgress(userBillingDay))}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out"
                      style={{ width: `${getBillingPeriodProgress(userBillingDay)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auto-reset Notice */}
          {userBillingDay !== 1 && (
            <div className="relative glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-start gap-3 sm:gap-4">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl animate-pulse"></div>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-2">
                    Custom Billing Cycle Active
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full font-semibold">Day {userBillingDay}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Your budgets track from the {userBillingDay}{userBillingDay === 1 ? 'st' : userBillingDay === 2 ? 'nd' : userBillingDay === 3 ? 'rd' : 'th'} of each month. Change this in Settings.</p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-premium rounded-2xl p-4 sm:p-5 border border-border/20 hover:shadow-premium-lg transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">₹{summary.totalBudgeted.toLocaleString()}</p>
            </div>

            <div className="glass-premium rounded-2xl p-4 sm:p-5 border border-border/20 hover:shadow-premium-lg transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600">₹{summary.totalSpent.toLocaleString()}</p>
            </div>

            <div className="glass-premium rounded-2xl p-4 sm:p-5 border border-border/20 hover:shadow-premium-lg transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">₹{summary.totalRemaining.toLocaleString()}</p>
            </div>

            <div className="glass-premium rounded-2xl p-4 sm:p-5 border border-border/20 hover:shadow-premium-lg transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Overall Used</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{summary.overallPercentage}%</p>
            </div>
          </div>

          {/* Budget List */}
          <div className="space-y-3">
            {analytics.length === 0 ? (
              <div className="glass-premium rounded-2xl p-8 sm:p-12 text-center border border-border/20">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-xl">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">No Budgets Set</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Start by adding a budget for your expense categories to track your spending</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:scale-105 transition-transform font-medium shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Budget
                  </button>
                  <button
                    onClick={() => {
                      fetchAvailableMonths()
                      setShowCopyModal(true)
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:scale-105 transition-transform font-medium shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy from Previous Month
                  </button>
                </div>
              </div>
            ) : (
              analytics.map((item) => (
                <div 
                  key={item.category} 
                  onClick={() => handleCategoryClick(item.category)}
                  className="relative glass-premium rounded-2xl border border-border/20 hover:border-border/40 p-3.5 hover:shadow-lg transition-all duration-300 group overflow-hidden cursor-pointer"
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-indigo-600/3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-center justify-between gap-2.5">
                    {/* Left: Icon + Category + Amount */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="text-2xl flex-shrink-0 transform group-hover:scale-110 transition-transform">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{item.category}</h3>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground font-semibold">₹{item.spent.toLocaleString()}</span>
                          <span className="text-muted-foreground/60 mx-1">of</span>
                          <span className="text-muted-foreground">₹{item.budgeted.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Percentage Badge + Edit Button */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === 'good' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                        item.status === 'warning' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                        'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.percentage}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const budget = budgets.find(b => b.category === item.category)
                          if (budget) {
                            setEditingBudget(budget)
                            setFormData({ 
                              category: budget.category, 
                              amount: budget.amount.toString(),
                              payableBank: (budget as any).payableBank || ''
                            })
                            setShowAddModal(true)
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-secondary/50 hover:bg-secondary border border-border/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-2.5 shadow-inner">
                    <div
                      className={`h-full bg-gradient-to-r ${getStatusColor(item.status)} transition-all duration-700 ease-out relative overflow-hidden`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="flex justify-between items-center text-[11px] mt-2">
                    <span className="text-muted-foreground">
                      Remaining: <span className="font-semibold text-foreground">₹{item.remaining.toLocaleString()}</span>
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      item.status === 'over' ? 'text-rose-600' :
                      item.status === 'warning' ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {item.status === 'over' ? '⚠️ Over budget' : item.status === 'warning' ? '⚡ Almost there' : '✓ On track'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Add/Edit Budget Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-20 sm:pb-4 animate-fade-in">
            <div className="relative glass-premium rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full border border-border/30 shadow-2xl animate-slide-up sm:animate-scale-in max-h-[75vh] sm:max-h-[90vh] overflow-y-auto mb-safe">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-t-3xl sm:rounded-3xl"></div>
              
              {/* Header */}
              <div className="relative flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      {editingBudget ? 'Edit Budget' : 'Add Budget'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Set your spending limit</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ category: '', amount: '', payableBank: '' })
                    setEditingBudget(null)
                  }}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary border border-border/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Form */}
              <div className="relative space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-3 text-foreground">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-border/50 text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-secondary/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none shadow-sm"
                      disabled={!!editingBudget}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-3 text-foreground">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Budget Amount
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className="text-lg font-bold text-blue-600">₹</span>
                    </div>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary border border-border/50 text-foreground font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-secondary/80 shadow-sm"
                      placeholder="Enter amount"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 ml-1">Set your monthly spending limit for this category</p>
                </div>

                {/* Payable Bank */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-3 text-foreground">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payable Bank
                    <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.payableBank}
                      onChange={(e) => setFormData({ ...formData, payableBank: e.target.value })}
                      className="w-full px-4 py-3.5 rounded-xl bg-secondary border border-border/50 text-foreground font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-secondary/80 cursor-pointer appearance-none shadow-sm"
                    >
                      <option value="">Select preferred bank</option>
                      {banks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 ml-1">Choose which bank you prefer to use for this category</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({ category: '', amount: '', payableBank: '' })
                      setEditingBudget(null)
                    }}
                    className="flex-1 px-5 py-3.5 rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary border border-border/50 font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBudget}
                    className="relative flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 active:scale-95 transition-all font-semibold shadow-lg hover:shadow-blue-500/50 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {editingBudget ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Update
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-20 sm:pb-4 animate-fade-in">
            <div className="relative glass-premium rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-border/30 shadow-2xl animate-slide-up sm:animate-scale-in max-h-[75vh] sm:max-h-[90vh] overflow-y-auto mb-safe">
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-pink-600/5 rounded-t-3xl sm:rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent rounded-t-3xl sm:rounded-3xl"></div>
              
              {/* Header */}
              <div className="relative flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Budget History</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Past budget performance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Month Selection */}
              {availableHistoryMonths.length > 0 && (
                <div className="relative mb-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedHistoryMonth(null)
                        setSelectedHistoryYear(null)
                        fetchHistory()
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedHistoryMonth === null
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                          : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/50'
                      }`}
                    >
                      All History
                    </button>
                    {availableHistoryMonths.map((monthData) => (
                      <button
                        key={`${monthData.month}-${monthData.year}`}
                        onClick={() => {
                          setSelectedHistoryMonth(monthData.month)
                          setSelectedHistoryYear(monthData.year)
                          fetchHistoryForMonth(monthData.month, monthData.year)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedHistoryMonth === monthData.month && selectedHistoryYear === monthData.year
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                            : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border/50'
                        }`}
                      >
                        {months[monthData.month - 1]} {monthData.year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="relative space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 text-foreground">No History Found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      {selectedHistoryMonth ? 'No budget data found for the selected month' : 'No past budget data available. Budget history shows all months before the current month.'}
                    </p>
                  </div>
                ) : (
                  history.map((period: any) => (
                    <div key={`${period.month}-${period.year}`} className="relative glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-border/30 hover:border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-300 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <h3 className="font-bold text-base sm:text-lg text-foreground">{months[period.month - 1]} {period.year}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {period.categories.length} categories
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            ₹{period.categories.reduce((sum: number, cat: any) => sum + cat.spentAmount, 0).toLocaleString()} spent
                          </div>
                        </div>
                      </div>
                      <div className="relative space-y-2.5">
                        {period.categories.map((cat: any) => (
                          <div key={cat.id} className="flex items-center justify-between text-sm p-3 sm:p-3.5 rounded-lg bg-secondary/50 hover:bg-secondary/70 border border-border/30 hover:border-border/50 transition-all duration-200 shadow-sm">
                            <span className="font-semibold text-foreground">{cat.category}</span>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-foreground font-bold">₹{cat.spentAmount.toLocaleString()}</span>
                              <span className="text-muted-foreground text-xs font-medium">/</span>
                              <span className="text-muted-foreground font-medium">₹{cat.budgetedAmount.toLocaleString()}</span>
                              <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold shadow-md ${
                                cat.status === 'good' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20' :
                                cat.status === 'warning' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-amber-500/20' :
                                'bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-rose-500/20'
                              }`}>
                                {cat.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
      <KeyboardShortcutsHint />
      
      {showSuccess && (
        <SuccessAnimation
          message={successMessage}
          onComplete={() => {
            setShowSuccess(false)
            setShowAddModal(false)
          }}
        />
      )}

      {/* Copy Budget Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Copy from Previous Month</h2>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a previous month to copy all budgets to {months[(selectedMonth || new Date().getMonth() + 1) - 1]} {selectedYear || new Date().getFullYear()}
                </p>

                {availableMonths.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">No previous budgets found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableMonths.map((monthData) => (
                      <button
                        key={`${monthData.month}-${monthData.year}`}
                        onClick={() => copyBudgetsFromMonth(monthData.month, monthData.year)}
                        disabled={copyingBudgets}
                        className="w-full p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {months[monthData.month - 1]} {monthData.year}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {monthData.count} budget{monthData.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {copyingBudgets ? (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LazyCategoryDetailsModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          setSelectedCategory(null)
        }}
        category={selectedCategory || ''}
        expenses={selectedCategory ? getCategoryExpenses(selectedCategory) : []}
        totalAmount={selectedCategory ? getCategoryTotal(selectedCategory) : 0}
        budgetAmount={selectedCategory ? budgets.find(b => b.category === selectedCategory)?.amount || 0 : 0}
        payableBank={selectedCategory ? budgets.find(b => b.category === selectedCategory)?.payableBank : undefined}
      />
    </>
  )
}

export default function MonthlyBudget() {
  return (
    <ProtectedRoute>
      <MonthlyBudgetContent />
    </ProtectedRoute>
  )
}
