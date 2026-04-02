'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { getDateInputValue, parseAppDate } from '@/lib/dateUtils'

interface EditIncomeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (income: any) => void
  income: any
}

export default function EditIncomeModal({ isOpen, onClose, onSave, income }: EditIncomeModalProps) {
  const { addNotification } = useNotification()
  const [formData, setFormData] = useState({
    date: '',
    source: '',
    amount: '',
    notes: '',
  })

  useEffect(() => {
    if (income && isOpen) {
      setFormData({
        date: income.date ? getDateInputValue(parseAppDate(income.date)) : getDateInputValue(),
        source: income.source || '',
        amount: income.amount?.toString() || '',
        notes: income.notes || '',
      })
    }
  }, [income, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updatedIncome = {
      ...income,
      ...formData,
      amount: parseInt(formData.amount),
    }
    
    onSave(updatedIncome)
    
    // Show success notification
    addNotification({
      type: 'success',
      title: 'Income Updated',
      message: `₹${updatedIncome.amount.toLocaleString()} income from ${updatedIncome.source} has been updated.`,
      duration: 4000
    })
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="glass-premium rounded-2xl p-6 w-full max-w-md border border-border/20 shadow-premium animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Edit Income</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input-premium w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., Salary, Freelance, Investment"
              className="input-premium w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Amount (₹)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              className="input-premium w-full"
              required
              min="1"
            />
          </div>



          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="input-premium w-full h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl border border-border bg-secondary/50 hover:bg-secondary text-foreground font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Update Income
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
