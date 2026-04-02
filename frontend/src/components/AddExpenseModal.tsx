'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect, memo, useCallback } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { getDateInputValue } from '@/lib/dateUtils'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expense: any) => Promise<void>
}

interface Category {
  id: string
  name: string
  icon: string
}

interface Bank {
  id: string
  name: string
  icon: string
}

function AddExpenseModal({ isOpen, onClose, onSave }: AddExpenseModalProps) {
  const { addNotification } = useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [formData, setFormData] = useState({
    date: getDateInputValue(),
    title: '',
    amount: '',
    category: '',
    bank: '',
    paymentMode: 'Cash',
    tags: '',
    notes: '',
  })

  const loadCategoriesAndBanks = useCallback(async () => {
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
        
        // Set default values
        if (categoriesData.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: categoriesData[0].name }))
        }
        if (banksData.length > 0 && !formData.bank) {
          setFormData(prev => ({ ...prev, bank: banksData[0].name }))
        }
      }
    } catch (error) {
      console.error('Error loading categories and banks:', error)
    }
  }, [formData.category, formData.bank])

  useEffect(() => {
    if (isOpen) {
      loadCategoriesAndBanks()
    }
  }, [isOpen, loadCategoriesAndBanks])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      const expense = {
        ...formData,
        amount: parseInt(formData.amount),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      
      await onSave(expense)
      
      setFormData({
        date: getDateInputValue(),
        title: '',
        amount: '',
        category: 'Food',
        bank: 'Cash',
        paymentMode: 'Cash',
        tags: '',
        notes: '',
      })
      onClose()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add expense. Please try again.',
        duration: 4000
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, onSave, onClose, addNotification])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="glass-premium w-full sm:max-w-xl rounded-2xl sm:rounded-3xl max-h-[94vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
        {/* Premium Header */}
        <div className="relative flex-shrink-0 px-4 py-3 sm:px-6 sm:py-5 border-b border-white/10 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-red-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-pink-600/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl blur-md opacity-50"></div>
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Add Expense</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Record a new expense</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 hover:rotate-90 border border-border/50"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-premium w-full pl-7 pr-3 py-2.5 sm:py-3 text-sm sm:text-base"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
              placeholder="e.g., Lunch at restaurant"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                {categories.length === 0 ? (
                  <option>Loading...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Bank</label>
              <select
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                {banks.length === 0 ? (
                  <option>Loading...</option>
                ) : (
                  banks.map((bank) => (
                    <option key={bank.id} value={bank.name}>
                      {bank.icon} {bank.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Wallet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
              placeholder="e.g., work, lunch, team"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-premium w-full px-3 py-2.5 sm:py-3 resize-none text-sm sm:text-base"
              rows={3}
              placeholder="Add any additional details..."
            />
          </div>

          <div className="flex gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 sm:py-3 border-2 border-border/50 text-foreground rounded-xl text-sm sm:text-base font-semibold hover:bg-secondary/50 hover:border-border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 hover:from-rose-600 hover:via-pink-700 hover:to-red-700 text-white rounded-xl text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default memo(AddExpenseModal)
