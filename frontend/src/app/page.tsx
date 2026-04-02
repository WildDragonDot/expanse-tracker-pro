'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import PublicRoute from '@/components/PublicRoute'

// Optimized Animated Counter Component with better performance
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
    const startValue = 0
    const endValue = parseInt(String(end).replace(/[^\d]/g, ''))

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Use easeOutCubic for smoother animation
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
    <div className="min-h-screen bg-premium-mesh relative overflow-hidden">
      {/* Optimized Mobile Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Optimized floating orbs with will-change for better performance */}
        <div className="absolute top-1/4 -left-10 sm:-left-20 w-48 h-48 sm:w-72 sm:h-72 bg-primary/12 sm:bg-primary/18 rounded-full blur-[50px] sm:blur-[80px] animate-float will-change-transform"></div>
        <div 
          className="absolute bottom-1/4 -right-12 sm:-right-24 w-64 h-64 sm:w-96 sm:h-96 bg-accent/15 sm:bg-accent/22 rounded-full blur-[60px] sm:blur-[90px] animate-float will-change-transform"
          style={{ animationDelay: '2s' }}
        ></div>
        <div 
          className="absolute top-[60%] sm:top-[70%] left-1/4 sm:left-1/3 w-40 h-40 sm:w-64 sm:h-64 bg-success/12 sm:bg-success/18 rounded-full blur-[70px] sm:blur-[100px] animate-float will-change-transform"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      {/* COMPACT MOBILE NAVBAR */}
      <header className="relative z-20 safe-area-top">
        <nav className="flex items-center justify-between p-3 sm:p-6 md:p-8 backdrop-blur-md bg-background/80 border-b border-border/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-premium">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-base sm:text-xl md:text-2xl font-black text-foreground tracking-tight">FinanceTracker</span>
          </div>

          {/* Enhanced Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              disabled={isTransitioning}
              className={`theme-toggle-btn p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-2xl glass border border-border/50 transition-all hover:shadow-premium hover:scale-105 ${
                isTransitioning ? 'animate-theme-toggle' : ''
              } disabled:opacity-50`}
              aria-label="Toggle theme"
            >
              <div className="relative w-4 h-4 sm:w-6 sm:h-6">
                <svg 
                  className={`absolute inset-0 w-4 h-4 sm:w-6 sm:h-6 text-foreground transition-all duration-300 ${
                    theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <svg 
                  className={`absolute inset-0 w-4 h-4 sm:w-6 sm:h-6 text-foreground transition-all duration-300 ${
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
        </nav>
      </header>

      {/* COMPACT MOBILE HERO SECTION */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 pt-4 sm:pt-12 md:pt-16 pb-8 sm:pb-20 md:pb-24 min-h-[calc(100vh-70px)] sm:min-h-[calc(100vh-96px)]">
        
        {/* Optimized Mobile Badge */}
        <div className="inline-flex items-center gap-2 glass px-4 sm:px-6 py-2 sm:py-4 rounded-xl sm:rounded-3xl border border-border/50 shadow-premium animate-slide-in hover:scale-105 transition-transform duration-300 group mb-4 sm:mb-8 will-change-transform">
          <div className="relative">
            <span className="w-2 h-2 sm:w-4 sm:h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse block"></span>
          </div>
          <span className="text-xs sm:text-base font-semibold text-foreground/80 group-hover:text-foreground transition-colors duration-200">AI-Powered Financial Intelligence</span>
          <div className="w-1 h-1 sm:w-2 sm:h-2 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"></div>
        </div>

        {/* Compact Mobile Heading */}
        <div className="text-center max-w-sm sm:max-w-md md:max-w-4xl space-y-4 sm:space-y-8 animate-slide-in flex-1 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.85] text-foreground tracking-tight">
            <span className="block mb-1 sm:mb-3">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Master</span>
              <span className="text-foreground"> Your</span>
            </span>
            <span className="block mb-1 sm:mb-3">
              <span className="text-foreground">Money,</span>
            </span>
            <span className="block">
              <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">Shape Future</span>
            </span>
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto px-1">
            Transform your financial journey with AI-powered insights and smart automation
          </p>
        </div>

        {/* Optimized Mobile CTA Buttons */}
        <div className="w-full max-w-sm sm:max-w-md space-y-3 sm:space-y-5 mt-6 sm:mt-12">
          <Link
            href="/register"
            className="group relative w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center gap-3 hover:from-violet-700 hover:to-indigo-700 transition-colors duration-200 px-6 py-4 sm:py-6 text-base sm:text-xl font-bold min-h-[56px] sm:min-h-[72px] rounded-xl sm:rounded-3xl shadow-premium-lg hover:scale-[1.02] overflow-hidden will-change-transform"
            style={{ transform: 'translateZ(0)' }}
          >
            <span>Start Your Journey</span>
            <svg className="w-5 h-5 sm:w-7 sm:h-7 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <Link
            href="/login"
            className="group relative w-full glass border-2 border-border/50 text-foreground hover:border-violet-500/50 transition-colors duration-200 px-6 py-4 sm:py-6 text-base sm:text-xl font-bold min-h-[56px] sm:min-h-[72px] flex items-center justify-center gap-3 rounded-xl sm:rounded-3xl hover:scale-[1.02] overflow-hidden will-change-transform"
            style={{ transform: 'translateZ(0)' }}
          >
            <span>Sign In</span>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h1" />
            </svg>
          </Link>
        </div>

        {/* Compact Mobile Scroll Indicator */}
        <div className="mt-6 sm:hidden">
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
            <div className="text-xs font-medium tracking-wide">Discover More</div>
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
              <div className="w-1 h-2 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full mt-1 animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Compact Mobile Section Separator */}
      <div className="relative z-10 flex justify-center py-4 sm:py-12">
        <div className="flex items-center gap-3">
          <div className="w-12 sm:w-24 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse"></div>
          <div className="w-12 sm:w-24 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        </div>
      </div>

      {/* Compact Mobile Stats */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-12">
        {/* Compact Mobile Stats Header */}
        <div className="text-center mb-6 sm:mb-14 animate-slide-in">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 sm:mb-6">
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Trusted</span>
            <span className="text-foreground"> by Thousands</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Join our growing community of smart financial managers
          </p>
        </div>

        {/* Compact Mobile Stats Grid */}
        <div className="relative">
          {/* Enhanced Mobile Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-indigo-500/20 rounded-2xl blur-xl animate-pulse"></div>
          
          <div className="relative space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
            {[
              { 
                value: '10K+', 
                rawValue: '10000',
                label: 'Active Users', 
                icon: '👥',
                gradient: 'from-violet-500 to-purple-600',
                bgGradient: 'from-violet-500/10 to-purple-600/10'
              },
              { 
                value: '₹50M+', 
                rawValue: '50',
                label: 'Money Tracked', 
                icon: '💰',
                gradient: 'from-emerald-500 to-cyan-600',
                bgGradient: 'from-emerald-500/10 to-cyan-600/10'
              },
              { 
                value: '99.9%', 
                rawValue: '99.9',
                label: 'Uptime', 
                icon: '⚡',
                gradient: 'from-orange-500 to-red-600',
                bgGradient: 'from-orange-500/10 to-red-600/10'
              },
            ].map((item, i) => (
              <div 
                key={i} 
                className="group relative"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {/* Optimized Stats Card */}
                <div className={`relative glass rounded-2xl p-6 sm:p-10 border border-border/40 hover:border-border/80 dark:border-border/20 dark:hover:border-border/40 transition-colors duration-200 hover:scale-[1.01] animate-slide-in bg-gradient-to-br ${item.bgGradient} backdrop-blur-xl shadow-lg hover:shadow-xl will-change-transform`}>
                  
                  {/* Floating Icon */}
                  <div className="absolute top-4 right-4 text-2xl sm:text-4xl opacity-40 dark:opacity-30 group-hover:opacity-60 transition-opacity duration-200">
                    {item.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="text-center relative z-10">
                    {/* Counter */}
                    <div className="mb-3 sm:mb-6">
                      <div className={`text-3xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent drop-shadow-sm`}>
                        {i === 0 && <><AnimatedCounter end={item.rawValue} />K+</>}
                        {i === 1 && <>₹<AnimatedCounter end={item.rawValue} />M+</>}
                        {i === 2 && <><AnimatedCounter end={item.rawValue} />%</>}
                      </div>
                      
                      {/* Underline */}
                      <div className={`h-1 w-16 bg-gradient-to-r ${item.gradient} mx-auto mt-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                    </div>
                    
                    {/* Label */}
                    <div className="text-base sm:text-xl font-bold text-foreground dark:text-foreground/90 mb-2">
                      {item.label}
                    </div>
                    
                    {/* Simplified Dots */}
                    <div className="flex justify-center gap-1 opacity-60 dark:opacity-50">
                      <div className={`w-1.5 h-1.5 bg-gradient-to-r ${item.gradient} rounded-full`}></div>
                      <div className={`w-1.5 h-1.5 bg-gradient-to-r ${item.gradient} rounded-full`}></div>
                      <div className={`w-1.5 h-1.5 bg-gradient-to-r ${item.gradient} rounded-full`}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compact Mobile Bottom Accent */}
        <div className="text-center mt-6 sm:mt-12">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-xl border border-border/30 text-xs sm:text-base text-muted-foreground animate-fade-in">
            <div className="relative">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <span className="font-medium">Real-time data • Updated every minute</span>
            <div className="relative">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Features Section */}
        <section className="w-full max-w-7xl mx-auto mt-8 sm:mt-20 md:mt-24 lg:mt-32 px-4 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-4">
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Powerful</span>
              <span className="text-foreground"> Features</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Everything you need to take control of your financial future
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Intelligent Analytics",
                desc: "Advanced AI algorithms analyze your spending patterns and provide actionable insights to optimize your financial health.",
                gradient: "from-violet-500 via-purple-600 to-indigo-600",
                bgColor: "bg-violet-50 dark:bg-violet-950/20",
                borderColor: "border-violet-200 dark:border-violet-800/30",
                iconBg: "bg-violet-100 dark:bg-violet-900/30",
                icon: (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                )
              },
              {
                title: "Smart Automation",
                desc: "Effortlessly categorize transactions, detect subscriptions, and track recurring expenses with zero manual input.",
                gradient: "from-emerald-500 via-teal-600 to-cyan-600",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
                borderColor: "border-emerald-200 dark:border-emerald-800/30",
                iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
                icon: (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                )
              },
              {
                title: "Personal AI Coach",
                desc: "Get personalized financial advice, budget recommendations, and investment suggestions tailored to your goals.",
                gradient: "from-rose-500 via-pink-600 to-fuchsia-600",
                bgColor: "bg-rose-50 dark:bg-rose-950/20",
                borderColor: "border-rose-200 dark:border-rose-800/30",
                iconBg: "bg-rose-100 dark:bg-rose-900/30",
                icon: (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                  />
                )
              }
            ].map((feature, i) => (
              <div
                key={i}
                className={`group relative ${feature.bgColor} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 ${feature.borderColor} hover:border-opacity-60 dark:hover:border-opacity-60 transition-colors duration-200 hover:scale-[1.01] hover:shadow-lg animate-slide-in overflow-hidden will-change-transform`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Top Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-t-2xl sm:rounded-t-3xl`}></div>
                
                {/* Icon Container */}
                <div className="relative z-10 mb-6">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 ${feature.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm will-change-transform`}>
                    <svg className={`w-8 h-8 sm:w-10 sm:h-10 ${i === 0 ? 'text-violet-600 dark:text-violet-400' : i === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      {feature.icon}
                    </svg>
                  </div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
                
                {/* Bottom Accent */}
                <div className="absolute bottom-4 right-4 opacity-20">
                  <div className={`w-6 h-6 bg-gradient-to-br ${feature.gradient} rounded-full blur-sm`}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

      {/* PREMIUM FOOTER */}
      <footer className="relative z-10 mt-8 sm:mt-20 md:mt-24 lg:mt-32">
        {/* Premium Glass Background */}
        <div className="glass border-t border-border/30 bg-background/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-8 md:py-12 lg:py-16">
            
            {/* Mobile-First Brand Section */}
            <div className="text-center mb-8 sm:mb-14 md:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-premium">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xl sm:text-3xl font-bold text-foreground">FinanceTracker</span>
              </div>
              <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto px-2">
                AI-powered financial intelligence that transforms how you manage your money.
              </p>
            </div>

            {/* Mobile-Optimized Links Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 md:gap-12 mb-8 sm:mb-14 md:mb-16">
              
              {/* Product Links */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Product</h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li><Link href="/dashboard" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Dashboard</Link></li>
                  <li><Link href="/expenses" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Expenses</Link></li>
                  <li><Link href="/analytics" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Analytics</Link></li>
                  <li><Link href="/reports" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Reports</Link></li>
                </ul>
              </div>

              {/* Company Links */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Company</h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">About</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Careers</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Blog</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Support</a></li>
                </ul>
              </div>

              {/* Resources Links */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Resources</h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Help Center</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">API Docs</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Tutorials</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Community</a></li>
                </ul>
              </div>

              {/* Legal Links */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Legal</h3>
                <ul className="space-y-2 sm:space-y-3">
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Privacy</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Terms</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Cookies</a></li>
                  <li><a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors block py-1">Security</a></li>
                </ul>
              </div>
            </div>

            {/* Premium Social Section */}
            <div className="text-center mb-8 sm:mb-12 md:mb-14">
              <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-4 sm:mb-8">Connect With Us</h3>
              <div className="flex justify-center gap-3 sm:gap-5 md:gap-6">
                <a href="#" className="group w-10 h-10 sm:w-12 sm:h-12 glass border border-border/50 hover:border-violet-500/50 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-premium">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-violet-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="group w-10 h-10 sm:w-12 sm:h-12 glass border border-border/50 hover:border-blue-500/50 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-premium">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="group w-10 h-10 sm:w-12 sm:h-12 glass border border-border/50 hover:border-gray-500/50 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-premium">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-gray-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="group w-10 h-10 sm:w-12 sm:h-12 glass border border-border/50 hover:border-pink-500/50 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-premium">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-pink-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Premium Bottom Section */}
            <div className="pt-6 sm:pt-10 md:pt-12 border-t border-border/30">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    © 2024 FinanceTracker. All rights reserved.
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Made with</span>
                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span>in India</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-end items-center gap-3 sm:gap-6">
                  <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                  <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                  <a href="#" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">Cookie Policy</a>
                </div>
              </div>
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