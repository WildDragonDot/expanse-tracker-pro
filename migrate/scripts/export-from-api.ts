/**
 * Direct Live Server Data Exporter via HTTPS API
 * Connects to https://expensetracker.chandandev.online and exports all data
 */
import * as fs from 'fs'
import * as path from 'path'

const API_BASE = 'https://expensetracker.chandandev.online/api'

export async function exportUserDataViaAPI(email: string, pass: string) {
  console.log(`Connecting to Live Server (${API_BASE})...`)

  // 1. Authenticate with live server
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  })

  if (!loginRes.ok) {
    const err = await loginRes.json().catch(() => ({}))
    throw new Error(`Login failed: ${err.message || err.error || loginRes.statusText}`)
  }

  const { token, user } = await loginRes.json()
  console.log(`✅ Authenticated as: ${user.name} (${user.email})`)

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  // 2. Fetch all collections in parallel
  console.log('Fetching live data from production server...')
  const [expenses, incomes, udhar, budgets, categories, shopping]: any[] = await Promise.all([
    fetch(`${API_BASE}/expenses`, { headers }).then((r) => r.json()).catch(() => []),
    fetch(`${API_BASE}/incomes`, { headers }).then((r) => r.json()).catch(() => []),
    fetch(`${API_BASE}/udhar`, { headers }).then((r) => r.json()).catch(() => []),
    fetch(`${API_BASE}/monthly-budget`, { headers }).then((r) => r.json()).catch(() => []),
    fetch(`${API_BASE}/expense-categories`, { headers }).then((r) => r.json()).catch(() => []),
    fetch(`${API_BASE}/shopping-list`, { headers }).then((r) => r.json()).catch(() => []),
  ])

  const fullData = {
    user,
    expenses: Array.isArray(expenses) ? expenses : expenses?.expenses || [],
    incomes: Array.isArray(incomes) ? incomes : incomes?.incomes || [],
    udhar: Array.isArray(udhar) ? udhar : udhar?.records || [],
    monthlyBudgets: Array.isArray(budgets) ? budgets : [],
    categories: Array.isArray(categories) ? categories : [],
    shoppingList: Array.isArray(shopping) ? shopping : [],
  }

  const outDir = path.join(__dirname, '../data')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, 'server-backup.json')
  fs.writeFileSync(outFile, JSON.stringify([fullData], null, 2), 'utf-8')

  console.log(`\n🎉 Live Server Data Exported Successfully!`)
  console.log(`   - File: ${outFile}`)
  console.log(`   - Expenses: ${fullData.expenses.length}`)
  console.log(`   - Incomes: ${fullData.incomes.length}`)
  console.log(`   - Udhar: ${fullData.udhar.length}`)

  return fullData
}
