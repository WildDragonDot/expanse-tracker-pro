'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useRef } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { useData } from '@/contexts/DataContext'

interface DataExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DataExportModal({ isOpen, onClose }: DataExportModalProps) {
  const { addNotification } = useNotification()
  const { triggerRefresh } = useData()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleExport = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please login to export data.',
          duration: 4000
        })
        return
      }

      const response = await apiFetch('/api/user/data/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `expense-tracker-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        addNotification({
          type: 'success',
          title: 'Export Complete',
          message: 'Your data has been downloaded successfully.',
          duration: 4000
        })
        onClose()
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
        duration: 4000
      })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      addNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please select a valid JSON file.',
        duration: 4000
      })
      return
    }

    setImporting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please login to import data.',
          duration: 4000
        })
        return
      }

      const fileContent = await file.text()
      const jsonData = JSON.parse(fileContent)

      const response = await apiFetch('/api/user/data/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: jsonData,
          mode: importMode
        })
      })

      if (response.ok) {
        const result = await response.json()
        addNotification({
          type: 'success',
          title: 'Import Complete',
          message: `Successfully imported ${result.results.expenses} expenses, ${result.results.incomes} incomes, and more.`,
          duration: 5000
        })
        triggerRefresh()
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: error.message || 'Failed to import data. Please check the file format.',
        duration: 4000
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="glass w-full sm:max-w-md rounded-xl sm:rounded-2xl border border-border shadow-premium-lg animate-scale-in">
        {/* Header */}
        <div className="glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {activeTab === 'export' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  )}
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Data Management</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Export or import your data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'export'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              Export
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'import'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              Import
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {activeTab === 'export' ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">What will be exported?</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">All your expenses, incomes, categories, settings, and more in JSON format.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-foreground">Expenses</span>
                  </div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-foreground">Incomes</span>
                  </div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-foreground">Categories</span>
                  </div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-foreground">Settings</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Important Notice</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Import will restore data from a previously exported JSON file. Choose merge or replace mode carefully.</p>
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Import Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setImportMode('merge')}
                    className={`p-3 rounded-lg border transition-all ${
                      importMode === 'merge'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1">Merge</div>
                    <div className="text-[10px]">Add to existing data</div>
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-lg border transition-all ${
                      importMode === 'replace'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300'
                        : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1">Replace</div>
                    <div className="text-[10px]">Delete all & restore</div>
                  </button>
                </div>
              </div>

              {/* File Upload Area */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={importing}
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={exporting || importing}
              className="flex-1 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {activeTab === 'export' ? (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Select File
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
