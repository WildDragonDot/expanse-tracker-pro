# 🚀 Expense Tracker Pro — Firebase Migration Module (`migrate/`)

This directory contains the **complete, standalone Firebase backend and Mobile service layer** designed for ₹0 operational cost and Google Play Store deployment.

---

## 📁 Directory Structure

```
migrate/
├── README.md                      # This documentation
├── firebase/
│   ├── firebase.config.ts         # Firebase App, Auth, Firestore & Storage instances
│   ├── firestore.rules            # Production security rules (User data isolation)
│   ├── storage.rules              # Receipt image storage rules (5MB limit & image validation)
│   └── firestore.indexes.json     # High-speed Firestore query indexing configuration
├── mobile-services/               # Standalone Firestore Client Services (Drop-in replacement)
│   ├── types.ts                   # Complete TypeScript data contracts
│   ├── auth.service.ts            # Firebase Auth & Google Sign-In with auto profile sync
│   ├── expense.service.ts         # Expenses CRUD + Real-time Listeners + Summary aggregations
│   ├── income.service.ts          # Income tracking
│   ├── budget.service.ts          # Monthly budget planning
│   ├── udhar.service.ts           # Debt / Udhar ledger
│   ├── subscription.service.ts    # Subscriptions & recurring bill occurrences
│   ├── shopping.service.ts        # Shopping lists & event planning
│   ├── split.service.ts           # Split bills & group calculations
│   ├── savings.service.ts         # Savings milestones
│   ├── ai.service.ts              # Direct Gemini AI client insights & SMS parsing
│   ├── storage.service.ts         # Receipt image upload to Firebase Storage
│   └── index.ts                   # Centralized export of all services
├── scripts/
│   ├── seed-firestore.ts          # Default categories & payment modes seeder
│   └── migrate-postgres-to-firestore.ts # One-click Postgres to Firestore data exporter
└── playstore-checklist/
    ├── play-console-guide.md      # Play Store release build & console checklist
    └── app-privacy-policy.md      # Ready-to-publish Privacy Policy for Play Console
```

---

## 🌟 Key Benefits of this Architecture

1. **100% Free Forever (Spark Plan):** No credit card required, 50,000 reads & 20,000 writes/day free.
2. **Zero Server Maintenance:** Direct mobile-to-Firebase connection. No Node.js server to keep running 24/7.
3. **Real-time Sync & Offline Mode:** Users can add expenses offline, and data auto-syncs instantly when online.
4. **Google Play Store Native:** Uses official Google Play Services & Firebase libraries.

---

## 🛠️ How to Activate / Switch Mobile App to Firebase

When you are ready to switch the mobile app to this Firebase layer:
1. In `mobile/src/services/`, simply import from `@migrate/mobile-services` or copy the services directly.
2. Update `mobile/src/context/AuthContext.tsx` to use `FirebaseAuthService`.
3. Build your release `.aab` using the guide in `migrate/playstore-checklist/play-console-guide.md`.
