'use client'

import { Skeleton } from './Skeleton'

export default function AuthLoader() {
  return (
    <div className="fixed inset-0 bg-premium-mesh z-40">
      <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
        {/* Header Skeleton */}
        <header className="md:block hidden relative overflow-hidden animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40" />
          <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div>
                    <Skeleton className="w-48 h-8 mb-2" />
                    <Skeleton className="w-64 h-4" />
                  </div>
                </div>
              </div>
              <Skeleton className="w-12 h-12 rounded-2xl" />
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-24 h-5 mb-1" />
              <Skeleton className="w-40 h-3" />
            </div>
            <Skeleton className="w-9 h-9 rounded-xl" />
          </div>
        </div>

        {/* Content Skeleton */}
        <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-premium rounded-2xl p-4 border border-border/20">
                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                <Skeleton className="w-20 h-6 mb-1" />
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>

          {/* Main Content Cards */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-premium rounded-2xl p-6 border border-border/20 animate-pulse">
                <Skeleton className="w-32 h-6 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1">
                        <Skeleton className="w-32 h-4 mb-2" />
                        <Skeleton className="w-48 h-3" />
                      </div>
                      <Skeleton className="w-5 h-5 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Premium Bottom Navigation Skeleton - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="bg-background/98 backdrop-blur-xl border-t border-border/10 shadow-2xl">
            <div className="flex items-center justify-around px-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 py-2 animate-pulse">
                  <Skeleton className="w-6 h-6 rounded-lg" />
                  <Skeleton className="w-12 h-2.5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
