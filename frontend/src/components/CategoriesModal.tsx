'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface CategoriesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Category {
  id: string
  name: string
  icon: string
  isDefault: boolean
}

interface Bank {
  id: string
  name: string
  icon: string
  isDefault: boolean
}

export default function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { addNotification } = useNotification()
  const [activeTab, setActiveTab] = useState<'categories' | 'banks'>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📝' })
  const [newBank, setNewBank] = useState({ name: '', icon: '🏦' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      const [categoriesRes, banksRes] = await Promise.all([
        apiFetch('/api/expense-categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        apiFetch('/api/expense-banks', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (categoriesRes.ok && banksRes.ok) {
        const categoriesData = await categoriesRes.json()
        const banksData = await banksRes.json()
        setCategories(categoriesData)
        setBanks(banksData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load categories and banks',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const addCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/expense-categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      })

      if (response.ok) {
        const created = await response.json()
        setCategories(prev => [...prev, created])
        setNewCategory({ name: '', icon: '📝' })
        setShowAddForm(false)
        addNotification({
          type: 'success',
          title: 'Category Added',
          message: `${newCategory.name} has been created.`,
          duration: 3000
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed',
        message: error.message || 'Failed to add category',
        duration: 4000
      })
    }
  }

  const addBank = async () => {
    if (!newBank.name.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch('/api/expense-banks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBank)
      })

      if (response.ok) {
        const created = await response.json()
        setBanks(prev => [...prev, created])
        setNewBank({ name: '', icon: '🏦' })
        setShowAddForm(false)
        addNotification({
          type: 'success',
          title: 'Bank Added',
          message: `${newBank.name} has been created.`,
          duration: 3000
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed',
        message: error.message || 'Failed to add bank',
        duration: 4000
      })
    }
  }

  const deleteCategory = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      addNotification({
        type: 'error',
        title: 'Cannot Delete',
        message: 'Default categories cannot be deleted',
        duration: 3000
      })
      return
    }

    if (!confirm('Delete this category?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/expense-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== id))
        addNotification({
          type: 'success',
          title: 'Deleted',
          message: 'Category has been removed.',
          duration: 3000
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed',
        message: error.message || 'Failed to delete category',
        duration: 4000
      })
    }
  }

  const deleteBank = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      addNotification({
        type: 'error',
        title: 'Cannot Delete',
        message: 'Default banks cannot be deleted',
        duration: 3000
      })
      return
    }

    if (!confirm('Delete this bank?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await apiFetch(`/api/expense-banks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setBanks(prev => prev.filter(b => b.id !== id))
        addNotification({
          type: 'success',
          title: 'Deleted',
          message: 'Bank has been removed.',
          duration: 3000
        })
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed',
        message: error.message || 'Failed to delete bank',
        duration: 4000
      })
    }
  }

  const categoryEmojiOptions = ['🍔', '🚗', '🛍️', '🎬', '📄', '🏥', '📚', '✈️', '💪', '🎁']
  const bankEmojiOptions = ['💵', '🏦', '💳', '💰', '🏧', '💸', '🪙', '💴', '💶', '💷']

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="glass w-full sm:max-w-lg rounded-xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col border border-border shadow-premium-lg animate-scale-in">
        <div className="flex-shrink-0 glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground">Manage Expense Settings</h2>
            </div>
            <button 
              onClick={onClose} 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 glass-premium rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('categories'); setShowAddForm(false); }}
              className={`flex-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => { setActiveTab('banks'); setShowAddForm(false); }}
              className={`flex-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'banks'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                  : 'text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              Banks
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                      {activeTab === 'categories' ? (
                        <>
                          <span className="text-base">📁</span>
                          Expense Categories
                        </>
                      ) : (
                        <>
                          <span className="text-base">🏦</span>
                          Banks
                        </>
                      )}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      {activeTab === 'categories' 
                        ? `${categories.length} categories available` 
                        : `${banks.length} banks available`
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${
                      activeTab === 'categories'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New
                    </span>
                  </button>
                </div>

                {showAddForm && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 border border-border rounded-lg sm:rounded-xl bg-secondary/20">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          {activeTab === 'categories' ? 'Category Name' : 'Bank Name'}
                        </label>
                        <input
                          type="text"
                          value={activeTab === 'categories' ? newCategory.name : newBank.name}
                          onChange={(e) => activeTab === 'categories' 
                            ? setNewCategory({ ...newCategory, name: e.target.value })
                            : setNewBank({ ...newBank, name: e.target.value })
                          }
                          className="input-premium w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base"
                          placeholder={activeTab === 'categories' ? 'Enter category name' : 'Enter bank name'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Icon</label>
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                          {(activeTab === 'categories' ? categoryEmojiOptions : bankEmojiOptions).map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => activeTab === 'categories'
                                ? setNewCategory({ ...newCategory, icon: emoji })
                                : setNewBank({ ...newBank, icon: emoji })
                              }
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-base sm:text-lg transition-colors ${
                                (activeTab === 'categories' ? newCategory.icon : newBank.icon) === emoji 
                                  ? 'bg-primary text-white' 
                                  : 'bg-secondary hover:bg-secondary/80'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={activeTab === 'categories' ? addCategory : addBank}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-secondary text-foreground rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-secondary/80 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {activeTab === 'categories' ? (
                  categories.length > 0 ? (
                    categories.map((category, index) => (
                      <div
                        key={category.id}
                        className="group flex items-center justify-between p-2.5 sm:p-3 rounded-lg border border-border/50 bg-gradient-to-r from-background to-background/50 hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:border-blue-300/50 dark:hover:border-blue-700/50 animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-base sm:text-lg">{category.icon}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{category.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                category.isDefault 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              }`}>
                                {category.isDefault ? '⭐ Default' : '✨ Custom'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!category.isDefault && (
                          <button
                            onClick={() => deleteCategory(category.id, category.isDefault)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                            title="Delete category"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-sm">No categories yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Click "Add New" to create one</p>
                    </div>
                  )
                ) : (
                  banks.length > 0 ? (
                    banks.map((bank, index) => (
                      <div
                        key={bank.id}
                        className="group flex items-center justify-between p-2.5 sm:p-3 rounded-lg border border-border/50 bg-gradient-to-r from-background to-background/50 hover:from-emerald-50/50 hover:to-green-50/50 dark:hover:from-emerald-900/10 dark:hover:to-green-900/10 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:border-emerald-300/50 dark:hover:border-emerald-700/50 animate-slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-base sm:text-lg">{bank.icon}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{bank.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                bank.isDefault 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              }`}>
                                {bank.isDefault ? '⭐ Default' : '✨ Custom'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!bank.isDefault && (
                          <button
                            onClick={() => deleteBank(bank.id, bank.isDefault)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                            title="Delete bank"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-sm">No banks yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Click "Add New" to create one</p>
                    </div>
                  )
                )}
              </div>

              <div className="flex space-x-3 pt-4 sm:pt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}