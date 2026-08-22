'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { api } from '@/lib/api'
import { apiFetch } from '@/lib/apiFetch'
import { useAuth } from '@/contexts/AuthContext'
import { offlineStore } from '@/lib/offlineStore'
import { useNotification } from '@/contexts/NotificationContext'

export interface ExpenseRecord {
  id: string
  title: string
  amount: number
  category: string
  date: string
  paymentMethod?: string
  bankName?: string
  description?: string
  receiptUrl?: string
  tags?: string[]
  isRecurring?: boolean
  createdAt?: string
}

export interface IncomeRecord {
  id: string
  title: string
  amount: number
  source: string
  date: string
  paymentMethod?: string
  description?: string
  createdAt?: string
}

export interface BudgetRecord {
  id?: string
  category: string
  amount: number
  month: number
  year: number
}

export interface UdharRecord {
  id: string
  personName: string
  amount: number
  type: 'given' | 'taken'
  dueDate?: string
  status: 'pending' | 'partially_paid' | 'paid'
  description?: string
  paidAmount?: number
  transactions?: any[]
  createdAt?: string
}

export interface SubscriptionRecord {
  id: string
  name: string
  amount: number
  billingCycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly'
  nextBillingDate: string
  category: string
  status: 'active' | 'cancelled' | 'paused'
  autoRenew?: boolean
  notes?: string
}

interface DataContextType {
  // Global Real State
  expenses: ExpenseRecord[]
  incomes: IncomeRecord[]
  monthlyBudgets: BudgetRecord[]
  udhars: UdharRecord[]
  subscriptions: SubscriptionRecord[]
  financialSummary: any
  userBillingDay: number
  
  // Loading & Network States
  loading: boolean
  isOnline: boolean
  refreshTrigger: number
  
  // Refresh & Fetch Actions
  triggerRefresh: () => void
  refreshAllData: () => Promise<void>
  refreshFinancialSummary: () => Promise<void>
  
  // Centralized Mutations (with Optimistic Updates + Offline Sync)
  createExpense: (data: Partial<ExpenseRecord>) => Promise<ExpenseRecord>
  updateExpense: (id: string, data: Partial<ExpenseRecord>) => Promise<ExpenseRecord>
  deleteExpense: (id: string) => Promise<void>
  
  createIncome: (data: Partial<IncomeRecord>) => Promise<IncomeRecord>
  updateIncome: (id: string, data: Partial<IncomeRecord>) => Promise<IncomeRecord>
  deleteIncome: (id: string) => Promise<void>
  
  setCategoryBudget: (category: string, amount: number, month: number, year: number) => Promise<void>
  createUdhar: (data: Partial<UdharRecord>) => Promise<UdharRecord>
  updateUdhar: (id: string, data: Partial<UdharRecord>) => Promise<UdharRecord>
  deleteUdhar: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()

