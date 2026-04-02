'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { getDateInputValue, parseAppDate } from '@/lib/dateUtils'

interface PlanningCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (category: any) => void
  editingCategory?: any
}

const iconOptions = ['✈️', '🎉', '📝', '🏠', '🚗', '🍔', '🎓', '💼', '🏥', '🎮', '📱', '👕', '🎁', '💰', '📅', '🗓️']
const colorOptions = [
  { id: 'blue', label: 'Blue', value: 'from-blue-500 to-cyan-600' },
  { id: 'purple', label: 'Purple', value: 'from-purple-500 to-pink-600' },
  { id: 'green', label: 'Green', value: 'from-green-500 to-emerald-600' },
  { id: 'orange', label: 'Orange', value: 'from-orange-500 to-red-600' },
  { id: 'red', label: 'Red', value: 'from-red-500 to-rose-600' },
  { id: 'indigo', label: 'Indigo', value: 'from-indigo-500 to-purple-600' },
  { id: 'teal', label: 'Teal', value: 'from-teal-500 to-cyan-600' },
  { id: 'amber', label: 'Amber', value: 'from-amber-500 to-orange-600' }
]

const categoryTypes = [
  { id: 'general', label: 'General', icon: '📝', description: 'No time restrictions' },
  { id: 'festival', label: 'Festival', icon: '🎉', description: 'For festivals and events' },
  { id: 'day', label: 'Single Day', icon: '📅', description: 'Expenses for a specific day' },
  { id: 'month', label: 'Monthly', icon: '🗓️', description: 'Expenses for a specific month' },
  { id: 'year', label: 'Yearly', icon: '📆', description: 'Expenses for a specific year' },
  { id: 'duration', label: 'Time Duration', icon: '⏱️', description: 'Custom date range' }
]

export default function PlanningCategoryModal({ isOpen, onClose, onSave, editingCategory }: PlanningCategoryModalProps) {
  const { addNotification } = useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    color: 'from-blue-500 to-cyan-600',
    expectedCost: '',
    type: 'general',
    startDate: '',
    endDate: '',
    expiryDate: ''
  })

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color,
        expectedCost: editingCategory.expectedCost?.toString() || '',
        type: editingCategory.type || 'general',
        startDate: editingCategory.startDate ? getDateInputValue(parseAppDate(editingCategory.startDate)) : '',
        endDate: editingCategory.endDate ? getDateInputValue(parseAppDate(editingCategory.endDate)) : '',
        expiryDate: editingCategory.expiryDate ? getDateInputValue(parseAppDate(editingCategory.expiryDate)) : ''
      })
    } else {
      setFormData({
        name: '',
        icon: '📝',
        color: 'from-blue-500 to-cyan-600',
        expectedCost: '',
        type: 'general',
        startDate: '',
        endDate: '',
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

    // Validate dates based on type
    if (['day', 'month', 'year', 'duration', 'festival'].includes(formData.type)) {
      if (!formData.startDate) {
        addNotification({
          type: 'error',
          title: 'Missing Date',
          message: 'Please select a start date for this category type',
          duration: 3000
        })
        return
      }
      if (formData.type === 'duration' && !formData.endDate) {
        addNotification({
          type: 'error',
          title: 'Missing End Date',
          message: 'Please select an end date for duration type',
          duration: 3000
        })
        return
      }
    }

    setIsLoading(true)
    
    try {
      const data: any = {
        ...formData,
        expectedCost: formData.expectedCost ? parseFloat(formData.expectedCost) : 0,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        expiryDate: formData.expiryDate || null
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
      icon: '📝',
      color: 'from-blue-500 to-cyan-600',
      expectedCost: '',
      type: 'general',
      startDate: '',
      endDate: '',
      expiryDate: ''
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="glass-premium w-full sm:max-w-2xl rounded-2xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
        {/* Premium Header with Gradient */}
        <div className="relative flex-shrink-0 px-5 py-4 sm:px-7 sm:py-6 border-b border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl blur-md opacity-50"></div>
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {editingCategory ? 'Update category details' : 'Organize your expenses with categories'}
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
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
              Category Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-indigo-500/50 transition-all"
              placeholder="e.g., Wedding 2024, Summer Vacation, Home Renovation..."
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
                      ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500 scale-110 shadow-lg'
                      : 'bg-secondary/50 hover:bg-secondary border-2 border-border/50 hover:border-border hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Category Type</label>
            <div className="grid grid-cols-1 gap-2">
              {categoryTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    formData.type === type.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-secondary/50'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  {formData.type === type.id && (
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Date Fields */}
          {['day', 'month', 'year', 'duration', 'festival'].includes(formData.type) && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                  {formData.type === 'day' ? 'Date' : formData.type === 'month' ? 'Month' : formData.type === 'year' ? 'Year' : 'Start Date'} *
                </label>
                <input
                  type={formData.type === 'month' ? 'month' : formData.type === 'year' ? 'number' : 'date'}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  placeholder={formData.type === 'year' ? 'e.g., 2024' : ''}
                  min={formData.type === 'year' ? '2020' : undefined}
                  max={formData.type === 'year' ? '2100' : undefined}
                  required
                />
              </div>
              
              {formData.type === 'duration' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                    min={formData.startDate}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Expiry Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-600"></span>
              Category Expiry Date
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-red-500/50 transition-all"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              After this date, the category will become inactive and no new expenses can be added
            </p>
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
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg scale-105'
                      : 'border-border/50 hover:bg-secondary/50 hover:border-border'
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${color.value} shadow-md`}></div>
                  <span className="text-sm sm:text-base font-semibold flex-1">{color.label}</span>
                  {formData.color === color.value && (
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="flex-1 px-5 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
