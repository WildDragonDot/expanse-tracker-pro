'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { getDateInputValue, parseAppDate } from '@/lib/dateUtils'

interface ExpensePlanningModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expense: any) => void
  categories: any[]
  selectedCategoryId?: string
  editingExpense?: any
}

export default function ExpensePlanningModal({ isOpen, onClose, onSave, categories, selectedCategoryId, editingExpense }: ExpensePlanningModalProps) {
  const { addNotification } = useNotification()
  const [formData, setFormData] = useState({
    date: getDateInputValue(),
    title: '',
    amount: '',
    categoryId: selectedCategoryId || '',
    description: '',
  })

  // Update form when editing expense changes
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        date: editingExpense.date ? getDateInputValue(parseAppDate(editingExpense.date)) : getDateInputValue(),
        title: editingExpense.title || '',
        amount: editingExpense.amount?.toString() || '',
        categoryId: editingExpense.categoryId || selectedCategoryId || '',
        description: editingExpense.description || '',
      })
    } else if (isOpen) {
      setFormData({
        date: getDateInputValue(),
        title: '',
        amount: '',
        categoryId: selectedCategoryId || '',
        description: '',
      })
    }
  }, [editingExpense, selectedCategoryId, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.amount) {
      addNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill all required fields',
        duration: 3000
      })
      return
    }

    const expense = {
      ...formData,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId || null,
      description: formData.description
    }
    
    onSave(expense)
    
    // Reset form
    setFormData({
      date: getDateInputValue(),
      title: '',
      amount: '',
      categoryId: selectedCategoryId || '',
      description: '',
    })
  }

  const handleClose = () => {
    setFormData({
      date: getDateInputValue(),
      title: '',
      amount: '',
      categoryId: selectedCategoryId || '',
      description: '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="glass-premium w-full sm:max-w-xl rounded-2xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
        {/* Premium Header with Gradient */}
        <div className="relative flex-shrink-0 px-5 py-4 sm:px-7 sm:py-6 border-b border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl blur-md opacity-50"></div>
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{editingExpense ? 'Edit Expense' : 'Plan New Expense'}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{editingExpense ? 'Update your planned expense' : 'Add a planned expense to your budget'}</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 hover:rotate-90 border border-border/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Premium Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 sm:space-y-6 custom-scrollbar">
          {/* Expense Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
              Expense Title
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-indigo-500/50 transition-all"
              placeholder="e.g., Wedding venue booking, Flight tickets..."
              required
            />
          </div>

          {/* Amount and Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"></span>
                Expected Amount
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base sm:text-lg font-bold">₹</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-premium w-full pl-9 pr-4 py-3 sm:py-3.5 text-sm sm:text-base font-semibold rounded-xl border-2 border-border/50 focus:border-blue-500/50 transition-all"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></span>
                Expected Date
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-emerald-500/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Category Selection - Hidden, automatically uses selected category */}
          <input type="hidden" value={formData.categoryId} />

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600"></span>
              Description
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-amber-500/50 transition-all resize-none"
              placeholder="Add any additional notes or details about this expense..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-5 py-3 sm:py-3.5 border-2 border-border/50 text-foreground rounded-xl text-sm sm:text-base font-semibold hover:bg-secondary/50 hover:border-border transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
