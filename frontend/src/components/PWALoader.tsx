'use client'

import { useEffect, useState } from 'react'

export default function PWALoader() {
  const [isLoading, setIsLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    // Minimum loading time to prevent flash
    const minLoadTime = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Hide loader after animation
    const hideLoader = setTimeout(() => {
      setShowLoader(false)
    }, 1500)

    // Check if DOM is ready
    const checkReady = () => {
      if (document.readyState === 'complete') {
        clearTimeout(minLoadTime)
        setTimeout(() => setIsLoading(false), 300)
      }
    }

    document.addEventListener('readystatechange', checkReady)
    checkReady()

    return () => {
      clearTimeout(minLoadTime)
      clearTimeout(hideLoader)
      document.removeEventListener('readystatechange', checkReady)
    }
  }, [])

  if (!showLoader) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-background flex items-center justify-center transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="text-center">
        {/* App Logo */}
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
          <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-2xl font-bold text-white mb-2">Expense Tracker</h1>
        <p className="text-white/80 text-sm mb-8">Smart Finance Manager</p>

        {/* Loading Animation */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}