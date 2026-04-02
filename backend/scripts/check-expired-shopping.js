const { PrismaClient } = require('@prisma/client')
const { sendShoppingCategoryEmail } = require('../src/lib/shoppingExport')

const prisma = new PrismaClient()

async function checkExpiredCategories() {
  try {
    console.log('[' + new Date().toISOString() + '] Checking for expired shopping categories...')
    
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Find categories that expired today and are still active
    const expiredCategories = await prisma.shoppingCategory.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lte: now
        }
      },
      include: {
        user: true,
        items: true
      }
    })
    
    console.log(`Found ${expiredCategories.length} expired categories`)
    
    for (const category of expiredCategories) {
      try {
        // Mark category as inactive
        await prisma.shoppingCategory.update({
          where: { id: category.id },
          data: { isActive: false }
        })
        
        console.log(`Marked category "${category.name}" as inactive`)
        
        // Send email with bill if user has email
        if (category.user.email) {
          await sendShoppingCategoryEmail(category, category.items, category.user.email)
          console.log(`Sent expiry email to ${category.user.email} for category "${category.name}"`)
        }
      } catch (error) {
        console.error(`Error processing category ${category.id}:`, error)
      }
    }
    
    console.log('[' + new Date().toISOString() + '] Expired categories check completed')
  } catch (error) {
    console.error('Error checking expired categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkExpiredCategories()
