/**
 * Firestore Savings Goals Service
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.config'
import { SavingsGoalDoc } from './types'

export class FirestoreSavingsService {
  public static async addGoal(
    userId: string,
    data: Omit<SavingsGoalDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<SavingsGoalDoc> {
    const colRef = collection(db, 'users', userId, 'savingsGoals')
    const newDoc: SavingsGoalDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, newDoc)
    return { ...newDoc, id: docRef.id }
  }

  public static async updateGoal(
    userId: string,
    goalId: string,
    data: Partial<SavingsGoalDoc>
  ): Promise<void> {
    const docRef = doc(db, 'users', userId, 'savingsGoals', goalId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  }

  public static async deleteGoal(userId: string, goalId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'savingsGoals', goalId)
    await deleteDoc(docRef)
  }

  public static subscribeToGoals(
    userId: string,
    callback: (goals: SavingsGoalDoc[]) => void
  ): () => void {
    const colRef = collection(db, 'users', userId, 'savingsGoals')

    return onSnapshot(colRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavingsGoalDoc))
      callback(list)
    })
  }
}
