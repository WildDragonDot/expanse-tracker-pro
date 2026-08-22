'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileModal from '@/components/ProfileModal'
import NotificationSettingsModal from '@/components/NotificationSettingsModal'
import SecurityModal from '@/components/SecurityModal'
import DataExportModal from '@/components/DataExportModal'
import ClearDataModal from '@/components/ClearDataModal'
import HapticsModal from '@/components/HapticsModal'
import BillingCycleModal from '@/components/BillingCycleModal'
import CurrencyModal from '@/components/CurrencyModal'
import CategoriesModal from '@/components/CategoriesModal'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

type SettingsModal =
  | 'profile'
  | 'notifications'
  | 'security'
  | 'billing'
  | 'currency'
  | 'categories'
  | 'data'
  | 'danger'
  | 'haptics'
  | 'about'
  | 'support'
  | null

type SettingsItem = {
  id: Exclude<SettingsModal, null>
  title: string
  description: string
  icon: string
  iconClassName: string
  badge?: string
}

const sections: Array<{ title: string; items: SettingsItem[] }> = [
  {
    title: 'Account',
    items: [
      {
        id: 'profile',
        title: 'Profile',
        description: 'Manage your personal information',
        icon: '👤',
        iconClassName: 'bg-blue-500/12 text-blue-600 dark:bg-blue-500/18 dark:text-blue-300',
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Configure alerts and reminders',
        icon: '🔔',
        iconClassName: 'bg-amber-500/12 text-amber-600 dark:bg-amber-500/18 dark:text-amber-300',
      },
      {
        id: 'security',
        title: 'Security',
        description: 'Password and authentication',
        icon: '🔐',
        iconClassName: 'bg-violet-500/12 text-violet-600 dark:bg-violet-500/18 dark:text-violet-300',
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        id: 'billing',
        title: 'Billing Cycle',
        description: 'Set your monthly cycle start day',
        icon: '📅',
        iconClassName: 'bg-red-500/12 text-red-600 dark:bg-red-500/18 dark:text-red-300',
      },
      {
        id: 'currency',
        title: 'Currency',
        description: 'Change default currency',
        icon: '💰',
        iconClassName: 'bg-yellow-500/12 text-yellow-700 dark:bg-yellow-500/18 dark:text-yellow-300',
      },
      {
        id: 'categories',
        title: 'Categories',
        description: 'Customize expense categories',
        icon: '📊',
        iconClassName: 'bg-indigo-500/12 text-indigo-600 dark:bg-indigo-500/18 dark:text-indigo-300',
      },
    ],
  },
  {
    title: 'App Settings',
    items: [
      {
        id: 'haptics',
        title: 'Haptic Feedback',
        description: 'Vibration feedback on mobile',
        icon: '📳',
        iconClassName: 'bg-fuchsia-500/12 text-fuchsia-600 dark:bg-fuchsia-500/18 dark:text-fuchsia-300',
      },
      {
        id: 'data',
        title: 'Data Export',
        description: 'Export your financial data',
        icon: '🗄️',
        iconClassName: 'bg-slate-500/12 text-slate-700 dark:bg-slate-500/18 dark:text-slate-300',
      },
      {
        id: 'danger',
        title: 'Clear Data',
        description: 'Reset all app data',
        icon: '🗑️',
        iconClassName: 'bg-rose-500/12 text-rose-600 dark:bg-rose-500/18 dark:text-rose-300',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        id: 'support',
        title: 'Help & Support',
        description: 'Get help and contact us',
        icon: '❓',
        iconClassName: 'bg-red-500/12 text-red-500 dark:bg-red-500/18 dark:text-red-300',
      },
      {
        id: 'about',
        title: 'About',
        description: 'App version and information',
        icon: 'ℹ️',
        iconClassName: 'bg-sky-500/12 text-sky-600 dark:bg-sky-500/18 dark:text-sky-300',
      },
    ],
  },
]

