#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up FinanceTracker Database...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env.local not found. Please create it with your database and email configuration.');
  console.log('📋 Copy from .env.example and fill in your values:\n');
  
  const exampleEnv = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
  console.log(exampleEnv);
  
  console.log('\n🔧 Required configurations:');
  console.log('1. DATABASE_URL - Your PostgreSQL connection string');
  console.log('2. JWT_SECRET - A random secret key for JWT tokens');
  console.log('3. GMAIL_USER - Your Gmail address for notifications');
  console.log('4. GMAIL_APP_PASSWORD - Your Gmail app password');
  console.log('\n📖 For Gmail setup: https://support.google.com/accounts/answer/185833');
  
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n🗄️  Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup complete!');
  console.log('\n🎉 Your FinanceTracker is ready to use!');
  console.log('\n🚀 Start the development server:');
  console.log('   npm run dev');
  console.log('\n📊 Open Prisma Studio (optional):');
  console.log('   npm run db:studio');
  
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure PostgreSQL is running');
  console.log('2. Check your DATABASE_URL in .env.local');
  console.log('3. Ensure you have the correct permissions');
  process.exit(1);
}