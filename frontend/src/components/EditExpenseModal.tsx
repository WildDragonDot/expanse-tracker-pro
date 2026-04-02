'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { getDateInputValue, parseAppDate } from '@/lib/dateUtils'

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expense: any) => void
  expense: any
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

export default function EditExpenseModal({ isOpen, onClose, onSave, expense }: EditExpenseModalProps) {
  const { addNotification } = useNotification()
  const [categories, setCategories] = useState<Category[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    amount: '',
    category: '',
    bank: '',
    paymentMode: 'Cash',
    tags: '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      loadCategoriesAndBanks()
    }
  }, [isOpen])

  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        date: expense.date ? getDateInputValue(parseAppDate(expense.date)) : getDateInputValue(),
        title: expense.title || '',
        amount: expense.amount?.toString() || '',
        category: expense.category || '',
        bank: expense.bank || '',
        paymentMode: expense.paymentMode || 'Cash',
        tags: expense.tags ? expense.tags.join(', ') : '',
        notes: expense.notes || '',
      })
    }
  }, [expense, isOpen])

  const loadCategoriesAndBanks = async () => {
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
      console.error('Error loading categories and banks:', error)
    }
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updatedExpense = {
      ...expense,
      ...formData,
      amount: parseInt(formData.amount),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    
    onSave(updatedExpense)
    
    // Show success notification
    addNotification({
      type: 'success',
      title: 'Expense Updated',
      message: `₹${updatedExpense.amount.toLocaleString()} expense "${updatedExpense.title}" has been updated.`,
      duration: 4000
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="glass w-full sm:max-w-lg rounded-xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col border border-border shadow-premium-lg animate-scale-in">
        <div className="flex-shrink-0 glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Edit Expense</h2>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
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

          <div className="flex space-x-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              Update Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
