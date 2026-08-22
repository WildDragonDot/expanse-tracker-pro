/**
 * Database Service Layer
 * 
 * Yeh file database operations ko handle karti hai using Prisma ORM
 * 
 * Main Features:
 * - User authentication aur management
 * - Expense tracking aur CRUD operations
 * - Income management
 * - Budget warnings aur notifications
 * - Subscription detection
 * - Financial analytics aur reports
 * 
 * Dependencies:
 * - Prisma Client: Database ORM
 * - bcryptjs: Password hashing
 * - jsonwebtoken: JWT token generation
 * - email.ts: Email notifications
 * - dateUtils.ts: Date parsing utilities
 * 
 * Used By:
 * - All API routes in /api folder
 * - Authentication middleware
 * - Analytics services
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendEmail, emailTemplates } from './email'
import { parseAppDate } from './dateUtils'

// Global Prisma instance - singleton pattern
// Development mein hot reload ke liye global object use karte hain
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client Instance
 * 
 * Connection pooling ke saath configured hai to prevent "too many clients" error
 * Development mein error aur warnings log hoti hain
 * Production mein sirf errors log hoti hain
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Connection pool configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Development mein global object mein store karte hain hot reload ke liye
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  console.log('🔌 Prisma Client initialized with connection pooling')
}

// ============================================
// JWT TOKEN UTILITIES
// ============================================

/**
 * JWT Token Generate Karta Hai
 * 
 * @param userId - User ka unique ID
 * @returns JWT token string (30 days expiry)
 * 
 * Used By:
 * - createUser: Registration ke baad
 * - authenticateUser: Login ke baad
 */
export function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}

/**
 * JWT Token Verify Karta Hai
 * 
 * @param token - JWT token string
 * @returns User ID agar valid hai, null agar invalid
 * 
 * Used By:
 * - auth.ts middleware: Request authentication ke liye
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
  } catch {
    return null
  }
}

// ============================================
// USER SERVICES
// ============================================

/**
 * Naya User Create Karta Hai (Registration)
 * 
 * Process:
 * 1. Check karta hai ki email already exist to nahi
 * 2. Password ko hash karta hai (bcrypt)
 * 3. User ko database mein save karta hai
 * 4. Welcome email bhejta hai
 * 5. JWT token generate karta hai
 * 
 * @param data - User registration data
 * @returns User object aur JWT token
 * @throws Error agar user already exists
 * 
 * Used By:
 * - POST /api/auth/register
 */
export async function createUser(data: {
  name: string
  email: string
  password: string
  salary?: number
  billingCycleStartDay?: number
}) {
  // Check: Email already registered hai ya nahi
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    throw new Error('User already exists')
  }

  // Password ko hash karte hain security ke liye (12 rounds)
  const passwordHash = await bcrypt.hash(data.password, 12)
  
  // Database mein user create karte hain
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      salary: data.salary || 0,
      billingCycleStartDay: data.billingCycleStartDay || 1,
    },
    select: {
      id: true,
      name: true,
      email: true,
      salary: true,
      currency: true,
      billingCycleStartDay: true,
      createdAt: true,
    }
  })

  // Welcome email bhejte hain (async, error ko log karte hain)
  try {
    await sendEmail({
      to: user.email,
      ...emailTemplates.welcome(user.name)
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }

  // JWT token generate karte hain
  const token = generateToken(user.id)
  return { user, token }
}

/**
 * User Ko Authenticate Karta Hai (Login)
 * 
 * Process:
 * 1. Email se user dhundta hai
 * 2. Password verify karta hai
 * 3. JWT token generate karta hai
 * 
 * @param email - User email
 * @param password - Plain text password
 * @returns User object (without password) aur JWT token
 * @throws Error agar credentials invalid hain
 * 
 * Used By:
 * - POST /api/auth/login
 */
export async function authenticateUser(email: string, password: string) {
  // Email se user dhundte hain
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      profileImage: true,
      passwordHash: true,
      salary: true,
      currency: true,
      createdAt: true,
    }
  })

  // User nahi mila ya password galat hai
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('Invalid credentials')
  }

  // Password hash ko response se remove karte hain (security)
  const { passwordHash, ...userWithoutPassword } = user
  const token = generateToken(user.id)
  
  return { user: userWithoutPassword, token }
}

/**
 * User ID Se User Details Fetch Karta Hai
 * 
 * @param id - User unique ID
 * @returns User object (without password)
 * 
 * Used By:
 * - GET /api/user/profile
 * - Budget warning emails
 * - Monthly reports
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      profileImage: true,
      salary: true,
      currency: true,
      notificationSettings: true,
      createdAt: true,
    }
  })
}

/**
 * User Profile Update Karta Hai
 * 
 * @param id - User ID
 * @param data - Update karne wale fields
 * @returns Updated user object
 * 
 * Used By:
 * - PUT /api/user/profile
 * - POST /api/user/profile/upload (profile image ke liye)
 */
