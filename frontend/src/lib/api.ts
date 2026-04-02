import { getApiUrl } from './apiFetch'

export class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    let response: Response

    try {
      response = await fetch(getApiUrl(`/api${endpoint}`), {
        ...options,
        headers,
      })
    } catch (error) {
      const devBackendHint =
        typeof window !== 'undefined' && process.env.NODE_ENV !== 'production'
          ? ' Backend server may not be running on http://localhost:3001.'
          : ''

      throw new Error(`Unable to connect to the API.${devBackendHint}`)
    }

    if (!response.ok) {
      if (response.status >= 500 && typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        throw new Error('API server error. Make sure both frontend (3000) and backend (3001) dev servers are running.')
      }

      // Handle 401 Unauthorized - auto logout
      if (response.status === 401) {
        this.clearToken()
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          // Trigger a custom event that AuthContext can listen to
          window.dispatchEvent(new CustomEvent('unauthorized'))
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login'
          }, 100)
        }
      }
      
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(data.token)
    return data
  }

  async register(name: string, email: string, password: string, salary?: number) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, salary }),
    })
    this.setToken(data.token)
    return data
  }

  // Expenses
  async getExpenses(filters?: any) {
    const filteredEntries = Object.entries(filters || {}).filter(([_, v]) => v != null)
    const params = new URLSearchParams(
      filteredEntries.map(([k, v]) => [k, String(v)])
    ).toString()
    return this.request(`/expenses${params ? `?${params}` : ''}`)
  }

  async createExpense(expense: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    })
  }

  async updateExpense(id: string, expense: any) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    })
  }

  async deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    })
  }

  // Incomes
  async getIncomes(filters?: any) {
    const filteredEntries = Object.entries(filters || {}).filter(([_, v]) => v != null)
    const params = new URLSearchParams(
      filteredEntries.map(([k, v]) => [k, String(v)])
    ).toString()
    return this.request(`/incomes${params ? `?${params}` : ''}`)
  }

  async createIncome(income: any) {
    return this.request('/incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    })
  }

  async updateIncome(id: string, income: any) {
    return this.request(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(income),
    })
  }

  async deleteIncome(id: string) {
    return this.request(`/incomes/${id}`, {
      method: 'DELETE',
    })
  }

  // Udhar
  async getUdhars() {
    return this.request('/udhar')
  }

  async createUdhar(udhar: any) {
    return this.request('/udhar', {
      method: 'POST',
      body: JSON.stringify(udhar),
    })
  }

  async updateUdhar(id: string, udhar: any) {
    return this.request(`/udhar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(udhar),
    })
  }

  async deleteUdhar(id: string) {
    return this.request(`/udhar/${id}`, {
      method: 'DELETE',
    })
  }

  // User Profile
  async getUserProfile() {
    return this.request('/user/profile')
  }

  async updateUserProfile(data: any) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // Analytics
  async getFinancialSummary(year?: number, month?: number) {
    const params = new URLSearchParams()
    if (year) params.set('year', year.toString())
    if (month) params.set('month', month.toString())
    return this.request(`/analytics/summary${params.toString() ? `?${params}` : ''}`)
  }

  async generateMonthlyReport(year: number, month: number) {
    return this.request('/reports/monthly', {
      method: 'POST',
      body: JSON.stringify({ year, month }),
    })
  }

  async sendEmailReport(filters: {
    dateFrom?: string
    dateTo?: string
    category?: string
    type?: 'day' | 'month' | 'year'
    reportType?: string
    includeBillAttachments?: boolean
    selectedExpenseIds?: string[]
  }) {
    return this.request('/reports/email', {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  }

  // Subscriptions
  async getSubscriptions() {
    return this.request('/subscriptions')
  }

  async detectSubscriptions() {
    return this.request('/subscriptions/detect', {
      method: 'POST',
    })
  }

  // Smart Score
  async getSmartScore(year: number, month: number) {
    return this.request(`/smart-score/monthly?year=${year}&month=${month}`)
  }

  async recalculateSmartScore(year: number, month: number) {
    return this.request('/smart-score/recalculate', {
      method: 'POST',
      body: JSON.stringify({ year, month }),
    })
  }

  // Chat
  async chatQuery(query: string) {
    return this.request('/chat/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  }

  async intelligentChatQuery(query: string) {
    return this.request('/chat/intelligent', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  }
}

export const api = new ApiClient()
