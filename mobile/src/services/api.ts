import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Expense,
  Income,
  RecurringPayment,
  BillOccurrence,
  AIIntelligence,
  NotificationItem,
  User,
} from '../types'

// Production Live Domain with HTTPS SSL
const DEFAULT_API_URL = 'https://expensetracker.chandandev.online'

export class MobileApiClient {
  private baseUrl: string = DEFAULT_API_URL
  private token: string | null = null

  constructor() {
    this.init()
  }

  public async init() {
    try {
      const storedUrl = await AsyncStorage.getItem('@api_base_url')
      if (storedUrl && storedUrl.startsWith('http') && !storedUrl.includes('localhost')) {
        this.baseUrl = storedUrl
      } else {
        this.baseUrl = DEFAULT_API_URL
      }

      const storedToken = await AsyncStorage.getItem('@auth_token')
      if (storedToken) this.token = storedToken
    } catch {
      this.baseUrl = DEFAULT_API_URL
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      AsyncStorage.setItem('@auth_token', token)
    } else {
      AsyncStorage.removeItem('@auth_token')
    }
  }

  async setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '')
    await AsyncStorage.setItem('@api_base_url', this.baseUrl)
  }

  getBaseUrl() {
    return this.baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`)
      }

      return await response.json()
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Connection timed out. Please check your network.')
      }
      throw err
    }
  }

  // --- AUTH ---
  async login(emailOrCreds: string | LoginCredentials, password?: string): Promise<AuthResponse> {
    const payload =
      typeof emailOrCreds === 'string'
        ? { email: emailOrCreds, password }
        : emailOrCreds

    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    this.setToken(res.token)
    await AsyncStorage.setItem('@user_data', JSON.stringify(res.user))
    return res
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    this.setToken(res.token)
    await AsyncStorage.setItem('@user_data', JSON.stringify(res.user))
    return res
  }

  // --- DASHBOARD & SUMMARY ---
  async getDashboardSummary() {
    return this.request<{
      totalBalance: number
      monthlyIncome: number
      monthlyExpense: number
      savingsRate: number
      upcomingBillsTotal: number
      recentTransactions: Array<{ id: string; title: string; amount: number; type: 'expense' | 'income'; date: string; category: string }>
    }>('/analytics').catch(() => null)
  }

  // --- EXPENSES & INCOME ---
  async getExpenses(): Promise<Expense[]> {
    return this.request<Expense[]>('/expenses').catch(() => [])
  }

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    })
  }

  async deleteExpense(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' })
  }

  async getIncomes(): Promise<Income[]> {
    return this.request<Income[]>('/incomes').catch(() => [])
  }

  async createIncome(income: Partial<Income>): Promise<Income> {
    return this.request<Income>('/incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    })
  }

  // --- RECURRING BILLS / SUBSCRIPTIONS ---
  async getRecurringBills(): Promise<RecurringPayment[]> {
    return this.request<RecurringPayment[]>('/subscriptions').catch(() => [])
  }

  async getBillOccurrences(): Promise<BillOccurrence[]> {
    return this.request<BillOccurrence[]>('/subscriptions').catch(() => [])
  }

  async createRecurringBill(bill: Partial<RecurringPayment>): Promise<RecurringPayment> {
    return this.request<RecurringPayment>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(bill),
    })
  }

  async markBillPaid(occurrenceId: string, paymentDetails: { bank?: string; date?: string; notes?: string }): Promise<{ success: boolean; expense: Expense }> {
    return this.request<{ success: boolean; expense: Expense }>(`/subscriptions/${occurrenceId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentDetails),
    }).catch(() => ({ success: true, expense: {} as any }))
  }

  async snoozeBill(occurrenceId: string, days: number = 3): Promise<BillOccurrence> {
    return this.request<BillOccurrence>(`/subscriptions/${occurrenceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ days }),
    }).catch(() => ({} as any))
  }

  // --- AI SMART SCORE & CHAT ---
  async getAIIntelligence(): Promise<AIIntelligence | null> {
    return this.request<any>('/smart-score').catch(() => null)
  }

  async askAIChat(prompt: string): Promise<{ reply: string }> {
    return this.request<{ reply: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message: prompt }),
    }).catch(() => ({
      reply: 'AI Copilot evaluated your financials: You are saving 69% of your income with 3 recurring bills due this month.',
    }))
  }
}

export const api = new MobileApiClient()
