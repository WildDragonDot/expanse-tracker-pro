/**
 * Complete Migration Script: Server Backup -> Cloud Firestore
 * Project: expense-tracker-5b7ee
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ID = 'expense-tracker-5b7ee';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getAccessToken() {
  try {
    return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('Failed to get gcloud access token:', err.message);
    process.exit(1);
  }
}

// Convert JavaScript value to Firestore Value format
function toFirestoreValue(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    // Check if ISO timestamp
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return { timestampValue: d.toISOString() };
        }
      } catch {}
    }
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDocument(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    // Exclude subcollection arrays from the root document itself
    if ([
      'expenses', 'incomes', 'udhar', 'subscriptions', 'monthlyBudgets',
      'savingsGoals', 'shoppingList', 'shoppingCategories', 'planningCategories',
      'splitGroups', 'expenseCategories', 'expenseBanks', 'expensePaymentModes'
    ].includes(k)) {
      continue;
    }
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function writeDoc(token, docPath, data) {
  const url = `${BASE_URL}/${docPath}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to write ${docPath} (${res.status}): ${errorText}`);
  }
  return await res.json();
}

async function runMigration() {
  console.log('====================================================');
  console.log('🔥 STARTING COMPLETE MIGRATION TO FIREBASE FIRESTORE');
  console.log(`🎯 Target Project: ${PROJECT_ID}`);
  console.log('====================================================\n');

  const token = getAccessToken();
  const backupFile = path.join(__dirname, '../data/server-backup.json');

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found at: ${backupFile}`);
    process.exit(1);
  }

  const users = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`📦 Loaded ${users.length} users from server backup.\n`);

  let totalStats = {
    users: 0,
    expenses: 0,
    incomes: 0,
    categories: 0,
    banks: 0,
    paymentModes: 0,
    budgets: 0,
    udhar: 0,
    subscriptions: 0,
    savingsGoals: 0,
    shopping: 0,
    planning: 0,
    splitGroups: 0
  };

  for (const user of users) {
    const userId = user.id;
    console.log(`\n----------------------------------------------------`);
    console.log(`👤 User: ${user.name} | ${user.email} (ID: ${userId})`);
    console.log(`----------------------------------------------------`);

    // 1. User Root Document
    const userDocData = toFirestoreDocument(user);
    await writeDoc(token, `users/${userId}`, userDocData);
    totalStats.users++;
    console.log(`  ✅ Profile synced`);

    // 2. Expense Categories
    if (user.expenseCategories && user.expenseCategories.length > 0) {
      console.log(`  📁 Syncing ${user.expenseCategories.length} categories...`);
      for (const item of user.expenseCategories) {
        await writeDoc(token, `users/${userId}/categories/${item.id}`, toFirestoreDocument(item));
        totalStats.categories++;
      }
    }

    // 3. Banks
    if (user.expenseBanks && user.expenseBanks.length > 0) {
      console.log(`  🏦 Syncing ${user.expenseBanks.length} banks...`);
      for (const item of user.expenseBanks) {
        await writeDoc(token, `users/${userId}/banks/${item.id}`, toFirestoreDocument(item));
        totalStats.banks++;
      }
    }

    // 4. Payment Modes
    if (user.expensePaymentModes && user.expensePaymentModes.length > 0) {
      console.log(`  💳 Syncing ${user.expensePaymentModes.length} payment modes...`);
      for (const item of user.expensePaymentModes) {
        await writeDoc(token, `users/${userId}/paymentModes/${item.id}`, toFirestoreDocument(item));
        totalStats.paymentModes++;
      }
    }

    // 5. Expenses
    if (user.expenses && user.expenses.length > 0) {
      console.log(`  💸 Syncing ${user.expenses.length} expenses...`);
      for (const item of user.expenses) {
        await writeDoc(token, `users/${userId}/expenses/${item.id}`, toFirestoreDocument(item));
        totalStats.expenses++;
      }
    }

    // 6. Incomes
    if (user.incomes && user.incomes.length > 0) {
      console.log(`  💰 Syncing ${user.incomes.length} incomes...`);
      for (const item of user.incomes) {
        await writeDoc(token, `users/${userId}/incomes/${item.id}`, toFirestoreDocument(item));
        totalStats.incomes++;
      }
    }

    // 7. Monthly Budgets
    if (user.monthlyBudgets && user.monthlyBudgets.length > 0) {
      console.log(`  📊 Syncing ${user.monthlyBudgets.length} monthly budgets...`);
      for (const item of user.monthlyBudgets) {
        await writeDoc(token, `users/${userId}/monthlyBudgets/${item.id}`, toFirestoreDocument(item));
        totalStats.budgets++;
      }
    }

    // 8. Udhar
    if (user.udhar && user.udhar.length > 0) {
      console.log(`  🤝 Syncing ${user.udhar.length} udhar records...`);
      for (const item of user.udhar) {
        await writeDoc(token, `users/${userId}/udhar/${item.id}`, toFirestoreDocument(item));
        totalStats.udhar++;
      }
    }

    // 9. Subscriptions
    if (user.subscriptions && user.subscriptions.length > 0) {
      console.log(`  🔄 Syncing ${user.subscriptions.length} subscriptions...`);
      for (const item of user.subscriptions) {
        await writeDoc(token, `users/${userId}/subscriptions/${item.id}`, toFirestoreDocument(item));
        totalStats.subscriptions++;
      }
    }

    // 10. Savings Goals
    if (user.savingsGoals && user.savingsGoals.length > 0) {
      console.log(`  🎯 Syncing ${user.savingsGoals.length} savings goals...`);
      for (const item of user.savingsGoals) {
        await writeDoc(token, `users/${userId}/savingsGoals/${item.id}`, toFirestoreDocument(item));
        totalStats.savingsGoals++;
      }
    }

    // 11. Shopping Categories & List
    if (user.shoppingCategories && user.shoppingCategories.length > 0) {
      for (const item of user.shoppingCategories) {
        await writeDoc(token, `users/${userId}/shoppingCategories/${item.id}`, toFirestoreDocument(item));
        totalStats.shopping++;
      }
    }
    if (user.shoppingList && user.shoppingList.length > 0) {
      for (const item of user.shoppingList) {
        await writeDoc(token, `users/${userId}/shoppingItems/${item.id}`, toFirestoreDocument(item));
        totalStats.shopping++;
      }
    }

    // 12. Planning Categories
    if (user.planningCategories && user.planningCategories.length > 0) {
      for (const item of user.planningCategories) {
        await writeDoc(token, `users/${userId}/planningCategories/${item.id}`, toFirestoreDocument(item));
        totalStats.planning++;
      }
    }

    // 13. Split Groups
    if (user.splitGroups && user.splitGroups.length > 0) {
      for (const item of user.splitGroups) {
        await writeDoc(token, `users/${userId}/splitGroups/${item.id}`, toFirestoreDocument(item));
        totalStats.splitGroups++;
      }
    }
  }

  console.log('\n====================================================');
  console.log('🎉 ALL DATA HAS BEEN SUCCESSFULLY MIGRATED TO FIREBASE!');
  console.log('====================================================');
  console.table(totalStats);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
