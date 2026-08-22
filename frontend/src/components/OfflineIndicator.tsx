'use client'

import { useState, useEffect } from 'react'
import { offlineStore } from '@/lib/offlineStore'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [showSyncedToast, setShowSyncedToast] = useState<boolean>(false)

  useEffect(() => {
    setIsOnline(offlineStore.isOnline())
    setPendingCount(offlineStore.getQueuedMutations().length)

    const unsubscribe = offlineStore.subscribe((online) => {
      setIsOnline(online)
      if (online) {
        setIsSyncing(true)
        offlineStore.replayQueuedMutations().finally(() => {
          setIsSyncing(false)
          setPendingCount(offlineStore.getQueuedMutations().length)
          setShowSyncedToast(true)
          setTimeout(() => setShowSyncedToast(false), 3500)
        })
      } else {
        setPendingCount(offlineStore.getQueuedMutations().length)
      }
    })

    const interval = setInterval(() => {
      setPendingCount(offlineStore.getQueuedMutations().length)
    }, 4000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  if (isOnline && !isSyncing && !showSyncedToast && pendingCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-5 z-50 transition-all duration-300 transform translate-y-0 pointer-events-none">
      {!isOnline && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border border-amber-500/40 bg-slate-900/90 text-amber-300 text-xs font-semibold">
          <svg className="w-4 h-4 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M8.5 8.5a7 7 0 019.9 0M5 12a11 11 0 0114 0M12 19h.01" />
          </svg>
          <span>Offline Mode (Cached Data Active)</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">
              {pendingCount} Queued
            </span>
          )}
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border border-cyan-500/40 bg-slate-900/90 text-cyan-300 text-xs font-semibold">
          <svg className="w-4 h-4 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Syncing offline mutations to cloud...</span>
        </div>
      )}

      {isOnline && showSyncedToast && !isSyncing && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border border-emerald-500/40 bg-slate-900/90 text-emerald-300 text-xs font-semibold animate-bounce">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>All data synced & up to date!</span>
        </div>
      )}
    </div>
  )
}
