'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect, useMemo } from 'react'
import BottomNav from '@/components/BottomNav'
import ShoppingItemModal from '@/components/ShoppingItemModal'
import ShoppingCategoryModal from '@/components/ShoppingCategoryModal'
import ShoppingCategoryDetailsModal from '@/components/ShoppingCategoryDetailsModal'
import ShoppingItemDetailsModal from '@/components/ShoppingItemDetailsModal'
import ActualPriceModal from '@/components/ActualPriceModal'
import ConfirmModal from '@/components/ConfirmModal'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/contexts/NotificationContext'
import { useTheme } from '@/contexts/ThemeContext'
import { exportShoppingCategoryToPDF, exportShoppingCategoryToExcel, sendShoppingCategoryEmail } from '@/lib/shoppingExport'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import KeyboardShortcutsHint from '@/components/KeyboardShortcutsHint'
import ConfirmDialog from '@/components/ConfirmDialog'
import SuccessAnimation from '@/components/SuccessAnimation'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { loadWithMinimumTime } from '@/lib/loadingHelper'

interface ShoppingCategory {
  id: string
  name: string
  icon: string
  color: string
  expectedCost: number
  realCost: number
  isActive: boolean
  expiryDate?: string
  items: ShoppingItem[]
  createdAt: string
}

interface ShoppingItem {
  id: string
  name: string
  categoryId?: string
  expectedPrice: number
  actualPrice?: number
  quantity: number
  unit: string
  isBought: boolean
  notes?: string
  createdAt: string
}

import ProtectedRoute from '@/components/ProtectedRoute'

function ShoppingContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { addNotification } = useNotification()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  
  const [categories, setCategories] = useState<ShoppingCategory[]>([])
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ShoppingCategory | null>(null)
  const [editingCategory, setEditingCategory] = useState<ShoppingCategory | null>(null)
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [itemToBuy, setItemToBuy] = useState<ShoppingItem | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'category' | 'item'; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      callback: () => setShowCategoryModal(true),
      description: 'Add Shopping Category'
    },
    {
      key: 'i',
      ctrl: true,
      callback: () => setShowItemModal(true),
      description: 'Add Shopping Item'
    },
    {
      key: 'Escape',
      callback: () => {
        setShowCategoryModal(false)
        setShowItemModal(false)
        setShowDetailsModal(false)
        setShowPriceModal(false)
      },
      description: 'Close Modal'
    }
  ])

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
        
        const [categoriesRes, itemsRes] = await Promise.all([
          apiFetch('/api/shopping-categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          apiFetch('/api/shopping-items', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (categoriesRes.ok && itemsRes.ok) {
          const categoriesData = await categoriesRes.json()
          const itemsData = await itemsRes.json()
          setCategories(categoriesData)
          setItems(itemsData)
          
          // Update selected category with fresh data if modal is open
          if (selectedCategory) {
            const updatedCategory = categoriesData.find((c: any) => c.id === selectedCategory.id)
            if (updatedCategory) {
              setSelectedCategory(updatedCategory)
            }
          }
        }
      }, 1000)
    } catch (error) {
      console.error('Error loading data:', error)
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load shopping data. Please try again.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (categoryData: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/shopping-categories', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(categoryData)
      })

      if (response.ok) {
        const newCategory = await response.json()
        // Optimistic update
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
      const response = await apiFetch(`/api/shopping-categories/${editingCategory.id}`, {
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

  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'category', name })
    setShowDeleteConfirm(true)
  }

  const handleAddItem = async (itemData: any) => {
    try {
      const token = localStorage.getItem('token')
      
      if (editingItem) {
        const response = await apiFetch(`/api/shopping-items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(itemData)
        })

        if (response.ok) {
          const updatedItem = await response.json()
          // Optimistic update
          setItems(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i))
          
          addNotification({
            type: 'success',
            title: 'Item Updated',
            message: `${itemData.name} has been updated`,
            duration: 3000
          })
          setShowItemModal(false)
          setEditingItem(null)
        }
      } else {
        const response = await apiFetch('/api/shopping-items', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(itemData)
        })

        if (response.ok) {
          const newItem = await response.json()
          // Optimistic update
          setItems(prev => [...prev, newItem])
          
          addNotification({
            type: 'success',
            title: 'Item Added',
            message: `${itemData.name} added to shopping list`,
            duration: 4000
          })
          setShowItemModal(false)
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete ${deleteTarget?.type || 'item'}`,
        duration: 4000
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteItem = (id: string, name: string) => {
    setDeleteTarget({ id, type: 'item', name })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const endpoint = deleteTarget.type === 'category' 
        ? `/api/shopping-categories/${deleteTarget.id}`
        : `/api/shopping-items/${deleteTarget.id}`
      
      const response = await apiFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Optimistic update
        if (deleteTarget.type === 'category') {
          setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
          setItems(prev => prev.filter(i => i.categoryId !== deleteTarget.id))
          setSelectedCategory(null)
          setShowDetailsModal(false)
        } else {
          setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
        }
        
        addNotification({
          type: 'success',
          title: `${deleteTarget.type === 'category' ? 'Category' : 'Item'} Deleted`,
          message: deleteTarget.type === 'category' && data.deletedExpenses > 0
            ? `Category and ${data.deletedExpenses} associated expense(s) deleted`
            : `${deleteTarget.type === 'category' ? 'Category' : 'Shopping item'} has been deleted`,
          duration: 3000
        })
        setShowDeleteConfirm(false)
        setDeleteTarget(null)
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete item',
        duration: 4000
      })
    }
  }

  const handleMarkBought = async (item: ShoppingItem) => {
    if (item.isBought) {
      try {
        const token = localStorage.getItem('token')
        const response = await apiFetch(`/api/shopping-items/${item.id}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            isBought: false,
            actualPrice: null
          })
        })

        if (response.ok) {
          const updatedItem = await response.json()
          // Optimistic update
          setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))
          
          addNotification({
            type: 'success',
            title: 'Item Unmarked',
            message: `${item.name} marked as not bought`,
            duration: 3000
          })
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update item',
          duration: 4000
        })
      }
      return
    }

    // Open premium modal instead of browser prompt
    setItemToBuy(item)
    setShowPriceModal(true)
  }

  const handleConfirmPrice = async (price: number) => {
    if (!itemToBuy) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/shopping-items/${itemToBuy.id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          isBought: true,
          actualPrice: price
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Close the modal immediately
        setShowPriceModal(false)
        setItemToBuy(null)
        
        // Update local state immediately for real-time UI update
        setItems(prevItems => 
          prevItems.map(i => 
            i.id === itemToBuy.id 
              ? { ...i, isBought: true, actualPrice: price }
              : i
          )
        )
        
        // Update categories to reflect new costs
        setCategories(prevCategories =>
          prevCategories.map(cat => {
            if (cat.id === itemToBuy.categoryId) {
              const categoryItems = items.filter(i => i.categoryId === cat.id)
              const updatedItems = categoryItems.map(i =>
                i.id === itemToBuy.id ? { ...i, isBought: true, actualPrice: price } : i
              )
              const realCost = updatedItems
                .filter(i => i.isBought && i.actualPrice)
                .reduce((sum, i) => sum + (i.actualPrice! * i.quantity), 0)
              
              return { ...cat, realCost }
            }
            return cat
          })
        )
        
        addNotification({
          type: 'success',
          title: result.expenseCreated ? 'Item Bought & Expense Added' : 'Item Marked as Bought',
          message: result.expenseCreated 
            ? `${itemToBuy.name} marked as bought for ₹${price} and added to expenses` 
            : `${itemToBuy.name} marked as bought for ₹${price}`,
          duration: 5000
        })
        
        // State already updated optimistically above, no need to reload
      } else {
        throw new Error('Failed to update item')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update item',
        duration: 4000
      })
    }
  }

  const handleViewCategoryDetails = (category: ShoppingCategory) => {
    setSelectedCategory(category)
    setShowDetailsModal(true)
  }

  const handleExportCategory = async (format: 'pdf' | 'excel' | 'email') => {
    if (!selectedCategory) return

    const categoryItems = items.filter(i => i.categoryId === selectedCategory.id)

    try {
      if (format === 'pdf') {
        await exportShoppingCategoryToPDF(selectedCategory, categoryItems, user?.email)
        addNotification({
          type: 'success',
          title: 'PDF Downloaded',
          message: 'Shopping bill has been downloaded',
          duration: 3000
        })
      } else if (format === 'excel') {
        exportShoppingCategoryToExcel(selectedCategory, categoryItems)
        addNotification({
          type: 'success',
          title: 'Excel Downloaded',
          message: 'Shopping bill has been downloaded',
          duration: 3000
        })
      } else if (format === 'email') {
        if (!user?.email) {
          throw new Error('User email not found. Please log in again.')
        }
        await sendShoppingCategoryEmail(selectedCategory, categoryItems, user.email)
        addNotification({
          type: 'success',
          title: 'Email Sent',
          message: `Shopping bill has been sent to ${user.email}`,
          duration: 5000
        })
      }
    } catch (error: any) {
      console.error('Export error:', error)
      const errorMsg = error?.message || 'Failed to export shopping bill. Please try again.'
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
    const totalItems = items.length
    const boughtItems = items.filter(i => i.isBought).length
    
    return { totalExpected, totalReal, totalItems, boughtItems }
  }, [categories, items])

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
      <div className="min-h-screen bg-background text-foreground pt-16 pb-24 md:pt-6 md:pb-12 md:pl-64 lg:pl-72">
        {/* Desktop Header Banner */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  Purchases
                </span>
                <span className="text-xs text-white/80">
                  {categories.length} categories • {stats.totalItems} items
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Shopping Lists</h1>
              <p className="text-sm text-white/80 max-w-lg">
                Organize shopping lists by category, set price estimates, and log actual receipts.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-sm shadow-lg hover:bg-white/90 hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Category</span>
              </button>
              <button
                onClick={() => setShowItemModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur-md transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-4 md:space-y-6">
          {/* Statistics Cards - Premium Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-slide-in">
            {/* Categories Card */}
            <div className="relative glass-premium rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium overflow-hidden group hover:shadow-premium-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="metric-value text-blue-600 dark:text-blue-400">{categories.length}</p>
                <p className="text-xs text-muted-foreground font-medium">Categories</p>
              </div>
            </div>

            {/* Total Items Card */}
            <div className="relative glass-premium rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium overflow-hidden group hover:shadow-premium-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="metric-value text-emerald-600 dark:text-emerald-400">{stats.totalItems}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Total Items</p>
                  {stats.boughtItems > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-semibold">
                      {stats.boughtItems} bought
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expected Cost Card */}
            <div className="relative glass-premium rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium overflow-hidden group hover:shadow-premium-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="metric-value text-purple-600 dark:text-purple-400">₹{stats.totalExpected.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground font-medium">Expected Cost</p>
              </div>
            </div>

            {/* Real Cost Card */}
            <div className="relative glass-premium rounded-2xl p-3 md:p-4 border border-border/20 shadow-premium overflow-hidden group hover:shadow-premium-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="metric-value text-amber-600 dark:text-amber-400">₹{stats.totalReal.toLocaleString()}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Actual Cost</p>
                  {stats.totalReal > 0 && stats.totalExpected > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      stats.totalReal > stats.totalExpected 
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                        : 'bg-green-500/10 text-green-600 dark:text-green-400'
                    }`}>
                      {stats.totalReal > stats.totalExpected ? '↑' : '↓'} ₹{Math.abs(stats.totalReal - stats.totalExpected).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-600/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-bold text-foreground">Shopping Categories</h2>
                    <p className="text-xs text-muted-foreground">Organize your shopping by category</p>
                  </div>
                </div>
                <button onClick={() => setShowCategoryModal(true)} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  New Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {categories.map((category) => {
                  const categoryItems = items.filter(i => i.categoryId === category.id)
                  const variance = category.realCost - category.expectedCost
                  const progress = category.expectedCost > 0 ? (category.realCost / category.expectedCost) * 100 : 0
                  
                  const isExpired = category.expiryDate ? new Date(category.expiryDate) < new Date() : false

                  return (
                    <div 
                      key={category.id} 
                      onClick={() => handleViewCategoryDetails(category)}
                      className={`relative glass-premium rounded-2xl border shadow-2xl overflow-hidden group hover:shadow-premium-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer ${
                        isExpired ? 'border-red-500/30 opacity-75 grayscale-[0.3]' : 'border-white/10'
                      }`}
                    >
                      <div className={`h-1 bg-gradient-to-r ${isExpired ? 'from-red-500 to-red-600' : category.color}`}></div>
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                      
                      <div className="relative p-2.5 md:p-3 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                              <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-lg md:text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] brightness-150 contrast-125 saturate-150">
                                  {category.icon}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-xs md:text-sm font-bold text-foreground mb-0.5">{category.name}</h3>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 bg-secondary/80 backdrop-blur-sm rounded-full font-medium">
                                  {categoryItems.length} items
                                </span>
                                {isExpired ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold backdrop-blur-sm bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                                    ● Expired
                                  </span>
                                ) : category.isActive && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold backdrop-blur-sm bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30">
                                    ● Active
                                  </span>
                                )}
                              </div>
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
                              onClick={() => handleDeleteCategory(category.id, category.name)} 
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all hover:scale-110 backdrop-blur-sm border border-red-500/20"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

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

                        {!isExpired ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedCategory(category); setShowItemModal(true); }} 
                            className={`w-full py-2 md:py-2.5 bg-gradient-to-r ${category.color} hover:shadow-lg text-white rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95`}
                          >
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Item
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
            <div className="relative glass-premium rounded-2xl md:rounded-3xl p-8 md:p-12 text-center border border-border/20 shadow-premium overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-teal-500/5"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl md:rounded-3xl blur-xl opacity-40 animate-pulse"></div>
                  <div className="relative w-full h-full rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-lg md:text-2xl font-bold text-foreground mb-2 md:mb-3">Start Your Shopping Journey</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 max-w-md mx-auto leading-relaxed">
                  Create your first shopping category to organize items, track costs, and manage your shopping efficiently
                </p>
                
                <button 
                  onClick={() => setShowCategoryModal(true)} 
                  className="group relative px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-2 md:gap-3 hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl"></div>
                  <svg className="w-5 h-5 md:w-6 md:h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="relative z-10">Create First Category</span>
                </button>
                
                <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto">
                  <div className="glass-premium rounded-xl p-3 md:p-4 border border-border/10">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-600/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-foreground">Organize by Category</p>
                  </div>
                  <div className="glass-premium rounded-xl p-3 md:p-4 border border-border/10">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-600/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-foreground">Track Purchases</p>
                  </div>
                  <div className="glass-premium rounded-xl p-3 md:p-4 border border-border/10">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-600/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-foreground">Monitor Costs</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <button onClick={() => setShowCategoryModal(true)} className="hidden fixed bottom-28 right-3 w-12 h-12 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-600 text-white rounded-xl shadow-2xl hover:shadow-emerald-500/50 items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
        <svg className="w-5 h-5 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <ShoppingCategoryModal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        editingCategory={editingCategory}
      />

      <ShoppingItemModal
        isOpen={showItemModal}
        onClose={() => { setShowItemModal(false); setSelectedCategory(null); setEditingItem(null); }}
        onSave={handleAddItem}
        categories={categories}
        selectedCategoryId={selectedCategory?.id}
        editingItem={editingItem}
      />

      <ActualPriceModal
        isOpen={showPriceModal}
        onClose={() => { setShowPriceModal(false); setItemToBuy(null); }}
        onConfirm={handleConfirmPrice}
        itemName={itemToBuy?.name || ''}
        expectedPrice={itemToBuy?.expectedPrice || 0}
        currency="₹"
      />

      <ShoppingCategoryDetailsModal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedCategory(null); }}
        category={selectedCategory}
        items={selectedCategory ? items.filter(i => i.categoryId === selectedCategory.id) : []}
        onDeleteItem={handleDeleteItem}
        onEditItem={(item) => {
          setEditingItem(item)
          setSelectedCategory(categories.find(c => c.id === item.categoryId) || null)
          setShowDetailsModal(false)
          setShowItemModal(true)
        }}
        onMarkBought={handleMarkBought}
        onItemClick={(item) => {
          setSelectedItem(item)
          setShowItemDetailsModal(true)
        }}
        onExport={handleExportCategory}
        onAddItem={() => {
          setShowDetailsModal(false)
          setShowItemModal(true)
        }}
        onUpdateCategory={async (categoryData) => {
          if (!selectedCategory) return
          try {
            const token = localStorage.getItem('token')
            const response = await apiFetch(`/api/shopping-categories/${selectedCategory.id}`, {
              method: 'PATCH',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
              },
              body: JSON.stringify(categoryData)
            })

            if (response.ok) {
              const updatedCategory = await response.json()
              
              // Update categories list
              setCategories(prev => prev.map(cat => 
                cat.id === updatedCategory.id ? { ...cat, ...updatedCategory } : cat
              ))
              
              // Update selected category to trigger re-render
              setSelectedCategory(prev => prev ? { ...prev, ...updatedCategory } : null)
              
              addNotification({
                type: 'success',
                title: 'Bills Updated',
                message: 'Category bills have been updated',
                duration: 3000
              })
            }
          } catch (error) {
            addNotification({
              type: 'error',
              title: 'Update Failed',
              message: 'Failed to update category bills',
              duration: 4000
            })
          }
        }}
      />

      <ShoppingItemDetailsModal
        isOpen={showItemDetailsModal}
        onClose={() => {
          setShowItemDetailsModal(false)
          setSelectedItem(null)
        }}
        item={selectedItem}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
        title={`Delete ${deleteTarget?.type === 'category' ? 'Category' : 'Item'}?`}
        message={
          deleteTarget?.type === 'category'
            ? `Are you sure you want to delete "${deleteTarget.name}"? All items and associated expenses in this category will be deleted. This action cannot be undone.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
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

export default function Shopping() {
  return (
    <ProtectedRoute>
      <ShoppingContent />
    </ProtectedRoute>
  )
}
