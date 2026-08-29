'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { apiFetch } from '@/lib/apiFetch'

interface SplitExpense {
  id: string
  title: string
  amount: number
  paidBy: string
  splitBetween: string[]
  splitType: string
  date: string
  notes?: string
}

interface SplitGroup {
  id: string
  name: string
  type: string
  members: string[]
  currency: string
  totalSpend?: number
  expensesCount?: number
  expenses?: SplitExpense[]
}

export default function SplitExpensesPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<SplitGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<SplitGroup | null>(null)
  const [groupDetails, setGroupDetails] = useState<{
    group: SplitGroup
    totalSpend: number
    balances: Record<string, number>
    yourBalance: number
    settlements: { from: string; to: string; amount: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)

  // Create Group Form
  const [groupName, setGroupName] = useState('')
  const [groupType, setGroupType] = useState('trip')
  const [membersInput, setMembersInput] = useState('')

  // Add Shared Expense Form
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expensePayer, setExpensePayer] = useState('You')
  const [selectedSplitters, setSelectedSplitters] = useState<string[]>([])

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const fetchGroups = async () => {
    try {
      const res = await apiFetch('/api/split-groups', {
        headers: getHeaders(),
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
        if (data.groups && data.groups.length > 0 && !selectedGroup) {
          fetchGroupDetails(data.groups[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to fetch split groups:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupDetails = async (id: string) => {
    try {
      const res = await apiFetch(`/api/split-groups/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedGroup(data.group)
        setGroupDetails(data)
        setSelectedSplitters(data.group.members || ['You'])
        setExpensePayer('You')
      }
    } catch (e) {
      console.error('Failed to fetch group details:', e)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return

    const members = membersInput
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0)

    try {
      const res = await apiFetch('/api/split-groups', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: groupName.trim(),
          type: groupType,
          members: members.length > 0 ? members : ['You'],
        }),
      })

      if (res.ok) {
        const created = await res.json()
        setShowCreateGroupModal(false)
        setGroupName('')
        setMembersInput('')
        fetchGroups()
        fetchGroupDetails(created.id)
      }
    } catch (err) {
      console.error('Create group failed:', err)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !expenseTitle || !expenseAmount) return

    try {
      const res = await apiFetch(`/api/split-groups/${selectedGroup.id}/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          title: expenseTitle.trim(),
          amount: Number(expenseAmount),
          paidBy: expensePayer,
          splitBetween: selectedSplitters,
        }),
      })

      if (res.ok) {
        setShowAddExpenseModal(false)
        setExpenseTitle('')
        setExpenseAmount('')
        fetchGroupDetails(selectedGroup.id)
        fetchGroups()
      }
    } catch (err) {
      console.error('Add shared expense failed:', err)
    }
  }

  const toggleSplitter = (member: string) => {
    if (selectedSplitters.includes(member)) {
      if (selectedSplitters.length > 1) {
        setSelectedSplitters(selectedSplitters.filter((m) => m !== member))
      }
    } else {
      setSelectedSplitters([...selectedSplitters, member])
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
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Split Expenses
              </h1>
              <p className="text-xs text-muted-foreground">Splitwise style group bills & balance settlement</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs md:text-sm font-semibold rounded-xl border border-border/40 transition-all"
            >
              + New Group
            </button>
            {selectedGroup && (
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                + Add Bill
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Groups Horizontal Tab Bar */}
        {groups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {groups.map((g) => {
              const isSelected = selectedGroup?.id === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => fetchGroupDetails(g.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs md:text-sm font-semibold flex items-center gap-2 flex-shrink-0 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                      : 'glass-card text-muted-foreground hover:text-foreground border border-border/30 hover:bg-secondary/40'
                  }`}
                >
                  <span>{g.type === 'trip' ? '✈️' : g.type === 'home' ? '🏠' : g.type === 'couple' ? '💑' : '👥'}</span>
                  <span>{g.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-secondary'}`}>
                    {g.members.length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Group View */}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading split groups...</div>
        ) : groups.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border/40 rounded-3xl p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-4">
              👥
            </div>
            <h3 className="text-lg font-bold text-foreground">No Split Groups Yet</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Create a group for your trip with friends, room rent, dinner party, or project.
            </p>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Create First Group
            </button>
          </div>
        ) : groupDetails ? (
          <div className="space-y-6">
            {/* Top Balance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-5 rounded-3xl border border-border/30 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent">
                <p className="text-xs text-muted-foreground font-medium">Your Balance in {groupDetails.group.name}</p>
                <p className={`text-2xl font-bold mt-1 ${groupDetails.yourBalance > 0 ? 'text-emerald-400' : groupDetails.yourBalance < 0 ? 'text-rose-400' : 'text-foreground'}`}>
                  {groupDetails.yourBalance > 0 ? `+₹${groupDetails.yourBalance.toLocaleString()}` : groupDetails.yourBalance < 0 ? `-₹${Math.abs(groupDetails.yourBalance).toLocaleString()}` : '₹0 (All Settled)'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {groupDetails.yourBalance > 0 ? 'You are owed money overall' : groupDetails.yourBalance < 0 ? 'You owe money in this group' : 'You are all squared up!'}
                </p>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-border/30">
                <p className="text-xs text-muted-foreground font-medium">Total Group Spend</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ₹{groupDetails.totalSpend.toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Across {groupDetails.group.expenses?.length || 0} shared bills
                </p>
              </div>

              <div className="glass-card p-5 rounded-3xl border border-border/30">
                <p className="text-xs text-muted-foreground font-medium">Members</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {groupDetails.group.members.map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-lg bg-secondary text-xs font-semibold text-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Settle Up Suggestions */}
            {groupDetails.settlements.length > 0 && (
              <div className="glass-card p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span>⚡</span> Suggested Settlements (Who Owes Whom):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {groupDetails.settlements.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-secondary/80 border border-border/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-rose-400">{s.from}</span> pays{' '}
                        <span className="font-bold text-emerald-400">{s.to}</span>
                      </div>
                      <div className="font-bold text-amber-400 text-sm">
                        ₹{s.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses List */}
            <div className="glass-card p-5 rounded-3xl border border-border/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground">Group Expenses</h3>
                <span className="text-xs text-muted-foreground">{groupDetails.group.expenses?.length || 0} transactions</span>
              </div>

              {groupDetails.group.expenses && groupDetails.group.expenses.length > 0 ? (
                <div className="space-y-3">
                  {groupDetails.group.expenses.map((expense) => {
                    const yourShare = expense.splitBetween.includes('You')
                      ? Math.round(expense.amount / expense.splitBetween.length)
                      : 0

                    return (
                      <div
                        key={expense.id}
                        className="p-4 rounded-2xl bg-secondary/40 border border-border/20 flex items-center justify-between hover:bg-secondary/70 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                            🧾
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{expense.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Paid by <span className="text-foreground font-semibold">{expense.paidBy}</span> • Split with {expense.splitBetween.join(', ')}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-sm text-foreground">₹{expense.amount.toLocaleString()}</p>
                          {expense.paidBy === 'You' ? (
                            <p className="text-[11px] text-emerald-400 font-semibold">
                              You lent ₹{(expense.amount - yourShare).toLocaleString()}
                            </p>
                          ) : yourShare > 0 ? (
                            <p className="text-[11px] text-rose-400 font-semibold">
                              Your share: ₹{yourShare.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground">Not involved</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No expenses added to this group yet. Tap "+ Add Bill" to log a shared expense!
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-border/40 bg-background shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">Create Split Group</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip, Flat 402, Friday Dinner"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Group Type</label>
                <select
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                >
                  <option value="trip">✈️ Trip & Vacation</option>
                  <option value="home">🏠 Room / Flatmates</option>
                  <option value="couple">💑 Couple / Partner</option>
                  <option value="project">💼 Project / Office</option>
                  <option value="other">👥 Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Members (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul, Pooja, Amit"
                  value={membersInput}
                  onChange={(e) => setMembersInput(e.target.value)}
                  className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">"You" is automatically included.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                Create Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-border/40 bg-background shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-foreground">Add Shared Bill</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">What was it for?</label>
                <input
                  type="text"
                  placeholder="e.g. Hotel Booking, Dinner, Groceries"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="2400"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Paid By</label>
                <select
                  value={expensePayer}
                  onChange={(e) => setExpensePayer(e.target.value)}
                  className="input-premium w-full mt-1 px-3 py-2.5 text-sm"
                >
                  {selectedGroup.members.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Split Between</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedGroup.members.map((member) => {
                    const isSelected = selectedSplitters.includes(member)
                    return (
                      <button
                        key={member}
                        type="button"
                        onClick={() => toggleSplitter(member)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{member}
                      </button>
                    )
                  })}
                </div>
                {expenseAmount && selectedSplitters.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    ₹{Math.round(Number(expenseAmount) / selectedSplitters.length).toLocaleString()} per person (Equal split)
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                Save Shared Bill
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
