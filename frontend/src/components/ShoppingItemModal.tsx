'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface ShoppingItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: any) => void
  categories: any[]
  selectedCategoryId?: string
  editingItem?: any
}

export default function ShoppingItemModal({ isOpen, onClose, onSave, categories, selectedCategoryId, editingItem }: ShoppingItemModalProps) {
  const { addNotification } = useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    expectedPrice: '',
    quantity: '1',
    unit: 'pcs',
    categoryId: selectedCategoryId || '',
    notes: ''
  })

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        expectedPrice: editingItem.expectedPrice?.toString() || '',
        quantity: editingItem.quantity?.toString() || '1',
        unit: editingItem.unit || 'pcs',
        categoryId: editingItem.categoryId || selectedCategoryId || '',
        notes: editingItem.notes || ''
      })
    } else if (isOpen) {
      setFormData({
        name: '',
        expectedPrice: '',
        quantity: '1',
        unit: 'pcs',
        categoryId: selectedCategoryId || '',
        notes: ''
      })
    }
  }, [editingItem, selectedCategoryId, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return
    
    if (!formData.name || !formData.expectedPrice) {
      addNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill all required fields',
        duration: 3000
      })
      return
    }

    setIsLoading(true)
    
    try {
      const item = {
        ...formData,
        expectedPrice: parseFloat(formData.expectedPrice),
        quantity: parseInt(formData.quantity),
        categoryId: formData.categoryId || null,
        notes: formData.notes
      }
      
      await onSave(item)
      
      // Reset form
      setFormData({
        name: '',
        expectedPrice: '',
        quantity: '1',
        unit: 'pcs',
        categoryId: selectedCategoryId || '',
        notes: ''
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      expectedPrice: '',
      quantity: '1',
      unit: 'pcs',
      categoryId: selectedCategoryId || '',
      notes: ''
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="glass-premium w-full sm:max-w-xl rounded-2xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative flex-shrink-0 px-5 py-4 sm:px-7 sm:py-6 border-b border-white/10 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-green-600/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl blur-md opacity-50"></div>
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{editingItem ? 'Edit Item' : 'Add Shopping Item'}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{editingItem ? 'Update your shopping item' : 'Add a new item to your shopping list'}</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 sm:space-y-6 custom-scrollbar">
          {/* Item Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></span>
              Item Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-emerald-500/50 transition-all"
              placeholder="e.g., Milk, Bread, Eggs..."
              required
            />
          </div>

          {/* Price and Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"></span>
                Expected Price
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base sm:text-lg font-bold">₹</span>
                <input
                  type="number"
                  value={formData.expectedPrice}
                  onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
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
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600"></span>
                Quantity
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-purple-500/50 transition-all"
                placeholder="1"
                min="1"
                required
              />
            </div>
          </div>

          {/* Unit Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600"></span>
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-amber-500/50 transition-all"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="l">Liter (l)</option>
              <option value="ml">Milliliter (ml)</option>
              <option value="pack">Pack</option>
              <option value="box">Box</option>
              <option value="dozen">Dozen</option>
            </select>
          </div>

          {/* Category Selection - Hidden, automatically uses selected category */}
          <input type="hidden" value={formData.categoryId} />

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600"></span>
              Notes
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="input-premium w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium rounded-xl border-2 border-border/50 focus:border-teal-500/50 transition-all resize-none"
              placeholder="Add any additional notes or details..."
            />
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
                  <span>{editingItem ? 'Updating...' : 'Adding...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  {editingItem ? 'Update' : 'Add Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
