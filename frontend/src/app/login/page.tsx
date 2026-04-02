'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import PublicRoute from '@/components/PublicRoute'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Only navigate on successful login (no error thrown)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password. Please try again.')
      // Don't navigate on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-premium-mesh relative overflow-hidden flex items-center justify-center px-3 py-4 sm:p-6 pb-safe">
      {/* Enhanced Background Orbs with better mobile positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-16 sm:-left-20 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-violet-500/30 to-purple-600/20 rounded-full blur-[60px] sm:blur-[90px] animate-float"></div>
        <div 
          className="absolute bottom-1/4 -right-20 sm:-right-24 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-emerald-500/25 to-cyan-500/20 rounded-full blur-[80px] sm:blur-[110px] animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div 
          className="absolute top-[65%] sm:top-[70%] left-1/4 sm:left-1/3 w-40 h-40 sm:w-64 sm:h-64 bg-gradient-to-br from-rose-500/20 to-pink-500/15 rounded-full blur-[70px] sm:blur-[120px] animate-float"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      {/* Enhanced Back to Home Link */}
      <Link 
        href="/"
        className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-300"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-xs sm:text-sm font-medium">Home</span>
      </Link>

      {/* Premium Login Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto px-1 sm:px-0">
        <div className="glass-premium rounded-2xl sm:rounded-3xl shadow-premium-lg p-5 sm:p-6 md:p-8 border border-white/20 dark:border-white/10 backdrop-blur-xl max-h-[92vh] overflow-y-auto mobile-safe-bottom">
          {/* Premium Header */}
          <div className="text-center mb-5 sm:mb-6 md:mb-8 animate-slide-in">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-premium-lg ring-2 ring-white/20 dark:ring-white/10">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">FinanceTracker</span>
                <div className="text-xs text-muted-foreground font-medium">Premium</div>
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Continue your premium financial journey
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

          {/* Premium Login Form */}
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
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="block text-sm sm:text-base font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none z-10">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium w-full min-h-[52px] sm:min-h-[56px] text-[16px] sm:text-lg !pl-[2.5rem] sm:!pl-[3rem] pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Premium Forgot Password Link */}
            <div className="text-right">
              <Link 
                href="/forgot-password" 
                className="text-sm sm:text-base text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-all duration-300 hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>

            {/* Premium Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group px-6 py-3.5 sm:py-4 text-base sm:text-lg font-bold min-h-[52px] sm:min-h-[56px] rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ring-2 ring-violet-500/20 hover:ring-violet-500/40 inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Premium Continue without login option */}
          {error?.includes('Database not available') && (
            <div className="mt-5 sm:mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-4 sm:py-5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 text-foreground rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-gray-300 dark:border-gray-600 text-sm sm:text-base min-h-[52px] sm:min-h-[56px] shadow-md"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Continue Offline (Local Mode)
                </span>
              </button>
            </div>
          )}

          {/* Premium Sign Up Link */}
          <div className="mt-6 sm:mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-muted-foreground font-medium">New to FinanceTracker?</span>
              </div>
            </div>
            <div className="mt-4">
              <Link 
                href="/register"
                prefetch={true}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-base sm:text-lg min-h-[52px] sm:min-h-[56px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </Link>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}

export default function Login() {
  return (
    <PublicRoute>
      <LoginContent />
    </PublicRoute>
  )
}