function SettingsRow({
  item,
  onOpen,
}: {
  item: SettingsItem
  onOpen: (id: SettingsModal) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="group flex w-full items-center gap-3 rounded-[1.25rem] px-3 py-3 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04] sm:px-4"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm ${item.iconClassName}`}>
        {item.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-semibold text-foreground">{item.title}</p>
          {item.badge ? (
            <span className="rounded-lg bg-amber-500/14 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
              {item.badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
      </div>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/55 text-muted-foreground transition-transform group-hover:translate-x-0.5">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

function InfoModal({
  title,
  description,
  body,
  isOpen,
  onClose,
}: {
  title: string
  description: string
  body: string[]
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-muted-foreground"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-3 px-5 py-5">
          {body.map((line) => (
            <p key={line} className="text-sm leading-6 text-muted-foreground">
              {line}
            </p>
          ))}
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsContent() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const [activeModal, setActiveModal] = useState<SettingsModal>(null)

  const initials = (user?.name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const accountState = useMemo(() => {
    const filledFields = [user?.name, user?.email, user?.phone, user?.bio].filter(Boolean).length
    if (filledFields >= 4) return 'Complete'
    if (filledFields >= 2) return 'Active'
    return 'New'
  }, [user])

  const openSetting = (id: SettingsModal) => {
    if (id === 'support') {
      setActiveModal('support')
      return
    }

    if (id === 'about') {
      setActiveModal('about')
      return
    }

    setActiveModal(id)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 pb-24 md:pt-6 md:pb-12 md:pl-64 lg:pl-72">
      <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-5 sm:py-5">
        <div className="rounded-[2rem] border border-black/5 bg-white/72 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50 dark:shadow-[0_24px_80px_rgba(2,6,23,0.42)]">
          <div className="rounded-[1.7rem] border border-black/5 bg-white/78 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/8 dark:bg-slate-950/45">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-[2rem] font-black tracking-tight text-foreground sm:text-[2.2rem]">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">Account & Preferences</p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                disabled={isTransitioning}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-[1.03] disabled:opacity-60"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-[1.7rem] border border-violet-200/60 bg-gradient-to-r from-violet-100/85 via-purple-100/78 to-indigo-100/75 p-3 shadow-[0_10px_30px_rgba(168,85,247,0.12)] dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.45)]">
            <div className="flex items-center gap-3">
              {user?.profileImage ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/70 dark:ring-white/10">
                  <img src={user.profileImage} alt={user.name || 'Profile'} className="h-full w-full object-cover" />
                  <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                </div>
              ) : (
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-bold text-white shadow-lg">
                  {initials}
                  <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-bold text-foreground dark:text-white">{user?.name || 'FinanceTracker User'}</p>
                <p className="truncate text-sm text-muted-foreground dark:text-slate-300">{user?.email || 'No email added yet'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/14 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {accountState}
                  </span>
                  <span className="rounded-full bg-violet-500/14 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                    Secure
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {sections.map((section) => (
              <section key={section.title}>
                <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.14em] text-foreground/80 dark:text-white/80">
                  {section.title}
                </p>

                <div className="overflow-hidden rounded-[1.7rem] border border-black/5 bg-white/82 shadow-[0_16px_35px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-950/52">
                  <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                    {section.items.map((item) => (
                      <SettingsRow key={item.id} item={item} onOpen={openSetting} />
                    ))}
                  </div>
                </div>
              </section>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-[1.55rem] bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 px-4 py-4 text-left text-white shadow-[0_18px_40px_rgba(244,63,94,0.28)] transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold">Sign Out</p>
                  <p className="text-sm text-white/80">End your current session</p>
                </div>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <ProfileModal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} />
      <NotificationSettingsModal isOpen={activeModal === 'notifications'} onClose={() => setActiveModal(null)} />
      <SecurityModal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} />
      <BillingCycleModal isOpen={activeModal === 'billing'} onClose={() => setActiveModal(null)} />
      <CurrencyModal isOpen={activeModal === 'currency'} onClose={() => setActiveModal(null)} />
      <CategoriesModal isOpen={activeModal === 'categories'} onClose={() => setActiveModal(null)} />
      <DataExportModal isOpen={activeModal === 'data'} onClose={() => setActiveModal(null)} />
      <ClearDataModal isOpen={activeModal === 'danger'} onClose={() => setActiveModal(null)} />
      <HapticsModal isOpen={activeModal === 'haptics'} onClose={() => setActiveModal(null)} />

      <InfoModal
        title="Help & Support"
        description="Need help with your account or app usage?"
        body={[
          'You can use this section for contact details, FAQs, or issue reporting without changing the rest of the settings flow.',
          'If you want, we can next connect this row to a real support page, WhatsApp link, email action, or ticket form.',
        ]}
        isOpen={activeModal === 'support'}
        onClose={() => setActiveModal(null)}
      />

      <InfoModal
        title="About FinanceTracker"
        description="App version and quick product information"
        body={[
          'FinanceTracker is organized to feel like a mobile app first, with quick access to profile, budgeting preferences, data tools, and device settings.',
          'If you want this closer to your original design, we can also add a version badge, changelog row, and developer credits here.',
        ]}
        isOpen={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
      />

      <BottomNav />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
