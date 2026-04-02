'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect, useMemo } from 'react'
import BottomNav from '@/components/BottomNav'
import ExpensePlanningModal from '@/components/ExpensePlanningModal'
import PlanningCategoryModal from '@/components/PlanningCategoryModal'
import ExpenseItemDetailsModal from '@/components/ExpenseItemDetailsModal'
import { LazyCategoryDetailsModal } from '@/components/LazyModals'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/contexts/NotificationContext'
import { useTheme } from '@/contexts/ThemeContext'
import { exportCategoryToPDF, exportCategoryToExcel, sendCategoryEmail } from '@/lib/categoryExport'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHint from '@/components/KeyboardShortcutsHint'
import ConfirmDialog from '@/components/ConfirmDialog'
import SuccessAnimation from '@/components/SuccessAnimation'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { loadWithMinimumTime } from '@/lib/loadingHelper'

interface PlanningCategory {
  id: string
  name: string
  icon: string
  color: string
  type: string
  expectedCost: number
  realCost: number
  startDate?: string
  endDate?: string
  expiryDate?: string
  isActive: boolean
  expenses: ExpensePlan[]
  createdAt: string
}

interface ExpensePlan {
  id: string
  title: string
  amount: number
  categoryId?: string
  date: string
  description?: string
  actualAmount?: number
  isCompleted?: boolean
  createdAt: string
}

import ProtectedRoute from '@/components/ProtectedRoute'

function ExpensePlanningContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { addNotification } = useNotification()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  
  const [categories, setCategories] = useState<PlanningCategory[]>([])
  const [expenses, setExpenses] = useState<ExpensePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showExpenseDetailsModal, setShowExpenseDetailsModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<PlanningCategory | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<ExpensePlan | null>(null)
  const [editingCategory, setEditingCategory] = useState<PlanningCategory | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'expense', id: string } | null>(null)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'p',
      ctrl: true,
      callback: () => setShowCategoryModal(true),
      description: 'Add Planning Category'
    },
    {
      key: 'e',
      ctrl: true,
      callback: () => setShowExpenseModal(true),
      description: 'Add Planned Expense'
    },
    {
      key: 'Escape',
      callback: () => {
        setShowCategoryModal(false)
        setShowExpenseModal(false)
        setShowDetailsModal(false)
      },
      description: 'Close Modal'
    }
  ])
  const [editingExpense, setEditingExpense] = useState<ExpensePlan | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      
      await loadWithMinimumTime(async () => {
        const token = localStorage.getItem('token')
        
        const [categoriesRes, expensesRes] = await Promise.all([
          apiFetch('/api/planning-categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          apiFetch('/api/expense-planning', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (categoriesRes.ok && expensesRes.ok) {
          const categoriesData = await categoriesRes.json()
          const expensesData = await expensesRes.json()
          setCategories(categoriesData)
          setExpenses(expensesData)
        }
      }, 800) // Reduced minimum loading time
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load planning data. Please try again.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (categoryData: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/planning-categories', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(categoryData)
      })

      if (response.ok) {
        const newCategory = await response.json()
        // Optimistic update - add to state immediately
        setCategories(prev => [...prev, newCategory])
        
        addNotification({
          type: 'success',
          title: 'Category Created',
          message: `${categoryData.name} category has been created`,
          duration: 3000
        })
        setShowCategoryModal(false)
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Create Failed',
        message: error.message || 'Failed to create category',
        duration: 4000
      })
    }
  }

  const handleUpdateCategory = async (categoryData: any) => {
    if (!editingCategory) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/planning-categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(categoryData)
      })

      if (response.ok) {
        const updatedCategory = await response.json()
        // Optimistic update
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updatedCategory : c))
        
        addNotification({
          type: 'success',
          title: 'Category Updated',
          message: `${categoryData.name} has been updated`,
          duration: 3000
        })
        setShowCategoryModal(false)
        setEditingCategory(null)
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update category',
        duration: 4000
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setDeleteTarget({ type: 'category', id })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    try {
      const token = localStorage.getItem('token')
      
      if (deleteTarget.type === 'category') {
        const response = await apiFetch(`/api/planning-categories/${deleteTarget.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          // Optimistic update - remove category from state immediately
          setCategories(prev => prev.filter(cat => cat.id !== deleteTarget.id))
          
          addNotification({
            type: 'success',
            title: 'Category Deleted',
            message: 'Category has been deleted',
            duration: 3000
          })
          setSelectedCategory(null)
        }
      } else if (deleteTarget.type === 'expense') {
        const response = await apiFetch(`/api/expense-planning/${deleteTarget.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          // Optimistic update - remove expense from state immediately
          setExpenses(prev => prev.filter(exp => exp.id !== deleteTarget.id))
          
          // Update category costs optimistically
          setCategories(prev => prev.map(cat => {
            const categoryExpenses = expenses.filter(exp => exp.categoryId === cat.id && exp.id !== deleteTarget.id)
            const realCost = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            return cat.id === expenses.find(exp => exp.id === deleteTarget.id)?.categoryId 
              ? { ...cat, realCost } 
              : cat
          }))
          
          addNotification({
            type: 'success',
            title: 'Plan Deleted',
            message: 'Expense plan has been deleted',
            duration: 3000
          })
          
          // Close the details modal if it's open
          setShowDetailsModal(false)
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete ${deleteTarget.type}`,
        duration: 4000
      })
    } finally {
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
    }
  }

  const handleAddExpense = async (expenseData: any) => {
    try {
      const token = localStorage.getItem('token')
      
      if (editingExpense) {
        // Update existing expense
        const response = await apiFetch(`/api/expense-planning/${editingExpense.id}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(expenseData)
        })

        if (response.ok) {
          const updatedExpense = await response.json()
          
          // Batch state updates to prevent multiple re-renders
          setExpenses(prev => {
            const updatedExpenses = prev.map(e => e.id === editingExpense.id ? updatedExpense : e)
            
            // Update categories with new real cost calculation
            setCategories(prevCats => prevCats.map(cat => {
              if (cat.id === updatedExpense.categoryId) {
                const categoryExpenses = updatedExpenses.filter(exp => exp.categoryId === cat.id)
                const realCost = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
                return { ...cat, realCost }
              }
              return cat
            }))
            
            return updatedExpenses
          })
          
          addNotification({
            type: 'success',
            title: 'Expense Updated',
            message: `${expenseData.title} has been updated`,
            duration: 2000
          })
          setShowExpenseModal(false)
          setEditingExpense(null)
          setSelectedCategory(null)
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update expense')
        }
      } else {
        // Create new expense
        const response = await apiFetch('/api/expense-planning', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(expenseData)
        })

        if (response.ok) {
          const newExpense = await response.json()
          
          // Batch state updates to prevent multiple re-renders
          setExpenses(prev => {
            const updatedExpenses = [newExpense, ...prev]
            
            // Update categories with new real cost calculation
            setCategories(prevCats => prevCats.map(cat => {
              if (cat.id === newExpense.categoryId) {
                const categoryExpenses = updatedExpenses.filter(exp => exp.categoryId === cat.id)
                const realCost = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
                return { ...cat, realCost }
              }
              return cat
            }))
            
            return updatedExpenses
          })
          
          addNotification({
            type: 'success',
            title: 'Expense Planned',
            message: `₹${expenseData.amount.toLocaleString()} planned for ${expenseData.title}`,
            duration: 2000
          })
          setShowExpenseModal(false)
          setSelectedCategory(null)
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save expense')
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: editingExpense ? 'Update Failed' : 'Save Failed',
        message: error.message || `Failed to ${editingExpense ? 'update' : 'save'} expense plan`,
        duration: 4000
      })
    }
  }

  const handleDeleteExpense = async (id: string) => {
    setDeleteTarget({ type: 'expense', id })
    setShowDeleteConfirm(true)
  }

  const handleMarkComplete = async (expense: ExpensePlan, actualAmount: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/expense-planning/${expense.id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          actualAmount,
          isCompleted: true
        })
      })

      if (response.ok) {
        const updatedExpense = await response.json()
        // Optimistic update
        setExpenses(prev => prev.map(e => e.id === expense.id ? updatedExpense : e))
        
        addNotification({
          type: 'success',
          title: 'Expense Completed',
          message: `Marked ${expense.title} as completed`,
          duration: 4000
        })
        // No need to reload - optimistic update already applied
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update expense',
        duration: 4000
      })
    }
  }

  const handleViewCategoryDetails = (category: PlanningCategory) => {
    setSelectedCategory(category)
    setShowDetailsModal(true)
  }

  const handleExportCategory = async (format: 'pdf' | 'excel' | 'email') => {
    if (!selectedCategory) return

    const categoryExpenses = expenses.filter(e => e.categoryId === selectedCategory.id)

    try {
      if (format === 'pdf') {
        await exportCategoryToPDF(selectedCategory, categoryExpenses, user?.email)
        addNotification({
          type: 'success',
          title: 'PDF Downloaded',
          message: 'Category report has been downloaded',
          duration: 3000
        })
      } else if (format === 'excel') {
        exportCategoryToExcel(selectedCategory, categoryExpenses)
        addNotification({
          type: 'success',
          title: 'Excel Downloaded',
          message: 'Category report has been downloaded',
          duration: 3000
        })
      } else if (format === 'email') {
        if (!user?.email) {
          throw new Error('User email not found. Please log in again.')
        }
        await sendCategoryEmail(selectedCategory, categoryExpenses, user.email)
        addNotification({
          type: 'success',
          title: 'Email Sent',
          message: `Category report has been sent to ${user.email}`,
          duration: 5000
        })
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to export category report. Please try again.'
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: errorMsg,
        duration: 4000
      })
    }
  }

  const stats = useMemo(() => {
    const totalExpected = categories.reduce((sum, cat) => sum + cat.expectedCost, 0)
    const totalReal = categories.reduce((sum, cat) => sum + cat.realCost, 0)
    const totalExpenses = expenses.length
    const completed = expenses.filter(e => e.isCompleted).length
    
    return { totalExpected, totalReal, totalExpenses, completed }
  }, [categories, expenses])

  if (!user) return null

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
          <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted/50 rounded-xl w-48"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted/50 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
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
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
            <div className="flex items-center justify-between gap-4">
              <div className="text-white space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="heading-page">Expense Planning</h1>
                    <p className="text-sm text-white/80">Plan by categories and track your budget</p>
                  </div>
                </div>
              </div>
              <button onClick={toggleTheme} disabled={isTransitioning} className="theme-toggle-btn flex-shrink-0 p-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300">
                <div className="relative w-6 h-6">
                  <svg className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <svg className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-foreground">Expense Planning</h1>
              <p className="text-xs text-muted-foreground">{categories.length} categories</p>
            </div>
            <button onClick={() => setShowCategoryModal(true)} className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-slide-in">
            <div className="glass-premium rounded-xl p-3 md:p-4 border border-border/20 shadow-premium">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <p className="metric-value text-blue-600">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>

            <div className="glass-premium rounded-xl p-3 md:p-4 border border-border/20 shadow-premium">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="metric-value text-emerald-600">{stats.totalExpenses}</p>
              <p className="text-xs text-muted-foreground">Total Plans</p>
            </div>

            <div className="glass-premium rounded-xl p-3 md:p-4 border border-border/20 shadow-premium">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <p className="metric-value text-purple-600">₹{stats.totalExpected.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Expected</p>
            </div>

            <div className="glass-premium rounded-xl p-3 md:p-4 border border-border/20 shadow-premium">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="metric-value text-amber-600">₹{stats.totalReal.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Real Cost</p>
            </div>
          </div>

          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold text-foreground">Planning Categories</h2>
                <button onClick={() => setShowCategoryModal(true)} className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {categories.map((category) => {
                  const categoryExpenses = expenses.filter(e => e.categoryId === category.id)
                  const variance = category.realCost - category.expectedCost
                  const progress = category.expectedCost > 0 ? (category.realCost / category.expectedCost) * 100 : 0

                  const getExpiryStatus = () => {
                    const now = new Date()
                    now.setHours(0, 0, 0, 0) // Reset to start of day for accurate comparison
                    
                    // Check expiryDate first (highest priority)
                    if (category.expiryDate) {
                      const expiryDate = new Date(category.expiryDate)
                      expiryDate.setHours(0, 0, 0, 0)
                      return now > expiryDate ? 'expired' : 'active'
                    }
                    
                    // Then check type-based expiry
                    if (!category.endDate && !category.startDate) return null
                    const endDate = category.endDate ? new Date(category.endDate) : null
                    const startDate = category.startDate ? new Date(category.startDate) : null

                    if (category.type === 'day' && startDate) {
                      const dayEnd = new Date(startDate)
                      dayEnd.setHours(23, 59, 59)
                      return now > dayEnd ? 'expired' : 'active'
                    }
                    if (category.type === 'month' && startDate) {
                      const monthEnd = new Date(startDate)
                      monthEnd.setMonth(monthEnd.getMonth() + 1)
                      return now > monthEnd ? 'expired' : 'active'
                    }
                    if (category.type === 'year' && startDate) {
                      const yearEnd = new Date(startDate)
                      yearEnd.setFullYear(yearEnd.getFullYear() + 1)
                      return now > yearEnd ? 'expired' : 'active'
                    }
                    if (endDate) return now > endDate ? 'expired' : 'active'
                    return 'active'
                  }

                  const expiryStatus = getExpiryStatus()
                  const isExpired = expiryStatus === 'expired'

                  return (
                    <div 
                      key={category.id} 
                      onClick={() => handleViewCategoryDetails(category)}
                      className={`relative glass-premium rounded-2xl border shadow-2xl overflow-hidden group hover:shadow-premium-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer ${
                        isExpired 
                          ? 'border-red-500/30 opacity-75 grayscale-[0.3]' 
                          : 'border-white/10'
                      }`}
                    >
                      {/* Gradient Top Bar */}
                      <div className={`h-1 bg-gradient-to-r ${isExpired ? 'from-red-500 to-red-600' : category.color}`}></div>
                      
                      {/* Background Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                      
                      <div className="relative p-2.5 md:p-3 space-y-2.5">
                        {/* Header Section */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {/* Icon with Glow */}
                            <div className="relative">
                              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                              <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-lg md:text-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                {category.icon}
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-xs md:text-sm font-bold text-foreground mb-0.5">{category.name}</h3>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 bg-secondary/80 backdrop-blur-sm rounded-full font-medium">
                                  {categoryExpenses.length} expenses
                                </span>
                                {expiryStatus && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold backdrop-blur-sm ${
                                    expiryStatus === 'active' 
                                      ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                                      : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                                  }`}>
                                    {expiryStatus === 'active' ? '● Active' : '● Inactive'}
                                  </span>
                                )}
                              </div>
                              {/* Show expiry date if category is expired or has an expiry date */}
                              {category.expiryDate && (
                                <p className={`text-[10px] mt-1 font-medium flex items-center gap-1 ${
                                  isExpired ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                                }`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {isExpired ? 'Expired: ' : 'Expires: '}
                                  {new Date(category.expiryDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }} 
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all hover:scale-110 backdrop-blur-sm border border-blue-500/20"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(category.id)} 
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all hover:scale-110 backdrop-blur-sm border border-red-500/20"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Cost Display Section */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="glass-premium rounded-lg p-2 border border-blue-500/20 bg-blue-500/5">
                              <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Expected</p>
                              <p className="text-sm md:text-base font-bold text-blue-600 flex items-baseline">
                                <span className="text-[10px] mr-0.5">₹</span>
                                {category.expectedCost.toLocaleString()}
                              </p>
                            </div>
                            <div className="glass-premium rounded-lg p-2 border border-emerald-500/20 bg-emerald-500/5">
                              <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">Real Cost</p>
                              <p className="text-sm md:text-base font-bold text-emerald-600 flex items-baseline">
                                <span className="text-[10px] mr-0.5">₹</span>
                                {category.realCost.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {variance !== 0 && (
                            <div className={`glass-premium rounded-lg p-2 border ${
                              variance > 0 
                                ? 'border-red-500/20 bg-red-500/5' 
                                : 'border-green-500/20 bg-green-500/5'
                            }`}>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] text-muted-foreground font-medium">Variance</p>
                                <p className={`text-xs md:text-sm font-bold flex items-baseline ${
                                  variance > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  <span className="text-[10px] mr-0.5">₹</span>
                                  {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {category.expectedCost > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-semibold text-muted-foreground">Progress</span>
                              <span className="text-xs font-bold text-foreground">{Math.min(progress, 100).toFixed(0)}%</span>
                            </div>
                            <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm border border-border/30">
                              <div 
                                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${category.color} transition-all duration-500 rounded-full shadow-lg`} 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Add Expense Button - Hidden when expired */}
                        {!isExpired ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedCategory(category); setShowExpenseModal(true); }} 
                            className={`w-full py-2 md:py-2.5 bg-gradient-to-r ${category.color} hover:shadow-lg text-white rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95`}
                          >
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Expense
                          </button>
                        ) : (
                          <div className="w-full py-2 md:py-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Category Expired
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="glass-premium rounded-xl p-6 md:p-8 text-center border border-border/20">
              <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <svg className="w-7 h-7 md:w-8 md:h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">No Categories Yet</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-md mx-auto">Create your first planning category to start organizing your expenses</p>
              <button onClick={() => setShowCategoryModal(true)} className="px-5 py-2 md:px-6 md:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm md:text-base font-medium hover:shadow-lg transition-all inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Category
              </button>
            </div>
          )}

          {/* Uncategorized Expenses */}
          {expenses.filter(e => !e.categoryId).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base md:text-lg font-semibold text-foreground">Uncategorized Expenses</h2>
              <div className="glass-premium rounded-xl border border-border/20 shadow-premium divide-y divide-border/10">
                {expenses.filter(e => !e.categoryId).map((expense) => (
                  <div key={expense.id} className="px-4 py-3 hover:bg-secondary/10 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-foreground">{expense.title}</h3>
                        <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-sm text-blue-600">₹{expense.amount.toLocaleString()}</p>
                          {expense.actualAmount && (
                            <p className="text-xs text-emerald-600">₹{expense.actualAmount.toLocaleString()} actual</p>
                          )}
                        </div>
                        <button onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button - Mobile */}
      <button onClick={() => setShowCategoryModal(true)} className="hidden fixed bottom-28 right-3 w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white rounded-xl shadow-2xl items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <PlanningCategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        editingCategory={editingCategory}
      />

      <ExpensePlanningModal
        isOpen={showExpenseModal}
        onClose={() => { setShowExpenseModal(false); setSelectedCategory(null); setEditingExpense(null); }}
        onSave={handleAddExpense}
        categories={categories}
        selectedCategoryId={selectedCategory?.id}
        editingExpense={editingExpense}
      />

      <LazyCategoryDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedCategory(null); }}
        category={selectedCategory?.name || ''}
        expenses={selectedCategory ? expenses.filter(e => e.categoryId === selectedCategory.id) : []}
        totalAmount={selectedCategory ? expenses.filter(e => e.categoryId === selectedCategory.id).reduce((sum, e) => sum + e.amount, 0) : 0}
        budgetAmount={selectedCategory ? selectedCategory.expectedCost : 0}
        onEditExpense={(expense: ExpensePlan) => {
          setEditingExpense(expense)
          setShowDetailsModal(false)
          setShowExpenseModal(true)
        }}
        onDeleteExpense={handleDeleteExpense}
        onExpenseClick={(expense: ExpensePlan) => {
          // Show expense details modal
          setSelectedExpense(expense)
          setShowExpenseDetailsModal(true)
        }}
      />

      <ExpenseItemDetailsModal
        isOpen={showExpenseDetailsModal}
        onClose={() => { setShowExpenseDetailsModal(false); setSelectedExpense(null); }}
        expense={selectedExpense}
      />

      <BottomNav />
      <KeyboardShortcutsHint />
      
      {showSuccess && (
        <SuccessAnimation
          message={successMessage}
          onComplete={() => setShowSuccess(false)}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title={deleteTarget?.type === 'category' ? 'Delete Category?' : 'Delete Expense Plan?'}
        message={
          deleteTarget?.type === 'category' 
            ? 'Are you sure you want to delete this category? All expenses in this category will also be permanently deleted.' 
            : 'Are you sure you want to delete this expense plan? This action cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
      />
    </>
  )
}

export default function ExpensePlanning() {
  return (
    <ProtectedRoute>
      <ExpensePlanningContent />
    </ProtectedRoute>
  )
}
