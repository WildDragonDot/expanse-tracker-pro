'use client'

import { useState } from 'react'

interface Shortcut {
  keys: string[]
  description: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'N'], description: 'New Expense' },
  { keys: ['Ctrl', 'I'], description: 'New Income' },
  { keys: ['Ctrl', 'K'], description: 'Search' },
  { keys: ['Esc'], description: 'Close Modal' },
  { keys: ['Ctrl', 'S'], description: 'Save' },
  { keys: ['Ctrl', 'R'], description: 'Refresh' },
]

export default function KeyboardShortcutsHint() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button - Hidden on Mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all items-center justify-center"
        title="Keyboard Shortcuts"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-premium rounded-2xl p-6 max-w-md w-full border border-border/30 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, i) => (
                      <kbd
                        key={i}
                        className="px-2 py-1 text-xs font-semibold bg-background border border-border/50 rounded shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">?</kbd> to toggle this menu
            </p>
          </div>
        </div>
      )}
    </>
  )
}
