/**
 * Firestore Subscriptions & Recurring Bills Service
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
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/firebase.config'
import { SubscriptionDoc, BillOccurrenceDoc } from './types'

export class FirestoreSubscriptionService {
  /**
   * Add a new Subscription and generate its next bill occurrence
   */
  public static async addSubscription(
    userId: string,
    data: Omit<SubscriptionDoc, 'id' | 'userId' | 'createdAt'>
  ): Promise<SubscriptionDoc> {
    const colRef = collection(db, 'users', userId, 'subscriptions')
    const newDoc: SubscriptionDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, newDoc)
    const savedSub = { ...newDoc, id: docRef.id }

    // Create initial Bill Occurrence
    await this.createOccurrence(userId, {
      subscriptionId: docRef.id,
      userId,
      title: data.name,
      amount: data.amount,
      category: data.category,
      dueDate: data.nextDueDate,
      status: 'UPCOMING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return savedSub
  }

  public static async getSubscriptions(userId: string): Promise<SubscriptionDoc[]> {
    const colRef = collection(db, 'users', userId, 'subscriptions')
    const snap = await getDocs(colRef)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SubscriptionDoc))
  }

  public static async deleteSubscription(userId: string, subId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'subscriptions', subId)
    await deleteDoc(docRef)
  }

  // Bill Occurrences
  public static async createOccurrence(
    userId: string,
    data: Omit<BillOccurrenceDoc, 'id'>
  ): Promise<BillOccurrenceDoc> {
    const colRef = collection(db, 'users', userId, 'billOccurrences')
    const docRef = await addDoc(colRef, data)
    return { ...data, id: docRef.id }
  }

  public static async getOccurrences(userId: string): Promise<BillOccurrenceDoc[]> {
    const colRef = collection(db, 'users', userId, 'billOccurrences')
    const q = query(colRef, orderBy('dueDate', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BillOccurrenceDoc))
  }

  public static async markOccurrencePaid(
    userId: string,
    occurrenceId: string,
    expenseId?: string
  ): Promise<void> {
    const docRef = doc(db, 'users', userId, 'billOccurrences', occurrenceId)
    await updateDoc(docRef, {
      status: 'PAID',
      paidAt: new Date().toISOString(),
      expenseId: expenseId || null,
      updatedAt: new Date().toISOString(),
    })
  }

  public static subscribeToOccurrences(
    userId: string,
    callback: (bills: BillOccurrenceDoc[]) => void
  ): () => void {
    const colRef = collection(db, 'users', userId, 'billOccurrences')
    const q = query(colRef, orderBy('dueDate', 'asc'))

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BillOccurrenceDoc))
      callback(list)
    })
  }
}
