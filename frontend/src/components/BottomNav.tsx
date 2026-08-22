'use client'

import { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { haptics } from '@/lib/haptics'

function BottomNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const [showMoreDrawer, setShowMoreDrawer] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dashboard' && (pathname === '/dashboard' || pathname === '/')) return true
    return pathname === path
  }

  // Close drawer on path change
  useEffect(() => {
    setShowMoreDrawer(false)
  }, [pathname])

  // Get user initials for avatar
  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get current page title for mobile top bar
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard':
      case '/':
        return 'Dashboard'
      case '/expenses':
        return 'Expenses & Income'
      case '/monthly-budget':
        return 'Monthly Budget'
      case '/expense-planning':
        return 'Expense Planning'
      case '/shopping':
      case '/shopping-list':
        return 'Shopping Lists'
      case '/analytics':
        return 'Analytics'
      case '/subscriptions':
        return 'Subscriptions'
      case '/udhar':
        return 'Udhar Tracker'
      case '/chat':
        return 'AI Assistant'
      case '/settings':
        return 'Settings'
      case '/reports':
        return 'Reports'
      default:
        return 'Expense Tracker'
    }
  }

  // Primary navigation items for Mobile Bottom Bar (5 items)
  const mobilePrimaryItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/expenses',
      label: 'Expenses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      path: '/monthly-budget',
      label: 'Budget',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  // All navigation sections for Desktop Sidebar
  const navSections = [
    {
      title: 'Overview',
      items: [
        {
          path: '/dashboard',
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          path: '/expenses',
          label: 'Expenses & Income',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
        },
        {
          path: '/monthly-budget',
          label: 'Monthly Budget',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          path: '/analytics',
          label: 'Analytics & Trends',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Planning & Purchases',
      items: [
        {
          path: '/expense-planning',
          label: 'Event Planning',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          path: '/shopping',
          label: 'Shopping Lists',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          path: '/subscriptions',
          label: 'Subscriptions',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
        },
        {
          path: '/udhar',
          label: 'Udhar & Loans',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Assistant & Account',
      items: [
        {
          path: '/chat',
          label: 'AI Advisor',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          ),
        },
        {
          path: '/settings',
          label: 'Settings',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    },
  ]

  // All items for drawer menu
  const drawerItems = [
    {
      path: '/expense-planning',
      label: 'Event Planning',
      description: 'Budget for festivals, trips & events',
      icon: (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ),
    },
    {
      path: '/shopping',
      label: 'Shopping Lists',
      description: 'Smart lists with estimated & actual prices',
      icon: (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      ),
    },
    {
      path: '/subscriptions',
      label: 'Subscriptions',
      description: 'Manage recurring billing and renewals',
      icon: (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      ),
    },
    {
      path: '/udhar',
      label: 'Udhar & Loans',
      description: 'Track money you owe or are owed',
      icon: (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      ),
    },
    {
      path: '/chat',
      label: 'AI Advisor',
      description: 'Smart insights and budget advice',
      icon: (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
      ),
    },
    {
      path: '/settings',
      label: 'Settings & Profile',
      description: 'Currency, billing cycle, notifications',
      icon: (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 text-white flex items-center justify-center shadow-md">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP NAVIGATION BAR (Fixed top on mobile screens)                 */}
      {/* ========================================================================= */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-border/40 shadow-sm pt-safe">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Brand & Page Indicator */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <Link
              href="/dashboard"
              onClick={() => haptics.tabSwitch()}
              className="flex items-center space-x-2 flex-shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-foreground truncate tracking-tight">
                {getPageTitle(pathname)}
              </h1>
              <p className="text-[10px] text-muted-foreground truncate leading-none">
                FinanceTracker Pro
              </p>
            </div>
          </div>

          {/* Quick Actions (Theme toggle + User Avatar / Drawer Trigger) */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              disabled={isTransitioning}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/60 hover:bg-secondary text-foreground transition-all duration-200 border border-border/40"
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link
              href="/settings"
              onClick={() => haptics.tabSwitch()}
              className="relative w-8 h-8 rounded-lg overflow-hidden border border-border/60 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-sm"
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{getUserInitials(user?.name)}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE BOTTOM FLOATING NAVIGATION DOCK                                  */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe">
        <div className="px-3 pb-2 pt-1">
          <div className="bg-background/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-border/60 dark:border-slate-800/80 rounded-2xl shadow-2xl shadow-black/20 px-2 py-1.5 flex items-center justify-around">
            {mobilePrimaryItems.map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => haptics.tabSwitch()}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 relative ${
                    active
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                        : 'hover:bg-secondary/60'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </Link>
              )
            })}

            {/* More Menu Drawer Trigger */}
            <button
              onClick={() => {
                haptics.impact()
                setShowMoreDrawer(true)
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                showMoreDrawer || (!mobilePrimaryItems.some(i => isActive(i.path)))
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  showMoreDrawer || (!mobilePrimaryItems.some(i => isActive(i.path)))
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                    : 'hover:bg-secondary/60'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">More</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. MOBILE "MORE" SLIDE-UP DRAWER                                          */}
      {/* ========================================================================= */}
      {showMoreDrawer && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setShowMoreDrawer(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          />

          {/* Drawer Sheet */}
          <div className="relative bg-background dark:bg-slate-900 border-t border-border/60 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto pb-safe pt-3 px-4 animate-slide-up">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">More Features</h3>
                <p className="text-xs text-muted-foreground">Quick access to all tools</p>
              </div>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="w-8 h-8 rounded-full bg-secondary/80 text-muted-foreground flex items-center justify-center hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid of tools */}
            <div className="grid grid-cols-1 gap-2.5 mb-6">
              {drawerItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => {
                      haptics.tabSwitch()
                      setShowMoreDrawer(false)
                    }}
                    className={`flex items-center space-x-3.5 p-3 rounded-2xl border transition-all duration-200 ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'
                        : 'bg-card hover:bg-secondary/50 border-border/40'
                    }`}
                  >
                    {item.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{item.label}</span>
                        {active && (
                          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* User Details & Logout */}
            <div className="p-3.5 bg-secondary/40 rounded-2xl border border-border/40 mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center shadow">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{getUserInitials(user?.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMoreDrawer(false)
                  logout()
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ULTRA PREMIUM DESKTOP SIDEBAR (Visible on md: and above)               */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 lg:w-72 flex-col z-30 bg-background/95 dark:bg-slate-950/95 backdrop-blur-2xl border-r border-border/60 shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="p-5 lg:p-6 border-b border-border/40">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black text-foreground tracking-tight">
                Finance<span className="text-violet-600 dark:text-violet-400">Tracker</span>
              </h2>
              <span className="inline-flex items-center text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-md">
                PRO INTELLIGENCE
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
                {section.title}
              </p>
              {section.items.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                      active
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                  >
                    <div
                      className={`transition-transform duration-200 ${
                        active ? 'text-white scale-110' : 'group-hover:scale-110 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* User Card & Controls Footer */}
        <div className="p-3 border-t border-border/40 bg-secondary/20 space-y-2">
          {/* Theme Switcher Quick Toggle */}
          <div className="flex items-center justify-between px-3 py-2 bg-background/80 dark:bg-slate-900/80 rounded-xl border border-border/40">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <button
              onClick={toggleTheme}
              disabled={isTransitioning}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          {/* User Account */}
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-card border border-border/40 shadow-sm">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span>{getUserInitials(user?.name)}</span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email || ''}</p>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(BottomNav)
