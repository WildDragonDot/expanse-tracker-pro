'use client'

import { useState, memo, useCallback, useMemo } from 'react'
import { api } from '@/lib/api'
import { useNotification } from '@/contexts/NotificationContext'
import { exportToExcel, exportDetailedReport, exportToPDF, getDateRangeFilters } from '@/lib/exportUtils'
import { getDateInputValue, parseAppDate } from '@/lib/dateUtils'

interface ReportsModalProps {
  isOpen: boolean
  onClose: () => void
  expenses: any[]
  incomes: any[]
  categories: string[]
}

function ReportsModal({ isOpen, onClose, expenses, incomes, categories }: ReportsModalProps) {
  const [reportType, setReportType] = useState<'day' | 'month' | 'year'>('month')
  const [selectedDate, setSelectedDate] = useState(getDateInputValue())
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [loading, setLoading] = useState(false)
  const [includeBillAttachments, setIncludeBillAttachments] = useState(true)
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([])
  const [showExpenseSelection, setShowExpenseSelection] = useState(false)
  const { addNotification } = useNotification()

  const getFilteredData = useCallback(() => {
    let dateFrom: string, dateTo: string

    if (useCustomRange) {
      dateFrom = customDateFrom
      dateTo = customDateTo
    } else {
      const dateRange = getDateRangeFilters(reportType, new Date(selectedDate))
      dateFrom = dateRange.dateFrom
      dateTo = dateRange.dateTo
    }

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = getDateInputValue(parseAppDate(expense.date))
      const matchesDate = expenseDate >= dateFrom && expenseDate <= dateTo
      const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory
      return matchesDate && matchesCategory
    })

    const filteredIncomes = incomes.filter(income => {
      const incomeDate = getDateInputValue(parseAppDate(income.date))
      return incomeDate >= dateFrom && incomeDate <= dateTo
    })

    return { filteredExpenses, filteredIncomes, dateFrom, dateTo }
  }, [reportType, selectedDate, customDateFrom, customDateTo, useCustomRange, expenses, incomes, selectedCategory])

  const handleExportExpenses = useCallback(() => {
    const { filteredExpenses, dateFrom, dateTo } = getFilteredData()
    
    if (filteredExpenses.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Data',
        message: 'No expenses found for the selected period.',
        duration: 3000
      })
      return
    }

    exportToExcel(filteredExpenses, 'expenses', { dateFrom, dateTo, category: selectedCategory, type: reportType })
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `Exported ${filteredExpenses.length} expenses to Excel.`,
      duration: 4000
    })
  }, [getFilteredData, addNotification, selectedCategory, reportType])

  const handleExportIncomes = useCallback(() => {
    const { filteredIncomes, dateFrom, dateTo } = getFilteredData()
    
    if (filteredIncomes.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Data',
        message: 'No incomes found for the selected period.',
        duration: 3000
      })
      return
    }

    exportToExcel(filteredIncomes, 'incomes', { dateFrom, dateTo, type: reportType })
    addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `Exported ${filteredIncomes.length} incomes to Excel.`,
      duration: 4000
    })
  }, [getFilteredData, addNotification, reportType])

  const handleExportDetailedReport = useCallback(() => {
    const { filteredExpenses, filteredIncomes, dateFrom, dateTo } = getFilteredData()
    
    if (filteredExpenses.length === 0 && filteredIncomes.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Data',
        message: 'No transactions found for the selected period.',
        duration: 3000
      })
      return
    }

    exportDetailedReport(filteredExpenses, filteredIncomes, { dateFrom, dateTo, category: selectedCategory, type: reportType })
    addNotification({
      type: 'success',
      title: 'Report Generated',
      message: 'Detailed financial report exported successfully.',
      duration: 4000
    })
  }, [getFilteredData, addNotification, selectedCategory, reportType])

  const handleExportPremiumPDF = useCallback(async () => {
    const { filteredExpenses, filteredIncomes } = getFilteredData()
    
    if (filteredExpenses.length === 0 && filteredIncomes.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Data',
        message: 'No transactions found for the selected period.',
        duration: 3000
      })
      return
    }

    try {
        // Get user info from localStorage or API
      let userInfo = { name: 'Valued Customer', email: '' }
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          userInfo = {
            name: user.name || 'Valued Customer',
            email: user.email || ''
          }
        }
      } catch (error) {
        console.warn('Failed to parse user info from localStorage:', error)
      }

      const { dateFrom, dateTo } = getFilteredData()
      
      await exportToPDF(filteredExpenses, filteredIncomes, undefined, {
        title: 'Premium Financial Report',
        includeCharts: true,
        includeSmartScore: true,
        userInfo,
        reportType,
        dateFrom,
        dateTo,
        category: selectedCategory !== 'All' ? selectedCategory : undefined
      })

      addNotification({
        type: 'success',
        title: 'Premium PDF Generated',
        message: 'Premium financial report with professional formatting exported successfully.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to generate premium PDF report.',
        duration: 4000
      })
    }
  }, [getFilteredData, addNotification])

  const handleEmailReport = useCallback(async () => {
    setLoading(true)
    try {
      let dateFrom: string, dateTo: string

      if (useCustomRange) {
        dateFrom = customDateFrom
        dateTo = customDateTo
      } else {
        const dateRange = getDateRangeFilters(reportType, new Date(selectedDate))
        dateFrom = dateRange.dateFrom
        dateTo = dateRange.dateTo
      }

      const result = await api.sendEmailReport({
        dateFrom,
        dateTo,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        type: reportType,
        includeBillAttachments,
        selectedExpenseIds: selectedExpenseIds.length > 0 ? selectedExpenseIds : undefined
      })

      addNotification({
        type: 'success',
        title: 'Email Sent',
        message: 'Financial report has been sent to your email.',
        duration: 4000
      })

      onClose()
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Email Failed',
        message: error.message || 'Failed to send email report.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }, [reportType, useCustomRange, customDateFrom, customDateTo, selectedDate, selectedCategory, addNotification, onClose])

  const getPeriodDescription = useCallback(() => {
    if (useCustomRange) {
      return `${customDateFrom} to ${customDateTo}`
    }

    const date = new Date(selectedDate)
    switch (reportType) {
      case 'day':
        return date.toLocaleDateString('en-IN')
      case 'month':
        return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      case 'year':
        return date.getFullYear().toString()
      default:
        return 'Selected period'
    }
  }, [useCustomRange, customDateFrom, customDateTo, selectedDate, reportType])

  const { filteredExpenses, filteredIncomes } = useMemo(() => getFilteredData(), [getFilteredData])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[100]">
      <div className="glass rounded-xl sm:rounded-2xl shadow-premium-lg p-4 sm:p-6 w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Export & Email Reports</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Generate and share your financial reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-secondary rounded-lg sm:rounded-xl transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Period Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground">Select Period</h3>
            
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <input
                type="checkbox"
                id="customRange"
                checked={useCustomRange}
                onChange={(e) => setUseCustomRange(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="customRange" className="text-xs sm:text-sm text-foreground">Use custom date range</label>
            </div>

            {useCustomRange ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">From Date</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="input-premium w-full px-3 py-2 sm:py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">To Date</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="input-premium w-full px-3 py-2 sm:py-2.5 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'day' | 'month' | 'year')}
                    className="input-premium w-full px-3 py-2 sm:py-2.5 text-sm"
                  >
                    <option value="day">Daily</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input-premium w-full px-3 py-2 sm:py-2.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Category Filter</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-premium w-full px-3 py-2 sm:py-2.5 text-sm"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-secondary/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-2">Preview</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground">Period:</span>
                <p className="font-medium text-foreground">{getPeriodDescription()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>
                <p className="font-medium text-foreground">{selectedCategory}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Expenses:</span>
                <p className="font-medium text-foreground">{filteredExpenses.length} transactions</p>
              </div>
              <div>
                <span className="text-muted-foreground">Incomes:</span>
                <p className="font-medium text-foreground">{filteredIncomes.length} transactions</p>
              </div>
            </div>
          </div>

          {/* Email Options */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-rose-200/30 dark:border-rose-800/30">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Report Options
            </h4>
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeBills"
                  checked={includeBillAttachments}
                  onChange={(e) => setIncludeBillAttachments(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="includeBills" className="text-xs sm:text-sm text-foreground">
                  Include bill attachments (PDF/Images)
                </label>
              </div>
              
              <button
                onClick={() => setShowExpenseSelection(!showExpenseSelection)}
                className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:underline"
              >
                {showExpenseSelection ? 'Hide Selection' : 'Select specific expenses'}
              </button>
              
              {showExpenseSelection && (
                <div className="mt-3 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 rounded-lg p-2 border border-border">
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        if (selectedExpenseIds.length === filteredExpenses.length) {
                          setSelectedExpenseIds([])
                        } else {
                          setSelectedExpenseIds(filteredExpenses.map(e => e.id))
                        }
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2"
                    >
                      {selectedExpenseIds.length === filteredExpenses.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {filteredExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center gap-2 p-1.5 hover:bg-secondary/50 rounded">
                        <input
                          type="checkbox"
                          id={`expense-${expense.id}`}
                          checked={selectedExpenseIds.includes(expense.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExpenseIds([...selectedExpenseIds, expense.id])
                            } else {
                              setSelectedExpenseIds(selectedExpenseIds.filter(id => id !== expense.id))
                            }
                          }}
                          className="rounded border-border"
                        />
                        <label htmlFor={`expense-${expense.id}`} className="text-xs flex-1 cursor-pointer">
                          <span className="font-medium">{expense.title}</span>
                          <span className="text-muted-foreground ml-2">₹{expense.amount}</span>
                          {expense.receiptUrl && <span className="ml-2">[Receipt]</span>}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Premium Features Info */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-200/30 dark:border-amber-800/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Premium Features</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  • Professional PDF reports with INR currency formatting<br />
                  • Premium email templates with bill attachments<br />
                  • Advanced analytics and financial health scoring<br />
                  • Watermarked documents for authenticity
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Export Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={handleExportExpenses}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[0.98]"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Expenses
              </button>

              <button
                onClick={handleExportIncomes}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[0.98]"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Incomes
              </button>

              <button
                onClick={handleExportPremiumPDF}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse"></div>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707v11a2 2 0 01-2 2z" />
                </svg>
                <span className="relative z-10">Premium PDF</span>
                <span className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[8px] px-1 py-0.5 rounded-bl font-bold">PRO</span>
              </button>

              <button
                onClick={handleExportDetailedReport}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[0.98]"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV Report
              </button>

              <button
                onClick={handleEmailReport}
                disabled={loading}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-[0.98] disabled:opacity-50 md:col-span-2"
              >
                {loading ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                Email Premium Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ReportsModal)
