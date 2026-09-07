# Google Play Console Publishing Guide (₹0 Production Setup)

This guide walks you through publishing your Android application to the **Google Play Store** using the Firebase backend.

---

## 1. Firebase Console Pre-requisites

1. Open [Firebase Console](https://console.firebase.google.com/) and select your project: `expense-tracker-5b7ee`.
2. **Enable Authentication:**
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password** and **Google**.
   - Under Google, add your Web Client ID and Android SHA-1 fingerprint.
3. **Enable Cloud Firestore:**
   - Go to **Build > Firestore Database > Create Database**.
   - Choose Location: `asia-south1 (Mumbai)` for fastest response in India.
   - Start in **Production Mode**.
   - Go to **Rules** tab and paste the contents of `migrate/firebase/firestore.rules`.
4. **Enable Firebase Storage (Optional for receipts):**
   - Go to **Build > Storage > Get Started**.
   - Paste contents of `migrate/firebase/storage.rules`.

---

## 2. Generate Release Build (AAB) for Play Store

Google Play Console requires an **Android App Bundle (.aab)** signed with a release keystore.

### Step A: Keystore verification
Your project already contains `release.keystore` inside `/mobile`!

### Step B: Build the AAB
Run from the `/mobile` directory:
```bash
# Clean and bundle release AAB
cd mobile
npx expo run:android --variant release
# Or using EAS Build (Free tier):
npx eas-cli build --platform android --profile production
```

The resulting `.aab` file will be generated in `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 3. Google Play Console Listing Checklist

1. **App Name:** Expense Tracker Pro
2. **Short Description:** Smart personal finance, budget planner & expense tracker.
3. **Full Description:** Track daily expenses, manage income, budget categories, split group bills, and get AI insights for free.
4. **Category:** Finance
5. **Privacy Policy URL:** Use the template provided in `migrate/playstore-checklist/app-privacy-policy.md` (Host on GitHub Pages or Vercel for free).
6. **Data Safety Section:**
   - Data collected: Email address (for authentication), Financial info (User-entered expenses & budgets), Photos (Receipts optional).
   - All data is encrypted in transit and at rest by Google Firebase.
