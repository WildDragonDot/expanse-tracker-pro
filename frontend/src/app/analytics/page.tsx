'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotification } from '@/contexts/NotificationContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncomes } from '@/hooks/useIncomes'
import BottomNav from '@/components/BottomNav'
import { 
  getCurrentBillingPeriod, 
  isDateInBillingPeriod,
  formatBillingPeriod,
  getPreviousBillingPeriod
} from '@/lib/billingCycle'
import { parseAppDate } from '@/lib/dateUtils'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, RadialBarChart, RadialBar
} from 'recharts'
import { exportToExcel, generateFinancialSummary } from '@/lib/exportUtils'
import { calculateFinancialHealthScore } from '@/lib/healthScore'
import { InfoTooltip, TipTooltip } from '@/components/Tooltip'
import ProtectedRoute from '@/components/ProtectedRoute'
import CategoryDetailsModal from '@/components/CategoryDetailsModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHint from '@/components/KeyboardShortcutsHint'
import ErrorState from '@/components/ErrorState'
import { loadWithMinimumTime } from '@/lib/loadingHelper'

function AnalyticsContent() {
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const { addNotification } = useNotification()
  const { summary, loading: analyticsLoading } = useAnalytics()
  const { expenses, loading: expensesLoading } = useExpenses()
  const { incomes, loading: incomesLoading } = useIncomes()
  
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [budgetData, setBudgetData] = useState<any[]>([])
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
      key: 'r',
      ctrl: true,
      callback: () => window.location.reload(),
      description: 'Refresh Data'
    },
    {
      key: 'e',
      ctrl: true,
      callback: () => handleExport('excel'),
      description: 'Export to Excel'
    },
    {
      key: 'Escape',
      callback: () => setShowCategoryModal(false),
      description: 'Close Modal'
    }
  ])

  // Fetch budget data (using billing period)
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const token = localStorage.getItem('token')
        const now = new Date()
        const currentPeriod = getCurrentBillingPeriod(userBillingDay, now)
        const response = await apiFetch(`/api/monthly-budget/analytics?month=${currentPeriod.month}&year=${currentPeriod.year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setBudgetData(data.analytics || [])
        }
      } catch (error) {
        console.error('Error fetching budget data:', error)
      }
    }
    if (userBillingDay) {
      fetchBudgets()
    }
  }, [userBillingDay])

  // Calculate comprehensive analytics data
  const analyticsData = {
    // Monthly trend data
    monthlyTrend: generateMonthlyTrend(),
    // Category breakdown
    categoryData: generateCategoryData(),
    // Income vs Expense comparison
    incomeExpenseData: generateIncomeExpenseData(),
    // Daily spending pattern
    dailyPattern: generateDailyPattern(),
    // Payment method distribution
    paymentMethods: generatePaymentMethodData(),
    // Bank vs Digital payments
    bankVsDigital: generateBankVsDigitalData(),
    // Weekly spending trend
    weeklyTrend: generateWeeklyTrend(),
    // Income sources
    incomeSources: generateIncomeSourcesData(),
    // Savings rate over time
    savingsRate: generateSavingsRateData(),
    // Top spending categories
    topCategories: generateTopCategories(),
    // Budget vs actual
    budgetComparison: generateBudgetComparison(),
    // Expense growth rate
    growthRate: calculateGrowthRate(),
    // Financial health score
    healthScore: calculateFinancialHealthScore(expenses, incomes),
    // Bank-wise budget spending
    bankWiseBudgetSpending: generateBankWiseBudgetSpending()
  }

  function generateMonthlyTrend() {
    const periods = []
    
    // Generate last 12 billing periods
    for (let i = 11; i >= 0; i--) {
      const refDate = new Date()
      refDate.setMonth(refDate.getMonth() - i)
      const period = getCurrentBillingPeriod(userBillingDay, refDate)
      
      const periodExpenses = expenses.filter(e => {
        const date = parseAppDate(e.date)
        return isDateInBillingPeriod(date, period)
      })
      const periodIncomes = incomes.filter(i => {
        const date = parseAppDate(i.date)
        return isDateInBillingPeriod(date, period)
      })
      
      const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0)
      const totalIncome = periodIncomes.reduce((sum, i) => sum + i.amount, 0)
      
      // Format label based on billing day
      const monthLabel = period.startDate.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      })
      
      periods.push({
        month: monthLabel,
        expenses: totalExpenses,
        income: totalIncome,
        savings: totalIncome - totalExpenses
      })
    }
    return periods
  }

  function generateCategoryData() {
    const categories: Record<string, number> = {}
    expenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + expense.amount
    })
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName)
    setShowCategoryModal(true)
  }

  const getCategoryExpenses = (category: string) => {
    return expenses.filter((e: any) => e.category === category)
  }

  const getCategoryTotal = (category: string) => {
    return expenses
      .filter((e: any) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  function generateIncomeExpenseData() {
    const last6Periods = []
    for (let i = 5; i >= 0; i--) {
      const refDate = new Date()
      refDate.setMonth(refDate.getMonth() - i)
      const period = getCurrentBillingPeriod(userBillingDay, refDate)
      
      const periodExpenses = expenses.filter(e => {
        const expenseDate = parseAppDate(e.date)
        return isDateInBillingPeriod(expenseDate, period)
      })
      
      const periodIncomes = incomes.filter(i => {
        const incomeDate = parseAppDate(i.date)
        return isDateInBillingPeriod(incomeDate, period)
      })

      const periodLabel = period.startDate.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      })

      last6Periods.push({
        month: periodLabel,
        income: periodIncomes.reduce((sum, i) => sum + i.amount, 0),
        expenses: periodExpenses.reduce((sum, e) => sum + e.amount, 0)
      })
    }
    return last6Periods
  }

  function generateDailyPattern() {
    const now = new Date()
    const currentDow = now.getDay() // 0 = Sun, 1 = Mon ...
    const diffToMonday = currentDow === 0 ? -6 : 1 - currentDow
    const mondayDate = new Date(now)
    mondayDate.setDate(now.getDate() + diffToMonday)
    mondayDate.setHours(0, 0, 0, 0)

    const formatDayDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const todayStr = formatDayDate(now)
    const expenseByDate: Record<string, number> = {}
    expenses.forEach(exp => {
      const d = parseAppDate(exp.date)
      const dStr = formatDayDate(d)
      expenseByDate[dStr] = (expenseByDate[dStr] || 0) + exp.amount
    })

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => {
      const targetDate = new Date(mondayDate)
      targetDate.setDate(mondayDate.getDate() + index)
      const targetDateStr = formatDayDate(targetDate)
      const isFuture = targetDateStr > todayStr
      return {
        day,
        amount: isFuture ? 0 : (expenseByDate[targetDateStr] || 0)
      }
    })
  }

  function generatePaymentMethodData() {
    const methods: Record<string, number> = {}
    expenses.forEach(expense => {
      const method = expense.paymentMode || 'Cash'
      methods[method] = (methods[method] || 0) + expense.amount
    })
    return Object.entries(methods).map(([name, value]) => ({ name, value }))
  }

  function generateBankVsDigitalData() {
    const bankMethods = ['Bank Transfer', 'Debit Card', 'Credit Card', 'Cheque']
    const digitalMethods = ['UPI', 'Paytm', 'PhonePe', 'Google Pay', 'Digital Wallet']
    
    let bank = 0, digital = 0, cash = 0
    
    expenses.forEach(expense => {
      const method = expense.paymentMode || 'Cash'
      if (bankMethods.some(m => method.toLowerCase().includes(m.toLowerCase()))) {
        bank += expense.amount
      } else if (digitalMethods.some(m => method.toLowerCase().includes(m.toLowerCase()))) {
        digital += expense.amount
      } else {
        cash += expense.amount
      }
    })
    
    return [
      { name: 'Bank/Card', value: bank, color: '#3B82F6' },
      { name: 'Digital/UPI', value: digital, color: '#8B5CF6' },
      { name: 'Cash', value: cash, color: '#10B981' }
    ]
  }

  function generateWeeklyTrend() {
    const period = getCurrentBillingPeriod(userBillingDay)
    
    // Calculate number of weeks in current billing period
    const totalDays = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const numWeeks = Math.ceil(totalDays / 7)
    
    const weeks = []
    for (let i = 0; i < numWeeks; i++) {
      const weekStartDate = new Date(period.startDate)
      weekStartDate.setDate(weekStartDate.getDate() + (i * 7))
      
      const weekEndDate = new Date(weekStartDate)
      weekEndDate.setDate(weekEndDate.getDate() + 6)
      
      // Don't go beyond period end
      if (weekEndDate > period.endDate) {
        weekEndDate.setTime(period.endDate.getTime())
      }
      
      const weekExpenses = expenses.filter(e => {
        const date = parseAppDate(e.date)
        return date >= weekStartDate && date <= weekEndDate
      })
      
      weeks.push({
        week: `Week ${i + 1}`,
        dateRange: `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEndDate.toLocaleDateString('en-US', { day: 'numeric' })}`,
        amount: weekExpenses.reduce((sum, e) => sum + e.amount, 0)
      })
    }
    
    return weeks
  }

  function generateIncomeSourcesData() {
    const sources: Record<string, number> = {}
    incomes.forEach(income => {
      const source = income.source || 'Other'
      sources[source] = (sources[source] || 0) + income.amount
    })
    return Object.entries(sources).map(([name, value]) => ({ name, value }))
  }

  function generateSavingsRateData() {
    return generateMonthlyTrend().map(item => ({
      month: item.month,
      rate: item.income > 0 ? ((item.savings / item.income) * 100).toFixed(1) : 0
    }))
  }

  function generateTopCategories() {
    return generateCategoryData()
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }

  function generateBudgetComparison() {
    // Get actual spending from expenses for current billing period
    const period = getCurrentBillingPeriod(userBillingDay)
    
    const categoryTotals: Record<string, number> = {}
    expenses.forEach(expense => {
      const expenseDate = parseAppDate(expense.date)
      // Only include expenses from current billing period
      if (isDateInBillingPeriod(expenseDate, period)) {
        const cat = expense.category || 'Other'
        categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount
      }
    })
    
    // If no expenses, return empty array
    if (Object.keys(categoryTotals).length === 0) {
      return []
    }

    // Create a map of budgets by category
    const budgetMap: Record<string, number> = {}
    if (budgetData && budgetData.length > 0) {
      budgetData.forEach(item => {
        budgetMap[item.category] = item.budgeted
      })
    }

    // Create comparison data: show all categories with expenses
    const comparisonData = Object.entries(categoryTotals).map(([category, actual]) => {
      const budget = budgetMap[category] || 0 // Use 0 if no budget set
      return {
        category,
        budget,
        actual,
        percentage: budget > 0 ? Math.round((actual / budget) * 100) : 0
      }
    })
    
    // Sort by actual spending and return top 5
    return comparisonData
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 5)
  }

  function calculateGrowthRate() {
    const currentPeriod = getCurrentBillingPeriod(userBillingDay)
    const previousPeriod = getPreviousBillingPeriod(userBillingDay)
    
    const thisPeriod = expenses.filter(e => {
      const date = parseAppDate(e.date)
      return isDateInBillingPeriod(date, currentPeriod)
    }).reduce((sum, e) => sum + e.amount, 0)

    const lastPeriod = expenses.filter(e => {
      const date = parseAppDate(e.date)
      return isDateInBillingPeriod(date, previousPeriod)
    }).reduce((sum, e) => sum + e.amount, 0)

    return lastPeriod > 0 ? ((thisPeriod - lastPeriod) / lastPeriod * 100).toFixed(1) : 0
  }

  function generateBankWiseBudgetSpending() {
    // Safety check
    if (!expenses || expenses.length === 0) {
      return { data: [], banks: [] }
    }

    // Get current period expenses
    const currentPeriod = getCurrentBillingPeriod(userBillingDay)
    const currentExpenses = expenses.filter(e => {
      const date = parseAppDate(e.date)
      return isDateInBillingPeriod(date, currentPeriod)
    })

    // Group by category first, then by bank
    const categoryBankMap: Record<string, Record<string, number>> = {}
    const allBanks = new Set<string>()
    
    currentExpenses.forEach(expense => {
      const category = expense.category || 'Other'
      const bank = expense.bank || 'Cash'
      
      allBanks.add(bank)
      
      if (!categoryBankMap[category]) {
        categoryBankMap[category] = {}
      }
      categoryBankMap[category][bank] = (categoryBankMap[category][bank] || 0) + expense.amount
    })

    // Convert to array format for grouped bar chart
    const result = Object.entries(categoryBankMap).map(([category, banks]) => {
      const item: any = { category }
      
      // Add each bank as a separate property (0 if not used)
      allBanks.forEach(bank => {
        item[bank] = banks[bank] || 0
      })
      
      // Calculate total for sorting
      item.total = Object.values(banks).reduce((sum: number, val) => sum + (val as number), 0)
      
      return item
    })

    // Filter out categories with 0 total and sort by total amount
    const filteredData = result
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)

    return {
      data: filteredData, // Show ALL categories with spending > 0
      banks: Array.from(allBanks).sort() // Show ALL banks used
    }
  }



  const handleExport = async (type: 'excel') => {
    setExportLoading(true)
    try {
      const report = generateFinancialSummary(expenses, incomes)
      exportToExcel([report], 'financial-analytics')
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Analytics data exported to Excel successfully.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export analytics data. Please try again.',
        duration: 4000
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Financial Analytics Report',
          text: `My financial summary: Income: ₹${incomes.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}, Expenses: ₹${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback to clipboard
      const shareText = `Financial Analytics Report\nIncome: ₹${incomes.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}\nExpenses: ₹${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}\nSavings: ₹${(incomes.reduce((sum, i) => sum + i.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}`
      
      navigator.clipboard.writeText(shareText)
      addNotification({
        type: 'success',
        title: 'Copied to Clipboard',
        message: 'Analytics summary copied to clipboard.',
        duration: 3000
      })
    }
  }

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1']

  const loading = analyticsLoading || expensesLoading || incomesLoading

  return (
    <>
      <div className="min-h-screen bg-background text-foreground pt-16 pb-24 md:pt-6 md:pb-12 md:pl-64 lg:pl-72">
        {/* Desktop Header Banner */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  Analytics & Insights
                </span>
                <span className="text-xs text-white/80">
                  Health Score: {analyticsData.healthScore}% • {expenses.length + incomes.length} total records
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Financial Analytics</h1>
              <p className="text-sm text-white/80 max-w-lg">
                Deep dive into cash flow trends, category distributions, bank breakdowns, and forecasts.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <button
                onClick={() => handleExport('excel')}
                disabled={exportLoading}
                className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm shadow-lg hover:bg-white/90 hover:scale-105 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 md:space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-slide-in">
            {/* Financial Health */}
            <div className="col-span-2 md:col-span-1 glass-premium rounded-xl p-4 md:p-5 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded font-medium border border-violet-200/50 dark:border-violet-500/50">Health</span>
                  <InfoTooltip 
                    content="Comprehensive financial wellness score based on savings rate, income stability, expense tracking, and spending patterns"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold text-violet-600 mb-1">{analyticsData.healthScore}%</p>
                <p className="text-xs text-muted-foreground">Financial Health</p>
              </div>
            </div>

            {/* Total Income */}
            <div className="glass-premium rounded-xl p-4 md:p-5 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-sm md:text-base">₹</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded font-medium border border-emerald-200/50 dark:border-emerald-500/50">Income</span>
                  <InfoTooltip 
                    content="Total money earned from all sources including salary, freelance, investments, and other income streams"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold text-emerald-600 mb-1">₹{incomes.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Income</p>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="glass-premium rounded-xl p-4 md:p-5 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded font-medium border border-red-200/50 dark:border-red-500/50">Expense</span>
                  <InfoTooltip 
                    content="Total money spent across all categories including food, transport, shopping, bills, and other expenses"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold text-red-600 mb-1">₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
              </div>
            </div>

            {/* Net Savings */}
            <div className="glass-premium rounded-xl p-4 md:p-5 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded font-medium border border-blue-200/50 dark:border-blue-500/50">Savings</span>
                  <InfoTooltip 
                    content="Total income minus total expenses (positive = savings, negative = deficit)"
                    iconSize="w-2.5 h-2.5"
                  />
                </div>
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold text-blue-600 mb-1">₹{(incomes.reduce((sum, i) => sum + i.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Net Savings</p>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart - Full Width Premium */}
          <div className="relative glass-premium rounded-xl md:rounded-2xl p-2 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden -mx-1 md:mx-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 md:mb-5 px-2 md:px-0">
                <div>
                  <h3 className="text-sm md:text-lg font-bold text-foreground mb-0.5 md:mb-1">Monthly Trend</h3>
                  <p className="text-xs text-muted-foreground hidden md:block">Income vs Expenses over time</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                  <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Premium Legend at Top */}
              <div className="flex items-center justify-center gap-4 md:gap-6 mb-3 md:mb-4 pb-2 md:pb-3 border-b border-border/10 px-2 md:px-0">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-lg"></div>
                  <span className="text-xs font-semibold text-foreground">income</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 shadow-lg"></div>
                  <span className="text-xs font-semibold text-foreground">expenses</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-purple-500 shadow-lg"></div>
                  <span className="text-xs font-semibold text-foreground">savings</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.monthlyTrend} margin={{ top: 20, right: 10, left: -25, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                    opacity={0.5}
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis 
                    dataKey="month" 
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                    width={45}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                      borderRadius: '16px',
                      padding: '14px 18px',
                      boxShadow: theme === 'dark' 
                        ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 20px 40px -10px rgba(139, 92, 246, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    }}
                    labelStyle={{ 
                      fontWeight: 700, 
                      marginBottom: '8px', 
                      fontSize: '13px',
                      color: theme === 'dark' ? '#F3F4F6' : '#111827',
                      textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                    itemStyle={{
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    cursor={{ 
                      stroke: theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                      strokeWidth: 2,
                      strokeDasharray: '5 5'
                    }}
                    animationDuration={300}
                    animationEasing="ease-out"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#8B5CF6" 
                    strokeWidth={4}
                    dot={{ fill: '#8B5CF6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
          </div>

          {/* Other Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Category Breakdown Pie Chart */}
            <div className="relative glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Expense Categories</h3>
                  <p className="text-xs text-muted-foreground">Spending distribution by category</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    </svg>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    animationDuration={800}
                    onClick={(data) => handleCategoryClick(data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {analyticsData.categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${theme === 'dark' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)'}`,
                      borderRadius: '16px',
                      padding: '14px 18px',
                      boxShadow: theme === 'dark' 
                        ? '0 20px 40px -10px rgba(168, 85, 247, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 20px 40px -10px rgba(168, 85, 247, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    }}
                    labelStyle={{ 
                      fontWeight: 700, 
                      marginBottom: '8px', 
                      fontSize: '13px',
                      color: theme === 'dark' ? '#F3F4F6' : '#111827',
                      textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                    itemStyle={{
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    cursor={{ 
                      fill: theme === 'dark' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
                    }}
                    animationDuration={300}
                    animationEasing="ease-out"
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* More Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Income vs Expense Comparison */}
            <div className="relative glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Income vs Expenses</h3>
                  <p className="text-xs text-muted-foreground">Last 6 months comparison</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Premium Legend at Top */}
              <div className="flex items-center justify-center gap-6 mb-4 pb-3 border-b border-border/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg"></div>
                  <span className="text-xs font-semibold text-foreground">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg"></div>
                  <span className="text-xs font-semibold text-foreground">Expenses</span>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={analyticsData.incomeExpenseData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  barGap={8}
                  barCategoryGap="20%"
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                    opacity={0.5}
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis 
                    dataKey="month" 
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                    tick={{ fontSize: 11, fontWeight: 500 }}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                      borderRadius: '16px',
                      padding: '14px 18px',
                      boxShadow: theme === 'dark' 
                        ? '0 20px 40px -10px rgba(16, 185, 129, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 20px 40px -10px rgba(16, 185, 129, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    }}
                    labelStyle={{ 
                      fontWeight: 700, 
                      marginBottom: '8px', 
                      fontSize: '13px',
                      color: theme === 'dark' ? '#F3F4F6' : '#111827',
                      textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                    itemStyle={{
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    cursor={{ 
                      fill: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                    }}
                    animationDuration={300}
                    animationEasing="ease-out"
                  />
                  <Bar 
                    dataKey="income" 
                    fill="#10B981" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={800}
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="#EF4444" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Distribution - Bar Chart */}
            <div className="relative glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Payment Methods</h3>
                    <p className="text-xs text-muted-foreground">How you spend your money</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={analyticsData.paymentMethods}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#F97316" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                      opacity={0.5}
                      vertical={false}
                      horizontal={true}
                    />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: `1px solid ${theme === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
                        borderRadius: '16px',
                        padding: '14px 18px',
                        boxShadow: theme === 'dark' 
                          ? '0 20px 40px -10px rgba(245, 158, 11, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 20px 40px -10px rgba(245, 158, 11, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      }}
                      labelStyle={{ 
                        fontWeight: 700, 
                        marginBottom: '8px', 
                        fontSize: '13px',
                        color: theme === 'dark' ? '#F3F4F6' : '#111827',
                        textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#D1D5DB' : '#374151',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      cursor={{ 
                        fill: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                      }}
                      animationDuration={300}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#paymentGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bank vs Digital Payments & Weekly Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Bank vs Digital Payments - Pie Chart */}
            <div className="relative glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Payment Types</h3>
                    <p className="text-xs text-muted-foreground">Bank, Digital & Cash distribution</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.bankVsDigital}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                      animationDuration={800}
                    >
                      {analyticsData.bankVsDigital.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: `1px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                        borderRadius: '16px',
                        padding: '14px 18px',
                        boxShadow: theme === 'dark' 
                          ? '0 20px 40px -10px rgba(59, 130, 246, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 20px 40px -10px rgba(59, 130, 246, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      }}
                      labelStyle={{ 
                        fontWeight: 700, 
                        marginBottom: '8px', 
                        fontSize: '13px',
                        color: theme === 'dark' ? '#F3F4F6' : '#111827',
                        textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#D1D5DB' : '#374151',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                      animationDuration={300}
                      animationEasing="ease-out"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Spending Trend */}
            <div className="relative glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1">
                      Weekly Spending - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-muted-foreground">Expenses by week of current month</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={analyticsData.weeklyTrend}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                      opacity={0.5}
                      vertical={false}
                      horizontal={true}
                    />
                    <XAxis 
                      dataKey="week" 
                      stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      tick={(props) => {
                        const { x, y, payload } = props
                        const data = analyticsData.weeklyTrend.find((item: any) => item.week === payload.value)
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text 
                              x={0} 
                              y={0} 
                              dy={12} 
                              textAnchor="middle" 
                              fill={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                              fontSize={11}
                              fontWeight={500}
                            >
                              {payload.value}
                            </text>
                            <text 
                              x={0} 
                              y={0} 
                              dy={24} 
                              textAnchor="middle" 
                              fill={theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                              fontSize={9}
                            >
                              {data?.dateRange || ''}
                            </text>
                          </g>
                        )
                      }}
                      height={50}
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: `1px solid ${theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                        borderRadius: '16px',
                        padding: '14px 18px',
                        boxShadow: theme === 'dark' 
                          ? '0 20px 40px -10px rgba(99, 102, 241, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 20px 40px -10px rgba(99, 102, 241, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      }}
                      labelStyle={{ 
                        fontWeight: 700, 
                        marginBottom: '8px', 
                        fontSize: '13px',
                        color: theme === 'dark' ? '#F3F4F6' : '#111827',
                        textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#D1D5DB' : '#374151',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spent']}
                      cursor={{ 
                        fill: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                      }}
                      animationDuration={300}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="url(#weeklyGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={60}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Income Sources & Daily Spending Pattern */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* Income Sources Breakdown */}
            <div className="relative glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Income Sources</h3>
                    <p className="text-xs text-muted-foreground">Where your money comes from</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.incomeSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                      animationDuration={800}
                    >
                      {analyticsData.incomeSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                        borderRadius: '16px',
                        padding: '14px 18px',
                        boxShadow: theme === 'dark' 
                          ? '0 20px 40px -10px rgba(16, 185, 129, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 20px 40px -10px rgba(16, 185, 129, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      }}
                      labelStyle={{ 
                        fontWeight: 700, 
                        marginBottom: '8px', 
                        fontSize: '13px',
                        color: theme === 'dark' ? '#F3F4F6' : '#111827',
                        textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                      }}
                      itemStyle={{
                        color: theme === 'dark' ? '#D1D5DB' : '#374151',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                      animationDuration={300}
                      animationEasing="ease-out"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Spending Pattern */}
            <div className="glass-premium rounded-2xl p-6 border border-border/20 shadow-premium">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground">
                    Daily Spending Pattern - Week {Math.ceil(new Date().getDate() / 7)}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Average spending by day of week (All time)</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.dailyPattern}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                    opacity={0.5}
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis dataKey="day" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${theme === 'dark' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)'}`,
                      borderRadius: '16px',
                      padding: '14px 18px',
                      boxShadow: theme === 'dark' 
                        ? '0 20px 40px -10px rgba(236, 72, 153, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 20px 40px -10px rgba(236, 72, 153, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    }}
                    labelStyle={{ 
                      fontWeight: 700, 
                      marginBottom: '8px', 
                      fontSize: '13px',
                      color: theme === 'dark' ? '#F3F4F6' : '#111827',
                      textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                    itemStyle={{
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    cursor={{ 
                      stroke: theme === 'dark' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)',
                      strokeWidth: 2,
                      strokeDasharray: '5 5'
                    }}
                    animationDuration={300}
                    animationEasing="ease-out"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#EC4899" 
                    fill="#EC4899" 
                    fillOpacity={0.3}
                    strokeWidth={3}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Savings Rate Trend */}
            <div className="glass-premium rounded-2xl p-6 border border-border/20 shadow-premium">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-foreground">Savings Rate Trend</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Monthly savings percentage</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.savingsRate}>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                    opacity={0.5}
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis dataKey="month" stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${theme === 'dark' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
                      borderRadius: '16px',
                      padding: '14px 18px',
                      boxShadow: theme === 'dark' 
                        ? '0 20px 40px -10px rgba(6, 182, 212, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 20px 40px -10px rgba(6, 182, 212, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    }}
                    labelStyle={{ 
                      fontWeight: 700, 
                      marginBottom: '8px', 
                      fontSize: '13px',
                      color: theme === 'dark' ? '#F3F4F6' : '#111827',
                      textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                    itemStyle={{
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    cursor={{ 
                      stroke: theme === 'dark' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)',
                      strokeWidth: 2,
                      strokeDasharray: '5 5'
                    }}
                    animationDuration={300}
                    animationEasing="ease-out"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#06B6D4" 
                    strokeWidth={3} 
                    dot={{ fill: '#06B6D4', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget vs Actual Comparison - Premium Horizontal Chart */}
          <div className="relative glass-premium rounded-2xl p-4 md:p-6 border border-border/20 shadow-premium overflow-hidden group hover:shadow-premium-lg transition-all duration-300">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base md:text-lg font-bold text-foreground">Budget vs Actual</h3>
                    <div className="px-2 py-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full">
                      <span className="text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {analyticsData.budgetComparison.length} Categories
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Track your spending performance</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Premium Legend with Gradient */}
              <div className="flex items-center justify-center gap-6 mb-5 pb-4 border-b border-border/10">
                <div className="flex items-center gap-2 group/legend cursor-pointer">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded blur-sm opacity-50 group-hover/legend:opacity-100 transition-opacity"></div>
                    <div className="relative w-4 h-4 rounded bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg"></div>
                  </div>
                  <span className="text-xs font-semibold text-foreground">Budget</span>
                </div>
                <div className="flex items-center gap-2 group/legend cursor-pointer">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded blur-sm opacity-50 group-hover/legend:opacity-100 transition-opacity"></div>
                    <div className="relative w-4 h-4 rounded bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg"></div>
                  </div>
                  <span className="text-xs font-semibold text-foreground">Actual</span>
                </div>
              </div>
              
              {analyticsData.budgetComparison.length > 0 ? (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={Math.max(analyticsData.budgetComparison.length * 85, 220)}>
                    <BarChart 
                      data={analyticsData.budgetComparison}
                      layout="vertical"
                      margin={{ top: 10, right: 25, left: 5, bottom: 10 }}
                      barGap={3}
                      barCategoryGap="18%"
                    >
                      <defs>
                        <linearGradient id="budgetGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#A78BFA" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#22D3EE" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                        horizontal={false}
                        strokeOpacity={0.5}
                        vertical={true}
                      />
                      <XAxis 
                        type="number"
                        stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                        tick={{ fontSize: 10, fontWeight: 500 }}
                        tickFormatter={(value) => {
                          if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
                          return `₹${value}`
                        }}
                        axisLine={{ strokeWidth: 2 }}
                      />
                      <YAxis 
                        dataKey="category"
                        type="category"
                        stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        width={85}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '16px',
                          fontSize: '12px',
                          padding: '12px 16px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          backdropFilter: 'blur(10px)'
                        }}
                        formatter={(value: number, name: string) => [
                          `₹${value.toLocaleString()}`,
                          name === 'budget' ? '💰 Budget' : '💳 Actual'
                        ]}
                        labelStyle={{ 
                          fontWeight: 'bold', 
                          marginBottom: '8px',
                          fontSize: '13px',
                          color: theme === 'dark' ? '#F3F4F6' : '#111827'
                        }}
                      />
                      <Bar 
                        dataKey="budget" 
                        fill="url(#budgetGradient)"
                        name="budget" 
                        radius={[0, 10, 10, 0]}
                        maxBarSize={28}
                        animationDuration={800}
                        animationBegin={0}
                      />
                      <Bar 
                        dataKey="actual" 
                        fill="url(#actualGradient)"
                        name="actual" 
                        radius={[0, 10, 10, 0]}
                        maxBarSize={28}
                        animationDuration={800}
                        animationBegin={200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
                      <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">No Data Available</h4>
                  <p className="text-xs text-muted-foreground">Add expenses to visualize your budget</p>
                </div>
              )}
            </div>
          </div>

          {/* Bank-wise & Category Spending Comparison */}
          {analyticsData.bankWiseBudgetSpending.data && analyticsData.bankWiseBudgetSpending.data.length > 0 && (
            <div className="relative glass-premium rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1">Bank & Category Spending</h3>
                    <p className="text-xs text-muted-foreground">Compare spending across banks and categories</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Grouped Bar Chart - Categories with Banks */}
                <div>
                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-4 pb-3 border-b border-border/10">
                    {analyticsData.bankWiseBudgetSpending.banks.map((bank: string, index: number) => {
                      const colors = [
                        { from: '#8B5CF6', to: '#6366F1' },
                        { from: '#10B981', to: '#14B8A6' },
                        { from: '#F59E0B', to: '#F97316' },
                        { from: '#06B6D4', to: '#3B82F6' },
                        { from: '#EC4899', to: '#F472B6' },
                      ]
                      const color = colors[index % colors.length]
                      return (
                        <div key={bank} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shadow-lg" 
                            style={{ background: `linear-gradient(to right, ${color.from}, ${color.to})` }}
                          ></div>
                          <span className="text-xs font-semibold text-foreground">{bank}</span>
                        </div>
                      )
                    })}
                  </div>

                  <ResponsiveContainer width="100%" height={Math.max(350, analyticsData.bankWiseBudgetSpending.data.length * 60)}>
                    <BarChart 
                      data={analyticsData.bankWiseBudgetSpending.data}
                      layout="vertical"
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="bank0" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="bank1" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                          <stop offset="100%" stopColor="#14B8A6" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="bank2" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                          <stop offset="100%" stopColor="#F97316" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="bank3" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="bank4" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#EC4899" stopOpacity={1} />
                          <stop offset="100%" stopColor="#F472B6" stopOpacity={1} />
                        </linearGradient>
                        <filter id="barGlow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={theme === 'dark' ? '#4B5563' : '#D1D5DB'} 
                        opacity={0.5}
                        vertical={true}
                        horizontal={false}
                      />
                      <XAxis 
                        type="number"
                        stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                        tick={{ fontSize: 10, fontWeight: 500 }}
                        tickFormatter={(value) => {
                          if (value === 0) return '₹0'
                          if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`
                          return `₹${value}`
                        }}
                        domain={[0, 'auto']}
                        allowDecimals={false}
                      />
                      <YAxis 
                        type="category"
                        dataKey="category"
                        stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                        tick={{ fontSize: 10, fontWeight: 600 }}
                        width={80}
                        tickMargin={5}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                          border: `1px solid ${theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                          borderRadius: '16px',
                          padding: '14px 18px',
                          boxShadow: theme === 'dark' 
                            ? '0 20px 40px -10px rgba(139, 92, 246, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            : '0 20px 40px -10px rgba(139, 92, 246, 0.3), 0 10px 20px -5px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(16px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        }}
                        labelStyle={{ 
                          fontWeight: 700, 
                          marginBottom: '8px', 
                          fontSize: '13px',
                          color: theme === 'dark' ? '#F3F4F6' : '#111827',
                          textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(255,255,255,0.8)'
                        }}
                        itemStyle={{
                          color: theme === 'dark' ? '#D1D5DB' : '#374151',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                        formatter={(value: number, name: string) => {
                          if (value === 0) return null
                          return [`₹${value.toLocaleString()}`, name]
                        }}
                        cursor={{ 
                          fill: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                        }}
                        animationDuration={300}
                        animationEasing="ease-out"
                      />
                      {analyticsData.bankWiseBudgetSpending.banks.map((bank: string, index: number) => (
                        <Bar 
                          key={bank}
                          dataKey={bank}
                          fill={`url(#bank${index % 5})`}
                          radius={[0, 6, 6, 0]}
                          barSize={25}
                          animationDuration={800}
                          filter="url(#barGlow)"
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            <div className="glass-premium rounded-2xl p-6 border border-border/20 shadow-premium text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold text-foreground mb-2">Growth Rate</h3>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600 mb-2">{analyticsData.growthRate}%</p>
              <p className="text-xs md:text-sm text-muted-foreground">Month over month change</p>
            </div>

            <div className="glass-premium rounded-2xl p-6 border border-border/20 shadow-premium text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold text-foreground mb-2">Transactions</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">{expenses.length + incomes.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Total recorded transactions</p>
            </div>

            <div className="glass-premium rounded-2xl p-6 border border-border/20 shadow-premium text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-bold text-foreground mb-2">Health Score</h3>
              <p className="text-2xl md:text-3xl font-bold text-violet-600 mb-2">{analyticsData.healthScore}%</p>
              <p className="text-xs md:text-sm text-muted-foreground">Financial wellness indicator</p>
            </div>
          </div>
        </main>
      </div>

      <CategoryDetailsModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false)
          setSelectedCategory(null)
        }}
        category={selectedCategory || ''}
        expenses={selectedCategory ? getCategoryExpenses(selectedCategory) : []}
        totalAmount={selectedCategory ? getCategoryTotal(selectedCategory) : 0}
      />

      <BottomNav />
      <KeyboardShortcutsHint />
    </>
  )
}

export default function Analytics() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}
