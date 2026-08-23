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

  // User nahi mila, ya account Google-only hai (koi password set hi nahi hai), ya password galat hai
  if (!user || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
    if (user && !user.passwordHash) {
      throw new Error('This account uses Google Sign-In. Please continue with Google.')
    }
    throw new Error('Invalid credentials')
  }

  // Password hash ko response se remove karte hain (security)
  const { passwordHash, ...userWithoutPassword } = user
  const token = generateToken(user.id)

  return { user: userWithoutPassword, token }
}

// OAuth client ID(s) allowed as the "audience" of a Google ID token.
// Client IDs are not secret (they ship inside the mobile app itself) — only the
// token's signature and claims need verifying, which happens against Google below.
const GOOGLE_OAUTH_AUDIENCES = [
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  '268456368819-2oepgmd8t8jknh4vqs9rtnf6lem1rfml.apps.googleusercontent.com',
].filter(Boolean) as string[]

/**
 * Google ID Token Verify Karta Hai Google Ke Servers Se
 *
 * Ise koi bhi fake/self-signed token accept nahi karega — Google khud signature,
 * expiry aur audience verify karta hai. Isiliye client (mobile app) se aaya hua
 * idToken blindly trust nahi kiya jaata.
 *
 * @param idToken - Google Sign-In se mila JWT ID token
 * @throws Error agar token invalid, expired, ya kisi aur app ke liye issue hua ho
 */
async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
}> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!res.ok) {
    throw new Error('Invalid or expired Google token')
  }

  const payload = await res.json()

  if (!GOOGLE_OAUTH_AUDIENCES.includes(payload.aud)) {
    throw new Error('Google token was not issued for this app')
  }
  if (!payload.email || payload.email_verified !== 'true') {
    throw new Error('Google account email is not verified')
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: true,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture,
  }
}

/**
 * Google Sign-In Se User Ko Authenticate (Ya Naya Account Create) Karta Hai
 *
 * Process:
 * 1. idToken ko Google se verify karte hain (asli, tampered nahi)
 * 2. googleId se existing linked account dhundte hain
 * 3. Nahi mila to email se existing (password-based) account dhundte hain aur google se link karte hain
 * 4. Wo bhi nahi mila to naya Google-only account banate hain (passwordHash null)
 * 5. JWT token generate karte hain — baaki app isi token se normal auth ki tarah chalta hai
 *
 * @param idToken - Google Sign-In se mila JWT ID token
 * @returns User object (without password) aur JWT token
 *
 * Used By:
 * - POST /api/auth/google
 */
export async function authenticateGoogleUser(idToken: string) {
  const google = await verifyGoogleIdToken(idToken)

  let user = await prisma.user.findUnique({ where: { googleId: google.sub } })

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: google.email } })

    if (existingByEmail) {
      // Same email already registered (probably via password signup) — link Google to it
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: google.sub,
          profileImage: existingByEmail.profileImage || google.picture,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          name: google.name,
          email: google.email,
          googleId: google.sub,
          authProvider: 'google',
          profileImage: google.picture,
        },
      })

      try {
        await sendEmail({ to: user.email, ...emailTemplates.welcome(user.name) })
      } catch (error) {
        console.error('Failed to send welcome email:', error)
      }
    }
  }

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

  // Current password verify karte hain (Google-only account ke paas password hi nahi hota)
  if (!user || !user.passwordHash || !await bcrypt.compare(currentPassword, user.passwordHash)) {
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
  phoneNumber?: string
  reason: string
  total: number
  direction: string
  dueDate?: string
}) {
  return prisma.udhar.create({
    data: {
      userId,
      person: data.person,
      phoneNumber: data.phoneNumber,
      reason: data.reason,
      total: data.total,
      remaining: data.total,
      direction: data.direction,
      dueDate: data.dueDate ? parseAppDate(data.dueDate) : null,
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
  phoneNumber: string
  reason: string
  total: number
  remaining: number
  direction: string
  dueDate: string
}>) {
  const { dueDate, ...rest } = data
  return prisma.udhar.update({
    where: { id, userId },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? parseAppDate(dueDate) : null } : {}),
    },
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

/**
 * Ek Recurring Bill (Subscription Rule) Banata Hai
 *
 * Rule ke saath uski pehli BillOccurrence bhi turant create hoti hai, taaki
 * mobile app ko "Add Bill" karte hi timeline me real entry dikhe.
 *
 * @param userId - Owner user ID
 * @param data - Bill details (mobile RecurringPayment shape)
 * @returns Naya Subscription record
 *
 * Used By:
 * - POST /api/subscriptions
 */
export async function createSubscription(userId: string, data: {
  title: string
  amount: number
  category: string
  frequency: string
  nextDueDate: string
  reminderDays?: number[]
  isAutoDebit?: boolean
  isTrial?: boolean
  trialEndDate?: string
  notes?: string
}) {
  const nextDueDate = parseAppDate(data.nextDueDate)

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      name: data.title,
      amount: Math.round(data.amount),
      category: data.category || 'General',
      interval: data.frequency,
      reminderDays: data.reminderDays || [],
      isAutoDebit: data.isAutoDebit || false,
      isTrial: data.isTrial || false,
      trialEndDate: data.trialEndDate ? parseAppDate(data.trialEndDate) : null,
      notes: data.notes,
      nextDueDate,
      lastChargedAt: nextDueDate,
      active: true,
      source: 'manual',
      expenseIds: [],
    },
  })

  await prisma.billOccurrence.create({
    data: {
      subscriptionId: subscription.id,
      userId,
      title: subscription.name,
      amount: subscription.amount,
      category: subscription.category,
      dueDate: subscription.nextDueDate,
      status: 'UPCOMING',
      notes: subscription.notes,
    },
  })

  return subscription
}

