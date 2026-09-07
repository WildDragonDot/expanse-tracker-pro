/**
 * Import JSON Backup directly into Cloud Firestore
 */
import { doc, setDoc, collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase.config'
import * as fs from 'fs'
import * as path from 'path'

export async function importJsonToFirestore(filePath?: string) {
  const targetPath = filePath || path.join(__dirname, '../data/server-backup.json')

  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Backup file not found at: ${targetPath}`)
    return
  }

  const rawData = fs.readFileSync(targetPath, 'utf-8')
  const users = JSON.parse(rawData)

  console.log(`🚀 Starting Firestore import for ${users.length} user(s)...`)

  for (const user of users) {
    const userId = user.id
    console.log(`\nImporting data for user: ${user.email} (${userId})...`)

    // 1. User Profile
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      name: user.name,
      email: user.email,
      salary: user.salary || 0,
      currency: user.currency || 'INR',
      billingCycleStartDay: user.billingCycleStartDay || 1,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }, { merge: true })

    // 2. Expenses
    if (user.expenses?.length) {
      console.log(`  -> Uploading ${user.expenses.length} expenses...`)
      for (const exp of user.expenses) {
        const expId = exp.id
        await setDoc(doc(db, 'users', userId, 'expenses', expId), {
          title: exp.title,
          amount: exp.amount,
          category: exp.category,
          bank: exp.bank,
          paymentMode: exp.paymentMode,
          date: exp.date,
          tags: exp.tags || [],
          notes: exp.notes || '',
          receiptUrl: exp.receiptUrl || '',
          createdAt: exp.createdAt,
        }, { merge: true })
      }
    }

    // 3. Incomes
    if (user.incomes?.length) {
      console.log(`  -> Uploading ${user.incomes.length} incomes...`)
      for (const inc of user.incomes) {
        await setDoc(doc(db, 'users', userId, 'incomes', inc.id), {
          source: inc.source,
          amount: inc.amount,
          date: inc.date,
          notes: inc.notes || '',
          createdAt: inc.createdAt,
        }, { merge: true })
      }
    }

    // 4. Udhar
    if (user.udhar?.length) {
      console.log(`  -> Uploading ${user.udhar.length} udhar records...`)
      for (const u of user.udhar) {
        await setDoc(doc(db, 'users', userId, 'udhar', u.id), {
          person: u.person,
          phoneNumber: u.phoneNumber || '',
          reason: u.reason,
          total: u.total,
          remaining: u.remaining,
          direction: u.direction,
          dueDate: u.dueDate || null,
          createdAt: u.createdAt,
        }, { merge: true })
      }
    }

    // 5. Monthly Budgets
    if (user.monthlyBudgets?.length) {
      console.log(`  -> Uploading ${user.monthlyBudgets.length} budgets...`)
      for (const b of user.monthlyBudgets) {
        const cleanCat = b.category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const budgetId = `${b.year}_${b.month}_${cleanCat}`
        await setDoc(doc(db, 'users', userId, 'monthlyBudgets', budgetId), {
          category: b.category,
          amount: b.amount,
          month: b.month,
          year: b.year,
          spent: b.spent || 0,
          isActive: b.isActive !== false,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        }, { merge: true })
      }
    }
  }

  console.log('\n🎉 ALL SERVER DATA HAS BEEN SUCCESSFULLY IMPORTED TO FIREBASE FIRESTORE!')
}
