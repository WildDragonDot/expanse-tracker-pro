const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function recalculateCategoryCosts() {
  try {
    console.log('Starting to recalculate category costs...')

    // Get all categories
    const categories = await prisma.planningCategory.findMany({
      include: {
        expenses: true
      }
    })

    console.log(`Found ${categories.length} categories`)

    for (const category of categories) {
      // Calculate total real cost from all expenses
      const totalRealCost = category.expenses.reduce((sum, expense) => {
        return sum + expense.amount
      }, 0)

      // Update the category
      await prisma.planningCategory.update({
        where: { id: category.id },
        data: { realCost: totalRealCost }
      })

      console.log(`Updated category "${category.name}": Expected ₹${category.expectedCost}, Real ₹${totalRealCost} (${category.expenses.length} expenses)`)
    }

    console.log('\n✅ Successfully recalculated all category costs!')
  } catch (error) {
    console.error('❌ Error recalculating category costs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recalculateCategoryCosts()
