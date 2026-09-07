#!/usr/bin/env bash

# Fetch all production data from remote EC2 Server
SERVER_USER="ubuntu"
SERVER_IP="34.200.236.88"
SSH_KEY="$HOME/.ssh/id_rsa_no_pass"
DEST_FILE="$(dirname "$0")/../data/server-backup.json"

mkdir -p "$(dirname "$0")/../data"

echo "Connecting to AWS EC2 Server ($SERVER_IP)..."

ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "cd /home/ubuntu/expanse-tracker-pro/backend && node -e \"
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const users = await p.user.findMany({
    include: {
      expenses: true,
      incomes: true,
      udhar: true,
      subscriptions: { include: { occurrences: true } },
      monthlyBudgets: true,
      savingsGoals: true,
      shoppingList: true,
      shoppingCategories: { include: { items: true } },
      planningCategories: { include: { expenses: true } },
      splitGroups: { include: { expenses: true } },
      expenseCategories: true,
      expenseBanks: true,
      expensePaymentModes: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}
run().finally(() => p.\\\$disconnect());
\"" > "$DEST_FILE"

echo "✅ Backup successfully saved to $DEST_FILE"
