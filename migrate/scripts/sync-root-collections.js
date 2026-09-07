/**
 * Sync all backup data to ROOT-LEVEL collections in Cloud Firestore
 * Project: expense-tracker-5b7ee
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ID = 'expense-tracker-5b7ee';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getAccessToken() {
  return execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return { timestampValue: d.toISOString() };
      } catch {}
    }
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
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

async function syncRootCollections() {
  const token = getAccessToken();
  const backupFile = path.join(__dirname, '../data/server-backup.json');
  const users = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  console.log('🚀 Creating ROOT-LEVEL collections in Firestore for direct visibility...\n');

  for (const user of users) {
    const userId = user.id;

    // Expenses
    if (user.expenses) {
      for (const item of user.expenses) {
        await writeDoc(token, `expenses/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Incomes
    if (user.incomes) {
      for (const item of user.incomes) {
        await writeDoc(token, `incomes/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Categories
    if (user.expenseCategories) {
      for (const item of user.expenseCategories) {
        await writeDoc(token, `categories/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Banks
    if (user.expenseBanks) {
      for (const item of user.expenseBanks) {
        await writeDoc(token, `banks/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Payment Modes
    if (user.expensePaymentModes) {
      for (const item of user.expensePaymentModes) {
        await writeDoc(token, `paymentModes/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Monthly Budgets
    if (user.monthlyBudgets) {
      for (const item of user.monthlyBudgets) {
        await writeDoc(token, `monthlyBudgets/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Subscriptions
    if (user.subscriptions) {
      for (const item of user.subscriptions) {
        await writeDoc(token, `subscriptions/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Udhar
    if (user.udhar) {
      for (const item of user.udhar) {
        await writeDoc(token, `udhar/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Savings Goals
    if (user.savingsGoals) {
      for (const item of user.savingsGoals) {
        await writeDoc(token, `savingsGoals/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Shopping
    if (user.shoppingList) {
      for (const item of user.shoppingList) {
        await writeDoc(token, `shoppingItems/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }

    // Split
    if (user.splitGroups) {
      for (const item of user.splitGroups) {
        await writeDoc(token, `splitGroups/${item.id}`, toFirestoreDocument({ ...item, userId }));
      }
    }
  }

  console.log('✅ ALL ROOT-LEVEL COLLECTIONS POPULATED SUCCESSFULLY!');
}

syncRootCollections().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
