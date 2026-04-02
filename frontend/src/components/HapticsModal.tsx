'use client'

import { useState, useEffect } from 'react'
import { isHapticsSupported, isHapticsEnabled, setHapticsEnabled, haptics } from '@/lib/haptics'
import { useNotification } from '@/contexts/NotificationContext'

interface HapticsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function HapticsModal({ isOpen, onClose }: HapticsModalProps) {
  const [enabled, setEnabled] = useState(true)
  const [supported, setSupported] = useState(true)
  const { addNotification } = useNotification()

  useEffect(() => {
    setSupported(isHapticsSupported())
    setEnabled(isHapticsEnabled())
  }, [isOpen])

  const handleToggle = () => {
    const newValue = !enabled
    setEnabled(newValue)
    setHapticsEnabled(newValue)
    
    // Test haptic feedback
    if (newValue) {
      haptics.save()
    }
    
    addNotification({
      type: 'success',
      title: 'Haptics Updated',
      message: `Haptic feedback ${newValue ? 'enabled' : 'disabled'}`,
      duration: 3000
    })
  }

  const testHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error') => {
    if (!enabled) {
      addNotification({
        type: 'warning',
        title: 'Haptics Disabled',
        message: 'Enable haptics to test feedback',
        duration: 3000
      })
      return
    }
    
    switch (type) {
      case 'light':
        haptics.buttonLight()
        break
      case 'medium':
        haptics.buttonPress()
        break
      case 'heavy':
        haptics.impact()
        break
      case 'success':
        haptics.save()
        break
      case 'error':
        haptics.delete()
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="glass-premium rounded-2xl border border-white/10 shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-xl">📳</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Haptic Feedback</h2>
                <p className="text-xs text-white/70">Vibration settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!supported && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Not Supported</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Haptic feedback is not supported on this device or browser.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm !min-h-[28px]">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Enable Haptics</p>
              <p className="text-xs text-white/60 leading-tight mt-0.5">Vibration feedback for interactions</p>
            </div>
            <button
              onClick={handleToggle}
              disabled={!supported}
              className={`relative w-[52px] min-h-[28px] rounded-full transition-all shadow-lg flex-shrink-0 ${
                enabled ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-white/20'
              } ${!supported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] bg-white rounded-full shadow-lg transition-transform ${
                  enabled ? 'translate-x-[24px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Test Buttons */}
          {supported && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Test Haptic Patterns</p>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => testHaptic('light')}
                  disabled={!enabled}
                  className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 hover:border-blue-500/50 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-blue-400">Light</p>
                  <p className="text-xs text-white/50 mt-0.5">Quick tap</p>
                </button>

                <button
                  onClick={() => testHaptic('medium')}
                  disabled={!enabled}
                  className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 hover:border-purple-500/50 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-purple-400">Medium</p>
                  <p className="text-xs text-white/50 mt-0.5">Button press</p>
                </button>

                <button
                  onClick={() => testHaptic('heavy')}
                  disabled={!enabled}
                  className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 hover:border-indigo-500/50 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-indigo-400">Heavy</p>
                  <p className="text-xs text-white/50 mt-0.5">Impact</p>
                </button>

                <button
                  onClick={() => testHaptic('success')}
                  disabled={!enabled}
                  className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-emerald-400">Success</p>
                  <p className="text-xs text-white/50 mt-0.5">Double tap</p>
                </button>

                <button
                  onClick={() => testHaptic('error')}
                  disabled={!enabled}
                  className="col-span-2 p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-red-400">Error</p>
                  <p className="text-xs text-white/50 mt-0.5">Alert pattern</p>
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
            <div className="flex items-start gap-2.5">
              <span className="text-base">ℹ️</span>
              <div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Haptic feedback provides tactile responses when you interact with the app, making it feel more responsive and native-like on mobile devices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 backdrop-blur-md border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-purple-500 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
