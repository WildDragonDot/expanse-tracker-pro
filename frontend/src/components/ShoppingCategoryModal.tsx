'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { getDateInputValue, parseAppDate } from '@/lib/dateUtils'

interface ShoppingCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (category: any) => void
  editingCategory?: any
}

const iconOptions = ['🛒', '🥬', '🍎', '🥛', '🍞', '🥩', '🐟', '🧀', '🍕', '🍔', '🍜', '☕', '🧃', '🍰', '🧺', '🏠']
const colorOptions = [
  { id: 'green', label: 'Green', value: 'from-green-500 to-emerald-600' },
  { id: 'blue', label: 'Blue', value: 'from-blue-500 to-cyan-600' },
  { id: 'purple', label: 'Purple', value: 'from-purple-500 to-pink-600' },
  { id: 'orange', label: 'Orange', value: 'from-orange-500 to-red-600' },
  { id: 'red', label: 'Red', value: 'from-red-500 to-rose-600' },
  { id: 'indigo', label: 'Indigo', value: 'from-indigo-500 to-purple-600' },
  { id: 'teal', label: 'Teal', value: 'from-teal-500 to-cyan-600' },
  { id: 'amber', label: 'Amber', value: 'from-amber-500 to-orange-600' }
]

export default function ShoppingCategoryModal({ isOpen, onClose, onSave, editingCategory }: ShoppingCategoryModalProps) {
  const { addNotification } = useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '🛒',
    color: 'from-green-500 to-emerald-600',
    expectedCost: '',
    expiryDate: ''
  })

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color,
        expectedCost: editingCategory.expectedCost?.toString() || '',
        expiryDate: editingCategory.expiryDate ? getDateInputValue(parseAppDate(editingCategory.expiryDate)) : ''
      })
    } else {
      setFormData({
        name: '',
        icon: '🛒',
        color: 'from-green-500 to-emerald-600',
        expectedCost: '',
        expiryDate: ''
      })
    }
  }, [editingCategory, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    if (!formData.name) {
      addNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please enter a category name',
        duration: 3000
      })
      return
    }

    setIsLoading(true)
    
    try {
      const data: any = {
        ...formData,
        expectedCost: formData.expectedCost ? parseFloat(formData.expectedCost) : 0,
        expiryDate: formData.expiryDate ? parseAppDate(formData.expiryDate).toISOString() : null
      }

      await onSave(data)
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      icon: '🛒',
      color: 'from-green-500 to-emerald-600',
      expectedCost: '',
      expiryDate: ''
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="glass-premium w-full sm:max-w-2xl rounded-2xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative flex-shrink-0 px-5 py-4 sm:px-7 sm:py-6 border-b border-white/10 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-green-600/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl blur-md opacity-50"></div>
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  {editingCategory ? 'Edit Category' : 'Create Shopping Category'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {editingCategory ? 'Update category details' : 'Organize your shopping with categories'}
                </p>
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 sm:space-y-6 custom-scrollbar">
          {/* Category Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></span>
              Category Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-emerald-500/50 transition-all"
              placeholder="e.g., Groceries, Electronics, Household..."
              required
            />
          </div>

          {/* Expected Budget */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"></span>
              Expected Budget
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base sm:text-lg font-bold">₹</span>
              <input
                type="number"
                value={formData.expectedCost}
                onChange={(e) => setFormData({ ...formData, expectedCost: e.target.value })}
                className="input-premium w-full pl-9 pr-4 py-3 sm:py-3.5 text-sm sm:text-base font-semibold rounded-xl border-2 border-border/50 focus:border-blue-500/50 transition-all"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Total budget you expect to spend in this category
            </p>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600"></span>
              Expiry Date
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-purple-500/50 transition-all"
              min={getDateInputValue()}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Category will auto-expire and send bill via email on this date
            </p>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600"></span>
              Choose Icon
            </label>
            <div className="grid grid-cols-8 gap-2 sm:gap-2.5">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-200 ${
                    formData.icon === icon
                      ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500 scale-110 shadow-lg'
                      : 'bg-secondary/50 hover:bg-secondary border-2 border-border/50 hover:border-border hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600"></span>
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border-2 transition-all duration-200 ${
                    formData.color === color.value
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg scale-105'
                      : 'border-border/50 hover:bg-secondary/50 hover:border-border'
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${color.value} shadow-md`}></div>
                  <span className="text-sm sm:text-base font-semibold flex-1">{color.label}</span>
                  {formData.color === color.value && (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-5 py-3 sm:py-3.5 border-2 border-border/50 text-foreground rounded-xl text-sm sm:text-base font-semibold hover:bg-secondary/50 hover:border-border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-5 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white rounded-xl text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{editingCategory ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : editingCategory ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Update
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
