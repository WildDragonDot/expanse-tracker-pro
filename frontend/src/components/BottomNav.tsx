'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { haptics } from '@/lib/haptics'

function BottomNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isActive = (path: string) => pathname === path

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Bottom navigation items (excluding Home and Settings)
  const bottomNavItems = [
    {
      path: '/expenses',
      label: 'Expenses',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      path: '/expense-planning',
      label: 'Planning',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: '/shopping',
      label: 'Shopping',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: '/chat',
      label: 'Chat',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
  ]

  // All navigation items for desktop sidebar
  const allNavItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    ...bottomNavItems,
    {
      path: '/subscriptions',
      label: 'Subscriptions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      path: '/udhar',
      label: 'Udhar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile Top Navigation - Minimal Premium */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 pt-safe">
        <div className="flex items-center justify-between px-4 py-3 bg-background/98 backdrop-blur-xl border-b border-border/10 shadow-lg">
          {/* Home Button */}
          <Link
            href="/dashboard"
            onClick={() => haptics.tabSwitch()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isActive('/dashboard')
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white mobile-premium-button scale-105'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:scale-105'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>

          {/* App Title */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">FinanceTracker</span>
          </div>

          {/* Settings Button */}
          <Link
            href="/settings"
            onClick={() => haptics.tabSwitch()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isActive('/settings')
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white mobile-premium-button scale-105'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:scale-105'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile Premium Bottom Navigation - Minimal */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="bg-background/98 backdrop-blur-xl border-t border-border/10 shadow-2xl">
          <div className="flex items-center justify-around px-3 py-2">
            {bottomNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => haptics.tabSwitch()}
                className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive(item.path) 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white mobile-premium-button scale-110' 
                    : 'group-hover:bg-secondary/30 group-hover:scale-105'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    {item.path === '/expenses' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    )}
                    {item.path === '/expense-planning' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    )}
                    {item.path === '/shopping' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    )}
                    {item.path === '/analytics' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    )}
                    {item.path === '/chat' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    )}
                  </svg>
                </div>
                <span className={`text-xs mt-1 font-semibold transition-all duration-200 ${
                  isActive(item.path) ? 'text-violet-600 dark:text-violet-400' : ''
                }`}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Ultra Premium Desktop Sidebar */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 lg:w-72 z-40">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-800/98 to-slate-900/95 dark:from-slate-950/98 dark:via-slate-900/99 dark:to-slate-950/98 backdrop-blur-2xl border-r border-slate-700/30 dark:border-slate-600/20 shadow-2xl"></div>
        
        {/* Luxury accent gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent via-50% to-indigo-600/5"></div>
        
        {/* Premium mesh pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0-20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative flex flex-col h-full">
          {/* Premium Logo Section */}
          <div className="p-6 lg:p-7 border-b border-slate-700/30 dark:border-slate-600/20">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-11 h-11 lg:w-12 lg:h-12 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/30 group-hover:shadow-3xl group-hover:shadow-violet-500/40 transition-all duration-300 group-hover:scale-105 border border-violet-400/20">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base lg:text-lg font-bold text-slate-100 dark:text-white group-hover:text-white transition-colors">ExpenseTracker</h1>
                <p className="text-xs text-slate-400 dark:text-slate-400 group-hover:text-slate-300 transition-colors">Financial Dashboard</p>
              </div>
            </div>
          </div>

          {/* Premium Navigation */}
          <div className="flex-1 p-4 lg:p-5">
            <div className="space-y-2">
              {allNavItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-2xl shadow-violet-500/30 border border-violet-400/20'
                      : 'text-slate-300 dark:text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/80 hover:via-slate-600/80 hover:to-slate-700/80 hover:shadow-xl hover:shadow-slate-900/20 hover:border hover:border-slate-500/30 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Premium glow effect for active item */}
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20 blur-xl"></div>
                  )}
                  
                  <div className={`relative z-10 transition-all duration-300 ${
                    isActive(item.path) 
                      ? 'text-white scale-110 drop-shadow-sm' 
                      : 'group-hover:text-violet-400 group-hover:scale-110 group-hover:drop-shadow-sm'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`relative z-10 font-semibold text-sm transition-all duration-300 ${
                    isActive(item.path) 
                      ? 'text-white drop-shadow-sm' 
                      : 'group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Premium active indicator */}
                  {isActive(item.path) && (
                    <div className="ml-auto relative z-10">
                      <div className="w-2 h-2 bg-white/90 rounded-full shadow-sm"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-white/50 rounded-full animate-ping"></div>
                    </div>
                  )}
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-slate-600/10 via-slate-500/10 to-slate-600/10 transition-opacity duration-300 rounded-2xl"></div>
                </Link>
              ))}
            </div>
          </div>

          {/* Premium User Profile with Real Data */}
          <div className="p-4 lg:p-5 border-t border-slate-700/30 dark:border-slate-600/20">
            <div className="group relative">
              <div className="flex items-center space-x-3 p-4 rounded-2xl bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 hover:from-slate-600/60 hover:via-slate-500/60 hover:to-slate-600/60 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 border border-slate-600/30 hover:border-slate-500/50 backdrop-blur-sm">
                <div className="relative">
                  {user?.profileImage ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/30 transition-all duration-300 group-hover:scale-105 border border-violet-400/20">
                      <img 
                        src={user.profileImage} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/30 transition-all duration-300 group-hover:scale-105 border border-violet-400/20">
                      {user ? getUserInitials(user.name) : 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-sm">
                    <div className="w-full h-full bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 dark:text-slate-100 truncate group-hover:text-white transition-colors">
                    {user?.name || 'Guest User'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400 truncate group-hover:text-slate-300 transition-colors">
                    {user?.email || 'guest@example.com'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/20 hover:border hover:border-red-400/30 text-slate-400 hover:text-red-400 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default memo(BottomNav)