export async function updateUser(id: string, data: Partial<{
  name: string
  email: string
  phone: string
  bio: string
  profileImage: string
  salary: number
  currency: string
}>) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bio: true,
      profileImage: true,
      salary: true,
      currency: true,
      notificationSettings: true,
      createdAt: true,
    }
  })
}

/**
 * User Password Update Karta Hai
 * 
 * Process:
 * 1. Current password verify karta hai
 * 2. New password hash karta hai
 * 3. Database mein update karta hai
 * 
 * @param id - User ID
 * @param currentPassword - Purana password
 * @param newPassword - Naya password
 * @returns Success status
 * @throws Error agar current password galat hai
 * 
 * Used By:
 * - PUT /api/user/password
 */
export async function updateUserPassword(id: string, currentPassword: string, newPassword: string) {
  // User ka current password hash fetch karte hain
  const user = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true }
  })

  // Current password verify karte hain
  if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) {
    throw new Error('Current password is incorrect')
  }

  // New password ko hash karte hain
  const passwordHash = await bcrypt.hash(newPassword, 12)
  
  // Database mein update karte hain
  await prisma.user.update({
    where: { id },
    data: { passwordHash }
  })

  return { success: true }
}

// Expense services
export async function createExpense(userId: string, data: {
  date: string
  title: string
  amount: number
  category: string
  bank: string
  paymentMode: string
  tags: string[]
  notes?: string
}) {
  const expense = await prisma.expense.create({
    data: {
      userId,
      date: parseAppDate(data.date),
      title: data.title,
      amount: data.amount,
      category: data.category,
      bank: data.bank,
      paymentMode: data.paymentMode,
      tags: data.tags,
      notes: data.notes,
    }
  })

  // Expense alert emails are now sent manually via reports

  // Check budget warnings
  await checkBudgetWarnings(userId, data.category, data.amount)

  return expense
}

export async function getExpenses(userId: string, filters?: {
  category?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  const where: any = { userId }
  
  if (filters?.category) {
    where.category = filters.category
  }
  
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {}
    if (filters.dateFrom) where.date.gte = parseAppDate(filters.dateFrom)
    if (filters.dateTo) where.date.lte = parseAppDate(filters.dateTo)
  }

  return prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  })
}

export async function updateExpense(id: string, userId: string, data: Partial<{
  date: string
  title: string
  amount: number
  category: string
  bank: string
  paymentMode: string
  tags: string[]
  notes: string
}>) {
  return prisma.expense.update({
    where: { 
      id,
      userId // Ensure user can only update their own expense
    },
    data: {
      ...(data.date && { date: parseAppDate(data.date) }),
      ...(data.title && { title: data.title }),
      ...(data.amount && { amount: data.amount }),
      ...(data.category && { category: data.category }),
      ...(data.bank && { bank: data.bank }),
      ...(data.paymentMode && { paymentMode: data.paymentMode }),
      ...(data.tags && { tags: data.tags }),
      ...(data.notes !== undefined && { notes: data.notes }),
    }
  })
}

export async function deleteExpense(id: string, userId: string) {
  return prisma.expense.delete({
    where: { id, userId }
  })
}

// Income services
export async function createIncome(userId: string, data: {
  date: string
  source: string
  amount: number
  notes?: string
}) {
  return prisma.income.create({
    data: {
      userId,
      date: parseAppDate(data.date),
      source: data.source,
      amount: data.amount,
      notes: data.notes,
    }
  })
}

export async function getIncomes(userId: string, filters?: {
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  const where: any = { userId }
  
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {}
    if (filters.dateFrom) where.date.gte = parseAppDate(filters.dateFrom)
    if (filters.dateTo) where.date.lte = parseAppDate(filters.dateTo)
  }

  return prisma.income.findMany({
    where,
    orderBy: { date: 'desc' },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  })
}

export async function updateIncome(id: string, userId: string, data: Partial<{
  date: string
  source: string
  amount: number
  notes: string
}>) {
  return prisma.income.update({
    where: { 
      id,
      userId // Ensure user can only update their own income
    },
    data: {
      ...(data.date && { date: parseAppDate(data.date) }),
      ...(data.source && { source: data.source }),
      ...(data.amount && { amount: data.amount }),
      ...(data.notes !== undefined && { notes: data.notes }),
    }
  })
}

export async function deleteIncome(id: string, userId: string) {
  return prisma.income.delete({
    where: { 
      id,
      userId // Ensure user can only delete their own income
    }
  })
}

// Udhar services
export async function createUdhar(userId: string, data: {
  person: string
  reason: string
  total: number
  direction: string
}) {
  return prisma.udhar.create({
    data: {
      userId,
      person: data.person,
      reason: data.reason,
      total: data.total,
      remaining: data.total,
      direction: data.direction,
    }
  })
}

