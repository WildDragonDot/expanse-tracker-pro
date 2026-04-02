'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import PublicRoute from '@/components/PublicRoute'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend email')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-premium-mesh relative overflow-hidden flex items-center justify-center px-3 py-4 sm:p-6 pb-safe">
      {/* Enhanced Background Orbs with better mobile positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-16 sm:-left-20 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-500/30 to-indigo-600/20 rounded-full blur-[60px] sm:blur-[90px] animate-float"></div>
        <div 
          className="absolute bottom-1/4 -right-20 sm:-right-24 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-500/25 to-violet-500/20 rounded-full blur-[80px] sm:blur-[110px] animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div 
          className="absolute top-[65%] sm:top-[70%] left-1/4 sm:left-1/3 w-40 h-40 sm:w-64 sm:h-64 bg-gradient-to-br from-teal-500/20 to-cyan-500/15 rounded-full blur-[70px] sm:blur-[120px] animate-float"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      {/* Enhanced Back to Login Link */}
      <Link 
        href="/login"
        className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-300"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-xs sm:text-sm font-medium">Login</span>
      </Link>

      {/* Enhanced Theme Toggle - Top Right */}
      <button
        onClick={toggleTheme}
        disabled={isTransitioning}
        aria-label="Toggle theme"
        className={`fixed top-3 right-3 sm:top-6 sm:right-6 z-30 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-300 ${
          isTransitioning ? 'animate-theme-toggle' : ''
        } disabled:opacity-50`}
      >
        <div className="relative w-4 h-4 sm:w-5 sm:h-5">
          <svg
            className={`absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 text-foreground transition-all duration-300 ${
              theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <svg
            className={`absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 text-foreground transition-all duration-300 ${
              theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
      </button>

      {/* Premium Forgot Password Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto px-1 sm:px-0">
        <div className="glass-premium rounded-2xl sm:rounded-3xl shadow-premium-lg p-5 sm:p-6 md:p-8 border border-white/20 dark:border-white/10 backdrop-blur-xl max-h-[92vh] overflow-y-auto mobile-safe-bottom">
          {!isSubmitted ? (
            <>
              {/* Premium Header */}
              <div className="text-center mb-5 sm:mb-6 md:mb-8 animate-slide-in">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-premium-lg ring-2 ring-white/20 dark:ring-white/10">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">FinanceTracker</span>
                    <div className="text-xs text-muted-foreground font-medium">Premium</div>
                  </div>
                </div>
                
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                  Forgot Password?
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              {/* Premium Error Message */}
              {error && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/60 dark:border-red-800/60 rounded-xl sm:rounded-2xl text-red-700 dark:text-red-300 text-sm sm:text-base animate-slide-in backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="leading-relaxed font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Premium Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <label className="block text-sm sm:text-base font-semibold text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none z-10">
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-premium w-full min-h-[52px] sm:min-h-[56px] text-[16px] sm:text-lg !pl-[2.5rem] sm:!pl-[3rem] pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium"
                      placeholder="your@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send password reset instructions to this email address.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group px-6 py-3.5 sm:py-4 text-base sm:text-lg font-bold min-h-[52px] sm:min-h-[56px] rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ring-2 ring-violet-500/20 hover:ring-violet-500/40 inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Reset Link...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      Send Reset Link
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Premium Back to Login Link */}
              <div className="mt-6 sm:mt-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-900 text-muted-foreground font-medium">Remember your password?</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-base sm:text-lg min-h-[52px] sm:min-h-[56px]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center animate-slide-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-premium animate-pulse">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Check Your Email
                </h1>
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  We've sent password reset instructions to:
                </p>
                <div className="glass rounded-xl p-3 mb-4 border border-border">
                  <p className="font-semibold text-foreground text-base">{email}</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 text-left">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Check your inbox</p>
                      <p className="text-xs text-muted-foreground">Look for an email from FinanceTracker</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-left">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Click the reset link</p>
                      <p className="text-xs text-muted-foreground">Follow the instructions in the email</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-left">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Create new password</p>
                      <p className="text-xs text-muted-foreground">Choose a strong, secure password</p>
                    </div>
                  </div>
                </div>

                {/* Resend Button */}
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-4 px-6 py-3.5 sm:py-4 text-base sm:text-lg font-bold min-h-[52px] sm:min-h-[56px] rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resending...
                    </span>
                  ) : (
                    'Resend Email'
                  )}
                </button>

                {/* Premium Back to Login */}
                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-base sm:text-lg min-h-[52px] sm:min-h-[56px]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  )
}

export default function ForgotPassword() {
  return (
    <PublicRoute>
      <ForgotPasswordContent />
    </PublicRoute>
  )
}