# Commented Files Status

## Backend Files - Commented ✅

### Core Library Files
- ✅ `backend/src/lib/auth.ts` - Complete Hindi comments
- ✅ `backend/src/lib/database.ts` - Partial comments (User services)
- ⏳ `backend/src/lib/email.ts` - Pending
- ⏳ `backend/src/lib/dateUtils.ts` - Pending
- ⏳ `backend/src/middleware.ts` - Pending

### API Routes - Auth
- ✅ `backend/src/app/api/auth/register/route.ts` - Complete
- ⏳ `backend/src/app/api/auth/login/route.ts` - Pending
- ⏳ `backend/src/app/api/auth/forgot-password/route.ts` - Pending
- ⏳ `backend/src/app/api/auth/reset-password/route.ts` - Pending

### API Routes - Expenses
- ⏳ `backend/src/app/api/expenses/route.ts` - Pending
- ⏳ `backend/src/app/api/expenses/[id]/route.ts` - Pending

### API Routes - Incomes
- ⏳ `backend/src/app/api/incomes/route.ts` - Pending
- ⏳ `backend/src/app/api/incomes/[id]/route.ts` - Pending

### API Routes - Budget
- ⏳ `backend/src/app/api/monthly-budget/route.ts` - Pending
- ⏳ `backend/src/app/api/monthly-budget/analytics/route.ts` - Pending

### API Routes - Shopping
- ⏳ `backend/src/app/api/shopping-categories/route.ts` - Pending
- ⏳ `backend/src/app/api/shopping-items/route.ts` - Pending

### API Routes - User
- ⏳ `backend/src/app/api/user/profile/route.ts` - Pending
- ⏳ `backend/src/app/api/user/password/route.ts` - Pending

## Frontend Files - Pending ⏳

### Core Library Files
- ⏳ `frontend/src/lib/apiFetch.ts` - Pending
- ⏳ `frontend/src/lib/api.ts` - Pending

### Components
- ⏳ All components - Pending

### Pages
- ⏳ All pages - Pending

## Comment Template

Har file mein yeh structure follow karna hai:

```typescript
/**
 * File Ka Naam
 * 
 * Yeh file kya karta hai
 * 
 * Main Features:
 * - Feature 1
 * - Feature 2
 * 
 * Dependencies:
 * - Package/File: Kya use
 * 
 * Used By:
 * - Kaun use karta hai
 */

// Imports

// ============================================
// SECTION NAME
// ============================================

/**
 * Function Description
 * 
 * Process:
 * 1. Step 1
 * 2. Step 2
 * 
 * @param param - Description
 * @returns Return value
 * 
 * Used By:
 * - Caller
 */
function example() {
  // Inline comment: Kya kar rahe hain
  const result = doSomething()
  
  // Check: Condition
  if (result) {
    // Action: Kya hoga
    return result
  }
}
```

## Priority Order

1. **High Priority** (Core functionality)
   - ✅ auth.ts
   - ✅ database.ts (partial)
   - ⏳ middleware.ts
   - ⏳ email.ts

2. **Medium Priority** (API routes)
   - ✅ auth/register
   - ⏳ auth/login
   - ⏳ expenses routes
   - ⏳ budget routes

3. **Low Priority** (Frontend)
   - ⏳ apiFetch.ts
   - ⏳ Components
   - ⏳ Pages

## How to Add Comments

1. File header comment add karo
2. Har function ke upar detailed comment
3. Complex logic mein inline comments
4. Dependencies aur usage mention karo
5. Examples do jahan zaroorat ho

## Example: Fully Commented File

See `backend/src/lib/auth.ts` for reference.