export async function getUdhars(userId: string) {
  return prisma.udhar.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateUdhar(id: string, userId: string, data: Partial<{
  person: string
  reason: string
  total: number
  remaining: number
  direction: string
}>) {
  return prisma.udhar.update({
    where: { id, userId },
    data,
  })
}

export async function deleteUdhar(id: string, userId: string) {
  return prisma.udhar.delete({
    where: { id, userId }
  })
}

// Subscription services
export async function getSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function detectSubscriptions(userId: string) {
  // Get recurring expenses (same title, similar amounts, regular intervals)
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 1000, // Last 1000 expenses
  })

  const subscriptionCandidates = new Map()

  // Group expenses by title and analyze patterns
  expenses.forEach(expense => {
    const key = expense.title.toLowerCase().trim()
    if (!subscriptionCandidates.has(key)) {
      subscriptionCandidates.set(key, [])
    }
    subscriptionCandidates.get(key).push(expense)
  })

  const detectedSubscriptions = []

  for (const [title, expenseList] of subscriptionCandidates) {
    if (expenseList.length >= 3) { // At least 3 occurrences
      const amounts = expenseList.map((e: any) => e.amount)
      const avgAmount = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length
      const amountVariance = Math.max(...amounts) - Math.min(...amounts)
      
      // If amount variance is less than 10% of average, consider it a subscription
      if (amountVariance / avgAmount < 0.1) {
        // Calculate interval
        const dates = expenseList.map((e: any) => new Date(e.date)).sort()
        const intervals = []
        for (let i = 1; i < dates.length; i++) {
          const daysDiff = Math.round((dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24))
          intervals.push(daysDiff)
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        let intervalType = 'monthly'
        
        if (avgInterval <= 10) intervalType = 'weekly'
        else if (avgInterval <= 35) intervalType = 'monthly'
        else if (avgInterval <= 100) intervalType = 'quarterly'
        else intervalType = 'yearly'

        detectedSubscriptions.push({
          name: title,
          amount: Math.round(avgAmount),
          interval: intervalType,
          lastChargedAt: dates[dates.length - 1],
          nextDueDate: new Date(dates[dates.length - 1].getTime() + (avgInterval * 24 * 60 * 60 * 1000)),
          source: 'detected',
          expenseIds: expenseList.map((e: any) => e.id),
        })
      }
    }
  }

  // Save detected subscriptions
  for (const sub of detectedSubscriptions) {
    await prisma.subscription.upsert({
      where: {
        userId_name: { userId, name: sub.name }
      },
      update: {
        amount: sub.amount,
        interval: sub.interval,
        lastChargedAt: sub.lastChargedAt,
        nextDueDate: sub.nextDueDate,
        expenseIds: sub.expenseIds,
      },
      create: {
        userId,
        ...sub,
      }
    })
  }

  return detectedSubscriptions
}

// Budget warning system
async function checkBudgetWarnings(userId: string, category: string, newExpenseAmount: number) {
  // This is a simplified budget check - you can enhance this based on user-defined budgets
  const currentMonth = new Date()
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  const monthlyExpenses = await prisma.expense.findMany({
    where: {
      userId,
      category,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      }
    }
  })

  const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  
  // Simple budget rules - you can make this configurable per user
  const budgetLimits: Record<string, number> = {
    'Food': 15000,
    'Transport': 8000,
    'Shopping': 10000,
    'Entertainment': 5000,
    'Bills': 12000,
    'Healthcare': 8000,
    'Education': 10000,
  }

  const budgetLimit = budgetLimits[category]
  if (budgetLimit && totalSpent >= budgetLimit * 0.8) { // 80% threshold
    try {
      const user = await getUserById(userId)
      if (user) {
        await sendEmail({
          to: user.email,
          ...emailTemplates.budgetWarning(user.name, category, totalSpent, budgetLimit)
        })
      }
    } catch (error) {
      console.error('Failed to send budget warning:', error)
    }
  }
}

// Analytics services
export async function getFinancialSummary(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      }
    }),
    prisma.income.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate }
      }
    })
  ])

  const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  const totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0)
  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, savings) / totalIncome) * 100) : 0

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'General'
    acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0)
    return acc
  }, {} as Record<string, number>)

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }))

  return {
    totalExpenses,
    totalIncome,
    savings,
    savingsRate,
    topCategories,
    expenseCount: expenses.length,
    incomeCount: incomes.length,
  }
}

// Monthly report generation and email
export async function generateMonthlyReport(userId: string, year: number, month: number) {
  const summary = await getFinancialSummary(userId, year, month)
  const user = await getUserById(userId)
  
  if (user) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    
    const reportData = {
      ...summary,
      month: monthNames[month - 1],
      year,
    }

    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.monthlyReport(user.name, reportData)
      })
      return { success: true, reportData }
    } catch (error) {
      console.error('Failed to send monthly report:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  return { success: false, error: 'User not found' }
}
