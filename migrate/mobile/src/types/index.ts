export interface User {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  profileImage?: string
  salary?: number
  currency: string
  billingCycleStartDay: number
  notificationSettings?: {
    billAlerts: boolean
    budgetWarnings: boolean
    weeklyReports: boolean
    securityAlerts: boolean
  }
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password?: string
  isGoogle?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password?: string
  salary?: number
  billingCycleStartDay?: number
}

export interface Expense {
  id: string
  userId: string
  date: string
  title: string
  amount: number
  category: string
  bank: string
  paymentMode: string
  notes?: string
  receiptUrl?: string
  isRecurring?: boolean
  subscriptionId?: string
  createdAt?: string
}

export interface Income {
  id: string
  userId: string
  date: string
  source: string
  amount: number
  notes?: string
  createdAt?: string
}

export type BillFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'
export type BillStatus = 'UPCOMING' | 'PAID' | 'OVERDUE' | 'SNOOZED' | 'SKIPPED'

export interface RecurringPayment {
  id: string
  userId: string
  title: string
  amount: number
  category: string
  frequency: BillFrequency
  nextDueDate: string
  reminderDays: number[]
  isAutoDebit: boolean
  isTrial: boolean
  trialEndDate?: string
  notes?: string
  active: boolean
  createdAt?: string
}

export interface BillOccurrence {
  id: string
  recurringPaymentId: string
  title: string
  amount: number
  category: string
  dueDate: string
  status: BillStatus
  paidAt?: string
  expenseId?: string
  snoozedUntil?: string
  notes?: string
}

export interface AIIntelligence {
  healthScore: number // 0-100
  scoreLabel: string
  summary: string
  spendingVelocity: {
    comparisonPercentage: number
    topCategory: string
    isHigher: boolean
  }
  subscriptionWaste: {
    count: number
    potentialMonthlySavings: number
    recommendations: string[]
  }
  budgetRisk: {
    hasRisk: boolean
    riskCategory?: string
    daysUntilExceeded?: number
  }
  cashFlowPrediction: {
    projectedEndOfMonthBalance: number
    upcomingBillsSum: number
    estimatedDiscretionary: number
  }
  actionableInsights: string[]
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'BILL_DUE' | 'TRIAL_EXPIRING' | 'BUDGET_WARNING' | 'HEALTH_SCORE'
  date: string
  isRead: boolean
  actionUrl?: string
}

export interface MonthlyBudgetItem {
  id: string
  userId: string
  category: string
  amount: number
  month: number
  year: number
  spent: number
  payableBank?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UdharRecord {
  id: string
  userId: string
  person: string
  phoneNumber?: string | null
  reason: string
  total: number
  remaining: number
  direction: 'given' | 'taken'
  dueDate?: string | null
  createdAt: string
}

export interface ShoppingListItem {
  id: string
  userId: string
  name: string
  quantity: number
  unit: string
  category: string
  priority: string
  completed: boolean
  estimatedPrice?: number | null
  actualPrice?: number | null
  expenseId?: string | null
  notes?: string | null
  period: string
  createdAt: string
}

export interface ShoppingItem {
  id: string
  userId: string
  categoryId?: string | null
  name: string
  expectedPrice: number
  actualPrice?: number | null
  quantity: number
  unit: string
  isBought: boolean
  expenseId?: string | null
  notes?: string | null
  createdAt: string
}

export interface ExpenseCategoryItem {
  id: string
  userId: string
  name: string
  icon: string
  isDefault: boolean
  createdAt: string
}

export interface ExpenseBankItem {
  id: string
  userId: string
  name: string
  icon: string
  isDefault: boolean
  createdAt: string
}

export interface ExpensePaymentModeItem {
  id: string
  userId: string
  name: string
  icon: string
  isDefault: boolean
  createdAt: string
}

export interface ShoppingCategory {
  id: string
  userId: string
  name: string
  icon: string
  color: string
  expectedCost: number
  realCost: number
  membersCount: number
  isActive: boolean
  expiryDate?: string | null
  createdAt: string
  items: ShoppingItem[]
}

export interface SavingsGoal {
  id: string
  userId?: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string | null
  category: string
  icon: string
  color: string
  isCompleted: boolean
  createdAt: string
}

export interface SplitExpense {
  id: string
  groupId: string
  title: string
  amount: number
  paidBy: string
  splitBetween: string[]
  splitType: string
  date: string
  notes?: string
  createdAt?: string
}

export interface SplitGroup {
  id: string
  name: string
  type: string
  members: string[]
  currency: string
  totalSpend?: number
  expensesCount?: number
  expenses?: SplitExpense[]
  createdAt?: string
  updatedAt?: string
}
