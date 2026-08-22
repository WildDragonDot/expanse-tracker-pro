const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'wikeba2568@alexida.com' }
    })

    if (existingUser) {
      console.log('✅ Test user already exists!')
      console.log('Email: wikeba2568@alexida.com')
      console.log('Password: password123')
      return
    }

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10)
    
    const user = await prisma.user.create({
      data: {
        name: 'Dragon',
        email: 'wikeba2568@alexida.com',
        passwordHash,
        phone: '+1234567890',
        bio: 'Test user account',
        salary: 50000,
        currency: 'INR'
      }
    })

    console.log('✅ Test user created successfully!')
    console.log('Email:', user.email)
    console.log('Password: password123')
    console.log('Name:', user.name)
    console.log('\nYou can now login with these credentials.')
  } catch (error) {
    console.error('❌ Error creating test user:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
