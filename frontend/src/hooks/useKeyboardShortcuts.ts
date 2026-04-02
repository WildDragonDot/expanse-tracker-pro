import { useEffect } from 'react'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  callback: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(({ key, ctrl, shift, alt, callback }) => {
        const ctrlMatch = ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
        const shiftMatch = shift ? event.shiftKey : !event.shiftKey
        const altMatch = alt ? event.altKey : !event.altKey
        
        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault()
          callback()
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

// Predefined shortcuts
export const SHORTCUTS = {
  NEW_EXPENSE: { key: 'n', ctrl: true, description: 'New Expense' },
  NEW_INCOME: { key: 'i', ctrl: true, description: 'New Income' },
  SEARCH: { key: 'k', ctrl: true, description: 'Search' },
  CLOSE: { key: 'Escape', description: 'Close Modal' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh' },
}
