/**
 * Firestore Split Group & Bill Splitting Service
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
import { SplitGroupDoc, SplitExpenseDoc } from './types'

export class FirestoreSplitService {
  public static async createGroup(
    userId: string,
    data: Omit<SplitGroupDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<SplitGroupDoc> {
    const colRef = collection(db, 'users', userId, 'splitGroups')
    const newDoc: SplitGroupDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, newDoc)
    return { ...newDoc, id: docRef.id }
  }

  public static async getGroups(userId: string): Promise<SplitGroupDoc[]> {
    const colRef = collection(db, 'users', userId, 'splitGroups')
    const snap = await getDocs(colRef)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SplitGroupDoc))
  }

  public static async deleteGroup(userId: string, groupId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'splitGroups', groupId)
    await deleteDoc(docRef)
  }

  public static async addGroupExpense(
    userId: string,
    groupId: string,
    data: Omit<SplitExpenseDoc, 'id' | 'groupId' | 'createdAt'>
  ): Promise<SplitExpenseDoc> {
    const colRef = collection(db, 'users', userId, 'splitGroups', groupId, 'expenses')
    const newDoc: SplitExpenseDoc = {
      ...data,
      groupId,
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, newDoc)
    return { ...newDoc, id: docRef.id }
  }

  public static async getGroupExpenses(userId: string, groupId: string): Promise<SplitExpenseDoc[]> {
    const colRef = collection(db, 'users', userId, 'splitGroups', groupId, 'expenses')
    const q = query(colRef, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SplitExpenseDoc))
  }
}
