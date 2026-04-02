'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'rectangular' | 'text'
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({ 
  className, 
  variant = 'default',
  animation = 'pulse',
  ...props 
}: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  // Use CSS variables for theme-aware colors that don't flash
  const baseClasses = "skeleton-base"
  
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none", 
    text: "rounded-sm h-4"
  }
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-size-200",
    none: ""
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      {...props}
    />
  )
}

// Card Skeleton Component
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-4 border border-border/20 animate-pulse", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-8 h-8 rounded-xl" variant="circular" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-16 h-4" />
      </div>
    </div>
  )
}

// Quick Action Card Skeleton
export function QuickActionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 min-h-[140px] sm:min-h-[160px] bg-gradient-to-br from-muted/20 to-muted/40 border border-border/20 animate-pulse", className)}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl" variant="circular" />
          <Skeleton className="w-6 h-6 sm:w-8 sm:h-8 rounded-full" variant="circular" />
        </div>
        
        <div className="flex-1">
          <Skeleton className="w-24 sm:w-32 h-5 sm:h-6 mb-1 sm:mb-2" />
          <Skeleton className="w-20 sm:w-28 h-3 sm:h-4" />
        </div>
        
        <div className="mt-2 sm:mt-4 flex items-center">
          <Skeleton className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-2" variant="circular" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
    </div>
  )
}

