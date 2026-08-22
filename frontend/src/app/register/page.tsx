'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'
import PublicRoute from '@/components/PublicRoute'
import { useTheme } from '@/contexts/ThemeContext'

function RegisterContent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [salary, setSalary] = useState('')
  const [billingCycleStartDay, setBillingCycleStartDay] = useState('1')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { label: '', percent: 0, color: 'bg-border' }
    if (password.length < 6) return { label: 'Too short', percent: 25, color: 'bg-rose-500' }
    let score = 50
    if (password.length >= 8) score += 25
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 25
    if (score <= 50) return { label: 'Fair', percent: 50, color: 'bg-amber-500' }
    if (score <= 75) return { label: 'Good', percent: 75, color: 'bg-cyan-500' }
    return { label: 'Strong', percent: 100, color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    try {
      const salaryValue = salary ? parseInt(salary) : undefined
      const billingDay = billingCycleStartDay ? parseInt(billingCycleStartDay) : 1

      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          salary: salaryValue,
          billingCycleStartDay: billingDay,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      const data = await response.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-premium-mesh text-foreground relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Floating Glow Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 md:w-[480px] md:h-[480px] bg-gradient-to-br from-emerald-500/30 to-teal-600/20 rounded-full blur-[80px] md:blur-[120px] animate-float" />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 md:w-[520px] md:h-[520px] bg-gradient-to-br from-violet-500/25 to-purple-500/20 rounded-full blur-[90px] md:blur-[130px] animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-[65%] left-1/3 w-64 h-64 md:w-[420px] md:h-[420px] bg-gradient-to-br from-cyan-500/20 to-blue-500/15 rounded-full blur-[80px] md:blur-[120px] animate-float"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/60 backdrop-blur-xl border border-white/15 dark:border-white/10 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-card/90 transition-all shadow-sm hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-card/60 backdrop-blur-xl border border-white/15 dark:border-white/10 text-foreground hover:bg-card/90 transition-all shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-lg my-8">
        <div className="glass rounded-3xl border border-white/15 p-6 sm:p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-[0_0_25px_rgba(16,185,129,0.35)] mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Start your automated financial intelligence journey
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2.5 backdrop-blur-md">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/[0.1] transition-all"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/[0.1] transition-all"
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password with Show/Hide & Strength */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/[0.1] transition-all"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                    <span>Password Strength:</span>
                    <span>{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2-Column Row for Salary & Billing Cycle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Salary */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Monthly Salary <span className="font-normal lowercase opacity-70">(opt)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400 font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/[0.1] transition-all"
                    placeholder="50,000"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Billing Cycle Day */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cycle Start Day
                </label>
                <div className="relative">
                  <select
                    value={billingCycleStartDay}
                    onChange={(e) => setBillingCycleStartDay(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-white/[0.1] transition-all cursor-pointer appearance-none"
                    disabled={loading}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day} className="bg-card text-foreground">
                        Day {day} of month
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  return (
    <PublicRoute>
      <RegisterContent />
    </PublicRoute>
  )
}