  // State initialized with offline cache if available
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => offlineStore.getCache<ExpenseRecord[]>('expenses') || [])
  const [incomes, setIncomes] = useState<IncomeRecord[]>(() => offlineStore.getCache<IncomeRecord[]>('incomes') || [])
  const [monthlyBudgets, setMonthlyBudgets] = useState<BudgetRecord[]>(() => offlineStore.getCache<BudgetRecord[]>('monthlyBudgets') || [])
  const [udhars, setUdhars] = useState<UdharRecord[]>(() => offlineStore.getCache<UdharRecord[]>('udhars') || [])
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(() => offlineStore.getCache<SubscriptionRecord[]>('subscriptions') || [])
  const [financialSummary, setFinancialSummary] = useState<any>(() => offlineStore.getCache<any>('financialSummary') || null)
  const [userBillingDay, setUserBillingDay] = useState<number>(() => offlineStore.getCache<number>('userBillingDay') || 1)

  const [loading, setLoading] = useState<boolean>(true)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  // Track online/offline status
  useEffect(() => {
    setIsOnline(offlineStore.isOnline())
    const unsubscribe = offlineStore.subscribe((online) => {
      setIsOnline(online)
      if (online) {
        // Automatically fetch fresh data from backend when network reconnects
        refreshAllData()
      }
    })
    return () => unsubscribe()
  }, [])

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const refreshFinancialSummary = useCallback(async () => {
    if (!user) {
      setFinancialSummary(null)
      return
    }

    try {
      const summary = await api.getFinancialSummary()
      setFinancialSummary(summary)
      offlineStore.setCache('financialSummary', summary)
    } catch (error) {
      // Fallback to offline cache
      const cached = offlineStore.getCache<any>('financialSummary')
      if (cached) setFinancialSummary(cached)
    }
  }, [user])

  const refreshAllData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      const [expensesData, incomesData, udharsData, subsData, summaryData, billingRes] = await Promise.allSettled([
        api.getExpenses(),
        api.getIncomes(),
        api.getUdhars(),
        api.getSubscriptions(),
        api.getFinancialSummary(),
        token ? apiFetch('/api/user/billing-cycle', { headers: { Authorization: `Bearer ${token}` } }) : Promise.reject(),
      ])

      // 1. Expenses
      if (expensesData.status === 'fulfilled' && Array.isArray(expensesData.value)) {
        setExpenses(expensesData.value)
        offlineStore.setCache('expenses', expensesData.value)
      } else {
        const cached = offlineStore.getCache<ExpenseRecord[]>('expenses')
        if (cached) setExpenses(cached)
      }

      // 2. Incomes
      if (incomesData.status === 'fulfilled' && Array.isArray(incomesData.value)) {
        setIncomes(incomesData.value)
        offlineStore.setCache('incomes', incomesData.value)
      } else {
        const cached = offlineStore.getCache<IncomeRecord[]>('incomes')
        if (cached) setIncomes(cached)
      }

      // 3. Udhars
      if (udharsData.status === 'fulfilled' && Array.isArray(udharsData.value)) {
        setUdhars(udharsData.value)
        offlineStore.setCache('udhars', udharsData.value)
      } else {
        const cached = offlineStore.getCache<UdharRecord[]>('udhars')
        if (cached) setUdhars(cached)
      }

      // 4. Subscriptions
      if (subsData.status === 'fulfilled' && Array.isArray(subsData.value)) {
        setSubscriptions(subsData.value)
        offlineStore.setCache('subscriptions', subsData.value)
      } else {
        const cached = offlineStore.getCache<SubscriptionRecord[]>('subscriptions')
        if (cached) setSubscriptions(cached)
      }

      // 5. Summary
      if (summaryData.status === 'fulfilled' && summaryData.value) {
        setFinancialSummary(summaryData.value)
        offlineStore.setCache('financialSummary', summaryData.value)
      } else {
        const cached = offlineStore.getCache<any>('financialSummary')
        if (cached) setFinancialSummary(cached)
      }

      // 6. User Billing Cycle
      if (billingRes.status === 'fulfilled' && billingRes.value.ok) {
        const bData = await billingRes.value.json().catch(() => null)
        if (bData?.billingCycleStartDay) {
          setUserBillingDay(bData.billingCycleStartDay)
          offlineStore.setCache('userBillingDay', bData.billingCycleStartDay)
        }
      }
    } catch (err) {
      console.warn('Error fetching all data:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial load when user authentication is ready
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        refreshAllData()
      } else {
        setExpenses([])
        setIncomes([])
        setMonthlyBudgets([])
        setUdhars([])
        setSubscriptions([])
        setFinancialSummary(null)
        setLoading(false)
      }
    }
  }, [user, authLoading, refreshTrigger, refreshAllData])

  // --- Centralized Reactive Mutations ---

  const createExpense = async (data: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
    const tempId = 'exp_' + Date.now()
    const optimisticRecord: ExpenseRecord = {
      id: tempId,
      title: data.title || 'Expense',
      amount: Number(data.amount) || 0,
      category: data.category || 'General',
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod,
      bankName: data.bankName,
      description: data.description,
      receiptUrl: data.receiptUrl,
      tags: data.tags,
      isRecurring: data.isRecurring,
      createdAt: new Date().toISOString(),
    }

    // 1. Optimistic local state update
    const updatedList = [optimisticRecord, ...expenses]
    setExpenses(updatedList)
    offlineStore.setCache('expenses', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: '/api/expenses',
        method: 'POST',
        body: data,
        description: `Create Expense: ${data.title} (₹${data.amount})`,
      })
      addNotification({
        type: 'info',
        title: 'Saved Offline',
        message: `Expense of ₹${data.amount} saved locally. Will sync automatically when online.`,
        duration: 3500,
      })
      return optimisticRecord
    }

    try {
      const saved = await api.createExpense(data)
      // Replace optimistic temp with real backend record
      const finalized = updatedList.map((e) => (e.id === tempId ? saved : e))
      setExpenses(finalized)
      offlineStore.setCache('expenses', finalized)
      refreshFinancialSummary()
      return saved
    } catch (err: any) {
      console.warn('Online createExpense failed, queueing offline:', err)
      offlineStore.queueMutation({
        endpoint: '/api/expenses',
        method: 'POST',
        body: data,
        description: `Create Expense: ${data.title} (₹${data.amount})`,
      })
      return optimisticRecord
    }
  }

  const updateExpense = async (id: string, data: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
    // 1. Optimistic local update
    const updatedList = expenses.map((e) => (e.id === id ? ({ ...e, ...data } as ExpenseRecord) : e))
    setExpenses(updatedList)
    offlineStore.setCache('expenses', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: `/api/expenses/${id}`,
        method: 'PUT',
        body: data,
        description: `Update Expense: ${data.title || id}`,
      })
      return updatedList.find((e) => e.id === id)!
    }

    try {
      const saved = await api.updateExpense(id, data)
      const finalized = expenses.map((e) => (e.id === id ? saved : e))
      setExpenses(finalized)
      offlineStore.setCache('expenses', finalized)
      refreshFinancialSummary()
      return saved
    } catch (err: any) {
      offlineStore.queueMutation({
        endpoint: `/api/expenses/${id}`,
        method: 'PUT',
        body: data,
        description: `Update Expense: ${data.title || id}`,
      })
      return updatedList.find((e) => e.id === id)!
    }
  }

  const deleteExpense = async (id: string): Promise<void> => {
    const updatedList = expenses.filter((e) => e.id !== id)
    setExpenses(updatedList)
    offlineStore.setCache('expenses', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: `/api/expenses/${id}`,
        method: 'DELETE',
        description: `Delete Expense: ${id}`,
      })
      return
    }

    try {
      await api.deleteExpense(id)
      refreshFinancialSummary()
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: `/api/expenses/${id}`,
        method: 'DELETE',
        description: `Delete Expense: ${id}`,
      })
    }
  }

  const createIncome = async (data: Partial<IncomeRecord>): Promise<IncomeRecord> => {
    const tempId = 'inc_' + Date.now()
    const optimisticRecord: IncomeRecord = {
      id: tempId,
      title: data.title || 'Income',
      amount: Number(data.amount) || 0,
      source: data.source || 'Salary',
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod,
      description: data.description,
      createdAt: new Date().toISOString(),
    }

    const updatedList = [optimisticRecord, ...incomes]
    setIncomes(updatedList)
    offlineStore.setCache('incomes', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: '/api/incomes',
        method: 'POST',
        body: data,
        description: `Create Income: ${data.title} (₹${data.amount})`,
      })
      return optimisticRecord
    }

    try {
      const saved = await api.createIncome(data)
      const finalized = updatedList.map((i) => (i.id === tempId ? saved : i))
      setIncomes(finalized)
      offlineStore.setCache('incomes', finalized)
      refreshFinancialSummary()
      return saved
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: '/api/incomes',
        method: 'POST',
        body: data,
        description: `Create Income: ${data.title} (₹${data.amount})`,
      })
      return optimisticRecord
    }
  }

  const updateIncome = async (id: string, data: Partial<IncomeRecord>): Promise<IncomeRecord> => {
    const updatedList = incomes.map((i) => (i.id === id ? ({ ...i, ...data } as IncomeRecord) : i))
    setIncomes(updatedList)
    offlineStore.setCache('incomes', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: `/api/incomes/${id}`,
        method: 'PUT',
        body: data,
        description: `Update Income: ${data.title || id}`,
      })
      return updatedList.find((i) => i.id === id)!
    }

    try {
      const saved = await api.updateIncome(id, data)
      const finalized = incomes.map((i) => (i.id === id ? saved : i))
      setIncomes(finalized)
      offlineStore.setCache('incomes', finalized)
      refreshFinancialSummary()
      return saved
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: `/api/incomes/${id}`,
        method: 'PUT',
        body: data,
        description: `Update Income: ${data.title || id}`,
      })
      return updatedList.find((i) => i.id === id)!
    }
  }

  const deleteIncome = async (id: string): Promise<void> => {
    const updatedList = incomes.filter((i) => i.id !== id)
    setIncomes(updatedList)
    offlineStore.setCache('incomes', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: `/api/incomes/${id}`,
        method: 'DELETE',
        description: `Delete Income: ${id}`,
      })
      return
    }

    try {
      await api.deleteIncome(id)
      refreshFinancialSummary()
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: `/api/incomes/${id}`,
        method: 'DELETE',
        description: `Delete Income: ${id}`,
      })
    }
  }

  const setCategoryBudget = async (category: string, amount: number, month: number, year: number): Promise<void> => {
    const token = localStorage.getItem('token')
    const existingIdx = monthlyBudgets.findIndex((b) => b.category === category && b.month === month && b.year === year)
    let updatedBudgets: BudgetRecord[]

    if (existingIdx >= 0) {
      updatedBudgets = monthlyBudgets.map((b, idx) => (idx === existingIdx ? { ...b, amount } : b))
    } else {
      updatedBudgets = [...monthlyBudgets, { category, amount, month, year }]
    }

    setMonthlyBudgets(updatedBudgets)
    offlineStore.setCache('monthlyBudgets', updatedBudgets)

    const payload = { category, amount, month, year }

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: '/api/monthly-budget',
        method: 'POST',
        body: payload,
        description: `Set Budget: ${category} (₹${amount})`,
      })
      return
    }

    try {
      await apiFetch('/api/monthly-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: '/api/monthly-budget',
        method: 'POST',
        body: payload,
        description: `Set Budget: ${category} (₹${amount})`,
      })
    }
  }

  const createUdhar = async (data: Partial<UdharRecord>): Promise<UdharRecord> => {
    const tempId = 'udh_' + Date.now()
    const optimisticRecord: UdharRecord = {
      id: tempId,
      personName: data.personName || 'Person',
      amount: Number(data.amount) || 0,
      type: data.type || 'given',
      dueDate: data.dueDate,
      status: data.status || 'pending',
      description: data.description,
      paidAmount: data.paidAmount || 0,
      transactions: [],
      createdAt: new Date().toISOString(),
    }

    const updatedList = [optimisticRecord, ...udhars]
    setUdhars(updatedList)
    offlineStore.setCache('udhars', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: '/api/udhar',
        method: 'POST',
        body: data,
        description: `Create Udhar: ${data.personName} (₹${data.amount})`,
      })
      return optimisticRecord
    }

    try {
      const saved = await api.createUdhar(data)
      const finalized = updatedList.map((u) => (u.id === tempId ? saved : u))
      setUdhars(finalized)
      offlineStore.setCache('udhars', finalized)
      return saved
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: '/api/udhar',
        method: 'POST',
        body: data,
        description: `Create Udhar: ${data.personName} (₹${data.amount})`,
      })
      return optimisticRecord
    }
  }

  const updateUdhar = async (id: string, data: Partial<UdharRecord>): Promise<UdharRecord> => {
    const updatedList = udhars.map((u) => (u.id === id ? ({ ...u, ...data } as UdharRecord) : u))
    setUdhars(updatedList)
    offlineStore.setCache('udhars', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: `/api/udhar/${id}`,
        method: 'PUT',
        body: data,
        description: `Update Udhar: ${id}`,
      })
      return updatedList.find((u) => u.id === id)!
    }

    try {
      const saved = await api.updateUdhar(id, data)
      const finalized = udhars.map((u) => (u.id === id ? saved : u))
      setUdhars(finalized)
      offlineStore.setCache('udhars', finalized)
      return saved
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: `/api/udhar/${id}`,
        method: 'PUT',
        body: data,
        description: `Update Udhar: ${id}`,
      })
      return updatedList.find((u) => u.id === id)!
    }
  }

  const deleteUdhar = async (id: string): Promise<void> => {
    const updatedList = udhars.filter((u) => u.id !== id)
    setUdhars(updatedList)
    offlineStore.setCache('udhars', updatedList)

    if (!offlineStore.isOnline()) {
      offlineStore.queueMutation({
        endpoint: `/api/udhar/${id}`,
        method: 'DELETE',
        description: `Delete Udhar: ${id}`,
      })
      return
    }

    try {
      await api.deleteUdhar(id)
    } catch (err) {
      offlineStore.queueMutation({
        endpoint: `/api/udhar/${id}`,
        method: 'DELETE',
        description: `Delete Udhar: ${id}`,
      })
    }
  }

  return (
    <DataContext.Provider
      value={{
        expenses,
        incomes,
        monthlyBudgets,
        udhars,
        subscriptions,
        financialSummary,
        userBillingDay,
        loading,
        isOnline,
        refreshTrigger,
        triggerRefresh,
        refreshAllData,
        refreshFinancialSummary,
        createExpense,
        updateExpense,
        deleteExpense,
        createIncome,
        updateIncome,
        deleteIncome,
        setCategoryBudget,
        createUdhar,
        updateUdhar,
        deleteUdhar,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}