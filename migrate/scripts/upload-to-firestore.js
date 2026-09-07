/**
 * Upload Server Backup JSON to Cloud Firestore
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
  apiKey: 'AIzaSyAtXvBu1ltzwBA2eIVPysuhrWIoFYlU8rg',
  authDomain: 'expense-tracker-5b7ee.firebaseapp.com',
  projectId: 'expense-tracker-5b7ee',
  storageBucket: 'expense-tracker-5b7ee.firebasestorage.app',
  messagingSenderId: '268456368819',
  appId: '1:268456368819:android:6f48aea16996fc4609eec6',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadBackup() {
  const backupFile = path.join(__dirname, '../data/server-backup.json');
  if (!fs.existsSync(backupFile)) {
    console.error('Backup file not found:', backupFile);
    return;
  }

  const users = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`🚀 Starting Firestore upload for ${users.length} users...\n`);

  for (const user of users) {
    const userId = user.id;
    console.log(`👤 User: ${user.name} (${user.email}) [ID: ${userId}]`);

    // 1. User Profile Document
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      name: user.name,
      email: user.email,
      salary: user.salary || 0,
      currency: user.currency || 'INR',
      billingCycleStartDay: user.billingCycleStartDay || 1,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }, { merge: true });

    // 2. Expenses
    if (user.expenses && user.expenses.length > 0) {
      console.log(`  -> Uploading ${user.expenses.length} expenses...`);
      for (const exp of user.expenses) {
        await setDoc(doc(db, 'users', userId, 'expenses', exp.id), {
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
        }, { merge: true });
      }
    }

    // 3. Incomes
    if (user.incomes && user.incomes.length > 0) {
      console.log(`  -> Uploading ${user.incomes.length} incomes...`);
      for (const inc of user.incomes) {
        await setDoc(doc(db, 'users', userId, 'incomes', inc.id), {
          source: inc.source,
          amount: inc.amount,
          date: inc.date,
          notes: inc.notes || '',
          createdAt: inc.createdAt,
        }, { merge: true });
      }
    }

    // 4. Categories
    if (user.expenseCategories && user.expenseCategories.length > 0) {
      for (const cat of user.expenseCategories) {
        await setDoc(doc(db, 'users', userId, 'categories', cat.id), {
          name: cat.name,
          icon: cat.icon || '📁',
          isDefault: cat.isDefault || false,
          createdAt: cat.createdAt,
        }, { merge: true });
      }
    }
  }

  console.log('\n🎉 ALL DATABASE DATA HAS BEEN UPLOADED TO FIREBASE FIRESTORE SUCCESSFULLY!');
  process.exit(0);
}

uploadBackup().catch(err => {
  console.error('Upload error:', err);
  process.exit(1);
});
