/**
 * Firestore Expense Service (Real-time & Offline-First)
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.config'
import { ExpenseDoc } from './types'

export class FirestoreExpenseService {
  /**
   * Add a new Expense
   */
  public static async addExpense(userId: string, data: Omit<ExpenseDoc, 'id' | 'userId' | 'createdAt'>): Promise<ExpenseDoc> {
    const expensesCol = collection(db, 'users', userId, 'expenses')
    const newDoc: ExpenseDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = await addDoc(expensesCol, newDoc)
    return { ...newDoc, id: docRef.id }
  }

  /**
   * Update an existing Expense
   */
  public static async updateExpense(userId: string, expenseId: string, data: Partial<ExpenseDoc>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  }

  /**
   * Delete an Expense
   */
  public static async deleteExpense(userId: string, expenseId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId)
    await deleteDoc(docRef)
  }

  /**
   * Fetch expenses with optional date filtering
   */
  public static async getExpenses(
    userId: string,
    options?: { startDate?: string; endDate?: string; category?: string; maxLimit?: number }
  ): Promise<ExpenseDoc[]> {
    const expensesCol = collection(db, 'users', userId, 'expenses')
    let q = query(expensesCol, orderBy('date', 'desc'))

    if (options?.maxLimit) {
      q = query(q, limit(options.maxLimit))
    }

    const snap = await getDocs(q)
    let results: ExpenseDoc[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseDoc))

    // Client-side filtering for fast compound date ranges
    if (options?.startDate) {
      results = results.filter((item) => item.date >= options.startDate!)
    }
    if (options?.endDate) {
      results = results.filter((item) => item.date <= options.endDate!)
    }
    if (options?.category && options.category !== 'All') {
      results = results.filter((item) => item.category.toLowerCase() === options.category!.toLowerCase())
    }

    return results
  }

  /**
   * Real-time listener for expenses (Instant UI updates)
   */
  public static subscribeToExpenses(
    userId: string,
    callback: (expenses: ExpenseDoc[]) => void
  ): () => void {
    const expensesCol = collection(db, 'users', userId, 'expenses')
    const q = query(expensesCol, orderBy('date', 'desc'))

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseDoc))
        callback(list)
      },
      (error) => {
        console.warn('Expenses listener error:', error)
      }
    )
  }

  /**
   * Calculate monthly totals and category distribution
   */
  public static async getMonthlySummary(
    userId: string,
    year: number,
    month: number
  ): Promise<{
    totalExpense: number
    categoryBreakdown: { [category: string]: number }
    dailyExpenses: { [day: number]: number }
  }> {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const expenses = await this.getExpenses(userId, { startDate, endDate })

    let totalExpense = 0
    const categoryBreakdown: { [category: string]: number } = {}
    const dailyExpenses: { [day: number]: number } = {}

    for (const exp of expenses) {
      totalExpense += exp.amount
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount

      const day = new Date(exp.date).getDate()
      dailyExpenses[day] = (dailyExpenses[day] || 0) + exp.amount
    }

    return { totalExpense, categoryBreakdown, dailyExpenses }
  }
}
