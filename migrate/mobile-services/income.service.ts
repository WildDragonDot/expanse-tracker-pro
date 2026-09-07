/**
 * Firestore Income Service
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.config'
import { IncomeDoc } from './types'

export class FirestoreIncomeService {
  public static async addIncome(userId: string, data: Omit<IncomeDoc, 'id' | 'userId' | 'createdAt'>): Promise<IncomeDoc> {
    const incomesCol = collection(db, 'users', userId, 'incomes')
    const newDoc: IncomeDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(incomesCol, newDoc)
    return { ...newDoc, id: docRef.id }
  }

  public static async updateIncome(userId: string, incomeId: string, data: Partial<IncomeDoc>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'incomes', incomeId)
    await updateDoc(docRef, data)
  }

  public static async deleteIncome(userId: string, incomeId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'incomes', incomeId)
    await deleteDoc(docRef)
  }

  public static async getIncomes(userId: string): Promise<IncomeDoc[]> {
    const incomesCol = collection(db, 'users', userId, 'incomes')
    const q = query(incomesCol, orderBy('date', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as IncomeDoc))
  }

  public static subscribeToIncomes(
    userId: string,
    callback: (incomes: IncomeDoc[]) => void
  ): () => void {
    const incomesCol = collection(db, 'users', userId, 'incomes')
    const q = query(incomesCol, orderBy('date', 'desc'))

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IncomeDoc))
      callback(list)
    })
  }
}
