'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect, useMemo } from 'react'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/contexts/NotificationContext'
import { useTheme } from '@/contexts/ThemeContext'

interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  estimatedPrice?: number
  notes?: string
  period: 'daily' | 'monthly' | 'yearly'
  createdAt: string
}

const categories = [
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: 'from-green-500 to-emerald-600' },
  { id: 'household', label: 'Household', icon: '🏠', color: 'from-blue-500 to-cyan-600' },
  { id: 'electronics', label: 'Electronics', icon: '📱', color: 'from-purple-500 to-pink-600' },
  { id: 'clothing', label: 'Clothing', icon: '👕', color: 'from-pink-500 to-rose-600' },
  { id: 'health', label: 'Health & Beauty', icon: '💊', color: 'from-red-500 to-orange-600' },
  { id: 'other', label: 'Other', icon: '📦', color: 'from-gray-500 to-slate-600' }
]

const periods = [
  { id: 'daily', label: 'Daily', icon: '📅' },
  { id: 'monthly', label: 'Monthly', icon: '🗓️' },
  { id: 'yearly', label: 'Yearly', icon: '📆' }
]

const priorities = [
  { id: 'low', label: 'Low', color: 'from-gray-400 to-gray-500' },
  { id: 'medium', label: 'Medium', color: 'from-yellow-400 to-orange-500' },
  { id: 'high', label: 'High', color: 'from-red-500 to-red-600' }
]

import ProtectedRoute from '@/components/ProtectedRoute'

function ShoppingListContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { addNotification } = useNotification()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false) // Start false to prevent double loading
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unit: 'pcs',
    category: 'groceries',
    priority: 'medium',
    estimatedPrice: '',
    notes: '',
    period: 'daily'
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadItems()
  }, [user, router])

  const loadItems = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/shopping-list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error loading shopping items:', error)
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load shopping list. Please try again.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.quantity) {
      addNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill all required fields',
        duration: 3000
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/shopping-list', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined
        })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Item Added',
          message: `${formData.name} added to your shopping list`,
          duration: 4000
        })
        setFormData({
          name: '',
          quantity: '1',
          unit: 'pcs',
          category: 'groceries',
          priority: 'medium',
          estimatedPrice: '',
          notes: '',
          period: 'daily'
        })
        setShowAddModal(false)
        
        // Optimistic update - add new item to state immediately
        const newItem = await response.json()
        setItems(prev => [newItem, ...prev])
      } else {
        throw new Error('Failed to save item')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save item. Please try again.',
        duration: 4000
      })
    }
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/shopping-list/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ completed: !completed })
      })

      if (response.ok) {
        const item = items.find(i => i.id === id)
        addNotification({
          type: 'success',
          title: completed ? 'Item Unchecked' : 'Item Bought',
          message: completed ? `${item?.name} marked as pending` : `${item?.name} marked as bought`,
          duration: 3000
        })
        
        // Optimistic update - update item in state immediately
        setItems(prev => prev.map(item => 
          item.id === id ? { ...item, completed: !completed } : item
        ))
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update item. Please try again.',
        duration: 4000
      })
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/shopping-list/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Item Deleted',
          message: 'Item has been deleted successfully.',
          duration: 3000
        })
        
        // Optimistic update - remove item from state immediately
        setItems(prev => prev.filter(item => item.id !== id))
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete item. Please try again.',
        duration: 4000
      })
    }
  }

  // Filter and calculate stats
  const filteredItems = items.filter(item => {
    const periodMatch = item.period === selectedPeriod
    const categoryMatch = !selectedCategory || item.category === selectedCategory
    return periodMatch && categoryMatch
  })

  const stats = useMemo(() => {
    const completed = filteredItems.filter(item => item.completed).length
    const pending = filteredItems.filter(item => !item.completed).length
    const totalEstimated = filteredItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
    const pendingEstimated = filteredItems.filter(item => !item.completed).reduce((sum, item) => sum + (item.estimatedPrice || 0), 0)
    
    return { completed, pending, totalEstimated, pendingEstimated, total: filteredItems.length }
  }, [filteredItems])

  if (!user) return null

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
          <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
            {/* Loading skeleton */}
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted/50 rounded-xl w-48"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-muted/50 rounded-xl"></div>
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </>
    )
  }

  const completedItems = filteredItems.filter(item => item.completed)
  const pendingItems = filteredItems.filter(item => !item.completed)

  return (
    <>
      <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
        {/* Desktop Header */}
        <header className="md:block hidden relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600" />
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
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs md:text-sm text-white/80 font-medium bg-white/10 px-2 py-1 rounded-full">
                        Shopping
                      </span>
                      <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <span>{stats.total} items •</span>
                        <span className="currency-symbol-large text-white/80">₹</span>
                        <span>{stats.totalEstimated.toLocaleString()} estimated</span>
                      </span>
                    </div>
                    <h1 className="heading-page">Shopping List</h1>
                  </div>
                </div>
                <p className="text-sm md:text-base text-white/80 max-w-md">
                  Organize your shopping by period and track estimated costs
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

        {/* Mobile Header */}
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-foreground">Shopping List</h1>
              <p className="text-xs text-muted-foreground">
                {stats.total} items • ₹{stats.totalEstimated.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-md"
            >
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
            {/* Total Items */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">Total</span>
              </div>
              <div>
                <p className="metric-value text-blue-600">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>

            {/* Pending Items */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded font-medium">Pending</span>
              </div>
              <div>
                <p className="metric-value text-amber-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">To Buy</p>
              </div>
            </div>

            {/* Completed Items */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-medium">Bought</span>
              </div>
              <div>
                <p className="metric-value text-emerald-600">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>

            {/* Estimated Cost */}
            <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium">Cost</span>
              </div>
              <div>
                <p className="metric-value text-purple-600">
                  <span className="currency-symbol">₹</span>{stats.pendingEstimated.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Pending Cost</p>
              </div>
            </div>
          </div>

          {/* Period Filter */}
          <div className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium animate-slide-in">
            <div className="flex flex-wrap gap-2 mb-3">
              {periods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedPeriod === period.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <span>{period.icon}</span>
                  <span>{period.label}</span>
                  <span className="opacity-60">({items.filter(i => i.period === period.id).length})</span>
                </button>
              ))}
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  !selectedCategory 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                All ({filteredItems.length})
              </button>
              {categories.map((category) => {
                const count = filteredItems.filter(i => i.category === category.id).length
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="hidden sm:inline">{category.label}</span>
                    <span className="sm:hidden">{category.id}</span>
                    <span className="opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>



          {/* Shopping Items List */}
          <div className="glass-premium rounded-xl md:rounded-2xl border border-border/20 shadow-premium overflow-hidden animate-slide-in">
            {filteredItems.length > 0 ? (
              <div className="space-y-6 p-4 md:p-6">
                {/* Pending Items */}
                {pendingItems.length > 0 && (
                  <div>
                    <h3 className="heading-section mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      To Buy ({pendingItems.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingItems.map((item, index) => {
                        const category = categories.find(c => c.id === item.category)
                        const priority = priorities.find(p => p.id === item.priority)
                        
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/10 transition-all duration-200 group"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleComplete(item.id, item.completed)}
                              className="mt-1 w-5 h-5 border-2 border-border rounded-full flex items-center justify-center hover:border-emerald-500 transition-all duration-200 hover:scale-110"
                            >
                              {item.completed && (
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                              )}
                            </button>
                            
                            {/* Category Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-200 bg-gradient-to-br ${category?.color}`}>
                                <span className="text-sm text-white">{category?.icon}</span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-2">
                                  <h4 className="font-semibold text-sm md:text-base text-foreground group-hover:text-primary transition-colors">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">
                                      {item.quantity} {item.unit}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${priority?.color}`}></div>
                                    <span className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">
                                      {priority?.label}
                                    </span>
                                  </div>
                                  {item.notes && (
                                    <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Price and Actions */}
                                <div className="flex items-center gap-2">
                                  {item.estimatedPrice && (
                                    <div className="text-right">
                                      <p className="font-bold text-sm text-purple-600">
                                        ₹{item.estimatedPrice.toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => deleteItem(item.id)}
                                    className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200 hover:scale-110 opacity-70 md:opacity-0 group-hover:opacity-100"
                                    title="Delete item"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Completed Items */}
                {completedItems.length > 0 && (
                  <div>
                    <h3 className="heading-section mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Bought ({completedItems.length})
                    </h3>
                    <div className="space-y-2">
                      {completedItems.map((item, index) => {
                        const category = categories.find(c => c.id === item.category)
                        
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20 opacity-75 group"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleComplete(item.id, item.completed)}
                              className="mt-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-200"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            
                            {/* Category Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br ${category?.color} opacity-60`}>
                                <span className="text-sm text-white">{category?.icon}</span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-2">
                                  <h4 className="font-semibold text-sm md:text-base text-muted-foreground line-through">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">
                                      {item.quantity} {item.unit}
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                                      ✓ Bought
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200 hover:scale-110 opacity-70 md:opacity-0 group-hover:opacity-100"
                                  title="Delete item"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h3 className="heading-card">
                    {selectedCategory ? 'No items in this category' : 'No shopping items yet'}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
                    {selectedCategory 
                      ? `No items found for ${categories.find(c => c.id === selectedCategory)?.label}. Try a different category or add a new item.`
                      : 'Start building your shopping list by adding items you need to buy.'
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center items-center mt-4 md:mt-6">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 active:scale-95 px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm font-semibold group transition-all duration-200 rounded-xl inline-flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Your First Item
                  </button>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="px-3 py-1.5 md:px-4 md:py-2 text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-xl text-xs md:text-sm font-medium transition-all duration-200 active:scale-95"
                    >
                      View All Items
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
        onClick={() => setShowAddModal(true)}
        className="hidden fixed bottom-28 right-3 w-12 h-12 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-600 text-white rounded-xl shadow-2xl hover:shadow-emerald-500/25 items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-40 group border border-white/10"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-300"></div>
          <svg className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="glass w-full sm:max-w-lg rounded-xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col border border-border shadow-premium-lg animate-scale-in">
            <div className="flex-shrink-0 glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Add Shopping Item</h2>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="pack">pack</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: category.id })}
                      className={`flex items-center space-x-2 p-2.5 sm:p-3 rounded-xl border transition-all duration-200 ${
                        formData.category === category.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-secondary/50'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span className="text-xs sm:text-sm font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    {priorities.map((priority) => (
                      <option key={priority.id} value={priority.id}>{priority.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Period</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>{period.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Estimated Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    type="number"
                    value={formData.estimatedPrice}
                    onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                    className="input-premium w-full pl-7 pr-3 py-2.5 sm:py-3 text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base resize-none"
                  placeholder="Add notes (optional)"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 sm:py-3 border border-border text-muted-foreground rounded-xl font-medium hover:bg-secondary transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  )
}

export default function ShoppingList() {
  return (
    <ProtectedRoute>
      <ShoppingListContent />
    </ProtectedRoute>
  )
}
