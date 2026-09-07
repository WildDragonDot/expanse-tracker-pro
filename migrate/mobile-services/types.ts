/**
 * Unified TypeScript Models for Firestore Collections
 */

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  bio?: string
  profileImage?: string
  salary: number
  currency: string
  billingCycleStartDay: number
  notificationSettings?: {
    dailyReminder: boolean
    billAlerts: boolean
    budgetAlerts: boolean
    emailAlerts: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface ExpenseDoc {
  id?: string
  userId: string
  title: string
  amount: number
  category: string
  bank: string
  paymentMode: string
  date: string // ISO string YYYY-MM-DDTHH:mm:ss.sssZ
  tags: string[]
  notes?: string
  receiptUrl?: string
  isRecurring?: boolean
  subscriptionId?: string
  createdAt: string
  updatedAt?: string
}

export interface IncomeDoc {
  id?: string
  userId: string
  source: string
  amount: number
  date: string
  notes?: string
  createdAt: string
}

export interface UdharDoc {
  id?: string
  userId: string
  person: string
  phoneNumber?: string
  reason: string
  total: number
  remaining: number
  direction: 'YOU_GAVE' | 'YOU_GOT' | string
  dueDate?: string
  createdAt: string
}

export interface SubscriptionDoc {
  id?: string
  userId: string
  name: string
  amount: number
  category: string
  interval: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | string
  reminderDays: number[]
  isAutoDebit: boolean
  isTrial: boolean
  trialEndDate?: string
  notes?: string
  nextDueDate: string
  lastChargedAt: string
  active: boolean
  source: string
  createdAt: string
}

export interface BillOccurrenceDoc {
  id?: string
  subscriptionId: string
  userId: string
  title: string
  amount: number
  category: string
  dueDate: string
  status: 'UPCOMING' | 'PAID' | 'OVERDUE' | 'SNOOZED' | 'SKIPPED'
  paidAt?: string
  expenseId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MonthlyBudgetDoc {
  id?: string
  userId: string
  category: string
  amount: number
  month: number // 1-12
  year: number
  spent: number
  payableBank?: string
  isActive: boolean
  resetDate?: string
  createdAt: string
  updatedAt: string
}

export interface ShoppingCategoryDoc {
  id?: string
  userId: string
  name: string
  icon: string
  color: string
  expectedCost: number
  realCost: number
  membersCount: number
  isActive: boolean
  expiryDate?: string
  createdAt: string
  updatedAt: string
}

export interface ShoppingItemDoc {
  id?: string
  userId: string
  categoryId?: string
  name: string
  expectedPrice: number
  actualPrice?: number
  quantity: number
  unit: string
  isBought: boolean
  expenseId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ShoppingListDoc {
  id?: string
  userId: string
  name: string
  quantity: number
  unit: string
  category: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  estimatedPrice?: number
  actualPrice?: number
  expenseId?: string
  notes?: string
  period: 'daily' | 'weekly' | 'monthly'
  createdAt: string
  updatedAt: string
}

export interface SavingsGoalDoc {
  id?: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  category: string
  icon: string
  color: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface SplitGroupDoc {
  id?: string
  userId: string
  name: string
  type: string
  members: string[]
  currency: string
  createdAt: string
  updatedAt: string
}

export interface SplitExpenseDoc {
  id?: string
  groupId: string
  title: string
  amount: number
  paidBy: string
  splitBetween: string[]
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE'
  date: string
  notes?: string
  createdAt: string
}
