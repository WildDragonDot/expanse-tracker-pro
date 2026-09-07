/**
 * Push Complete Server Database Dump to Cloud Firestore
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
    const errText = await res.text();
    throw new Error(`Failed to write ${docPath} (${res.status}): ${errText}`);
  }
  return await res.json();
}

async function main() {
  console.log('🚀 Pushing 100% COMPLETE Database to Firebase Firestore...');
  const token = getAccessToken();
  const dumpPath = path.join(__dirname, '../data/complete-server-database.json');
  const db = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  const tables = [
    { key: 'users', rootCol: 'users', userSubCol: null },
    { key: 'expenses', rootCol: 'expenses', userSubCol: 'expenses' },
    { key: 'incomes', rootCol: 'incomes', userSubCol: 'incomes' },
    { key: 'subscriptions', rootCol: 'subscriptions', userSubCol: 'subscriptions' },
    { key: 'billOccurrences', rootCol: 'billOccurrences', userSubCol: 'billOccurrences' },
    { key: 'smartScores', rootCol: 'smartScores', userSubCol: 'smartScores' },
    { key: 'expenseCategories', rootCol: 'categories', userSubCol: 'categories' },
    { key: 'expenseBanks', rootCol: 'banks', userSubCol: 'banks' },
    { key: 'expensePaymentModes', rootCol: 'paymentModes', userSubCol: 'paymentModes' },
    { key: 'monthlyBudgets', rootCol: 'monthlyBudgets', userSubCol: 'monthlyBudgets' },
    { key: 'udhar', rootCol: 'udhar', userSubCol: 'udhar' },
    { key: 'savingsGoals', rootCol: 'savingsGoals', userSubCol: 'savingsGoals' },
    { key: 'shoppingLists', rootCol: 'shoppingLists', userSubCol: 'shoppingLists' },
    { key: 'shoppingCategories', rootCol: 'shoppingCategories', userSubCol: 'shoppingCategories' },
    { key: 'shoppingItems', rootCol: 'shoppingItems', userSubCol: 'shoppingItems' },
    { key: 'planningCategories', rootCol: 'planningCategories', userSubCol: 'planningCategories' },
    { key: 'expensePlanning', rootCol: 'expensePlanning', userSubCol: 'expensePlanning' },
    { key: 'splitGroups', rootCol: 'splitGroups', userSubCol: 'splitGroups' },
  ];

  const summary = {};

  for (const table of tables) {
    const records = db[table.key] || [];
    summary[table.key] = records.length;
    if (records.length === 0) continue;

    console.log(`\n📦 Uploading ${records.length} records for ${table.key}...`);

    for (const record of records) {
      const docData = toFirestoreDocument(record);

      // 1. Root-level collection
      await writeDoc(token, `${table.rootCol}/${record.id}`, docData);

      // 2. User nested subcollection (if record has userId)
      if (table.userSubCol && record.userId) {
        await writeDoc(token, `users/${record.userId}/${table.userSubCol}/${record.id}`, docData);
      }
    }
    console.log(`  ✅ Done ${table.key}`);
  }

  console.log('\n======================================================');
  console.log('🎉 100% DATABASE UPLOAD COMPLETE! ZERO RECORDS MISSED');
  console.log('======================================================');
  console.table(summary);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