/**
 * Ek Recurring Bill Rule Ko Delete Karta Hai
 *
 * Uski saari BillOccurrence bhi cascade se delete ho jaati hain (schema me
 * onDelete: Cascade set hai). Already-logged expenses touch nahi hoti.
 *
 * @param id - Subscription ID
 * @param userId - Owner user ID (ownership check ke liye)
 * @throws Error agar record na mile ya kisi aur user ka ho
 *
 * Used By:
 * - DELETE /api/subscriptions/[id]
 */
export async function deleteSubscription(id: string, userId: string) {
  const existing = await prisma.subscription.findFirst({ where: { id, userId } })
  if (!existing) {
    throw new Error('Recurring bill not found')
  }
  await prisma.subscription.delete({ where: { id } })
}

/**
 * Bill Frequency Ke Hisaab Se Agli Due Date Nikalta Hai
 *
 * @param current - Current due date
 * @param frequency - DAILY | WEEKLY | MONTHLY | QUARTERLY | HALF_YEARLY | YEARLY
 *   (ya detectSubscriptions se aaya lowercase 'weekly'/'monthly'/'quarterly'/'yearly')
 */
function computeNextDueDate(current: Date, frequency: string): Date {
  const next = new Date(current)
  switch ((frequency || '').toUpperCase()) {
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      break
    case 'HALF_YEARLY':
      next.setMonth(next.getMonth() + 6)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1)
      break
    case 'MONTHLY':
    default:
      next.setMonth(next.getMonth() + 1)
      break
  }
  return next
}

/**
 * User Ke Saare Bill Occurrences Fetch Karta Hai (Aur Pehle Sync Karta Hai)
 *
 * Sync step:
 * 1. Har active subscription ke liye ek open (UPCOMING/OVERDUE/SNOOZED) occurrence
 *    guarantee karta hai — agar koi nahi hai (naya bill, ya pichla abhi-abhi paid hua),
 *    to nextDueDate par ek naya UPCOMING occurrence bana deta hai.
 * 2. Jo UPCOMING/SNOOZED occurrence ki dueDate beet chuki hai unhe OVERDUE mark karta hai.
 *
 * Isse mobile app ko hamesha live, real state milti hai — koi hardcoded sample data nahi.
 *
 * @param userId - Owner user ID
 * @returns BillOccurrence[] (naya-pehle order me)
 *
 * Used By:
 * - GET /api/subscriptions/occurrences
 */
export async function getBillOccurrences(userId: string) {
  const activeSubs = await prisma.subscription.findMany({ where: { userId, active: true } })

  for (const sub of activeSubs) {
    const openOccurrence = await prisma.billOccurrence.findFirst({
      where: { subscriptionId: sub.id, status: { in: ['UPCOMING', 'OVERDUE', 'SNOOZED'] } },
    })

    if (!openOccurrence) {
      await prisma.billOccurrence.create({
        data: {
          subscriptionId: sub.id,
          userId,
          title: sub.name,
          amount: sub.amount,
          category: sub.category,
          dueDate: sub.nextDueDate,
          status: 'UPCOMING',
          notes: sub.notes,
        },
      })
    }
  }

  const now = new Date()
  await prisma.billOccurrence.updateMany({
    where: { userId, status: { in: ['UPCOMING', 'SNOOZED'] }, dueDate: { lt: now } },
    data: { status: 'OVERDUE' },
  })

  return prisma.billOccurrence.findMany({
    where: { userId },
    orderBy: { dueDate: 'asc' },
    take: 200,
  })
}

