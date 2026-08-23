import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Expense,
  Income,
  RecurringPayment,
  BillOccurrence,
  MonthlyBudgetItem,
  UdharRecord,
  ShoppingListItem,
  ShoppingCategory,
  ShoppingItem,
  ExpenseCategoryItem,
} from '../types'

// Production Live Domain with Cloudflare Universal HTTPS SSL
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

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    })
    this.setToken(res.token)
    await AsyncStorage.setItem('@user_data', JSON.stringify(res.user))
    return res
  }

  // --- DASHBOARD & SUMMARY ---
  async getDashboardSummary() {
    return this.request<{
      totalBalance: number
      totalIncome: number
      totalExpenses: number
      savingsRate: number
      upcomingBillsTotal: number
      upcomingBill: BillOccurrence | null
      recentTransactions: Array<{ id: string; title: string; amount: number; type: 'expense' | 'income'; date: string; category: string }>
      topCategories: Array<{ category: string; amount: number }>
    }>('/analytics/summary')
  }

  // --- EXPENSES & INCOME ---
  async getExpenses(): Promise<Expense[]> {
    return this.request<Expense[]>('/expenses')
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
    return this.request<Income[]>('/incomes')
  }

  async createIncome(income: Partial<Income>): Promise<Income> {
    return this.request<Income>('/incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    })
  }

  async deleteIncome(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/incomes/${id}`, { method: 'DELETE' })
  }

  // --- RECURRING BILLS / SUBSCRIPTIONS ---
  async getRecurringBills(): Promise<RecurringPayment[]> {
    return this.request<RecurringPayment[]>('/subscriptions')
  }

  async getBillOccurrences(): Promise<BillOccurrence[]> {
    return this.request<BillOccurrence[]>('/subscriptions/occurrences')
  }

  async createRecurringBill(bill: Partial<RecurringPayment>): Promise<RecurringPayment> {
    return this.request<RecurringPayment>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(bill),
    })
  }

  async deleteRecurringBill(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/subscriptions/${id}`, { method: 'DELETE' })
  }

  async markBillPaid(occurrenceId: string, paymentDetails: { bank?: string; date?: string; notes?: string }): Promise<{ success: boolean; expense: Expense }> {
    return this.request<{ success: boolean; expense: Expense }>(`/subscriptions/occurrences/${occurrenceId}`, {
      method: 'PUT',
      body: JSON.stringify(paymentDetails),
    })
  }

  async snoozeBill(occurrenceId: string, days: number = 3): Promise<BillOccurrence> {
    return this.request<BillOccurrence>(`/subscriptions/occurrences/${occurrenceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ days }),
    })
  }

  // --- ANALYTICS TAB ---
  async getAnalyticsInsights(months: number = 6): Promise<{
    currentMonth: { income: number; expenses: number; savings: number; savingsRate: number; healthScore: number }
    monthlyTrend: { label: string; year: number; month: number; income: number; expenses: number; savings: number; savingsRate: number }[]
    categoryBreakdown: { name: string; amount: number; count: number; percentage: number; color: string; budget: number }[]
    paymentMethods: { label: string; amount: number; color: string }[]
    paymentTypes: { name: string; value: number; color: string }[]
    weeklySpending: { label: string; amount: number }[]
    incomeSources: { name: string; value: number; color: string }[]
    dailySpendingPattern: { label: string; amount: number }[]
  }> {
    return this.request(`/analytics/insights?months=${months}`)
  }

  // --- MONTHLY BUDGET ---
  async getMonthlyBudgets(month: number, year: number): Promise<MonthlyBudgetItem[]> {
    return this.request<MonthlyBudgetItem[]>(`/monthly-budget?month=${month}&year=${year}`)
  }

  async saveMonthlyBudget(data: { category: string; amount: number; month: number; year: number; payableBank?: string }): Promise<MonthlyBudgetItem> {
    return this.request<MonthlyBudgetItem>('/monthly-budget', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteMonthlyBudget(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/monthly-budget?id=${id}`, { method: 'DELETE' })
  }

  // --- REPORTS ---
  async getRangeSummary(range: 'month' | 'quarter' | 'ytd' | 'custom', from?: string, to?: string): Promise<{
    totalIncome: number
    totalExpenses: number
    savings: number
    savingsRate: number
    avgDailySpend: number
    transactionsCount: number
    topCategories: { category: string; amount: number; percentage: number }[]
  }> {
    let url = `/analytics/range?range=${range}`
    if (from) url += `&from=${encodeURIComponent(from)}`
    if (to) url += `&to=${encodeURIComponent(to)}`
    return this.request(url)
  }

  // --- UDHAR (LOANS GIVEN/TAKEN) ---
  async getUdhars(): Promise<UdharRecord[]> {
    return this.request<UdharRecord[]>('/udhar')
  }

  async createUdhar(data: { person: string; phoneNumber?: string; reason: string; total: number; direction: 'given' | 'taken'; dueDate?: string }): Promise<UdharRecord> {
    return this.request<UdharRecord>('/udhar', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateUdhar(id: string, data: Partial<{ remaining: number; total: number; reason: string; dueDate: string }>): Promise<UdharRecord> {
    return this.request<UdharRecord>(`/udhar/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteUdhar(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/udhar/${id}`, { method: 'DELETE' })
  }

  // --- SHOPPING LIST (simple checklist) ---
  async getShoppingList(): Promise<ShoppingListItem[]> {
    return this.request<ShoppingListItem[]>('/shopping-list')
  }

  async createShoppingListItem(data: { name: string; quantity: number; unit?: string; category?: string; estimatedPrice?: number; notes?: string }): Promise<ShoppingListItem> {
    return this.request<ShoppingListItem>('/shopping-list', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateShoppingListItem(id: string, data: Partial<{ completed: boolean; actualPrice: number }>): Promise<ShoppingListItem> {
    return this.request<ShoppingListItem>(`/shopping-list/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteShoppingListItem(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/shopping-list/${id}`, { method: 'DELETE' })
  }

  // --- SHOPPING CATEGORIES / EVENT PLANNING (budgeted trips/events with items) ---
  async getShoppingCategories(): Promise<ShoppingCategory[]> {
    return this.request<ShoppingCategory[]>('/shopping-categories')
  }

  async createShoppingCategory(data: { name: string; icon?: string; expectedCost?: number; membersCount?: number; expiryDate?: string }): Promise<ShoppingCategory> {
    return this.request<ShoppingCategory>('/shopping-categories', { method: 'POST', body: JSON.stringify(data) })
  }

  async createShoppingItem(data: { name: string; expectedPrice: number; categoryId?: string; quantity?: number; unit?: string; notes?: string }): Promise<ShoppingItem> {
    return this.request<ShoppingItem>('/shopping-items', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateShoppingItem(id: string, data: Partial<{ isBought: boolean; actualPrice: number }>): Promise<ShoppingItem> {
    return this.request<ShoppingItem>(`/shopping-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  // --- EXPENSE CATEGORIES (Settings) ---
  async getExpenseCategories(): Promise<ExpenseCategoryItem[]> {
    return this.request<ExpenseCategoryItem[]>('/expense-categories')
  }

  async createExpenseCategory(data: { name: string; icon?: string }): Promise<ExpenseCategoryItem> {
    return this.request<ExpenseCategoryItem>('/expense-categories', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteExpenseCategory(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/expense-categories/${id}`, { method: 'DELETE' })
  }

  // --- AI SMART SCORE & CHAT ---
  async getSmartScore(year: number, month: number): Promise<{
    score: number
    summary: string
    metrics: { savingsRate: number; expenseVariability: number; budgetAdherence: number; incomeStability: number }
  } | null> {
    const res = await this.request<{ score: any }>('/smart-score/recalculate', {
      method: 'POST',
      body: JSON.stringify({ year, month }),
    })
    return res.score
  }

  async askAIChat(prompt: string): Promise<{ reply: string }> {
    const res = await this.request<{ response: string }>('/chat/intelligent', {
      method: 'POST',
      body: JSON.stringify({ query: prompt }),
    })
    return { reply: res.response }
  }

  // --- REPORTS & PDF EMAIL EXPORTS ---
  async sendEmailReport(data: {
    dateFrom: string
    dateTo: string
    category?: string
    type?: string
    recipientEmail?: string
    includeBillAttachments?: boolean
    returnPdfBase64?: boolean
  }): Promise<{ success: boolean; message: string; pdfBase64?: string; filename?: string; stats?: any }> {
    return this.request<{ success: boolean; message: string; pdfBase64?: string; filename?: string; stats?: any }>('/reports/email', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new MobileApiClient()
