'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { fuzzyMatch } from '@/lib/advancedFilters'

interface AdvancedSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
  onSuggestionSelect?: (suggestion: string) => void
  className?: string
}

export default function AdvancedSearchBar({
  value,
  onChange,
  placeholder = "Search across title, category, bank, tags, and notes...",
  suggestions = [],
  onSuggestionSelect,
  className = ""
}: AdvancedSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputGroupRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update dropdown position when opening
  const updateDropdownPosition = () => {
    // Use inputGroupRef (the div with border) for accurate positioning
    const element = inputGroupRef.current || containerRef.current
    if (element) {
      const rect = element.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  // Filter suggestions based on fuzzy matching
  useEffect(() => {
    if (value.trim() && suggestions.length > 0) {
      const filtered = suggestions
        .filter(suggestion => fuzzyMatch(suggestion, value))
        .slice(0, 8) // Limit to 8 suggestions
      setFilteredSuggestions(filtered)
      if (filtered.length > 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          updateDropdownPosition()
          setIsOpen(true)
        }, 10)
      } else {
        setIsOpen(false)
      }
    } else {
      setFilteredSuggestions([])
      setIsOpen(false)
    }
    setSelectedIndex(-1)
  }, [value, suggestions])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          const suggestion = filteredSuggestions[selectedIndex]
          onChange(suggestion)
          onSuggestionSelect?.(suggestion)
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    onSuggestionSelect?.(suggestion)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative z-[60] ${className}`}>
      <div ref={inputGroupRef} className="relative group">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear Button */}
        {value && (
          <button
            onClick={() => {
              onChange('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary/50 flex items-center justify-center"
            aria-label="Clear search"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              updateDropdownPosition()
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="input-premium w-full pl-10 pr-8 py-2.5 text-sm font-medium placeholder:text-muted-foreground/70"
          autoComplete="off"
        />
      </div>

      {/* Suggestions Dropdown - Rendered as Portal */}
      {mounted && isOpen && filteredSuggestions.length > 0 && dropdownPosition.width > 0 && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top - 1}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999
          }}
          className="bg-background border border-t-0 border-border/20 rounded-b-xl shadow-premium max-h-64 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
              Suggestions ({filteredSuggestions.length})
            </div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-150 flex items-center gap-2 ${
                  index === selectedIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary/50 text-foreground'
                }`}
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Search Tips */}
      {value && !isOpen && (
        <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-primary">
              Searching across title, category, bank, tags, and notes with fuzzy matching
            </span>
          </div>
        </div>
      )}
    </div>
  )
}