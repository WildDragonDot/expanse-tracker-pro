'use client'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import { useTheme } from '@/contexts/ThemeContext'
import { HeaderSkeleton, ChatMessageSkeleton, Skeleton } from '@/components/Skeleton'
import { useExpenses } from '@/hooks/useExpenses'
import { useIncomes } from '@/hooks/useIncomes'
import { useData } from '@/contexts/DataContext'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

function ChatContent() {
  const { expenses, loading: expensesLoading } = useExpenses()
  const { incomes, loading: incomesLoading } = useIncomes()
  const { financialSummary } = useData()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { theme, toggleTheme, isTransitioning } = useTheme()

  // Show loading state while data is being fetched
  if (expensesLoading || incomesLoading) {
    return (
      <>
        <div className="h-screen bg-premium-mesh overflow-hidden pt-16 pb-20 md:pt-0 md:pb-8 md:pl-64 lg:pl-72 flex flex-col">
          {/* Header Skeleton */}
          <HeaderSkeleton />

          {/* Chat Content Skeleton */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-background to-secondary/20">
            {/* Chat Messages Area Skeleton */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 pb-safe">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Welcome Card Skeleton */}
                <div className="glass-premium rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/20 shadow-premium">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 mx-auto flex items-center justify-center animate-pulse">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-500/30"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 sm:h-7 w-48 sm:w-56 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg mx-auto animate-pulse"></div>
                      <div className="h-4 w-64 sm:w-80 bg-muted/40 rounded mx-auto animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Skeleton */}
                <div className="space-y-4">
                  {/* AI Message */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex-shrink-0 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="glass rounded-2xl p-4 border border-border/20 max-w-[85%]">
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted/40 rounded animate-pulse"></div>
                          <div className="h-4 w-4/5 bg-muted/30 rounded animate-pulse"></div>
                          <div className="h-4 w-3/5 bg-muted/20 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex gap-3 items-start justify-end">
                    <div className="flex-1 flex justify-end">
                      <div className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-2xl p-4 border border-violet-500/20 max-w-[85%]">
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-violet-500/30 rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-violet-500/20 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 flex-shrink-0 animate-pulse"></div>
                  </div>

                  {/* AI Message */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex-shrink-0 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="glass rounded-2xl p-4 border border-border/20 max-w-[85%]">
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted/40 rounded animate-pulse"></div>
                          <div className="h-4 w-5/6 bg-muted/30 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="border-t border-border/50 bg-background/98 backdrop-blur-xl p-3 sm:p-4 pb-safe shadow-lg">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2 sm:gap-3 items-end">
                  <div className="flex-1 h-12 sm:h-14 bg-secondary/50 rounded-xl sm:rounded-2xl border border-border/30 animate-pulse"></div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500/30 to-purple-600/30 rounded-xl sm:rounded-2xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </>
    )
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input, id: Date.now() }
    setMessages([...messages, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    try {
      // Use intelligent chat API with real data
      const response = await api.intelligentChatQuery(currentInput)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response, 
        id: Date.now() + 1,
        source: response.source 
      }])
    } catch (error) {
      console.error('Chat error:', error)
      // Fallback to local response
      const fallbackResponse = generateFallbackResponse(currentInput.toLowerCase())
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fallbackResponse, 
        id: Date.now() + 1,
        source: 'fallback'
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateFallbackResponse = (query: string) => {
    // Use real data from hooks and context
    const totalExpense = financialSummary?.totalExpenses || expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = financialSummary?.totalIncome || incomes.reduce((sum, i) => sum + i.amount, 0)
    const savings = financialSummary?.savings || (totalIncome - totalExpense)
    const smartScore = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

    if (query.includes('spend') || query.includes('spent')) {
      if (query.includes('month')) {
        return `You've spent ₹${totalExpense.toLocaleString()} this month across ${expenses.length} transactions. Your average daily spending is ₹${Math.round(totalExpense / new Date().getDate()).toLocaleString()}.`
      }
      if (query.includes('food')) {
        const foodExpenses = expenses.filter(e => e.category === 'Food')
        const foodTotal = foodExpenses.reduce((sum, e) => sum + e.amount, 0)
        return `You've spent ₹${foodTotal.toLocaleString()} on Food this month from ${foodExpenses.length} transactions.`
      }
      return `Your total spending is ₹${totalExpense.toLocaleString()} from ${expenses.length} transactions.`
    }

    if (query.includes('category') || query.includes('categories')) {
      const categoryData = expenses.reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount
        return acc
      }, {})
      const topCategories = Object.entries(categoryData)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
      const breakdown = topCategories
        .map(([cat, amt]: [string, any]) => `${cat}: ₹${amt.toLocaleString()}`)
        .join('\n')
      return `Here's your top spending categories:\n\n${breakdown}`
    }

    if (query.includes('score') || query.includes('smart')) {
      return `Your Smart Spending Score is ${smartScore}%. ${
        smartScore >= 70 ? 'Excellent! You\'re managing your finances very well.' :
        smartScore >= 40 ? 'Good progress, but there\'s room for improvement.' :
        'Consider reducing expenses and increasing your savings rate.'
      }`
    }

    if (query.includes('saving') || query.includes('save')) {
      const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0
      return `You've ${savings >= 0 ? 'saved' : 'overspent by'} ₹${Math.abs(savings).toLocaleString()} this month. Your savings rate is ${savingsRate}%. ${
        savingsRate >= 20 ? 'Keep up the excellent work!' : 
        savingsRate >= 10 ? 'Good job, try to save a bit more.' : 
        'Consider reducing expenses to improve your savings.'
      }`
    }

    if (query.includes('income')) {
      return `Your total income this month is ₹${totalIncome.toLocaleString()} from ${incomes.length} sources.`
    }

    return "I can help you analyze your real financial data! Try asking: 'How much did I spend this month?', 'What's my savings rate?', 'Show my spending by category', or 'Give me financial advice'."
  }

  const quickQuestions = [
    'How much did I spend this month?',
    'Show my spending by category',
    "What's my savings rate?",
    'Give me financial advice based on my data',
    'What are my top expense categories?',
    'How can I improve my spending habits?'
  ]

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden pt-16 pb-20 md:pt-6 md:pb-6 md:pl-64 lg:pl-72 flex flex-col">
      {/* Desktop Header Banner */}
      <div className="hidden md:block max-w-4xl mx-auto px-4 md:px-6 lg:px-8 mb-4 w-full flex-shrink-0">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
          <div className="relative z-10 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                AI Copilot
              </span>
              <span className="text-xs text-white/80">
                Context-aware financial advisor
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight">Smart Financial Assistant</h1>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10 w-full min-h-0">
        <div className="glass-premium rounded-2xl border border-border/20 shadow-premium h-full flex flex-col overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto min-h-0">
              {messages.length === 0 ? (
                <div className="text-center py-6 md:py-8 animate-slide-in">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 animate-pulse shadow-premium">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-foreground mb-2 md:mb-3">Hi! I'm your AI assistant</p>
                  <p className="text-xs md:text-sm text-muted-foreground mb-6 md:mb-8 max-w-md mx-auto px-4">Ask me anything about your spending and finances. I'm here to help you make smarter financial decisions.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 max-w-4xl mx-auto">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); setTimeout(handleSend, 100) }}
                        className="glass-premium rounded-xl md:rounded-2xl p-3 md:p-4 text-left hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-0.5 group border border-border/20"
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{q}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                    >
                      <div className={`max-w-[85%] md:max-w-[70%] px-3 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl shadow-premium ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white' 
                          : 'glass-premium text-foreground border border-border/20'
                      }`}>
                        {msg.role === 'assistant' && msg.source && (
                          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                            {msg.source === 'openai' ? (
                              <>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>AI-Powered Response</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Smart Analysis</span>
                              </>
                            )}
                          </div>
                        )}
                        <p className="text-xs md:text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-2 md:gap-3 justify-start animate-slide-in">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 rounded-xl md:rounded-2xl p-3 md:p-4 max-w-[80%] animate-shimmer bg-size-200">
                        <div className="flex items-center gap-1 mb-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary/60 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-1.5 md:h-2 bg-muted/40 rounded animate-pulse"></div>
                          <div className="w-3/4 h-1.5 md:h-2 bg-muted/40 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-3 md:p-6 border-t border-border/20 glass-premium backdrop-blur-sm">
            <div className="flex space-x-2 md:space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about your finances..."
                className="flex-1 px-3 md:px-4 py-2 md:py-3 text-[16px] md:text-base bg-background/50 border border-border rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-300 placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-premium hover:shadow-premium-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 rounded-xl md:rounded-2xl"
              >
                {isTyping ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export default function Chat() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  )
}
