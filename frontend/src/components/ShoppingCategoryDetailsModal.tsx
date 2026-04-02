'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState, useRef, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import { getFileTypeIcon, formatFileSize } from '@/lib/fileDisplay'

interface ShoppingCategoryDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  category: any
  items: any[]
  onDeleteItem: (id: string, name: string) => void
  onEditItem: (item: any) => void
  onMarkBought: (item: any) => void
  onItemClick?: (item: any) => void
  onExport: (format: 'pdf' | 'excel' | 'email') => void
  onAddItem?: () => void
  onUpdateCategory?: (categoryData: any) => void
}

interface UploadedFile {
  url: string
  key: string
  name: string
  type: string
  size: number
}

export default function ShoppingCategoryDetailsModal({
  isOpen,
  onClose,
  category,
  items,
  onDeleteItem,
  onEditItem,
  onMarkBought,
  onItemClick,
  onExport,
  onAddItem,
  onUpdateCategory
}: ShoppingCategoryDetailsModalProps) {
  const { addNotification } = useNotification()
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [viewingAttachments, setViewingAttachments] = useState<any>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([])
  const [viewingImage, setViewingImage] = useState<UploadedFile | null>(null)
  const [expandedFileIndex, setExpandedFileIndex] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync attachments with category data
  useEffect(() => {
    if (category?.billAttachments) {
      setAttachments(Array.isArray(category.billAttachments) ? category.billAttachments : [])
    } else {
      setAttachments([])
    }
  }, [category?.billAttachments, category?.id])

  // Close expanded menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (expandedFileIndex !== null) {
        setExpandedFileIndex(null)
      }
    }
    
    if (expandedFileIndex !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [expandedFileIndex])

  if (!isOpen || !category) return null

  const variance = category.realCost - category.expectedCost
  const progress = category.expectedCost > 0 ? (category.realCost / category.expectedCost) * 100 : 0

  const boughtItems = items.filter(item => item.isBought)
  const pendingItems = items.filter(item => !item.isBought)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    if (attachments.length + previewFiles.length + files.length > 10) {
      addNotification({
        type: 'error',
        title: 'Too Many Files',
        message: 'Maximum 10 files allowed per category',
        duration: 3000
      })
      return
    }

    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setPreviewFiles(prev => [...prev, ...newPreviews])
  }

  const removePreviewFile = (index: number) => {
    setPreviewFiles(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index].preview)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  const removeAttachment = async (index: number) => {
    const fileToRemove = attachments[index]
    
    // Confirm deletion
    if (!confirm(`Delete "${fileToRemove.name}"?`)) {
      return
    }

    try {
      const newAttachments = [...attachments]
      newAttachments.splice(index, 1)
      setAttachments(newAttachments)
      
      if (onUpdateCategory) {
        await onUpdateCategory({ billAttachments: newAttachments })
      }
      
      addNotification({
        type: 'success',
        title: 'File Deleted',
        message: `"${fileToRemove.name}" has been removed`,
        duration: 3000
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete file',
        duration: 4000
      })
    }
  }

  const uploadFiles = async () => {
    if (previewFiles.length === 0) return

    setUploadingFiles(true)
    const token = localStorage.getItem('token')
    const uploadedFiles: UploadedFile[] = []

    try {
      // Upload files one by one
      for (const { file } of previewFiles) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await apiFetch('/api/shopping-items/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const uploadedFile = await response.json()
        uploadedFiles.push(uploadedFile)
      }

      // Update local state immediately for instant UI feedback
      const newAttachments = [...attachments, ...uploadedFiles]
      setAttachments(newAttachments)
      
      // Clear preview files immediately
      setPreviewFiles([])
      
      // Update database in background
      if (onUpdateCategory) {
        await onUpdateCategory({ billAttachments: newAttachments })
      }
      
      addNotification({
        type: 'success',
        title: 'Files Uploaded',
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        duration: 3000
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload files',
        duration: 4000
      })
      // Revert local state on error
      setPreviewFiles([])
    } finally {
      setUploadingFiles(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="glass-premium w-full sm:max-w-3xl rounded-2xl sm:rounded-3xl max-h-[94vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative flex-shrink-0 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-white/10 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-green-600/5"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-lg blur-md opacity-50`}></div>
                  <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
                    <span className="text-lg sm:text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] brightness-150 contrast-125 saturate-150">
                      {category.icon}
                    </span>
                  </div>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">{category.name}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded-full font-medium">{items.length} items</span>
                    {category.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        ● Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onClose} 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 hover:rotate-90 border border-border/50"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              {onAddItem && (
                <button
                  onClick={onAddItem}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 hover:from-blue-500/25 hover:via-indigo-500/25 hover:to-purple-500/25 border border-blue-400/30 dark:border-blue-500/30 backdrop-blur-sm text-blue-600 dark:text-blue-400 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  title="Add Item"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] font-bold">Add Item</span>
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/15 via-green-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:via-green-500/25 hover:to-teal-500/25 border border-emerald-400/30 dark:border-emerald-500/30 backdrop-blur-sm text-emerald-600 dark:text-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  title="Export"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-[10px] font-bold">Export</span>
                </button>
                
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-1.5 w-36 glass-premium rounded-lg border border-border shadow-premium-lg overflow-hidden z-10 animate-scale-in">
                    <button
                      onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-secondary/50 transition-all flex items-center gap-2 group"
                    >
                      <div className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold">PDF</span>
                    </button>
                    <button
                      onClick={() => { onExport('excel'); setShowExportMenu(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-secondary/50 transition-all flex items-center gap-2 group"
                    >
                      <div className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold">Excel</span>
                    </button>
                    <button
                      onClick={() => { onExport('email'); setShowExportMenu(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-secondary/50 transition-all flex items-center gap-2 group"
                    >
                      <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold">Email</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 custom-scrollbar">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="glass-premium rounded-lg p-2 border border-border/20">
              <p className="text-[10px] text-muted-foreground mb-0.5">Expected Cost</p>
              <p className="text-sm sm:text-base font-bold text-blue-600">₹{category.expectedCost.toLocaleString()}</p>
            </div>
            <div className="glass-premium rounded-lg p-2 border border-border/20">
              <p className="text-[10px] text-muted-foreground mb-0.5">Actual Cost</p>
              <p className="text-sm sm:text-base font-bold text-emerald-600">₹{category.realCost.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {category.expectedCost > 0 && (
            <div className="glass-premium rounded-lg p-2.5 border border-border/20">
              <div className="flex justify-between text-[10px] sm:text-xs mb-1.5">
                <span className="text-muted-foreground font-medium">Budget Progress</span>
                <span className="font-bold">{Math.min(progress, 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${category.color} transition-all duration-500`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              {variance !== 0 && (
                <p className={`text-[10px] sm:text-xs mt-1.5 font-medium ${variance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {variance > 0 ? 'Over budget by' : 'Saved'} ₹{Math.abs(variance).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Bill Attachments Upload */}
          <div className="glass-premium rounded-lg p-3 border border-border/20">
            <h3 className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              Category Bills & Receipts
            </h3>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFiles || (attachments.length + previewFiles.length >= 10)}
              className="w-full px-3 py-2 border-2 border-dashed border-border/50 hover:border-pink-500/50 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Bills (Max 10 files)
            </button>

            {/* Preview Files */}
            {previewFiles.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground">Ready to Upload ({previewFiles.length})</p>
                  <button
                    type="button"
                    onClick={uploadFiles}
                    disabled={uploadingFiles}
                    className="text-[10px] px-2 py-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {uploadingFiles ? 'Uploading...' : 'Upload Now'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {previewFiles.map((item, index) => (
                    <div key={index} className="relative group glass-premium rounded-lg p-1.5 border border-border/20">
                      {item.file.type.startsWith('image/') ? (
                        <img src={item.preview} alt={item.file.name} className="w-full h-16 object-cover rounded-lg mb-1" />
                      ) : (
                        <div className="w-full h-16 bg-secondary/50 rounded-lg mb-1 flex items-center justify-center">
                          <span className="text-2xl">{getFileTypeIcon(item.file.type)}</span>
                        </div>
                      )}
                      <p className="text-[9px] font-medium text-foreground truncate">{item.file.name}</p>
                      <button
                        type="button"
                        onClick={() => removePreviewFile(index)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {attachments.length > 0 && (
              <div className="relative">
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">✓ Uploaded ({attachments.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 relative">
                  {attachments.map((file) => (
                    <div
                      key={file.key}
                      className="relative group glass-premium rounded-lg p-1.5 border border-emerald-500/20 bg-emerald-500/5 hover:shadow-md transition-all overflow-visible"
                    >
                      <div 
                        className="block cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setViewingImage(file);
                        }}
                      >
                        {file.type.startsWith('image/') ? (
                          <img src={file.url} alt={file.name} className="w-full h-16 object-cover rounded-lg mb-1" />
                        ) : (
                          <div className="w-full h-16 bg-secondary/50 rounded-lg mb-1 flex items-center justify-center">
                            <span className="text-2xl">{getFileTypeIcon(file.type)}</span>
                          </div>
                        )}
                        <p className="text-[9px] font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-[8px] text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      
                      {/* Premium Eye Button with Expandable Menu */}
                      <div className="absolute top-1 right-1">
                        {/* Main Eye Button */}
                        <button
                          type="button"
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setExpandedFileIndex(expandedFileIndex === file.key ? null : file.key);
                          }}
                          className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg border border-white/30 transition-all hover:scale-110 active:scale-95"
                          title="Actions"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Expanded Action Menu */}
                        {expandedFileIndex === file.key && (
                          <div className="absolute top-8 right-0 glass-premium rounded-lg border border-white/20 shadow-2xl overflow-hidden animate-scale-in z-[102] min-w-[140px]">
                            <button
                              type="button"
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                setViewingImage(file);
                                setExpandedFileIndex(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-500/20 transition-all flex items-center gap-2 text-xs font-medium text-foreground"
                            >
                              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                              View Full Size
                            </button>
                            <a
                              href={file.url}
                              download={file.name}
                              onClick={(e) => { 
                                e.stopPropagation();
                                // Don't close the menu or modal on download
                                setTimeout(() => setExpandedFileIndex(null), 100);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-emerald-500/20 transition-all flex items-center gap-2 text-xs font-medium text-foreground"
                            >
                              <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </div>
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                setExpandedFileIndex(null);
                                const fileIndex = attachments.findIndex(f => f.key === file.key);
                                if (fileIndex !== -1) removeAttachment(fileIndex);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-red-500/20 transition-all flex items-center gap-2 text-xs font-medium text-foreground border-t border-border/20"
                            >
                              <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </div>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Items List */}
          <div>
            {/* Pending Items */}
            {pendingItems.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  To Buy ({pendingItems.length})
                </h3>
                <div className="space-y-1.5">
                  {pendingItems.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => onItemClick?.(item)}
                      className="glass-premium rounded-lg p-2.5 border border-border/20 hover:shadow-md hover:border-blue-500/30 transition-all group cursor-pointer hover:scale-[1.01]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); onMarkBought(item); }}
                            className="mt-0.5 w-5 h-5 border-2 border-border rounded-md flex items-center justify-center hover:border-emerald-500 transition-all duration-200 hover:scale-110 flex-shrink-0"
                          >
                            {item.isBought && (
                              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">{item.name}</h4>
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full font-semibold flex-shrink-0">
                                View Details
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {item.quantity} {item.unit}
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{item.notes}</p>
                            )}
                            {item.billAttachments && item.billAttachments.length > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewingAttachments(item); }}
                                className="mt-1 text-[10px] px-2 py-0.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full font-semibold hover:bg-pink-500/20 transition-all flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {item.billAttachments.length} file(s)
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs sm:text-sm font-bold text-blue-600">₹{item.expectedPrice.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEditItem(item); }}
                              className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all hover:scale-110"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id, item.name); }}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all hover:scale-110"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bought Items */}
            {boughtItems.length > 0 && (
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Bought ({boughtItems.length})
                </h3>
                <div className="space-y-1.5">
                  {boughtItems.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => onItemClick?.(item)}
                      className="glass-premium rounded-lg p-2.5 border border-border/20 bg-secondary/20 opacity-75 group hover:opacity-100 hover:border-emerald-500/30 transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); onMarkBought(item); }}
                            className="mt-0.5 w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center text-white hover:scale-110 transition-all duration-200 flex-shrink-0"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground line-through truncate">{item.name}</h4>
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full font-semibold flex-shrink-0">
                                View Details
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {item.quantity} {item.unit}
                            </p>
                            {item.billAttachments && item.billAttachments.length > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewingAttachments(item); }}
                                className="mt-1 text-[10px] px-2 py-0.5 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full font-semibold hover:bg-pink-500/20 transition-all flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {item.billAttachments.length} file(s)
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs sm:text-sm font-bold text-emerald-600">₹{item.actualPrice?.toLocaleString() || item.expectedPrice.toLocaleString()}</p>
                            {item.actualPrice && item.actualPrice !== item.expectedPrice && (
                              <p className="text-[10px] text-muted-foreground line-through">₹{item.expectedPrice.toLocaleString()}</p>
                            )}
                          </div>
                          <button
                            onClick={() => onDeleteItem(item.id, item.name)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all hover:scale-110 opacity-70 md:opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-xs">No items yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attachments Viewer Modal */}
      {viewingAttachments && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-2 sm:p-4 animate-fade-in" onClick={() => setViewingAttachments(null)}>
          <div className="glass-premium w-full sm:max-w-4xl rounded-2xl sm:rounded-3xl max-h-[94vh] sm:max-h-[88vh] flex flex-col border border-white/10 shadow-2xl animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative flex-shrink-0 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-white/10 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-red-500/10">
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">{viewingAttachments.name}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {viewingAttachments.billAttachments?.length || 0} attachment(s)
                  </p>
                </div>
                <button 
                  onClick={() => setViewingAttachments(null)} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary/50 hover:bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 hover:rotate-90 border border-border/50"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {viewingAttachments.billAttachments?.map((file: any, index: number) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-premium rounded-xl p-3 border border-border/20 hover:shadow-lg transition-all group"
                  >
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-full h-40 object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-full h-40 bg-secondary/50 rounded-lg mb-2 flex flex-col items-center justify-center">
                        <span className="text-5xl mb-2">{getFileTypeIcon(file.type)}</span>
                        <p className="text-xs text-muted-foreground">Click to view</p>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-foreground truncate mb-1">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-pink-600 dark:text-pink-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Viewer */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 hover:rotate-90 border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            {viewingImage.type.startsWith('image/') ? (
              <img 
                src={viewingImage.url} 
                alt={viewingImage.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="glass-premium rounded-2xl p-8 border border-white/10 text-center">
                <span className="text-8xl mb-4 block">{getFileTypeIcon(viewingImage.type)}</span>
                <p className="text-xl font-bold text-white mb-2">{viewingImage.name}</p>
                <p className="text-sm text-white/70 mb-6">{formatFileSize(viewingImage.size)}</p>
                <a
                  href={viewingImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open File
                </a>
              </div>
            )}

            {/* File Info */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 glass-premium rounded-full px-6 py-3 border border-white/10 backdrop-blur-md">
              <p className="text-sm font-semibold text-white text-center">{viewingImage.name}</p>
              <p className="text-xs text-white/70 text-center mt-1">{formatFileSize(viewingImage.size)}</p>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 left-4 flex gap-2">
              <a
                href={viewingImage.url}
                download={viewingImage.name}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 border border-white/20 shadow-lg"
                title="Download"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              <a
                href={viewingImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 border border-white/20 shadow-lg"
                title="Open in New Tab"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                onClick={() => {
                  const fileIndex = attachments.findIndex(f => f.key === viewingImage.key)
                  if (fileIndex !== -1) {
                    setViewingImage(null)
                    removeAttachment(fileIndex)
                  }
                }}
                className="w-10 h-10 bg-red-500 hover:bg-red-600 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110 border border-white/20 shadow-lg"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
