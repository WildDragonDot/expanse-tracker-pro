/**
 * Firestore Udhar (Debt / Borrow / Lend) Service
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
import { UdharDoc } from './types'

export class FirestoreUdharService {
  public static async addUdhar(userId: string, data: Omit<UdharDoc, 'id' | 'userId' | 'createdAt'>): Promise<UdharDoc> {
    const colRef = collection(db, 'users', userId, 'udhar')
    const newDoc: UdharDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, newDoc)
    return { ...newDoc, id: docRef.id }
  }

  public static async updateUdhar(userId: string, udharId: string, data: Partial<UdharDoc>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'udhar', udharId)
    await updateDoc(docRef, data)
  }

  public static async deleteUdhar(userId: string, udharId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'udhar', udharId)
    await deleteDoc(docRef)
  }

  public static async getUdhars(userId: string): Promise<UdharDoc[]> {
    const colRef = collection(db, 'users', userId, 'udhar')
    const q = query(colRef, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UdharDoc))
  }

  public static subscribeToUdhar(
    userId: string,
    callback: (udhars: UdharDoc[]) => void
  ): () => void {
    const colRef = collection(db, 'users', userId, 'udhar')
    const q = query(colRef, orderBy('createdAt', 'desc'))

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UdharDoc))
      callback(list)
    })
  }
}