/**
 * Ek Bill Occurrence Ko "Paid" Mark Karta Hai
 *
 * Process:
 * 1. Occurrence ko PAID mark karta hai
 * 2. Uske against ek asli Expense entry banata hai (expense ledger me real transaction)
 * 3. Parent subscription ki nextDueDate agle cycle tak advance karta hai
 * 4. Agla UPCOMING occurrence create karta hai — taaki timeline continue rahe
 *
 * @param occurrenceId - BillOccurrence ID
 * @param userId - Owner user ID (ownership check)
 * @param data - Payment details (bank/date/notes) jo expense ledger me record honge
 * @throws Error agar occurrence na mile ya already PAID ho
 *
 * Used By:
 * - PUT /api/subscriptions/occurrences/[id]
 */
export async function markOccurrencePaid(occurrenceId: string, userId: string, data: {
  bank?: string
  date?: string
  notes?: string
}) {
  const occurrence = await prisma.billOccurrence.findFirst({ where: { id: occurrenceId, userId } })
  if (!occurrence) {
    throw new Error('Bill occurrence not found')
  }
  if (occurrence.status === 'PAID') {
    throw new Error('This bill is already marked as paid')
  }

  const paidAt = data.date ? parseAppDate(data.date) : new Date()

  const expense = await createExpense(userId, {
    date: paidAt.toISOString(),
    title: occurrence.title,
    amount: occurrence.amount,
    category: occurrence.category,
    bank: data.bank || 'Not Specified',
    paymentMode: 'Bill Payment',
    tags: ['recurring-bill'],
    notes: data.notes || `Auto-logged from recurring bill reminder`,
  })

  const updatedOccurrence = await prisma.billOccurrence.update({
    where: { id: occurrenceId },
    data: { status: 'PAID', paidAt, expenseId: expense.id },
  })

  const subscription = await prisma.subscription.findUnique({ where: { id: occurrence.subscriptionId } })
  if (subscription) {
    const nextDueDate = computeNextDueDate(subscription.nextDueDate, subscription.interval)

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { nextDueDate, lastChargedAt: paidAt, expenseIds: [...subscription.expenseIds, expense.id] },
    })

    await prisma.billOccurrence.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        title: subscription.name,
        amount: subscription.amount,
        category: subscription.category,
        dueDate: nextDueDate,
        status: 'UPCOMING',
        notes: subscription.notes,
      },
    })
  }

  return { occurrence: updatedOccurrence, expense }
}

/**
 * Ek Bill Occurrence Ka Reminder Snooze Karta Hai
 *
 * @param occurrenceId - BillOccurrence ID
 * @param userId - Owner user ID (ownership check)
 * @param days - Kitne din ke liye snooze karna hai
 * @throws Error agar occurrence na mile ya already PAID ho
 *
 * Used By:
 * - PATCH /api/subscriptions/occurrences/[id]
 */
