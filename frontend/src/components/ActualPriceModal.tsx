'use client'

import { useState, useEffect, useRef } from 'react'

interface ActualPriceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (price: number) => void
  itemName: string
  expectedPrice: number
  currency?: string
}

export default function ActualPriceModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  expectedPrice,
  currency = '₹'
}: ActualPriceModalProps) {
  const [price, setPrice] = useState(expectedPrice.toString())
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setPrice(expectedPrice.toString())
      setError('')
      // Focus input after a small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }
  }, [isOpen, expectedPrice])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please enter a valid price')
      return
    }

    onConfirm(numPrice)
    onClose()
  }

  const difference = parseFloat(price) - expectedPrice
  const percentDiff = expectedPrice > 0 ? ((difference / expectedPrice) * 100).toFixed(1) : '0'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-4">
      <div className="glass w-full sm:max-w-md rounded-xl sm:rounded-2xl border border-border shadow-premium-lg animate-scale-in">
        {/* Header */}
        <div className="glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Mark as Bought</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{itemName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Expected vs Actual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Expected Price</p>
              <p className="text-lg sm:text-xl font-semibold text-foreground">{currency}{expectedPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300 mb-1">Actual Price</p>
              <p className="text-lg sm:text-xl font-semibold text-green-900 dark:text-green-100">
                {currency}{parseFloat(price) || 0}
              </p>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
              Enter Actual Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base font-medium">
                {currency}
              </span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value)
                  setError('')
                }}
                className={`input-premium w-full pl-8 sm:pl-10 pr-3 py-3 sm:py-3.5 text-base sm:text-lg font-semibold ${
                  error ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {error && (
              <p className="mt-2 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Difference Indicator */}
          {!isNaN(parseFloat(price)) && parseFloat(price) !== expectedPrice && (
            <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 ${
              difference > 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {difference > 0 ? (
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )}
                  <span className={`text-sm sm:text-base font-semibold ${
                    difference > 0 
                      ? 'text-red-900 dark:text-red-100' 
                      : 'text-green-900 dark:text-green-100'
                  }`}>
                    {difference > 0 ? 'Over Budget' : 'Under Budget'}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-base sm:text-lg font-bold ${
                    difference > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {difference > 0 ? '+' : ''}{currency}{Math.abs(difference).toFixed(2)}
                  </p>
                  <p className={`text-xs ${
                    difference > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {difference > 0 ? '+' : ''}{percentDiff}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick adjust:</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPrice((expectedPrice * 0.9).toFixed(2))}
                className="flex-1 py-2 px-3 text-xs sm:text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
              >
                -10%
              </button>
              <button
                type="button"
                onClick={() => setPrice(expectedPrice.toString())}
                className="flex-1 py-2 px-3 text-xs sm:text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
              >
                Expected
              </button>
              <button
                type="button"
                onClick={() => setPrice((expectedPrice * 1.1).toFixed(2))}
                className="flex-1 py-2 px-3 text-xs sm:text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
              >
                +10%
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark as Bought
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