// List Item Skeleton
export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("px-4 py-3 border-b border-border/10 animate-pulse", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Skeleton className="w-32 h-4 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-16 h-3 rounded-full" />
                <Skeleton className="w-1 h-1 rounded-full" variant="circular" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="text-right">
                <Skeleton className="w-16 h-4 mb-1" />
                <Skeleton className="w-12 h-3" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Header Skeleton
export function HeaderSkeleton() {
  return (
    <>
      {/* Desktop Header */}
      <header className="md:block hidden relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" variant="circular" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="w-16 h-5 rounded-full" />
                    <Skeleton className="w-1 h-1 rounded-full" variant="circular" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                  <Skeleton className="w-48 h-8" />
                </div>
              </div>
              <Skeleton className="w-64 h-4" />
            </div>
            <Skeleton className="w-12 h-12 rounded-2xl" variant="circular" />
          </div>
        </div>
      </header>

      {/* Mobile Header - Fixed and Always Visible */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20" />
            <div>
              <Skeleton className="w-32 h-4 mb-1 bg-foreground/10" />
              <Skeleton className="w-24 h-3 bg-foreground/5" />
            </div>
          </div>
          <Skeleton className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20" />
        </div>
      </div>
    </>
  )
}

// Balance Card Skeleton
export function BalanceCardSkeleton() {
  return (
    <section className="glass rounded-3xl border border-border shadow-premium p-6 md:p-8 animate-pulse">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-4">
          <Skeleton className="w-32 h-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-80 h-4" />
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" variant="circular" />
              <Skeleton className="w-32 h-3" />
            </div>
          </div>
        </div>
        <div className="text-center lg:text-right">
          <div className="space-y-2">
            <Skeleton className="w-40 h-12" />
            <div className="flex items-center justify-center lg:justify-end gap-2">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-4 h-4" variant="circular" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Chat Message Skeleton - Premium
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-pulse`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" variant="circular" />
        </div>
      )}
      <div className={`max-w-[85%] sm:max-w-[75%] ${
        isUser 
          ? 'glass-premium border border-blue-500/20' 
          : 'glass-premium border border-border/20'
      } rounded-2xl p-3 sm:p-4 shadow-md`}>
        <div className="space-y-2">
          <Skeleton className="w-full h-3.5 sm:h-4 rounded" />
          <Skeleton className="w-4/5 h-3.5 sm:h-4 rounded" />
          <Skeleton className="w-3/5 h-3.5 sm:h-4 rounded" />
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0">
          <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" variant="circular" />
        </div>
      )}
    </div>
  )
}

// Filter Skeleton
export function FilterSkeleton() {
  return (
    <div className="glass-premium rounded-2xl p-4 border border-border/20 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-xl" variant="circular" />
          <Skeleton className="w-12 h-4" />
        </div>
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-full h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
// Modal Skeleton Component
export function ModalSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]", className)}>
      <div className="glass rounded-2xl shadow-premium-lg p-6 w-full max-w-md border border-border animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
            <div>
              <Skeleton className="w-32 h-5 mb-2" />
              <Skeleton className="w-24 h-3" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 rounded-xl" />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-18 h-4" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="flex-1 h-10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Table Skeleton Component
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass rounded-2xl border border-border shadow-premium overflow-hidden animate-pulse">
      <div className="p-4 border-b border-border">
        <Skeleton className="w-32 h-6" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={`h-4 ${j === 0 ? 'w-8' : j === 1 ? 'flex-1' : 'w-20'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Form Skeleton Component
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="flex-1 h-10 rounded-lg" />
      </div>
    </div>
  )
}

// Mobile Dashboard Skeleton
export function MobileDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Skeleton */}
      <div className="glass-premium border-b border-border/20 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
            <div>
              <Skeleton className="w-24 h-4 mb-1" />
              <Skeleton className="w-32 h-6" />
            </div>
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
        </div>
        <Skeleton className="w-full h-3" />
      </div>

      {/* Balance Card Skeleton */}
      <div className="p-4">
        <div className="glass-premium rounded-2xl p-5 border border-border/20 animate-pulse">
          <Skeleton className="w-20 h-4 mb-3" />
          <Skeleton className="w-40 h-8 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-16 h-4 rounded-full" />
            <Skeleton className="w-4 h-4" variant="circular" />
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="px-4 pb-4">
        <Skeleton className="w-32 h-5 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-premium rounded-xl p-4 border border-border/20 animate-pulse">
              <Skeleton className="w-10 h-10 rounded-xl mb-3" variant="circular" />
              <Skeleton className="w-20 h-4 mb-1" />
              <Skeleton className="w-16 h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-40 h-5" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-premium rounded-xl p-3 border border-border/20 animate-pulse">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
                <div className="flex-1">
                  <Skeleton className="w-32 h-4 mb-1" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <Skeleton className="w-16 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mobile Expense List Skeleton
export function MobileExpenseListSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="glass-premium border-b border-border/20 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-10 rounded-xl" />
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="p-4 flex gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-8 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Expense List */}
      <div className="px-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-premium rounded-xl p-4 border border-border/20 animate-pulse">
            <div className="flex items-start gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" variant="circular" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-20 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-16 h-3 rounded-full" />
                  <Skeleton className="w-1 h-1 rounded-full" variant="circular" />
                  <Skeleton className="w-20 h-3" />
                </div>
                <Skeleton className="w-full h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mobile Analytics Skeleton
export function MobileAnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="glass-premium border-b border-border/20 p-4 animate-pulse">
        <Skeleton className="w-32 h-6 mb-4" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-10 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-premium rounded-xl p-4 border border-border/20 animate-pulse">
            <Skeleton className="w-16 h-4 mb-2" />
            <Skeleton className="w-24 h-7 mb-1" />
            <Skeleton className="w-20 h-3" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="px-4 pb-4">
        <div className="glass-premium rounded-2xl p-4 border border-border/20 animate-pulse">
          <Skeleton className="w-32 h-5 mb-4" />
          <Skeleton className="w-full h-48 rounded-xl" />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-4">
        <Skeleton className="w-40 h-5 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-premium rounded-xl p-3 border border-border/20 animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-lg" variant="circular" />
                  <Skeleton className="w-24 h-4" />
                </div>
                <Skeleton className="w-16 h-5" />
              </div>
              <Skeleton className="w-full h-2 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Settings Page Skeleton - Premium
export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
      {/* Desktop Header */}
      <header className="md:block hidden relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="text-white space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
                <div>
                  <Skeleton className="w-32 h-6 mb-2 bg-white/20" />
                  <Skeleton className="w-48 h-4 bg-white/15" />
                </div>
              </div>
            </div>
            <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
          </div>
        </div>
      </header>

      {/* Mobile Header - Fixed and Always Visible */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20" />
            <div>
              <Skeleton className="w-24 h-4 mb-1 bg-foreground/10" />
              <Skeleton className="w-40 h-3 bg-foreground/5" />
            </div>
          </div>
          <Skeleton className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-8 pb-safe relative z-10 space-y-6 animate-slide-in">
        {/* User Card */}
        <div className="glass-premium rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border/20 shadow-premium animate-pulse">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl" variant="circular" />
            <div className="flex-1">
              <Skeleton className="w-32 h-6 mb-2" />
              <Skeleton className="w-48 h-4 mb-1" />
              <Skeleton className="w-40 h-3" />
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        {Array.from({ length: 4 }).map((_, sectionIdx) => (
          <div key={sectionIdx} className="space-y-3">
            <Skeleton className="w-32 h-5 ml-1" />
            <div className="glass-premium rounded-2xl sm:rounded-3xl border border-border/20 shadow-premium overflow-hidden">
              {Array.from({ length: sectionIdx === 0 ? 3 : sectionIdx === 1 ? 4 : sectionIdx === 2 ? 3 : 2 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`p-4 sm:p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors animate-pulse ${
                    i > 0 ? 'border-t border-border/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl" variant="circular" />
                    <div className="flex-1">
                      <Skeleton className="w-32 h-5 mb-2" />
                      <Skeleton className="w-48 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-5 h-5 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <div className="glass-premium rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-red-500/20 bg-red-500/5 shadow-premium animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-500/20" variant="circular" />
              <div>
                <Skeleton className="w-24 h-5 mb-2 bg-red-500/20" />
                <Skeleton className="w-40 h-3 bg-red-500/15" />
              </div>
            </div>
            <Skeleton className="w-5 h-5 rounded bg-red-500/20" />
          </div>
        </div>
      </main>
    </div>
  )
}

// Mobile Settings Skeleton (Legacy - kept for compatibility)
export function MobileSettingsSkeleton() {
  return <SettingsSkeleton />
}

// Mobile Profile Skeleton
export function MobileProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Avatar */}
      <div className="glass-premium border-b border-border/20 p-6 animate-pulse">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="w-24 h-24 rounded-3xl mb-4" variant="circular" />
          <Skeleton className="w-40 h-6 mb-2" />
          <Skeleton className="w-48 h-4 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="w-24 h-9 rounded-xl" />
            <Skeleton className="w-24 h-9 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-premium rounded-xl p-3 border border-border/20 text-center animate-pulse">
            <Skeleton className="w-16 h-6 mx-auto mb-1" />
            <Skeleton className="w-12 h-3 mx-auto" />
          </div>
        ))}
      </div>

      {/* Info Cards */}
      <div className="px-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-premium rounded-xl p-4 border border-border/20 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
                <div>
                  <Skeleton className="w-20 h-4 mb-1" />
                  <Skeleton className="w-32 h-5" />
                </div>
              </div>
              <Skeleton className="w-6 h-6" variant="circular" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// Monthly Budget Page Skeleton
export function MonthlyBudgetSkeleton() {
  return (
    <div className="min-h-screen bg-premium-mesh pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72">
      {/* Desktop Header */}
      <header className="md:block hidden relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-600 to-red-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="text-white space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-2xl bg-white/20" />
                <div>
                  <Skeleton className="w-40 h-7 mb-2 bg-white/20" />
                  <Skeleton className="w-56 h-4 bg-white/15" />
                </div>
              </div>
            </div>
            <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
          </div>
        </div>
      </header>

      {/* Mobile Header - Fixed and Always Visible */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-background/98 backdrop-blur-xl border-b border-border/5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 to-rose-500/30 rounded-lg"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <Skeleton className="w-4 h-4 bg-white/40" />
              </div>
            </div>
            <div>
              <Skeleton className="w-32 h-4 mb-1 bg-foreground/10" />
              <Skeleton className="w-24 h-3 bg-foreground/5" />
            </div>
          </div>
          <Skeleton className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/20" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 mt-16 md:-mt-12 pb-safe relative z-10 space-y-4 md:space-y-6">
        {/* Month/Year Selector */}
        <div className="glass-premium rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/20 shadow-premium animate-pulse">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex gap-3">
              <Skeleton className="flex-1 h-12 rounded-xl" />
              <Skeleton className="w-24 h-12 rounded-xl" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="flex-1 sm:w-24 h-12 rounded-xl" />
              <Skeleton className="flex-1 sm:w-20 h-12 rounded-xl" />
              <Skeleton className="flex-1 sm:w-20 h-12 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-premium rounded-2xl p-4 sm:p-5 border border-border/20 shadow-premium animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" variant="circular" />
              </div>
              <Skeleton className="w-20 h-3 mb-1" />
              <Skeleton className="w-32 h-7" />
            </div>
          ))}
        </div>

        {/* Budget List */}
        <div className="glass-premium rounded-2xl sm:rounded-3xl border border-border/20 shadow-premium overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border/10 animate-pulse">
            <div className="flex items-center justify-between">
              <Skeleton className="w-40 h-6" />
              <Skeleton className="w-32 h-10 rounded-xl" />
            </div>
          </div>
          <div className="divide-y divide-border/10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 sm:p-5 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" variant="circular" />
                    <div>
                      <Skeleton className="w-32 h-5 mb-1" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="w-24 h-5 mb-1" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Skeleton className="w-16 h-3" />
                    <Skeleton className="w-12 h-3" />
                  </div>
                  <Skeleton className="w-full h-2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
