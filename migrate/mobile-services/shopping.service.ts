/**
 * Firestore Shopping List & Event Planning Service
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
import { ShoppingListDoc, ShoppingCategoryDoc, ShoppingItemDoc } from './types'

export class FirestoreShoppingService {
  // Simple Shopping List (Daily, Weekly, Monthly)
  public static async addItem(
    userId: string,
    data: Omit<ShoppingListDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ShoppingListDoc> {
    const colRef = collection(db, 'users', userId, 'shoppingLists')
    const newDoc: ShoppingListDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, newDoc)
    return { ...newDoc, id: docRef.id }
  }

  public static async toggleItemComplete(
    userId: string,
    itemId: string,
    completed: boolean
  ): Promise<void> {
    const docRef = doc(db, 'users', userId, 'shoppingLists', itemId)
    await updateDoc(docRef, { completed, updatedAt: new Date().toISOString() })
  }

  public static async deleteItem(userId: string, itemId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'shoppingLists', itemId)
    await deleteDoc(docRef)
  }

  public static subscribeToShoppingList(
    userId: string,
    callback: (items: ShoppingListDoc[]) => void
  ): () => void {
    const colRef = collection(db, 'users', userId, 'shoppingLists')
    const q = query(colRef, orderBy('createdAt', 'desc'))

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShoppingListDoc))
      callback(list)
    })
  }

  // Event & Category Shopping
  public static async getCategories(userId: string): Promise<ShoppingCategoryDoc[]> {
    const colRef = collection(db, 'users', userId, 'shoppingCategories')
    const snap = await getDocs(colRef)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShoppingCategoryDoc))
  }

  public static async addCategory(
    userId: string,
    data: Omit<ShoppingCategoryDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ShoppingCategoryDoc> {
    const colRef = collection(db, 'users', userId, 'shoppingCategories')
    const newDoc: ShoppingCategoryDoc = {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = await addDoc(colRef, newDoc)
    return { ...newDoc, id: docRef.id }
  }
}