export async function snoozeOccurrence(occurrenceId: string, userId: string, days: number) {
  const occurrence = await prisma.billOccurrence.findFirst({ where: { id: occurrenceId, userId } })
  if (!occurrence) {
    throw new Error('Bill occurrence not found')
  }
  if (occurrence.status === 'PAID') {
    throw new Error('This bill is already marked as paid')
  }

  const snoozedUntil = new Date()
  snoozedUntil.setDate(snoozedUntil.getDate() + Math.max(1, days))

  return prisma.billOccurrence.update({
    where: { id: occurrenceId },
    data: {
      status: 'SNOOZED',
      snoozedUntil,
      dueDate: snoozedUntil,
      notes: `Reminder snoozed for ${days} day(s)`,
    },
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

/**
 * Financial Summary Se Health Score (0-100) Nikalta Hai
 *
 * Shared by /api/smart-score/recalculate aur /api/analytics/insights taaki dono
 * jagah bilkul same formula use ho — koi alag/fake number na dikhe.
 */
export function computeHealthScore(summary: {
  totalIncome: number
  totalExpenses: number
  savings: number
  incomeCount: number
  topCategories: { category: string; amount: number }[]
}) {
  const metrics = { savingsRate: 0, expenseVariability: 0, budgetAdherence: 0, incomeStability: 0 }
  let score = 0

  if (summary.totalIncome > 0) {
    const savingsRate = (summary.savings / summary.totalIncome) * 100
    metrics.savingsRate = Math.max(0, Math.min(100, savingsRate))
    metrics.budgetAdherence =
      summary.totalExpenses <= summary.totalIncome
        ? 100
        : Math.max(0, Math.round((1 - (summary.totalExpenses - summary.totalIncome) / summary.totalIncome) * 100))
    metrics.incomeStability = summary.incomeCount > 0 ? 85 : 0
    metrics.expenseVariability = summary.topCategories.length > 1 ? 75 : 50

    score = Math.round(
      metrics.savingsRate * 0.4 + metrics.budgetAdherence * 0.3 + metrics.incomeStability * 0.2 + metrics.expenseVariability * 0.1
    )
    if (summary.totalExpenses === 0) {
      metrics.budgetAdherence = 0
      metrics.incomeStability = 0
      metrics.expenseVariability = 0
      score = 0
    } else {
      metrics.budgetAdherence = 20
      metrics.incomeStability = 0
      metrics.expenseVariability = 30
      score = 15
    }
  }

  score = Math.max(0, Math.min(100, score))
  return { score, metrics }
}

const ANALYTICS_CATEGORY_COLORS = ['#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#F43F5E', '#EC4899', '#3B82F6', '#6366F1']

/**
 * Mobile "Analytics" Tab Ke Liye Poora Real Data Bundle Ek Hi Call Me
 *
 * Sab kuch actual Expense/Income/MonthlyBudget rows se derive hota hai — koi
 * hardcoded chart data nahi. Charts: monthly trend, category breakdown,
 * payment methods/types, weekly spending, income sources, daily pattern,
 * savings-rate trend.
 *
 * @param userId - Owner user ID
 * @param months - Kitne pichhle mahine trend me chahiye (default 6)
 *
 * Used By:
 * - GET /api/analytics/insights
 */
export async function getAnalyticsInsights(userId: string, months: number = 6) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // 1. Monthly trend (income/expenses/savings/savingsRate) for the last N months
  const monthlyTrend: { label: string; year: number; month: number; income: number; expenses: number; savings: number; savingsRate: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1)
    const monthSummary = await getFinancialSummary(userId, d.getFullYear(), d.getMonth() + 1)
    monthlyTrend.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      income: monthSummary.totalIncome,
      expenses: monthSummary.totalExpenses,
      savings: monthSummary.savings,
      savingsRate: monthSummary.savingsRate,
    })
  }

  const currentSummary = await getFinancialSummary(userId, currentYear, currentMonth)
  const { score: healthScore } = computeHealthScore(currentSummary)

  // 2. Category breakdown for the current month, joined with any real budget limit
  const [currentExpenses, currentIncomes, currentBudgets] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: new Date(currentYear, currentMonth - 1, 1), lte: new Date(currentYear, currentMonth, 0, 23, 59, 59, 999) },
      },
    }),
    prisma.income.findMany({
      where: {
        userId,
        date: { gte: new Date(currentYear, currentMonth - 1, 1), lte: new Date(currentYear, currentMonth, 0, 23, 59, 59, 999) },
      },
    }),
    prisma.monthlyBudget.findMany({ where: { userId, month: currentMonth, year: currentYear, isActive: true } }),
  ])

  const categoryAgg = new Map<string, { amount: number; count: number }>()
  for (const exp of currentExpenses) {
    const entry = categoryAgg.get(exp.category) || { amount: 0, count: 0 }
    entry.amount += exp.amount
    entry.count += 1
    categoryAgg.set(exp.category, entry)
  }
  const totalCategorySpend = Array.from(categoryAgg.values()).reduce((s, c) => s + c.amount, 0) || 1
  const budgetByCategory = new Map(currentBudgets.map((b) => [b.category, b.amount]))

  const categoryBreakdown = Array.from(categoryAgg.entries())
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 8)
    .map(([name, agg], idx) => ({
      name,
      amount: agg.amount,
      count: agg.count,
      percentage: Math.round((agg.amount / totalCategorySpend) * 100),
      color: ANALYTICS_CATEGORY_COLORS[idx % ANALYTICS_CATEGORY_COLORS.length],
      budget: budgetByCategory.get(name) || 0,
    }))

  // 3. Payment methods (real, whatever the user actually typed — e.g. "UPI", "Cash")
  const paymentMethodAgg = new Map<string, number>()
  for (const exp of currentExpenses) {
    paymentMethodAgg.set(exp.paymentMode, (paymentMethodAgg.get(exp.paymentMode) || 0) + exp.amount)
  }
  const paymentMethods = Array.from(paymentMethodAgg.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([label, amount], idx) => ({ label, amount, color: ANALYTICS_CATEGORY_COLORS[idx % ANALYTICS_CATEGORY_COLORS.length] }))

  // 4. Payment types — group the same real paymentMode values into 3 broad buckets
  let digitalTotal = 0, bankCardTotal = 0, cashTotal = 0
  for (const [mode, amount] of paymentMethodAgg) {
    const m = mode.toLowerCase()
    if (m.includes('upi')) digitalTotal += amount
    else if (m.includes('cash')) cashTotal += amount
    else bankCardTotal += amount
  }
  const paymentTypes = [
    { name: 'Digital (UPI)', value: digitalTotal, color: '#10B981' },
    { name: 'Bank & Cards', value: bankCardTotal, color: '#8B5CF6' },
    { name: 'Cash', value: cashTotal, color: '#F59E0B' },
  ].filter((t) => t.value > 0)

  // 5. Weekly spending within the current month (Week 1-4, day 29+ folded into Week 4)
  const weeklyBuckets = [0, 0, 0, 0]
  for (const exp of currentExpenses) {
    const day = new Date(exp.date).getDate()
    const weekIdx = Math.min(3, Math.floor((day - 1) / 7))
    weeklyBuckets[weekIdx] += exp.amount
  }
  const weeklySpending = weeklyBuckets.map((amount, idx) => ({ label: `Week ${idx + 1}`, amount }))

  // 6. Income sources for the current month
  const incomeSourceAgg = new Map<string, number>()
  for (const inc of currentIncomes) {
    incomeSourceAgg.set(inc.source, (incomeSourceAgg.get(inc.source) || 0) + inc.amount)
  }
  const incomeSources = Array.from(incomeSourceAgg.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value], idx) => ({ name, value, color: ANALYTICS_CATEGORY_COLORS[idx % ANALYTICS_CATEGORY_COLORS.length] }))

  // 7. Daily spending pattern — all-time average spend per weekday, from real expense history
  const allExpenses = await prisma.expense.findMany({ where: { userId }, select: { amount: true, date: true } })
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0]
  const weekdayDateSets: Set<string>[] = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set()]
  for (const exp of allExpenses) {
    const d = new Date(exp.date)
    const dow = d.getDay()
    weekdayTotals[dow] += exp.amount
    weekdayDateSets[dow].add(d.toISOString().split('T')[0])
  }
  const dailySpendingPattern = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, idx) => ({
    label,
    amount: weekdayDateSets[idx].size > 0 ? Math.round(weekdayTotals[idx] / weekdayDateSets[idx].size) : 0,
  }))

  return {
    currentMonth: {
      income: currentSummary.totalIncome,
      expenses: currentSummary.totalExpenses,
      savings: currentSummary.savings,
      savingsRate: currentSummary.savingsRate,
      healthScore,
    },
    monthlyTrend,
    categoryBreakdown,
    paymentMethods,
    paymentTypes,
    weeklySpending,
    incomeSources,
    dailySpendingPattern,
  }
}

/**
 * Ek Arbitrary Date Range Ke Liye Financial Summary (Reports Tab Ke Liye)
 *
 * getFinancialSummary calendar-month tak simit hai; yeh function "Last 90 Days"
 * ya "Year to Date" jaise custom ranges ke liye wahi tarah ka real summary deta hai.
 *
 * @param userId - Owner user ID
 * @param startDate - Range start (inclusive)
 * @param endDate - Range end (inclusive)
 *
 * Used By:
 * - GET /api/analytics/range
 */
export async function getRangeSummary(userId: string, startDate: Date, endDate: Date) {
  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
    prisma.income.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
  ])

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((Math.max(0, savings) / totalIncome) * 100) : 0

  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {} as Record<string, number>)
  const totalCategorySpend = totalExpenses || 1
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([category, amount]) => ({ category, amount, percentage: Math.round((amount / totalCategorySpend) * 100) }))

  const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    avgDailySpend: Math.round(totalExpenses / days),
    transactionsCount: expenses.length + incomes.length,
    topCategories,
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
