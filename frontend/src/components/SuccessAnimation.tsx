'use client'

import { useEffect, useState } from 'react'

interface SuccessAnimationProps {
  message?: string
  onComplete?: () => void
  duration?: number
}

export default function SuccessAnimation({
  message = 'Success!',
  onComplete,
  duration = 2000
}: SuccessAnimationProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div className="animate-scale-in">
        <div className="relative">
          {/* Confetti effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  background: `hsl(${i * 30}, 70%, 60%)`,
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${i * 30}deg) translateY(-100px)`,
                }}
              />
            ))}
          </div>

          {/* Success checkmark */}
          <div className="relative glass-premium rounded-3xl p-8 border border-border/30 shadow-2xl">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl animate-bounce-in">
                <svg className="w-12 h-12 text-white animate-check-draw" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-bold text-foreground text-center">{message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
