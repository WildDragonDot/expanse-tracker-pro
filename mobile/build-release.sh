#!/bin/bash
set -e

echo "🚀 [FinanceTracker Pro] Production Android Build Generator"
echo "=========================================================="

cd "$(dirname "$0")"

echo ""
echo "Select build type:"
echo "1) 📱 Direct Installable APK (Preview / Testing)"
echo "2) 🛍️ Production App Bundle - AAB (Google Play Store Release)"
echo "3) 🔑 Show Keystore & SHA Fingerprints"
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo "🔨 Building Standalone APK..."
    npx -y eas-cli build -p android --profile preview
    ;;
  2)
    echo "🛍️ Building Google Play Store AAB..."
    npx -y eas-cli build -p android --profile production
    ;;
  3)
    echo "🔑 Keystore Information:"
    keytool -list -v -keystore release.keystore -alias expensetracker_release -storepass "DragonExpense2026!"
    ;;
  *)
    echo "❌ Invalid choice."
    ;;
esac
