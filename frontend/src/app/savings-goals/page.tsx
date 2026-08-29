'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { apiFetch } from '@/lib/apiFetch'

interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  category: string
  icon: string
  color: string
  isCompleted: boolean
  createdAt: string
}

export default function SavingsGoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    totalTarget: 0,
    totalSaved: 0,
    overallProgress: 0,
  })
  const [loading, setLoading] = useState(true)

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [category, setCategory] = useState('Emergency Fund')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#10B981')

  const icons = ['🎯', '🚗', '🏠', '✈️', '💻', '💍', '🎓', '🛡️', '📱', '🏖️']
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const fetchGoals = async () => {
    try {
      const res = await apiFetch('/api/savings-goals', {
        headers: getHeaders(),
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals || [])
        setStats(data.stats || { totalGoals: 0, completedGoals: 0, totalTarget: 0, totalSaved: 0, overallProgress: 0 })
      }
    } catch (e) {
      console.error('Failed to load savings goals:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !targetAmount) return

    try {
      const res = await apiFetch('/api/savings-goals', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name,
          targetAmount: Number(targetAmount),
          currentAmount: currentAmount ? Number(currentAmount) : 0,
          targetDate: targetDate || null,
          category,
          icon,
          color,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setName('')
        setTargetAmount('')
        setCurrentAmount('')
        setTargetDate('')
        fetchGoals()
      }
    } catch (err) {
      console.error('Error creating goal:', err)
    }
  }

  const handleDeposit = async () => {
    if (!selectedGoal || !depositAmount) return

    try {
      const res = await apiFetch(`/api/savings-goals/${selectedGoal.id}/deposit`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ amount: Number(depositAmount), action: 'deposit' }),
      })

      if (res.ok) {
        setShowDepositModal(false)
        setDepositAmount('')
        setSelectedGoal(null)
        fetchGoals()
      }
    } catch (err) {
      console.error('Error depositing to goal:', err)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return

    try {
      const res = await apiFetch(`/api/savings-goals/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      })
      if (res.ok) {
        fetchGoals()
      }
    } catch (err) {
      console.error('Failed to delete goal:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Savings Goals & Wealth
              </h1>
              <p className="text-xs text-muted-foreground">Track targets, milestone deadlines & wealth building</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <span className="text-base">+</span> New Goal
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="glass-card p-4 rounded-2xl border border-border/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent">
            <p className="text-xs text-muted-foreground font-medium">Total Saved</p>
            <p className="text-xl md:text-2xl font-bold text-emerald-400 mt-1">
              ₹{stats.totalSaved.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Across all goals</p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-border/30">
            <p className="text-xs text-muted-foreground font-medium">Total Target</p>
            <p className="text-xl md:text-2xl font-bold text-foreground mt-1">
              ₹{stats.totalTarget.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Planned aspirations</p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-border/30">
            <p className="text-xs text-muted-foreground font-medium">Overall Progress</p>
            <p className="text-xl md:text-2xl font-bold text-cyan-400 mt-1">
              {stats.overallProgress}%
            </p>
            <div className="w-full bg-secondary/60 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(100, stats.overallProgress)}%` }}
              />
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-border/30">
            <p className="text-xs text-muted-foreground font-medium">Completed</p>
            <p className="text-xl md:text-2xl font-bold text-purple-400 mt-1">
              {stats.completedGoals} / {stats.totalGoals}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Goals achieved 🎉</p>
          </div>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading your goals...</div>
        ) : goals.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border/40 rounded-3xl p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4">
              🎯
            </div>
            <h3 className="text-lg font-bold text-foreground">Set Your First Savings Goal</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Track targets for your emergency fund, dream vacation, gadget or car.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Create Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
              const isAchieved = goal.currentAmount >= goal.targetAmount

              return (
                <div
                  key={goal.id}
                  className="glass-card p-5 rounded-3xl border border-border/30 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 shadow-lg group"
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -z-10 opacity-20 pointer-events-none"
                    style={{ backgroundColor: goal.color || '#10B981' }}
                  />

                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                          style={{ backgroundColor: `${goal.color}20`, border: `1px solid ${goal.color}40` }}
                        >
                          {goal.icon || '🎯'}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                            {goal.name}
                          </h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-medium">
                            {goal.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1.5 transition-all"
                        title="Delete Goal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-muted-foreground">Saved</span>
                        <span className="font-bold text-foreground">
                          ₹{goal.currentAmount.toLocaleString()} <span className="text-muted-foreground font-normal">/ ₹{goal.targetAmount.toLocaleString()}</span>
                        </span>
                      </div>

                      <div className="w-full bg-secondary/80 h-3 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: goal.color || '#10B981',
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                        <span>{progress}% Completed</span>
                        {goal.targetDate && (
                          <span>Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/20 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedGoal(goal)
                        setShowDepositModal(true)
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <span>+</span> Add Funds
                    </button>
                    {isAchieved && (
                      <span className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1">
                        🎉 Done
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-border/40 bg-background shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">Create Savings Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund, New MacBook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Initial Saved (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                  >
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Vehicle">Vehicle / Bike / Car</option>
                    <option value="Travel">Travel & Vacation</option>
                    <option value="Electronics">Gadgets & Tech</option>
                    <option value="Home">Home & Furniture</option>
                    <option value="Wedding">Wedding / Family</option>
                    <option value="General">Other Goal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Icon</label>
                <div className="flex gap-2 overflow-x-auto py-2">
                  {icons.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${
                        icon === emoji ? 'border-emerald-500 bg-emerald-500/20 scale-110' : 'border-border/40 bg-secondary/40'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Color</label>
                <div className="flex gap-2 py-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-background' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-sm p-6 rounded-3xl border border-border/40 bg-background shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-foreground">Add Funds to {selectedGoal.name}</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">Amount to Deposit (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                <input
                  type="number"
                  placeholder="5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input-premium w-full pl-8 pr-3 py-3 text-lg font-bold"
                  autoFocus
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 pt-1">
                {[1000, 2000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDepositAmount(preset.toString())}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                  >
                    +₹{preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDeposit}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-2"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
