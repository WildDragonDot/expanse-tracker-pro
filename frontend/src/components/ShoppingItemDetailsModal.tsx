'use client'

import { useState } from 'react'

interface ShoppingItemDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    name: string
    expectedPrice: number
    actualPrice?: number
    quantity: number
    unit: string
    notes?: string
    isBought: boolean
    createdAt: string
  } | null
}

export default function ShoppingItemDetailsModal({ isOpen, onClose, item }: ShoppingItemDetailsModalProps) {
  if (!isOpen || !item) return null

  const expectedTotal = item.expectedPrice * item.quantity
  const actualTotal = (item.actualPrice || 0) * item.quantity
  const difference = actualTotal - expectedTotal
  const percentageDiff = expectedTotal > 0 ? ((difference / expectedTotal) * 100) : 0
  const savedOrExtra = difference < 0 ? 'Saved' : 'Extra'
  const isBought = item.isBought

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-20 sm:pb-4 animate-fade-in">
      <div className="glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-border shadow-premium-lg animate-slide-up sm:animate-scale-in max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 rounded-t-3xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg ${
                isBought 
                  ? 'from-green-500 to-emerald-600' 
                  : 'from-blue-500 to-indigo-600'
              }`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isBought ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {isBought ? 'Purchase Details' : 'Item Details'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isBought ? 'Item comparison' : 'Expected cost'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-secondary/50 backdrop-blur-sm hover:bg-secondary border border-border/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Item Name */}
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {item.quantity} {item.unit} • {isBought ? 'Purchased' : 'Not Purchased Yet'}
            </p>
          </div>

          {/* Price Cards */}
          {isBought ? (
            /* Price Comparison Cards - For Bought Items */
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Expected Price */}
              <div className="relative glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-500/30 bg-blue-500/5 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Expected</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Per unit</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    ₹{item.expectedPrice.toLocaleString()}
                  </p>
                  <div className="pt-2 border-t border-blue-500/20">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
                    <p className="text-sm font-bold text-foreground">
                      ₹{expectedTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actual Price */}
              <div className="relative glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-green-500/30 bg-green-500/5 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400">Actual</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Per unit</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                    ₹{(item.actualPrice || 0).toLocaleString()}
                  </p>
                  <div className="pt-2 border-t border-green-500/20">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Total</p>
                    <p className="text-sm font-bold text-foreground">
                      ₹{actualTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Expected Price Card - For Unbought Items */
            <div className="relative glass-premium rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-blue-500/30 bg-blue-500/5 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Expected Cost</p>
                      <p className="text-xs text-muted-foreground">Budget estimate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                      ₹{expectedTotal.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blue-500/20">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Per Unit</p>
                    <p className="text-lg font-bold text-foreground">₹{item.expectedPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                    <p className="text-lg font-bold text-foreground">{item.quantity} {item.unit}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Difference Card - Only for bought items */}
          {isBought && (
            <div className={`relative glass-premium rounded-xl sm:rounded-2xl p-4 sm:p-5 border overflow-hidden ${
              difference < 0 
                ? 'border-emerald-500/30 bg-emerald-500/5' 
                : difference > 0
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-gray-500/30 bg-gray-500/5'
            }`}>
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 hover:opacity-100 transition-opacity ${
              difference < 0 ? 'from-emerald-500/10' : difference > 0 ? 'from-red-500/10' : 'from-gray-500/10'
            } to-transparent`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center ${
                    difference < 0 
                      ? 'from-emerald-500 to-green-600' 
                      : difference > 0
                      ? 'from-red-500 to-rose-600'
                      : 'from-gray-500 to-slate-600'
                  }`}>
                    {difference < 0 ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                    ) : difference > 0 ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${
                      difference < 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : difference > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {difference === 0 ? 'Exact Match' : savedOrExtra}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {difference === 0 ? 'As expected' : 'Compared to expected'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl sm:text-3xl font-bold ${
                    difference < 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : difference > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {difference < 0 ? '-' : difference > 0 ? '+' : ''}₹{Math.abs(difference).toLocaleString()}
                  </p>
                  <p className={`text-xs font-semibold ${
                    difference < 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : difference > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {percentageDiff > 0 ? '+' : ''}{percentageDiff.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Visual Bar */}
              <div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                    difference < 0 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                      : difference > 0
                      ? 'bg-gradient-to-r from-red-500 to-rose-600'
                      : 'bg-gradient-to-r from-gray-500 to-slate-600'
                  }`}
                  style={{ width: `${Math.min(Math.abs(percentageDiff), 100)}%` }}
                />
              </div>
            </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-3">
            {item.notes && (
              <div className="glass-premium rounded-xl p-4 border border-border/20">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-4 h-4 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground mb-1">Notes</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.notes}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-premium rounded-xl p-4 border border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-semibold text-foreground">Purchase Date</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  )
}
