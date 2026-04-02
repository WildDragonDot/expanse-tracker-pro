'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export default function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  delay = 300,
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // Adjust position after a small delay to ensure tooltip is rendered
      setTimeout(() => adjustPosition(), 10)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const adjustPosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return

    const tooltip = tooltipRef.current
    const trigger = triggerRef.current
    const rect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Add more padding for mobile devices
    const padding = window.innerWidth < 768 ? 20 : 10

    let newPosition = position

    // Check if tooltip goes outside viewport and adjust
    // For top position, check if there's enough space above
    if (position === 'top' && rect.top - tooltipRect.height < padding) {
      newPosition = 'bottom'
    } 
    // For bottom position, check if there's enough space below
    else if (position === 'bottom' && rect.bottom + tooltipRect.height > viewport.height - padding) {
      newPosition = 'top'
    } 
    // For left position, check if there's enough space on the left
    else if (position === 'left' && rect.left - tooltipRect.width < padding) {
      newPosition = 'right'
    } 
    // For right position, check if there's enough space on the right
    else if (position === 'right' && rect.right + tooltipRect.width > viewport.width - padding) {
      newPosition = 'left'
    }

    // Double-check the new position also fits
    if (newPosition === 'top' && rect.top - tooltipRect.height < padding) {
      newPosition = 'bottom'
    } else if (newPosition === 'bottom' && rect.bottom + tooltipRect.height > viewport.height - padding) {
      newPosition = 'top'
    }

    setActualPosition(newPosition)
  }

  useEffect(() => {
    if (isVisible) {
      adjustPosition()
      // Re-adjust on window resize
      const handleResize = () => adjustPosition()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isVisible])

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-[99999] px-3 py-2 text-xs font-medium text-white bg-gray-900/98 dark:bg-gray-800/98 rounded-lg shadow-2xl border border-gray-700/80 dark:border-gray-600/80 backdrop-blur-xl'
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-3`
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-3`
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-3`
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-3`
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-3`
    }
  }

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 border border-gray-700 dark:border-gray-600 transform rotate-45'
    
    switch (actualPosition) {
      case 'top':
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0`
      case 'bottom':
        return `${baseArrow} bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0`
      case 'left':
        return `${baseArrow} left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0`
      case 'right':
        return `${baseArrow} right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0`
      default:
        return `${baseArrow} top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0`
    }
  }

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block z-[1] ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getPositionClasses()}
          style={{ 
            animation: 'tooltipFadeIn 0.2s ease-out',
            maxWidth: window.innerWidth < 768 ? 'calc(100vw - 2rem)' : '320px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            pointerEvents: 'none',
            willChange: 'transform, opacity'
          }}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          {content}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  )
}

// Helper component for info icon with tooltip
export function InfoTooltip({ 
  content, 
  position = 'top',
  className = '',
  iconSize = 'w-3 h-3'
}: {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  iconSize?: string
}) {
  return (
    <Tooltip content={content} position={position} className={className}>
      <div className="inline-flex items-center justify-center cursor-help">
        <svg 
          className={`${iconSize} text-muted-foreground hover:text-foreground transition-colors`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
    </Tooltip>
  )
}

// Helper component for lightbulb icon with tooltip
export function TipTooltip({ 
  content, 
  position = 'top',
  className = '',
  iconSize = 'w-3 h-3'
}: {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  iconSize?: string
}) {
  return (
    <Tooltip content={content} position={position} className={className}>
      <div className="inline-flex items-center justify-center cursor-help">
        <svg 
          className={`${iconSize} text-amber-500 hover:text-amber-600 transition-colors`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
          />
        </svg>
      </div>
    </Tooltip>
  )
}