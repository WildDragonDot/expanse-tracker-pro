/**
 * Firestore Monthly Budget Service
 */
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.config'
import { MonthlyBudgetDoc } from './types'

export class FirestoreBudgetService {
  /**
   * Set or update a monthly category budget
   */
  public static async setBudget(
    userId: string,
    data: Omit<MonthlyBudgetDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<MonthlyBudgetDoc> {
    // Unique ID per user-month-year-category
    const cleanCat = data.category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const budgetId = `${data.year}_${data.month}_${cleanCat}`
    const docRef = doc(db, 'users', userId, 'monthlyBudgets', budgetId)

    const newDoc: MonthlyBudgetDoc = {
      ...data,
      id: budgetId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(docRef, newDoc, { merge: true })
    return newDoc
  }

  /**
   * Get budgets for a given month and year
   */
  public static async getBudgets(userId: string, year: number, month: number): Promise<MonthlyBudgetDoc[]> {
    const colRef = collection(db, 'users', userId, 'monthlyBudgets')
    const q = query(colRef, where('year', '==', year), where('month', '==', month))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MonthlyBudgetDoc))
  }

  /**
   * Delete a budget
   */
  public static async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'monthlyBudgets', budgetId)
    await deleteDoc(docRef)
  }

  /**
   * Subscribe to real-time budget updates
   */
  public static subscribeToBudgets(
    userId: string,
    year: number,
    month: number,
    callback: (budgets: MonthlyBudgetDoc[]) => void
  ): () => void {
    const colRef = collection(db, 'users', userId, 'monthlyBudgets')
    const q = query(colRef, where('year', '==', year), where('month', '==', month))

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MonthlyBudgetDoc))
      callback(list)
    })
  }
}
