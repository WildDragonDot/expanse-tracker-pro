'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import PublicRoute from '@/components/PublicRoute'

interface AnimatedCounterProps {
  end: string | number
  duration?: number
  suffix?: string
  prefix?: string
}

const AnimatedCounter = ({ end, duration = 1500, suffix = '', prefix = '' }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const counterRef = useRef<HTMLSpanElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2, rootMargin: '50px' }
    )

    if (counterRef.current) {
      observer.observe(counterRef.current)
    }

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number | null = null
    const endValue = parseInt(String(end).replace(/[^\d]/g, ''))

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentCount = Math.floor(easeOutCubic * endValue)

      setCount(currentCount)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return (
    <span ref={counterRef}>
      {prefix}{count}{suffix}
    </span>
  )
}

function HomeContent() {
  const { theme, toggleTheme, isTransitioning } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-premium-mesh text-foreground relative overflow-hidden flex flex-col justify-between selection:bg-violet-500 selection:text-white">
      {/* Background Glowing Aurora Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-16 sm:-left-20 w-72 h-72 sm:w-80 md:w-[500px] sm:h-80 md:h-[500px] bg-gradient-to-br from-emerald-500/30 to-teal-600/20 rounded-full blur-[80px] sm:blur-[120px] animate-float" />
        <div
          className="absolute bottom-1/3 -right-20 sm:-right-24 w-80 h-80 sm:w-96 md:w-[580px] sm:h-96 md:h-[580px] bg-gradient-to-br from-violet-500/30 to-purple-600/25 rounded-full blur-[90px] sm:blur-[140px] animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-[60%] sm:top-[65%] left-1/4 sm:left-1/3 w-64 h-64 sm:w-72 md:w-[480px] sm:h-72 md:h-[480px] bg-gradient-to-br from-cyan-500/25 to-blue-500/20 rounded-full blur-[80px] sm:blur-[130px] animate-float"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* STICKY NAVBAR */}
      <header className="relative z-30 w-full border-b border-white/15 dark:border-white/10 backdrop-blur-2xl bg-background/70 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight text-foreground">
              Finance<span className="text-violet-600 dark:text-violet-400">Tracker</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Impact</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={toggleTheme}
                disabled={isTransitioning}
                className="p-2 rounded-xl border border-white/15 dark:border-white/10 bg-card/60 text-foreground hover:bg-card transition-all"
                aria-label="Toggle theme"
              >
                <div className="relative w-4 h-4">
                  <svg
                    className={`absolute inset-0 w-4 h-4 text-foreground transition-all duration-300 ${
                      theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <svg
                    className={`absolute inset-0 w-4 h-4 text-foreground transition-all duration-300 ${
                      theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </button>
            )}

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground hover:bg-card/70 rounded-xl transition-all"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 hover:scale-105 transition-all"
            >
              <span>Get Started</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 md:pt-20 pb-16 flex-1 flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300 text-xs font-semibold shadow-sm mb-6 animate-slide-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Next-Gen AI Financial Tracking • Live</span>
        </div>

        {/* Heading */}
        <div className="text-center max-w-3xl sm:max-w-4xl space-y-4 mb-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
            Master Your Money, <br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
              Shape Your Financial Future
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Automate transaction tracking, organize shopping lists, detect recurring subscriptions, and manage event budgets with intelligent AI guidance.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md sm:max-w-none mb-12">
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Start Free Trial</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="glass hover:bg-white/15 dark:hover:bg-white/10 w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base font-semibold text-foreground border border-white/15 hover:border-white/25 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95"
          >
            <span>Sign In to Dashboard</span>
          </Link>
        </div>

        {/* INTERACTIVE PRODUCT PREVIEW CARD */}
        <div className="glass w-full max-w-5xl relative rounded-3xl border border-white/15 shadow-2xl p-4 sm:p-6 mb-16 overflow-hidden">
          {/* Top Mockup Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-[11px] font-mono text-muted-foreground bg-black/20 dark:bg-black/30 px-3.5 py-1 rounded-full border border-white/10">
              financetracker.app/dashboard
            </div>
            <div className="w-10" />
          </div>

          {/* Mini Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance Card */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(139,92,246,0.35)] border border-white/20 space-y-2">
              <div className="flex items-center justify-between text-white/80 text-xs font-semibold">
                <span>Net Total Balance</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">+14.2%</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black">₹1,24,500</p>
              <div className="flex items-center justify-between text-xs text-white/80 pt-2 border-t border-white/15">
                <span>Income: ₹1,80,000</span>
                <span>Spent: ₹55,500</span>
              </div>
            </div>

            {/* Monthly Budget Card */}
            <div className="glass rounded-2xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Monthly Budget</span>
                <span className="text-emerald-500 font-bold">58% Used</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">₹35,000 <span className="text-xs text-muted-foreground font-normal">/ ₹60,000</span></p>
              <div className="w-full bg-black/20 dark:bg-black/30 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full w-[58%]" />
              </div>
              <p className="text-[11px] text-muted-foreground">₹25,000 remaining this month</p>
            </div>

            {/* AI Copilot Insight Card */}
            <div className="glass rounded-2xl p-4 border border-white/15 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-500 dark:text-violet-400">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                <span>AI Smart Advisory</span>
              </div>
              <p className="text-xs text-foreground font-medium leading-relaxed">
                "You saved <strong className="text-emerald-500 font-bold">₹8,400</strong> on food delivery this week compared to last month. Keep it up!"
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px]">
                <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">Smart Score: 88%</span>
              </div>
            </div>
          </div>
        </div>

        {/* IMPACT & STATS SECTION */}
        <section id="stats" className="w-full max-w-6xl py-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              {
                value: '10K+',
                rawValue: '10000',
                label: 'Active Savers',
                icon: '👥',
                gradient: 'from-violet-600 to-indigo-600',
              },
              {
                value: '₹50M+',
                rawValue: '50',
                label: 'Transactions Tracked',
                icon: '💰',
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                value: '98%',
                rawValue: '98',
                label: 'AI Categorization',
                icon: '🎯',
                gradient: 'from-cyan-500 to-blue-600',
              },
              {
                value: '99.9%',
                rawValue: '99.9',
                label: 'Cloud Reliability',
                icon: '⚡',
                gradient: 'from-amber-500 to-orange-600',
              },
            ].map((item, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/10 text-center space-y-1 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                  {i === 0 && <><AnimatedCounter end={item.rawValue} />K+</>}
                  {i === 1 && <>₹<AnimatedCounter end={item.rawValue} />M+</>}
                  {i === 2 && <><AnimatedCounter end={item.rawValue} />%</>}
                  {i === 3 && <><AnimatedCounter end={item.rawValue} />%</>}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="w-full max-w-6xl pt-16 pb-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              How FinanceTracker Works
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Get full clarity over your finances in 3 effortless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Log & Categorize',
                desc: 'Add daily expenses and income in seconds with smart auto-tagging and payment method selection.',
                gradient: 'from-violet-500 to-indigo-600',
              },
              {
                step: '02',
                title: 'Plan & Budget',
                desc: 'Set category budgets, create shopping checklists, and plan event costs with estimated vs actual tracking.',
                gradient: 'from-emerald-500 to-teal-600',
              },
              {
                step: '03',
                title: 'Grow & Optimize',
                desc: 'Get AI-driven spending patterns, subscription reminders, and automated financial health scoring.',
                gradient: 'from-cyan-500 to-blue-600',
              },
            ].map((step, i) => (
              <div key={i} className="glass rounded-2xl p-6 border border-white/10 relative space-y-3">
                <span className={`text-3xl font-black bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                  {step.step}
                </span>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES MATRIX */}
        <section id="features" className="w-full max-w-6xl pt-16 pb-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Complete Financial Superpowers
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Every tool and utility built to take your money management to the next level.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Intelligent Budgeting',
                desc: 'Set monthly category budgets with live usage meters and budget copy tools.',
                iconBg: 'bg-emerald-500/10 text-emerald-500',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
              },
              {
                title: 'Smart Shopping Lists',
                desc: 'Group grocery and household items with estimated costs and strike-off checklists.',
                iconBg: 'bg-violet-500/10 text-violet-500',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
              },
              {
                title: 'Event & Trip Planner',
                desc: 'Plan weddings, vacations, and festivals with dedicated sub-budgets and expense logs.',
                iconBg: 'bg-indigo-500/10 text-indigo-500',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                ),
              },
              {
                title: 'Udhar & IOU Tracker',
                desc: 'Track money lent and borrowed with friends and settle balances seamlessly.',
                iconBg: 'bg-amber-500/10 text-amber-500',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
              },
              {
                title: 'Subscription Auto-Detect',
                desc: 'Identify recurring bills like Netflix, Spotify, and gym renewals with alerts.',
                iconBg: 'bg-rose-500/10 text-rose-500',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ),
              },
              {
                title: 'AI Conversational Assistant',
                desc: 'Ask your personal financial coach anything and get actionable savings advice.',
                iconBg: 'bg-cyan-500/10 text-cyan-500',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                ),
              },
            ].map((f, i) => (
              <div key={i} className="glass rounded-2xl p-6 border border-white/10 hover:border-violet-500/40 transition-all space-y-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.iconBg}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="w-full max-w-6xl pt-16 pb-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
              Loved by Smart Savers
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              See what our community has to say about FinanceTracker.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Rahul Sharma',
                role: 'Software Engineer',
                comment: 'The subscription auto-detection saved me ₹3,500 in unwanted auto-renewals in the first month alone!',
                avatar: '👨‍💻',
              },
              {
                name: 'Priya Patel',
                role: 'Product Designer',
                comment: 'The shopping and event planning features made our vacation budgeting completely stress-free.',
                avatar: '👩‍🎨',
              },
              {
                name: 'Amit Verma',
                role: 'Freelancer',
                comment: 'The AI financial coach feels like having a private CA giving me custom monthly savings tips.',
                avatar: '🚀',
              },
            ].map((t, i) => (
              <div key={i} className="glass rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                  ★★★★★
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed">
                  "{t.comment}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">{t.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <div className="w-full max-w-5xl mt-16 rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-2xl space-y-6 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Take Control of Your Financial Future?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Join thousands of users who track smarter, spend wiser, and grow their savings with AI.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-indigo-700 font-bold text-sm sm:text-base shadow-xl hover:bg-white/95 hover:scale-105 transition-all"
              >
                <span>Create Free Account</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* FULL MULTI-COLUMN FOOTER */}
      <footer className="relative z-10 mt-16 sm:mt-24 border-t border-white/10 dark:border-white/5 bg-card/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Top Brand & Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 sm:gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xl font-black tracking-tight text-foreground">
                  Finance<span className="text-violet-600 dark:text-violet-400">Tracker</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                AI-powered financial intelligence and expense management designed to give you clarity and complete control over your money.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-violet-500/50 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-violet-500/50 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-violet-500/50 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/expenses" className="hover:text-foreground transition-colors">Expense Tracking</Link></li>
                <li><Link href="/monthly-budget" className="hover:text-foreground transition-colors">Monthly Budgets</Link></li>
                <li><Link href="/shopping" className="hover:text-foreground transition-colors">Shopping Lists</Link></li>
                <li><Link href="/analytics" className="hover:text-foreground transition-colors">Analytics & Insights</Link></li>
              </ul>
            </div>

            {/* Features Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Management</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/expense-planning" className="hover:text-foreground transition-colors">Event Planning</Link></li>
                <li><Link href="/subscriptions" className="hover:text-foreground transition-colors">Subscriptions</Link></li>
                <li><Link href="/udhar" className="hover:text-foreground transition-colors">Udhar Tracker</Link></li>
                <li><Link href="/chat" className="hover:text-foreground transition-colors">AI Assistant</Link></li>
                <li><Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link></li>
              </ul>
            </div>

            {/* Account & Security */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-foreground transition-colors">Create Account</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>© 2026 FinanceTracker. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Crafted with</span>
              <svg className="w-3.5 h-3.5 text-rose-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <PublicRoute redirectIfAuthenticated={false}>
      <HomeContent />
    </PublicRoute>
  )
}