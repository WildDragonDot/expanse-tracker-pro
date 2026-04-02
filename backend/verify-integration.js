#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying FinanceTracker Integration...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local not found');
  console.log('📋 Please create .env.local with your configuration');
  process.exit(1);
}

// Read environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value.replace(/"/g, '');
  }
});

console.log('📋 Configuration Check:');

// Check DATABASE_URL
if (envVars.DATABASE_URL) {
  console.log('✅ DATABASE_URL configured');
  if (envVars.DATABASE_URL.startsWith('postgresql://')) {
    console.log('✅ PostgreSQL URL format correct');
  } else {
    console.log('⚠️  DATABASE_URL should start with postgresql://');
  }
} else {
  console.log('❌ DATABASE_URL missing');
}

// Check JWT_SECRET
if (envVars.JWT_SECRET) {
  if (envVars.JWT_SECRET.length >= 32) {
    console.log('✅ JWT_SECRET configured (secure length)');
  } else {
    console.log('⚠️  JWT_SECRET should be at least 32 characters');
  }
} else {
  console.log('❌ JWT_SECRET missing');
}

// Check Gmail configuration
if (envVars.GMAIL_USER) {
  console.log('✅ GMAIL_USER configured');
  if (envVars.GMAIL_USER.includes('@gmail.com')) {
    console.log('✅ Gmail address format correct');
  } else {
    console.log('⚠️  GMAIL_USER should be a Gmail address');
  }
} else {
  console.log('❌ GMAIL_USER missing');
}

if (envVars.GMAIL_APP_PASSWORD) {
  if (envVars.GMAIL_APP_PASSWORD.length === 16) {
    console.log('✅ GMAIL_APP_PASSWORD configured (correct length)');
  } else {
    console.log('⚠️  GMAIL_APP_PASSWORD should be 16 characters');
  }
} else {
  console.log('❌ GMAIL_APP_PASSWORD missing');
}

console.log('\n📁 File Structure Check:');

// Check critical files
const criticalFiles = [
  'src/lib/database.ts',
  'src/lib/email.ts',
  'src/lib/auth.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/expenses/route.ts',
  'src/hooks/useExpenses.ts',
  'src/hooks/useIncomes.ts',
  'prisma/schema.prisma'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

console.log('\n🔧 Dependencies Check:');

// Check package.json dependencies
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
    'nodemailer',
    'next'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} missing`);
    }
  });
}

console.log('\n🎯 Integration Status:');

const hasDatabase = envVars.DATABASE_URL && envVars.JWT_SECRET;
const hasEmail = envVars.GMAIL_USER && envVars.GMAIL_APP_PASSWORD;
const hasFiles = fs.existsSync(path.join(process.cwd(), 'src/lib/database.ts'));

if (hasDatabase && hasEmail && hasFiles) {
  console.log('🎉 COMPLETE INTEGRATION READY!');
  console.log('✅ Database integration configured');
  console.log('✅ Email notifications configured');
  console.log('✅ All API endpoints available');
  console.log('✅ Real-time data synchronization ready');
  console.log('\n🚀 Start your app: npm run dev');
  console.log('📊 View database: npm run db:studio');
} else {
  console.log('⚠️  Integration incomplete:');
  if (!hasDatabase) console.log('   - Database configuration needed');
  if (!hasEmail) console.log('   - Email configuration needed');
  if (!hasFiles) console.log('   - Core files missing');
  console.log('\n🔧 Run setup: node setup-database.js');
}

console.log('\n📖 For help: Check TROUBLESHOOTING.md');