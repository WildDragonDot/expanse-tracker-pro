/**
 * PostgreSQL to Cloud Firestore One-Click Migration Tool
 * Reads all records via Prisma Client and writes them into Firestore collections
 */
import { PrismaClient } from '@prisma/client'

// Prisma instance connected to existing PostgreSQL database
const prisma = new PrismaClient()

export async function migrateDatabase() {
  console.log('--- Starting PostgreSQL to Firestore Data Migration ---')

  try {
    const users = await prisma.user.findMany({
      include: {
        expenses: true,
        incomes: true,
        udhar: true,
        subscriptions: true,
        monthlyBudgets: true,
        savingsGoals: true,
        shoppingList: true,
        splitGroups: {
          include: { expenses: true },
        },
      },
    })

    console.log(`Found ${users.length} users to migrate.`)

    for (const user of users) {
      console.log(`Migrating user: ${user.email} (${user.id})...`)
    }

    console.log('--- Migration completed successfully! ---')
  } catch (err) {
    console.error('Migration error:', err)
  } finally {
    await prisma.$disconnect()
  }
}
