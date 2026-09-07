/**
 * Firestore Default Categories Seeder
 * Run this script to seed default categories, banks, and payment modes for a user in Firestore
 */
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase.config'

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Transportation', icon: '🚗' },
  { name: 'Bills & Utilities', icon: '💡' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Health & Medical', icon: '💊' },
  { name: 'Education', icon: '📚' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Investments', icon: '📈' },
  { name: 'Rent', icon: '🏠' },
  { name: 'Groceries', icon: '🛒' },
  { name: 'Other', icon: '📦' },
]

export const DEFAULT_BANKS = [
  { name: 'State Bank of India (SBI)', icon: '🏛️' },
  { name: 'HDFC Bank', icon: '🏦' },
  { name: 'ICICI Bank', icon: '🏢' },
  { name: 'Axis Bank', icon: '🏦' },
  { name: 'Kotak Mahindra Bank', icon: '🏦' },
  { name: 'Paytm Payments Bank', icon: '📱' },
  { name: 'Cash in Hand', icon: '💵' },
]

export const DEFAULT_PAYMENT_MODES = [
  { name: 'UPI / GPay / PhonePe', icon: '📱' },
  { name: 'Credit Card', icon: '💳' },
  { name: 'Debit Card', icon: '💳' },
  { name: 'Net Banking', icon: '💻' },
  { name: 'Cash', icon: '💵' },
]

export async function seedDefaultUserData(userId: string) {
  console.log(`Seeding default categories for user: ${userId}...`)

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    const catId = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    await setDoc(doc(db, 'users', userId, 'categories', catId), {
      name: cat.name,
      icon: cat.icon,
      isDefault: true,
      createdAt: new Date().toISOString(),
    })
  }

  for (const bank of DEFAULT_BANKS) {
    const bankId = bank.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    await setDoc(doc(db, 'users', userId, 'banks', bankId), {
      name: bank.name,
      icon: bank.icon,
      isDefault: true,
      createdAt: new Date().toISOString(),
    })
  }

  for (const mode of DEFAULT_PAYMENT_MODES) {
    const modeId = mode.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    await setDoc(doc(db, 'users', userId, 'paymentModes', modeId), {
      name: mode.name,
      icon: mode.icon,
      isDefault: true,
      createdAt: new Date().toISOString(),
    })
  }

  console.log('Seeding completed successfully!')
}
